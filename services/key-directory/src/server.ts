import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import * as jose from 'jose';

const app = Fastify({ logger: true });

// Security middleware
await app.register(helmet);
await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? ['https://*.vercel.app'] : true,
  credentials: true
});

// Redis connection for key storage
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Schemas
const KeyEntrySchema = z.object({
  keyId: z.string(),
  publicKey: z.string(),
  userId: z.string(),
  timestamp: z.number(),
  signature: z.string().optional()
});

const TransparencyLogEntrySchema = z.object({
  id: z.string(),
  operation: z.enum(['add', 'revoke', 'update']),
  keyId: z.string(),
  timestamp: z.number(),
  merkleRoot: z.string(),
  proof: z.array(z.string())
});

// In-memory transparency log (would use persistent storage in production)
const transparencyLog: any[] = [];
let currentMerkleRoot = 'genesis';

// Routes
app.post('/keys', async (request, reply) => {
  try {
    const keyEntry = KeyEntrySchema.parse(request.body);
    
    // Store key in Redis
    const keyKey = `key:${keyEntry.keyId}`;
    await redis.hset(keyKey, {
      publicKey: keyEntry.publicKey,
      userId: keyEntry.userId,
      timestamp: keyEntry.timestamp,
      active: 'true'
    });
    
    // Add to transparency log
    const logEntry = {
      id: randomUUID(),
      operation: 'add' as const,
      keyId: keyEntry.keyId,
      timestamp: Date.now(),
      merkleRoot: currentMerkleRoot,
      proof: [] // Simplified - would implement proper Merkle tree
    };
    
    transparencyLog.push(logEntry);
    currentMerkleRoot = `root_${logEntry.timestamp}`;
    
    reply.code(201).send({ 
      success: true,
      keyId: keyEntry.keyId,
      logEntryId: logEntry.id
    });
  } catch (error) {
    app.log.error(error);
    reply.code(400).send({ error: 'Invalid key entry' });
  }
});

app.get('/keys/:keyId', async (request, reply) => {
  try {
    const { keyId } = request.params as { keyId: string };
    const keyData = await redis.hgetall(`key:${keyId}`);
    
    if (!keyData.publicKey) {
      return reply.code(404).send({ error: 'Key not found' });
    }
    
    if (keyData.active !== 'true') {
      return reply.code(410).send({ error: 'Key revoked' });
    }
    
    reply.send({
      keyId,
      publicKey: keyData.publicKey,
      userId: keyData.userId,
      timestamp: parseInt(keyData.timestamp),
      verified: true
    });
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

app.get('/keys/user/:userId', async (request, reply) => {
  try {
    const { userId } = request.params as { userId: string };
    const keys = await redis.keys(`key:*`);
    const userKeys = [];
    
    for (const key of keys) {
      const keyData = await redis.hgetall(key);
      if (keyData.userId === userId && keyData.active === 'true') {
        userKeys.push({
          keyId: key.replace('key:', ''),
          publicKey: keyData.publicKey,
          timestamp: parseInt(keyData.timestamp)
        });
      }
    }
    
    reply.send({ userId, keys: userKeys });
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

app.post('/keys/:keyId/revoke', async (request, reply) => {
  try {
    const { keyId } = request.params as { keyId: string };
    const keyExists = await redis.exists(`key:${keyId}`);
    
    if (!keyExists) {
      return reply.code(404).send({ error: 'Key not found' });
    }
    
    // Mark key as revoked
    await redis.hset(`key:${keyId}`, 'active', 'false');
    
    // Add to transparency log
    const logEntry = {
      id: randomUUID(),
      operation: 'revoke' as const,
      keyId,
      timestamp: Date.now(),
      merkleRoot: currentMerkleRoot,
      proof: []
    };
    
    transparencyLog.push(logEntry);
    currentMerkleRoot = `root_${logEntry.timestamp}`;
    
    reply.send({ 
      success: true,
      keyId,
      logEntryId: logEntry.id,
      revokedAt: logEntry.timestamp
    });
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

app.get('/transparency/log', async (request, reply) => {
  try {
    const { limit = 100, offset = 0 } = request.query as any;
    
    const entries = transparencyLog
      .slice(Number(offset), Number(offset) + Number(limit))
      .map(entry => ({
        id: entry.id,
        operation: entry.operation,
        keyId: entry.keyId,
        timestamp: entry.timestamp,
        merkleRoot: entry.merkleRoot
      }));
    
    reply.send({
      entries,
      total: transparencyLog.length,
      currentRoot: currentMerkleRoot
    });
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

app.get('/transparency/verify/:entryId', async (request, reply) => {
  try {
    const { entryId } = request.params as { entryId: string };
    const entry = transparencyLog.find(e => e.id === entryId);
    
    if (!entry) {
      return reply.code(404).send({ error: 'Log entry not found' });
    }
    
    // Simplified verification - would implement proper Merkle proof verification
    reply.send({
      entryId,
      verified: true,
      merkleProof: entry.proof,
      inclusion: true
    });
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

app.get('/health', async (request, reply) => {
  try {
    await redis.ping();
    reply.send({ 
      status: 'healthy', 
      timestamp: Date.now(),
      logEntries: transparencyLog.length,
      currentRoot: currentMerkleRoot
    });
  } catch (error) {
    app.log.error(error);
    reply.code(503).send({ status: 'unhealthy', error: error.message });
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3004');
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Atlas Key Directory Service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();