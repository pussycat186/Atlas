import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import * as jose from 'jose';
import { hash, verify } from 'argon2';

// Schema definitions
const UserRegistrationSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(64)
});

const PasskeyRegistrationStartSchema = z.object({
  userId: z.string().uuid()
});

const PasskeyRegistrationFinishSchema = z.object({
  userId: z.string().uuid(),
  credential: z.any() // WebAuthn credential response
});

const AliasSchema = z.object({
  alias: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  userId: z.string().uuid(),
  verified: z.boolean().default(false),
  createdAt: z.number()
});

type User = {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  createdAt: number;
  lastLoginAt?: number;
  passkeys: Array<{
    id: string;
    publicKey: Uint8Array;
    counter: number;
    deviceType: string;
    backedUp: boolean;
    transports?: AuthenticatorTransport[];
  }>;
};

type Alias = z.infer<typeof AliasSchema>;

// Identity service implementation
export class IdentityService {
  private redis: Redis;
  private jwtSecret: Uint8Array;
  
  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    this.jwtSecret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'atlas-identity-secret-change-in-production'
    );
  }

  // User management
  async createUser(userData: z.infer<typeof UserRegistrationSchema>): Promise<User> {
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const user: User = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: Date.now(),
      passkeys: []
    };

    await this.redis.set(`user:${user.id}`, JSON.stringify(user));
    await this.redis.set(`username:${user.username}`, user.id);
    
    if (user.email) {
      await this.redis.set(`email:${user.email}`, user.id);
    }

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    const userData = await this.redis.get(`user:${userId}`);
    return userData ? JSON.parse(userData) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const userId = await this.redis.get(`username:${username}`);
    return userId ? this.getUserById(userId) : null;
  }

  // Passkey registration
  async startPasskeyRegistration(userId: string): Promise<any> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: 'Atlas Chat Platform',
      rpID: process.env.RP_ID || 'localhost',
      userID: userId,
      userName: user.username,
      userDisplayName: user.displayName,
      attestationType: 'none',
      excludeCredentials: user.passkeys.map(pk => ({
        id: pk.id,
        type: 'public-key',
        transports: pk.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    };

    const options = await generateRegistrationOptions(opts);
    
    // Store challenge for verification
    await this.redis.setex(
      `challenge:reg:${userId}`,
      300, // 5 minutes
      options.challenge
    );

    return options;
  }

  async finishPasskeyRegistration(userId: string, credential: any): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const expectedChallenge = await this.redis.get(`challenge:reg:${userId}`);
    if (!expectedChallenge) {
      throw new Error('Challenge not found or expired');
    }

    const opts: VerifyRegistrationResponseOpts = {
      response: credential,
      expectedChallenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // Add passkey to user
      user.passkeys.push({
        id: Buffer.from(credentialID).toString('base64url'),
        publicKey: credentialPublicKey,
        counter,
        deviceType: credential.response.authenticatorData ? 'platform' : 'roaming',
        backedUp: false,
        transports: credential.response.getTransports?.() || []
      });

      await this.redis.set(`user:${userId}`, JSON.stringify(user));
      await this.redis.del(`challenge:reg:${userId}`);

      return true;
    }

    return false;
  }

  // Passkey authentication
  async startPasskeyAuthentication(username: string): Promise<any> {
    const user = await this.getUserByUsername(username);
    if (!user || user.passkeys.length === 0) {
      throw new Error('No passkeys found for user');
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: process.env.RP_ID || 'localhost',
      allowCredentials: user.passkeys.map(pk => ({
        id: pk.id,
        type: 'public-key',
        transports: pk.transports,
      })),
      userVerification: 'preferred',
    };

    const options = await generateAuthenticationOptions(opts);

    // Store challenge for verification
    await this.redis.setex(
      `challenge:auth:${user.id}`,
      300, // 5 minutes
      options.challenge
    );

    return { options, userId: user.id };
  }

  async finishPasskeyAuthentication(userId: string, credential: any): Promise<string> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const expectedChallenge = await this.redis.get(`challenge:auth:${userId}`);
    if (!expectedChallenge) {
      throw new Error('Challenge not found or expired');
    }

    const passkey = user.passkeys.find(pk => pk.id === credential.id);
    if (!passkey) {
      throw new Error('Passkey not found');
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(passkey.id, 'base64url'),
        credentialPublicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports
      },
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
      // Update counter
      passkey.counter = verification.authenticationInfo.newCounter;
      user.lastLoginAt = Date.now();
      
      await this.redis.set(`user:${userId}`, JSON.stringify(user));
      await this.redis.del(`challenge:auth:${userId}`);

      // Generate JWT token
      const token = await new jose.SignJWT({ 
        sub: user.id, 
        username: user.username,
        iat: Math.floor(Date.now() / 1000)
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(this.jwtSecret);

      return token;
    }

    throw new Error('Authentication failed');
  }

  // Alias management
  async createAlias(alias: string, userId: string): Promise<Alias> {
    const existingAlias = await this.redis.get(`alias:${alias}`);
    if (existingAlias) {
      throw new Error('Alias already exists');
    }

    const aliasRecord: Alias = {
      alias,
      userId,
      verified: false,
      createdAt: Date.now()
    };

    await this.redis.set(`alias:${alias}`, JSON.stringify(aliasRecord));
    await this.redis.sadd(`user:${userId}:aliases`, alias);

    return aliasRecord;
  }

  async resolveAlias(alias: string): Promise<string | null> {
    const aliasData = await this.redis.get(`alias:${alias}`);
    if (!aliasData) return null;

    const aliasRecord: Alias = JSON.parse(aliasData);
    return aliasRecord.verified ? aliasRecord.userId : null;
  }

  async getUserAliases(userId: string): Promise<string[]> {
    return await this.redis.smembers(`user:${userId}:aliases`);
  }

  // JWT verification
  async verifyToken(token: string): Promise<jose.JWTPayload> {
    const { payload } = await jose.jwtVerify(token, this.jwtSecret);
    return payload;
  }
}

// Fastify server setup
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty' }
        : undefined
    }
  });

  // Security plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  });

  const identityService = new IdentityService();

  // User registration
  fastify.post('/api/users', async (request, reply) => {
    try {
      const userData = UserRegistrationSchema.parse(request.body);
      const user = await identityService.createUser(userData);
      
      reply.send({ 
        success: true, 
        userId: user.id,
        username: user.username 
      });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Passkey registration endpoints
  fastify.post('/api/passkeys/register/start', async (request, reply) => {
    try {
      const { userId } = PasskeyRegistrationStartSchema.parse(request.body);
      const options = await identityService.startPasskeyRegistration(userId);
      
      reply.send({ success: true, options });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  fastify.post('/api/passkeys/register/finish', async (request, reply) => {
    try {
      const { userId, credential } = PasskeyRegistrationFinishSchema.parse(request.body);
      const success = await identityService.finishPasskeyRegistration(userId, credential);
      
      reply.send({ success });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Passkey authentication endpoints
  fastify.post('/api/auth/start', async (request, reply) => {
    try {
      const { username } = request.body as { username: string };
      const { options, userId } = await identityService.startPasskeyAuthentication(username);
      
      reply.send({ success: true, options, userId });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  fastify.post('/api/auth/finish', async (request, reply) => {
    try {
      const { userId, credential } = request.body as { userId: string; credential: any };
      const token = await identityService.finishPasskeyAuthentication(userId, credential);
      
      reply.send({ success: true, token });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Alias management
  fastify.post('/api/aliases', async (request, reply) => {
    try {
      const { alias, userId } = request.body as { alias: string; userId: string };
      const aliasRecord = await identityService.createAlias(alias, userId);
      
      reply.send({ success: true, alias: aliasRecord });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  fastify.get('/api/aliases/:alias/resolve', async (request, reply) => {
    try {
      const { alias } = request.params as { alias: string };
      const userId = await identityService.resolveAlias(alias);
      
      if (userId) {
        reply.send({ success: true, userId });
      } else {
        reply.status(404).send({ error: 'Alias not found or not verified' });
      }
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message });
    }
  });

  // Health check
  fastify.get('/api/health', async (request, reply) => {
    reply.send({ 
      status: 'healthy',
      service: 'identity',
      timestamp: Date.now()
    });
  });

  return fastify;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await createServer();
  
  try {
    const port = parseInt(process.env.PORT || '3011');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Identity service running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}