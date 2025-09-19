/**
 * Atlas Witness Node Server
 * HTTP server for witness node API
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { WitnessNode } from './witness';
// import { WitnessAPI } from '@atlas/fabric-protocol'; // Temporarily disabled

export class WitnessServer {
  private fastify: FastifyInstance;
  private witness: WitnessNode;

  constructor(witness: WitnessNode, _port: number = 3001) {
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
    this.fastify.get('/witness/health', async (_request, _reply) => {
      const health = await this.witness.getHealth();
      return health;
    });

    // Witness info
    this.fastify.get('/witness/info', async (_request, _reply) => {
      return this.witness.getInfo();
    });

    // Submit record
    this.fastify.post('/witness/record', async (request: any, reply) => {
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
    this.fastify.get('/witness/ledger', async (request: any, reply) => {
      try {
        const { since, limit } = request.query;
        
        const readOptions: { since?: string; limit?: number } = {};
        if (since) readOptions.since = since as string;
        if (limit) readOptions.limit = parseInt(limit.toString());
        
        const entries = await this.witness.getLedger().readLedger(readOptions);

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
    this.fastify.get('/witness/records/:record_id', async (request: any, reply) => {
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

    // Get ledger as NDJSON (public mirror) - streaming endpoint
    this.fastify.get('/ledger.ndjson', async (request, reply) => {
      try {
        const { since } = request.query as { since?: string };
        
        reply.type('application/x-ndjson');
        reply.header('Cache-Control', 'no-cache');
        reply.header('Connection', 'keep-alive');
        
        // Stream ledger entries
        const readOptions: { since?: string } = {};
        if (since) readOptions.since = since;
        
        const entries = await this.witness.getLedger().readLedger(readOptions);

        // Stream each entry as NDJSON
        for (const entry of entries) {
          const ndjsonLine = `${JSON.stringify(entry)  }\n`;
          reply.raw.write(ndjsonLine);
        }
        
        reply.raw.end();
        return;
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to export ledger',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Ledger statistics
    this.fastify.get('/witness/stats', async (_request, reply) => {
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
    this.fastify.get('/witness/validate', async (_request, reply) => {
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
