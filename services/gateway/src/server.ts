/**
 * Atlas Gateway Server
 * Main HTTP server for the gateway service with hardening
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { QuorumManager } from './quorum';
import { WitnessClient } from './witness-client';
import { 
  SubmitRecordRequestSchema,
  SubmitRecordResponseSchema,
  FabricConfig,
  WitnessConfig
} from '@atlas/fabric-protocol';

// Temporary type definitions for squeeze mode
type WebSocketEvents = {
  conflict_detected: {
    conflict_ticket: any;
  };
};

export class GatewayServer {
  private fastify: FastifyInstance;
  private quorumManager: QuorumManager;
  private witnessClient: WitnessClient;
  private startTime: number;
  private logger: pino.Logger;
  private idempotencyCache: Map<string, { response: any; timestamp: number }> = new Map();
  private readonly IDEMPOTENCY_TTL = 60000; // 60 seconds

  constructor(port: number = 3000) {
    this.startTime = Date.now();
    this.quorumManager = new QuorumManager();
    this.witnessClient = new WitnessClient(this.createConfigFromEnv());
    
    // Initialize structured logger
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
      } : undefined,
    });
    
    this.fastify = Fastify({
      logger: this.logger,
    });

    this.setupPlugins();
    this.setupRoutes();
    this.setupIdempotencyCleanup();
  }

  /**
   * Create configuration from environment variables
   */
  private createConfigFromEnv(): Partial<FabricConfig> {
    const witnessesEnv = process.env.WITNESSES;
    const quorumEnv = process.env.QUORUM;
    const deltaEnv = process.env.DELTA_MS;

    if (!witnessesEnv) {
      console.log('No WITNESSES environment variable found, using default config');
      return {};
    }

    const witnessEndpoints = witnessesEnv.split(',');
    const witnesses: WitnessConfig[] = witnessEndpoints.map((endpoint, index) => {
      const witnessId = `w${index + 1}`;
      return {
        witness_id: witnessId,
        endpoint: endpoint.trim(),
        region: 'docker',
        active: true,
      };
    });

    const config: Partial<FabricConfig> = {
      witnesses,
      total_witnesses: witnesses.length,
      quorum_size: quorumEnv ? parseInt(quorumEnv) : 4,
      max_timestamp_skew_ms: deltaEnv ? parseInt(deltaEnv) : 2000,
    };

    console.log('Created config from environment:', JSON.stringify(config, null, 2));
    return config;
  }

  /**
   * Setup Fastify plugins
   */
  private async setupPlugins(): Promise<void> {
    await this.fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await this.fastify.register(websocket);

    // Rate limiting
    await this.fastify.register(rateLimit, {
      max: 1000, // requests per windowMs
      timeWindow: '1 minute',
      errorResponseBuilder: (request: any, context: any) => ({
        error: 'Rate limit exceeded',
        message: `Rate limit exceeded, retry in ${Math.round(context.after / 1000)} seconds`,
        retryAfter: Math.round(context.after / 1000),
      }),
    });
  }

  /**
   * Setup idempotency cache cleanup
   */
  private setupIdempotencyCleanup(): void {
    // Clean up expired idempotency entries every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.idempotencyCache.entries()) {
        if (now - entry.timestamp > this.IDEMPOTENCY_TTL) {
          this.idempotencyCache.delete(key);
        }
      }
    }, 30000);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check with metrics
    this.fastify.get('/health', async (request, reply) => {
      const uptime = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage();
      
      return {
        status: 'healthy',
        uptime,
        timestamp: new Date().toISOString(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        idempotency_cache_size: this.idempotencyCache.size,
      };
    });

    // Metrics endpoint
    this.fastify.get('/metrics', async (request, reply) => {
      const stats = this.quorumManager.getQuorumStats();
      const witnessHealth = await this.witnessClient.getWitnessHealth();
      const memoryUsage = process.memoryUsage();
      
      return {
        latency: {
          p50: 100, // Mock data - would be calculated from actual requests
          p95: 200,
          p99: 500,
        },
        quorum_rate: 0.95, // Mock data
        conflict_rate: stats.conflictRate,
        witness_health: witnessHealth.reduce((acc, w) => {
          acc[w.witness_id] = w.status === 'active' ? 1 : 0;
          return acc;
        }, {} as Record<string, number>),
        timestamp_skew: {
          min: 0,
          max: 1000,
          avg: 200,
        },
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        idempotency_cache_size: this.idempotencyCache.size,
      };
    });

    // Submit record (primary endpoint) with validation and idempotency
    this.fastify.post('/record', async (request: any, reply) => {
      const startTime = Date.now();
      const idempotencyKey = request.headers['idempotency-key'] as string;
      
      try {
        // Validate input using Zod schema
        const validatedBody = SubmitRecordRequestSchema.parse(request.body);
        const { app, record_id, payload, meta } = validatedBody;

        // Check idempotency cache
        if (idempotencyKey) {
          const cached = this.idempotencyCache.get(idempotencyKey);
          if (cached && Date.now() - cached.timestamp < this.IDEMPOTENCY_TTL) {
            this.logger.info({ 
              record_id, 
              idempotency_key: idempotencyKey,
              cached: true 
            }, 'Returning cached response for idempotent request');
            return cached.response;
          }
        }
        
        this.logger.info({ 
          record_id, 
          app, 
          payload_size: payload.length,
          idempotency_key: idempotencyKey 
        }, 'Processing record submission');
        
        // Submit to all witnesses
        const attestations = await this.witnessClient.submitToAllWitnesses(
          app,
          record_id,
          payload,
          meta
        );

        // Verify quorum
        const quorumResult = this.quorumManager.verifyQuorum(attestations);

        // Broadcast conflict if detected
        if (quorumResult.conflict_ticket) {
          this.broadcastConflict(quorumResult.conflict_ticket);
        }

        const response = {
          success: quorumResult.ok,
          record_id,
          attestations,
          quorum_result: {
            ok: quorumResult.ok,
            quorum_count: quorumResult.quorum_count,
            max_skew_ms: quorumResult.max_skew_ms,
            conflict_ticket: quorumResult.conflict_ticket?.conflict_id,
          },
        };

        // Cache response for idempotency
        if (idempotencyKey) {
          this.idempotencyCache.set(idempotencyKey, {
            response,
            timestamp: Date.now(),
          });
        }

        const duration = Date.now() - startTime;
        this.logger.info({ 
          record_id, 
          duration, 
          quorum_ok: quorumResult.ok,
          attestation_count: attestations.length 
        }, 'Record submission completed');

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          record_id: request.body?.record_id 
        }, 'Record submission failed');
        
        reply.code(500);
        return {
          error: 'Failed to submit record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Verify record (primary endpoint)
    this.fastify.get('/verify/:record_id', async (request: any, reply) => {
      try {
        const { record_id } = request.params;
        
        // Get attestations from all witnesses
        const attestations: any[] = [];
        const witnesses = this.witnessClient.getConfig().witnesses;
        
        for (const witness of witnesses) {
          try {
            const record = await this.witnessClient.getWitnessRecord(witness.witness_id, record_id);
            if (record) {
              attestations.push(record.attestation);
            }
          } catch (error) {
            console.warn(`Failed to get record from witness ${witness.witness_id}:`, error);
          }
        }

        if (attestations.length === 0) {
          reply.code(404);
          return { error: 'Record not found' };
        }

        // Verify quorum
        const quorumResult = this.quorumManager.verifyQuorum(attestations);

        return {
          record_id,
          verified: quorumResult.ok,
          attestations,
          quorum_result: {
            ok: quorumResult.ok,
            quorum_count: quorumResult.quorum_count,
            max_skew_ms: quorumResult.max_skew_ms,
          },
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to verify record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Legacy API endpoints for backward compatibility with validation and idempotency
    this.fastify.post('/api/records', async (request: any, reply) => {
      const startTime = Date.now();
      const idempotencyKey = request.headers['idempotency-key'] as string;
      
      try {
        // Validate input using Zod schema
        const validatedBody = SubmitRecordRequestSchema.parse(request.body);
        const { app, record_id, payload, meta } = validatedBody;

        // Check idempotency cache
        if (idempotencyKey) {
          const cached = this.idempotencyCache.get(idempotencyKey);
          if (cached && Date.now() - cached.timestamp < this.IDEMPOTENCY_TTL) {
            this.logger.info({ 
              record_id, 
              idempotency_key: idempotencyKey,
              cached: true 
            }, 'Returning cached response for idempotent request (legacy API)');
            return cached.response;
          }
        }
        
        this.logger.info({ 
          record_id, 
          app, 
          payload_size: payload.length,
          idempotency_key: idempotencyKey,
          api: 'legacy'
        }, 'Processing record submission (legacy API)');
      
      const attestations = await this.witnessClient.submitToAllWitnesses(
        app,
        record_id,
        payload,
        meta
      );

      const quorumResult = this.quorumManager.verifyQuorum(attestations);

      if (quorumResult.conflict_ticket) {
        this.broadcastConflict(quorumResult.conflict_ticket);
      }

        const response = {
        success: quorumResult.ok,
        record_id,
        attestations,
        quorum_result: {
          ok: quorumResult.ok,
          quorum_count: quorumResult.quorum_count,
          max_skew_ms: quorumResult.max_skew_ms,
          conflict_ticket: quorumResult.conflict_ticket?.conflict_id,
        },
      };

        // Cache response for idempotency
        if (idempotencyKey) {
          this.idempotencyCache.set(idempotencyKey, {
            response,
            timestamp: Date.now(),
          });
        }

        const duration = Date.now() - startTime;
        this.logger.info({ 
          record_id, 
          duration, 
          quorum_ok: quorumResult.ok,
          attestation_count: attestations.length,
          api: 'legacy'
        }, 'Record submission completed (legacy API)');

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          record_id: request.body?.record_id,
          api: 'legacy'
        }, 'Record submission failed (legacy API)');
        
        reply.code(500);
        return {
          error: 'Failed to submit record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    this.fastify.get('/api/records/:record_id/verify', async (request: any, reply) => {
      // Redirect to primary endpoint
      const { record_id } = request.params;
      
      const attestations: any[] = [];
      const witnesses = this.witnessClient.getConfig().witnesses;
      
      for (const witness of witnesses) {
        try {
          const record = await this.witnessClient.getWitnessRecord(witness.witness_id, record_id);
          if (record) {
            attestations.push(record.attestation);
          }
        } catch (error) {
          console.warn(`Failed to get record from witness ${witness.witness_id}:`, error);
        }
      }

      if (attestations.length === 0) {
        reply.code(404);
        return { error: 'Record not found' };
      }

      const quorumResult = this.quorumManager.verifyQuorum(attestations);

      return {
        record_id,
        verified: quorumResult.ok,
        attestations,
        quorum_result: {
          ok: quorumResult.ok,
          quorum_count: quorumResult.quorum_count,
          max_skew_ms: quorumResult.max_skew_ms,
        },
      };
    });

    // Get conflicts
    this.fastify.get('/api/conflicts', async (request: any, reply) => {
      try {
        const { since, status, limit } = request.query;
        
        const conflicts = this.quorumManager.getConflicts({
          since,
          status,
          limit: limit ? parseInt(limit.toString()) : undefined,
        });

        return {
          conflicts,
          total: conflicts.length,
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get conflicts',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get witness status
    this.fastify.get('/api/witnesses/status', async (request, reply) => {
      try {
        const witnesses = await this.witnessClient.getWitnessHealth();
        return { witnesses };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get witness status',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Admin routes
    this.setupAdminRoutes();

    // WebSocket endpoint for real-time updates
    this.fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, req) => {
        console.log('WebSocket connection established');
        
        connection.socket.on('message', (message: any) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('WebSocket message received:', data);
          } catch (error) {
            console.error('Invalid WebSocket message:', error);
          }
        });

        connection.socket.on('close', () => {
          console.log('WebSocket connection closed');
        });
      });
    });
  }

  /**
   * Setup admin routes
   */
  private setupAdminRoutes(): void {
    // Get system metrics
    this.fastify.get('/admin/metrics', async (request: any, reply) => {
      try {
        const stats = this.quorumManager.getQuorumStats();
        const witnessHealth = await this.witnessClient.getWitnessHealth();
        
        return {
          latency: {
            p50: 100, // Mock data - would be calculated from actual requests
            p95: 200,
            p99: 500,
          },
          quorum_rate: 0.95, // Mock data
          conflict_rate: stats.conflictRate,
          witness_health: witnessHealth.reduce((acc, w) => {
            acc[w.witness_id] = w.status === 'active' ? 1 : 0;
            return acc;
          }, {} as Record<string, number>),
          timestamp_skew: {
            min: 0,
            max: 1000,
            avg: 200,
          },
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get metrics',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get conflict details
    this.fastify.get('/admin/conflicts/:conflict_id', async (request: any, reply) => {
      try {
        const { conflict_id } = request.params;
        
        const conflict = this.quorumManager.getConflict(conflict_id);
        if (!conflict) {
          reply.code(404);
          return { error: 'Conflict not found' };
        }

        return conflict;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get conflict',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Resolve conflict
    this.fastify.post('/admin/conflicts/:conflict_id/resolve', async (request: any, reply) => {
      try {
        const { conflict_id } = request.params;
        const { method, chosen_attestation_id, reason } = request.body;
        
        const success = this.quorumManager.resolveConflict(
          conflict_id,
          method,
          chosen_attestation_id,
          reason
        );

        if (!success) {
          reply.code(404);
          return { error: 'Conflict not found or already resolved' };
        }

        const conflict = this.quorumManager.getConflict(conflict_id);
        
        return {
          success: true,
          resolution: conflict?.resolution,
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to resolve conflict',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get witness performance
    this.fastify.get('/admin/witnesses/performance', async (request: any, reply) => {
      try {
        const witnessHealth = await this.witnessClient.getWitnessHealth();
        
        return {
          witnesses: witnessHealth.map(w => ({
            witness_id: w.witness_id,
            latency: Math.random() * 100, // Mock data
            success_rate: w.status === 'active' ? 0.99 : 0.0,
            conflict_count: 0, // Mock data
            region: w.region,
          })),
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get witness performance',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Broadcast conflict to WebSocket clients
   */
  private broadcastConflict(conflictTicket: any): void {
    const message: WebSocketEvents['conflict_detected'] = {
      conflict_ticket: conflictTicket,
    };

    // Broadcast to all WebSocket connections
    this.fastify.websocketServer?.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'conflict_detected',
          data: message,
        }));
      }
    });
  }

  /**
   * Start the server
   */
  async start(port: number = 3000, host: string = '0.0.0.0'): Promise<void> {
    try {
      await this.fastify.listen({ port, host });
      console.log(`Atlas Gateway listening on ${host}:${port}`);
    } catch (error) {
      console.error('Failed to start gateway server:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await this.fastify.close();
  }

  /**
   * Get Fastify instance
   */
  getFastify(): FastifyInstance {
    return this.fastify;
  }
}
