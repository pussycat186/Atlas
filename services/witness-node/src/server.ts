/**
 * Atlas Witness Node Server
 * HTTP server for witness node API
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { WitnessNode } from './witness';
import { WitnessAPI } from '@atlas/fabric-protocol';

export class WitnessServer {
  private fastify: FastifyInstance;
  private witness: WitnessNode;

  constructor(witness: WitnessNode, port: number = 3001) {
    this.witness = witness;
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

    this.setupRoutes();
    this.setupCors();
  }

  /**
   * Setup CORS
   */
  private async setupCors(): Promise<void> {
    await this.fastify.register(cors, {
      origin: true,
      credentials: true,
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.fastify.get('/witness/health', async (request, reply) => {
      const health = await this.witness.getHealth();
      return health;
    });

    // Witness info
    this.fastify.get('/witness/info', async (request, reply) => {
      return this.witness.getInfo();
    });

    // Submit record
    this.fastify.post<{
      Body: WitnessAPI['submitRecord']['body'];
    }>('/witness/record', async (request, reply) => {
      try {
        const { app, record_id, payload, meta } = request.body;
        
        const attestation = await this.witness.processRecord(
          app,
          record_id,
          payload,
          meta
        );

        return attestation;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to process record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get ledger
    this.fastify.get<{
      Querystring: WitnessAPI['getLedger']['query'];
    }>('/witness/ledger', async (request, reply) => {
      try {
        const { since, limit } = request.query;
        
        const entries = await this.witness.getLedger().readLedger({
          since,
          limit: limit ? parseInt(limit.toString()) : undefined,
        });

        return {
          entries,
          total: entries.length,
          witness_id: this.witness.getWitnessId(),
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to read ledger',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get specific record
    this.fastify.get<{
      Params: WitnessAPI['getRecord']['params'];
    }>('/witness/records/:record_id', async (request, reply) => {
      try {
        const { record_id } = request.params;
        
        const entry = await this.witness.getLedger().getRecord(record_id);
        
        if (!entry) {
          reply.code(404);
          return { error: 'Record not found' };
        }

        return {
          record: entry.record,
          attestation: entry.attestation,
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get record',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get ledger as NDJSON (public mirror)
    this.fastify.get('/ledger.ndjson', async (request, reply) => {
      try {
        const ndjson = await this.witness.getLedger().exportAsNDJSON();
        
        reply.type('application/x-ndjson');
        return ndjson;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to export ledger',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Ledger statistics
    this.fastify.get('/witness/stats', async (request, reply) => {
      try {
        const stats = await this.witness.getLedger().getStats();
        return stats;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to get stats',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Validate ledger integrity
    this.fastify.get('/witness/validate', async (request, reply) => {
      try {
        const validation = await this.witness.getLedger().validateIntegrity();
        return validation;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to validate ledger',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Start the server
   */
  async start(port: number = 3001, host: string = '0.0.0.0'): Promise<void> {
    try {
      await this.fastify.listen({ port, host });
      console.log(`Witness node ${this.witness.getWitnessId()} listening on ${host}:${port}`);
    } catch (error) {
      console.error('Failed to start witness server:', error);
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
