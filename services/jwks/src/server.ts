import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Redis } from 'ioredis';
import { CronJob } from 'cron';
import { z } from 'zod';
import { AtlasKeyManager } from '@atlas/receipt';
import type { JWK } from 'jose';

interface KeyEntry {
  kid: string;
  jwk: JWK;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'rotating' | 'revoked';
}

interface KeyRotationLog {
  timestamp: number;
  action: 'created' | 'activated' | 'rotated' | 'revoked';
  keyId: string;
  reason?: string;
}

export class JWKSManager {
  private redis: Redis;
  private currentKeys: Map<string, KeyEntry> = new Map();
  private rotationSchedule: CronJob;
  
  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    
    // Schedule key rotation every 30 days (configurable)
    const rotationCron = process.env.KEY_ROTATION_CRON || '0 0 */30 * *'; // Every 30 days at midnight
    this.rotationSchedule = new CronJob(rotationCron, () => {
      this.performScheduledRotation();
    });
  }
  
  async initialize(): Promise<void> {
    // Load existing keys from Redis
    await this.loadKeysFromRedis();
    
    // Generate initial keys if none exist
    if (this.currentKeys.size === 0) {
      await this.generateInitialKeys();
    }
    
    // Start rotation schedule
    this.rotationSchedule.start();
  }
  
  async generateInitialKeys(): Promise<void> {
    console.log('🔐 Generating initial JWKS keys...');
    
    // Generate Ed25519 key pair
    const { privateKey, publicKey } = await AtlasKeyManager.generateEd25519KeyPair();
    const keyId = `atlas-${Date.now()}-ed25519`;
    
    const publicJWK = await AtlasKeyManager.exportPublicKeyJWK(publicKey, keyId);
    
    const keyEntry: KeyEntry = {
      kid: keyId,
      jwk: publicJWK,
      createdAt: Date.now(),
      expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'active'
    };
    
    this.currentKeys.set(keyId, keyEntry);
    
    // Store in Redis
    await this.redis.set(`key:${keyId}`, JSON.stringify(keyEntry));
    await this.redis.sadd('active_keys', keyId);
    
    // Store private key securely (encrypted in production)
    await this.redis.set(`private_key:${keyId}`, JSON.stringify(privateKey), 'EX', 90 * 24 * 60 * 60);
    
    await this.logRotationEvent('created', keyId);
    console.log(`✅ Generated initial key: ${keyId}`);
  }
  
  async performScheduledRotation(): Promise<void> {
    console.log('🔄 Performing scheduled key rotation...');
    
    try {
      // Generate new key
      const { privateKey, publicKey } = await AtlasKeyManager.generateEd25519KeyPair();
      const keyId = `atlas-${Date.now()}-ed25519`;
      
      const publicJWK = await AtlasKeyManager.exportPublicKeyJWK(publicKey, keyId);
      
      const newKeyEntry: KeyEntry = {
        kid: keyId,
        jwk: publicJWK,
        createdAt: Date.now(),
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
        status: 'active'
      };
      
      // Add new key
      this.currentKeys.set(keyId, newKeyEntry);
      await this.redis.set(`key:${keyId}`, JSON.stringify(newKeyEntry));
      await this.redis.sadd('active_keys', keyId);
      await this.redis.set(`private_key:${keyId}`, JSON.stringify(privateKey), 'EX', 90 * 24 * 60 * 60);
      
      // Mark old keys for rotation (keep for 30 days for verification)
      const now = Date.now();
      for (const [kid, keyEntry] of this.currentKeys.entries()) {
        if (kid !== keyId && keyEntry.status === 'active' && (now - keyEntry.createdAt) > (60 * 24 * 60 * 60 * 1000)) {
          keyEntry.status = 'rotating';
          await this.redis.set(`key:${kid}`, JSON.stringify(keyEntry));
          await this.redis.srem('active_keys', kid);
          await this.logRotationEvent('rotated', kid, 'Scheduled rotation');
        }
      }
      
      await this.logRotationEvent('created', keyId, 'Scheduled rotation');
      console.log(`✅ Key rotation completed: ${keyId}`);
      
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
    }
  }
  
  async revokeKey(keyId: string, reason: string): Promise<void> {
    const keyEntry = this.currentKeys.get(keyId);
    if (!keyEntry) {
      throw new Error('Key not found');
    }
    
    keyEntry.status = 'revoked';
    this.currentKeys.set(keyId, keyEntry);
    
    await this.redis.set(`key:${keyId}`, JSON.stringify(keyEntry));
    await this.redis.srem('active_keys', keyId);
    await this.redis.del(`private_key:${keyId}`);
    
    await this.logRotationEvent('revoked', keyId, reason);
    console.log(`🚫 Key revoked: ${keyId} - ${reason}`);
  }
  
  getJWKS(): { keys: JWK[] } {
    const activeKeys = Array.from(this.currentKeys.values())
      .filter(key => key.status === 'active' || key.status === 'rotating')
      .map(key => key.jwk);
    
    return { keys: activeKeys };
  }
  
  getKeyRotationLogs(): Promise<KeyRotationLog[]> {
    return this.redis.lrange('key_rotation_log', 0, -1)
      .then(logs => logs.map(log => JSON.parse(log)));
  }
  
  private async loadKeysFromRedis(): Promise<void> {
    const activeKeyIds = await this.redis.smembers('active_keys');
    
    for (const keyId of activeKeyIds) {
      const keyData = await this.redis.get(`key:${keyId}`);
      if (keyData) {
        const keyEntry: KeyEntry = JSON.parse(keyData);
        this.currentKeys.set(keyId, keyEntry);
      }
    }
    
    console.log(`📋 Loaded ${this.currentKeys.size} keys from Redis`);
  }
  
  private async logRotationEvent(action: string, keyId: string, reason?: string): Promise<void> {
    const logEntry: KeyRotationLog = {
      timestamp: Date.now(),
      action: action as any,
      keyId,
      reason
    };
    
    await this.redis.lpush('key_rotation_log', JSON.stringify(logEntry));
    await this.redis.ltrim('key_rotation_log', 0, 999); // Keep last 1000 entries
  }
}

export async function createJWKSServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty' }
        : undefined
    }
  });

  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
      }
    }
  });
  
  await fastify.register(cors, {
    origin: true, // JWKS should be publicly accessible
    methods: ['GET', 'HEAD']
  });

  const jwksManager = new JWKSManager();
  await jwksManager.initialize();

  // JWKS endpoint (RFC 7517)
  fastify.get('/.well-known/jwks.json', async (request, reply) => {
    const jwks = jwksManager.getJWKS();
    
    // Set caching headers
    reply.header('Cache-Control', 'public, max-age=3600'); // 1 hour
    reply.header('Content-Type', 'application/json');
    
    return jwks;
  });
  
  // Alternative JWKS path
  fastify.get('/jwks', async (request, reply) => {
    return jwksManager.getJWKS();
  });

  // Key rotation logs (admin endpoint)
  fastify.get('/api/keys/rotation-log', async (request, reply) => {
    // TODO: Add admin authentication
    const logs = await jwksManager.getKeyRotationLogs();
    return { logs };
  });
  
  // Manual key rotation (admin endpoint)
  fastify.post('/api/keys/rotate', async (request, reply) => {
    // TODO: Add admin authentication
    try {
      await jwksManager.performScheduledRotation();
      reply.send({ success: true, message: 'Key rotation initiated' });
    } catch (error) {
      reply.status(500).send({ error: 'Key rotation failed' });
    }
  });
  
  // Key revocation (admin endpoint)
  fastify.post('/api/keys/:keyId/revoke', async (request, reply) => {
    // TODO: Add admin authentication
    try {
      const { keyId } = request.params as { keyId: string };
      const { reason } = request.body as { reason: string };
      
      await jwksManager.revokeKey(keyId, reason || 'Manual revocation');
      reply.send({ success: true, message: 'Key revoked successfully' });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Health check
  fastify.get('/api/health', async (request, reply) => {
    const jwks = jwksManager.getJWKS();
    
    reply.send({ 
      status: 'healthy',
      service: 'jwks',
      timestamp: Date.now(),
      activeKeys: jwks.keys.length
    });
  });

  return fastify;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await createJWKSServer();
  
  try {
    const port = parseInt(process.env.PORT || '3012');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`JWKS service running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}