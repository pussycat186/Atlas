import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { sha256 } from 'noble-hashes/sha256';
import { bytesToHex } from 'noble-hashes/utils';
import mimeTypes from 'mime-types';

const app = Fastify({ logger: true });

// Security middleware
await app.register(helmet);
await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? ['https://*.vercel.app'] : true,
  credentials: true
});
await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

// S3 client for object storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  } : undefined
});

// Redis for metadata and access control
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'atlas-media-storage';

// Schemas
const UploadMetadataSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  encryptionKey: z.string().optional(), // Base64 encoded encryption key
  chatId: z.string().optional(),
  expiresAt: z.number().optional()
});

const ShareRequestSchema = z.object({
  objectId: z.string(),
  recipients: z.array(z.string()),
  expiresIn: z.number().default(3600) // 1 hour default
});

// Utility functions
function generateObjectId(): string {
  return `atlas_${Date.now()}_${randomUUID()}`;
}

function calculateFileHash(buffer: Buffer): string {
  return bytesToHex(sha256(buffer));
}

// Routes
app.post('/upload', async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    const buffer = await data.toBuffer();
    const fileHash = calculateFileHash(buffer);
    const objectId = generateObjectId();
    const contentType = data.mimetype || 'application/octet-stream';
    
    // Validate content type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain'
    ];
    
    if (!allowedTypes.includes(contentType)) {
      return reply.code(400).send({ error: 'Unsupported file type' });
    }

    // Upload to S3
    const s3Key = `media/${objectId}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256'
    }));

    // Store metadata in Redis
    const metadata = {
      objectId,
      filename: data.filename,
      contentType,
      size: buffer.length,
      hash: fileHash,
      s3Key,
      uploadedAt: Date.now(),
      uploadedBy: request.headers['x-user-id'] || 'anonymous',
      encrypted: false, // Client-side encryption status would be passed in headers
      chatId: request.headers['x-chat-id'] || null
    };

    await redis.hset(`media:${objectId}`, metadata);
    await redis.expire(`media:${objectId}`, 86400 * 30); // 30 days default

    reply.code(201).send({
      objectId,
      url: `/media/${objectId}`,
      hash: fileHash,
      size: buffer.length,
      contentType
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Upload failed' });
  }
});

app.get('/media/:objectId', async (request, reply) => {
  try {
    const { objectId } = request.params as { objectId: string };
    
    // Get metadata from Redis
    const metadata = await redis.hgetall(`media:${objectId}`);
    
    if (!metadata.objectId) {
      return reply.code(404).send({ error: 'Media object not found' });
    }

    // Check access permissions (simplified - would implement proper ACL)
    const userId = request.headers['x-user-id'];
    if (metadata.chatId && !userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Generate signed URL for S3 access
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3Key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    reply.send({
      objectId,
      filename: metadata.filename,
      contentType: metadata.contentType,
      size: parseInt(metadata.size),
      downloadUrl: signedUrl,
      hash: metadata.hash,
      uploadedAt: parseInt(metadata.uploadedAt)
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to retrieve media' });
  }
});

app.post('/media/:objectId/share', async (request, reply) => {
  try {
    const { objectId } = request.params as { objectId: string };
    const shareRequest = ShareRequestSchema.parse(request.body);
    
    const metadata = await redis.hgetall(`media:${objectId}`);
    
    if (!metadata.objectId) {
      return reply.code(404).send({ error: 'Media object not found' });
    }

    // Create share token
    const shareToken = randomUUID();
    const shareData = {
      objectId,
      recipients: JSON.stringify(shareRequest.recipients),
      createdBy: request.headers['x-user-id'] || 'anonymous',
      createdAt: Date.now(),
      expiresAt: Date.now() + (shareRequest.expiresIn * 1000)
    };

    await redis.hset(`share:${shareToken}`, shareData);
    await redis.expire(`share:${shareToken}`, shareRequest.expiresIn);

    reply.send({
      shareToken,
      shareUrl: `/media/shared/${shareToken}`,
      expiresAt: shareData.expiresAt,
      recipients: shareRequest.recipients
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to create share link' });
  }
});

app.get('/media/shared/:shareToken', async (request, reply) => {
  try {
    const { shareToken } = request.params as { shareToken: string };
    
    const shareData = await redis.hgetall(`share:${shareToken}`);
    
    if (!shareData.objectId) {
      return reply.code(404).send({ error: 'Share link not found or expired' });
    }

    // Check if user is authorized (simplified)
    const userId = request.headers['x-user-id'];
    const recipients = JSON.parse(shareData.recipients);
    
    if (recipients.length > 0 && !recipients.includes(userId)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    // Get media metadata
    const metadata = await redis.hgetall(`media:${shareData.objectId}`);
    
    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3Key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    reply.send({
      objectId: shareData.objectId,
      filename: metadata.filename,
      contentType: metadata.contentType,
      size: parseInt(metadata.size),
      downloadUrl: signedUrl,
      sharedBy: shareData.createdBy,
      expiresAt: parseInt(shareData.expiresAt)
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to access shared media' });
  }
});

app.delete('/media/:objectId', async (request, reply) => {
  try {
    const { objectId } = request.params as { objectId: string };
    const userId = request.headers['x-user-id'];
    
    const metadata = await redis.hgetall(`media:${objectId}`);
    
    if (!metadata.objectId) {
      return reply.code(404).send({ error: 'Media object not found' });
    }

    // Check ownership (simplified)
    if (metadata.uploadedBy !== userId && userId !== 'admin') {
      return reply.code(403).send({ error: 'Permission denied' });
    }

    // Delete from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.s3Key
    }));

    // Delete metadata from Redis
    await redis.del(`media:${objectId}`);

    reply.send({ 
      success: true, 
      objectId, 
      deletedAt: Date.now() 
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to delete media' });
  }
});

app.get('/media', async (request, reply) => {
  try {
    const userId = request.headers['x-user-id'];
    const { limit = 50, offset = 0 } = request.query as any;
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Get user's media objects (simplified - would use proper indexing)
    const keys = await redis.keys(`media:*`);
    const userMedia = [];
    
    for (const key of keys.slice(Number(offset), Number(offset) + Number(limit))) {
      const metadata = await redis.hgetall(key);
      if (metadata.uploadedBy === userId) {
        userMedia.push({
          objectId: metadata.objectId,
          filename: metadata.filename,
          contentType: metadata.contentType,
          size: parseInt(metadata.size),
          uploadedAt: parseInt(metadata.uploadedAt),
          url: `/media/${metadata.objectId}`
        });
      }
    }

    reply.send({
      media: userMedia.sort((a, b) => b.uploadedAt - a.uploadedAt),
      total: userMedia.length
    });

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to list media' });
  }
});

app.get('/health', async (request, reply) => {
  try {
    await redis.ping();
    
    // Test S3 connectivity
    try {
      await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: 'health-check'
      }));
    } catch (s3Error: any) {
      if (s3Error.name !== 'NoSuchKey') {
        throw s3Error;
      }
    }
    
    reply.send({ 
      status: 'healthy', 
      timestamp: Date.now(),
      storage: 'available'
    });
  } catch (error) {
    app.log.error(error);
    reply.code(503).send({ status: 'unhealthy', error: error.message });
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3005');
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Atlas Media Service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();