/**
 * Atlas Gateway Server
 * Main HTTP server for the gateway service
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { QuorumManager } from './quorum';
import { WitnessClient } from './witness-client';
import { GatewayAPI, AdminAPI, WebSocketEvents } from '@atlas/fabric-protocol';

export class GatewayServer {
  private fastify: FastifyInstance;
  private quorumManager: QuorumManager;
  private witnessClient: WitnessClient;
  private startTime: number;

  constructor(port: number = 3000) {
    this.startTime = Date.now();
    this.quorumManager = new QuorumManager();
    this.witnessClient = new WitnessClient();
    
    this.fastify = Fastify({
      logger: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      },
    });

    this.setupPlugins();
    this.setupRoutes();
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
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.fastify.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      };
    });

    // Submit record
    this.fastify.post<{
      Body: GatewayAPI['submitRecord']['body'];
    }>('/api/records', async (request, reply) => {
      try {
        const { app, record_id, payload, meta } = request.body;
        
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

        return {
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
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to submit record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Verify record
    this.fastify.get<{
      Params: GatewayAPI['verifyRecord']['params'];
    }>('/api/records/:record_id/verify', async (request, reply) => {
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

    // Get conflicts
    this.fastify.get<{
      Querystring: GatewayAPI['getConflicts']['query'];
    }>('/api/conflicts', async (request, reply) => {
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
        
        connection.socket.on('message', (message) => {
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
    this.fastify.get<{
      Querystring: AdminAPI['getMetrics']['query'];
    }>('/admin/metrics', async (request, reply) => {
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
    this.fastify.get<{
      Params: AdminAPI['getConflict']['params'];
    }>('/admin/conflicts/:conflict_id', async (request, reply) => {
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
    this.fastify.post<{
      Params: AdminAPI['resolveConflict']['params'];
      Body: AdminAPI['resolveConflict']['body'];
    }>('/admin/conflicts/:conflict_id/resolve', async (request, reply) => {
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
    this.fastify.get<{
      Querystring: AdminAPI['getWitnessPerformance']['query'];
    }>('/admin/witnesses/performance', async (request, reply) => {
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
    this.fastify.websocketServer?.clients.forEach((client) => {
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
