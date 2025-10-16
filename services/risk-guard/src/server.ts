import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { sha256 } from 'noble-hashes/sha256';
import { bytesToHex } from 'noble-hashes/utils';

const app = Fastify({ logger: true });

// Security middleware
await app.register(helmet);
await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? ['https://*.vercel.app'] : true,
  credentials: true
});

// Redis for caching and reputation data
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Schemas
const LinkAnalysisRequestSchema = z.object({
  url: z.string().url(),
  userId: z.string().optional(),
  context: z.enum(['chat', 'share', 'profile']).default('chat')
});

const ReputationQuerySchema = z.object({
  userId: z.string(),
  includeHistory: z.boolean().default(false)
});

const ProofOfWorkRequestSchema = z.object({
  challenge: z.string(),
  difficulty: z.number().min(1).max(6).default(4),
  userId: z.string().optional()
});

const ProofOfWorkResponseSchema = z.object({
  challenge: z.string(),
  nonce: z.string(),
  hash: z.string()
});

// Risk scoring constants
const RISK_WEIGHTS = {
  domain_reputation: 0.3,
  url_structure: 0.2,
  content_analysis: 0.25,
  user_reputation: 0.15,
  historical_data: 0.1
};

// Known malicious domains (in production, would use threat intelligence feeds)
const MALICIOUS_DOMAINS = new Set([
  'malware-example.com',
  'phishing-site.net',
  'scam-crypto.org'
]);

const SUSPICIOUS_PATTERNS = [
  /bit\.ly|tinyurl\.com|t\.co/, // URL shorteners
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
  /[a-z0-9]{32,}\.com/, // Suspicious long domain names
  /crypto|wallet|btc|eth|urgent|claim|reward/i // Suspicious keywords
];

// Utility functions
function calculateLinkRisk(url: string, userReputation: number = 50): number {
  let riskScore = 0;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Check malicious domains
    if (MALICIOUS_DOMAINS.has(domain)) {
      return 95; // High risk
    }
    
    // Domain reputation (simplified)
    const trustworthy = [
      'github.com', 'google.com', 'microsoft.com', 'vercel.app',
      'youtube.com', 'wikipedia.org', 'mozilla.org'
    ];
    
    if (trustworthy.some(d => domain.includes(d))) {
      riskScore += 5; // Low risk for trusted domains
    } else {
      riskScore += 30; // Higher baseline risk for unknown domains
    }
    
    // URL structure analysis
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        riskScore += 20;
      }
    }
    
    // Path analysis
    if (urlObj.pathname.includes('..') || urlObj.pathname.includes('%')) {
      riskScore += 15; // Path traversal or encoding attempts
    }
    
    // User reputation factor
    if (userReputation < 30) {
      riskScore += 10; // Low reputation users add risk
    } else if (userReputation > 80) {
      riskScore -= 5; // High reputation users reduce risk
    }
    
    return Math.min(Math.max(riskScore, 0), 100);
    
  } catch (error) {
    return 90; // Invalid URLs are high risk
  }
}

function generateChallenge(difficulty: number): string {
  const challenge = randomUUID() + Date.now();
  return `${difficulty}:${challenge}`;
}

function verifyProofOfWork(challenge: string, nonce: string, hash: string): boolean {
  const [difficulty, challengeData] = challenge.split(':');
  const expectedHash = bytesToHex(sha256(new TextEncoder().encode(challengeData + nonce)));
  
  if (hash !== expectedHash) {
    return false;
  }
  
  // Check if hash meets difficulty requirement (leading zeros)
  const requiredZeros = parseInt(difficulty);
  return hash.startsWith('0'.repeat(requiredZeros));
}

// Routes
app.post('/analyze-link', async (request, reply) => {
  try {
    const analysis = LinkAnalysisRequestSchema.parse(request.body);
    const { url, userId, context } = analysis;
    
    // Get user reputation
    let userReputation = 50; // Default neutral reputation
    if (userId) {
      const repData = await redis.get(`reputation:${userId}`);
      if (repData) {
        userReputation = JSON.parse(repData).score;
      }
    }
    
    // Calculate risk score
    const riskScore = calculateLinkRisk(url, userReputation);
    
    // Determine risk level
    let riskLevel: string;
    let action: string;
    
    if (riskScore >= 80) {
      riskLevel = 'high';
      action = 'block';
    } else if (riskScore >= 50) {
      riskLevel = 'medium';
      action = 'warn';
    } else if (riskScore >= 25) {
      riskLevel = 'low';
      action = 'allow';
    } else {
      riskLevel = 'minimal';
      action = 'allow';
    }
    
    // Cache result
    const cacheKey = `link_analysis:${bytesToHex(sha256(new TextEncoder().encode(url)))}`;
    const result = {
      url,
      riskScore,
      riskLevel,
      action,
      analysedAt: Date.now(),
      context,
      userId
    };
    
    await redis.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
    
    // Log analysis for reputation tracking
    if (userId) {
      await redis.lpush(`user_links:${userId}`, JSON.stringify({
        url,
        riskScore,
        timestamp: Date.now()
      }));
      await redis.ltrim(`user_links:${userId}`, 0, 99); // Keep last 100 links
    }
    
    reply.send(result);
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Link analysis failed' });
  }
});

app.get('/reputation/:userId', async (request, reply) => {
  try {
    const { userId } = request.params as { userId: string };
    const { includeHistory } = request.query as any;
    
    let reputation = await redis.get(`reputation:${userId}`);
    
    if (!reputation) {
      // Initialize reputation for new user
      const initialRep = {
        userId,
        score: 50, // Neutral starting score
        level: 'neutral',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        activities: 0
      };
      
      await redis.setex(`reputation:${userId}`, 86400 * 30, JSON.stringify(initialRep));
      reputation = JSON.stringify(initialRep);
    }
    
    const repData = JSON.parse(reputation);
    
    // Include recent activity if requested
    if (includeHistory) {
      const recentLinks = await redis.lrange(`user_links:${userId}`, 0, 19);
      repData.recentLinks = recentLinks.map(link => JSON.parse(link));
    }
    
    reply.send(repData);
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to get reputation' });
  }
});

app.post('/reputation/:userId/update', async (request, reply) => {
  try {
    const { userId } = request.params as { userId: string };
    const { action, value } = request.body as { action: 'increment' | 'decrement' | 'set', value: number };
    
    let reputation = await redis.get(`reputation:${userId}`);
    let repData: any;
    
    if (!reputation) {
      repData = {
        userId,
        score: 50,
        level: 'neutral',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        activities: 0
      };
    } else {
      repData = JSON.parse(reputation);
    }
    
    // Update score based on action
    switch (action) {
      case 'increment':
        repData.score = Math.min(repData.score + value, 100);
        break;
      case 'decrement':
        repData.score = Math.max(repData.score - value, 0);
        break;
      case 'set':
        repData.score = Math.min(Math.max(value, 0), 100);
        break;
    }
    
    // Update level based on score
    if (repData.score >= 80) {
      repData.level = 'excellent';
    } else if (repData.score >= 60) {
      repData.level = 'good';
    } else if (repData.score >= 40) {
      repData.level = 'neutral';
    } else if (repData.score >= 20) {
      repData.level = 'poor';
    } else {
      repData.level = 'suspicious';
    }
    
    repData.lastUpdated = Date.now();
    repData.activities += 1;
    
    await redis.setex(`reputation:${userId}`, 86400 * 30, JSON.stringify(repData));
    
    reply.send(repData);
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to update reputation' });
  }
});

app.post('/proof-of-work/challenge', async (request, reply) => {
  try {
    const powRequest = ProofOfWorkRequestSchema.parse(request.body);
    const { difficulty, userId } = powRequest;
    
    const challenge = generateChallenge(difficulty);
    const challengeId = randomUUID();
    
    // Store challenge
    await redis.setex(`pow_challenge:${challengeId}`, 300, JSON.stringify({
      challenge,
      difficulty,
      userId,
      createdAt: Date.now()
    }));
    
    reply.send({
      challengeId,
      challenge,
      difficulty,
      expiresAt: Date.now() + 300000, // 5 minutes
      instruction: `Find nonce such that SHA256(${challenge.split(':')[1]} + nonce) starts with ${difficulty} zeros`
    });
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to generate challenge' });
  }
});

app.post('/proof-of-work/verify', async (request, reply) => {
  try {
    const { challengeId, ...powResponse } = request.body as { challengeId: string } & z.infer<typeof ProofOfWorkResponseSchema>;
    
    const challengeData = await redis.get(`pow_challenge:${challengeId}`);
    
    if (!challengeData) {
      return reply.code(404).send({ error: 'Challenge not found or expired' });
    }
    
    const { challenge, difficulty, userId } = JSON.parse(challengeData);
    
    if (powResponse.challenge !== challenge) {
      return reply.code(400).send({ error: 'Challenge mismatch' });
    }
    
    const isValid = verifyProofOfWork(challenge, powResponse.nonce, powResponse.hash);
    
    if (!isValid) {
      return reply.code(400).send({ error: 'Invalid proof of work' });
    }
    
    // Clean up used challenge
    await redis.del(`pow_challenge:${challengeId}`);
    
    // Award reputation points for completed PoW
    if (userId) {
      const repKey = `reputation:${userId}`;
      let reputation = await redis.get(repKey);
      let repData: any;
      
      if (reputation) {
        repData = JSON.parse(reputation);
        repData.score = Math.min(repData.score + difficulty, 100); // Award points based on difficulty
        repData.lastUpdated = Date.now();
        await redis.setex(repKey, 86400 * 30, JSON.stringify(repData));
      }
    }
    
    reply.send({
      verified: true,
      challengeId,
      difficulty,
      completedAt: Date.now(),
      reputationAwarded: difficulty
    });
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Verification failed' });
  }
});

app.get('/stats', async (request, reply) => {
  try {
    const analysisKeys = await redis.keys('link_analysis:*');
    const reputationKeys = await redis.keys('reputation:*');
    const challengeKeys = await redis.keys('pow_challenge:*');
    
    reply.send({
      totalAnalyses: analysisKeys.length,
      totalUsers: reputationKeys.length,
      activeChallenges: challengeKeys.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to get stats' });
  }
});

app.get('/health', async (request, reply) => {
  try {
    await redis.ping();
    reply.send({ 
      status: 'healthy', 
      timestamp: Date.now(),
      services: ['link_analysis', 'reputation', 'proof_of_work']
    });
  } catch (error) {
    app.log.error(error);
    reply.code(503).send({ status: 'unhealthy', error: error.message });
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3006');
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Atlas Risk Guard Service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();