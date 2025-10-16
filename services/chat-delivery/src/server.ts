import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { RFC9421Signer, AtlasKeyManager, type AtlasReceiptContent } from '@atlas/receipt';

// Message schemas
const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string(),
  content: z.string().max(4096),
  timestamp: z.number(),
  mlsCommit: z.string().optional(), // MLS commit for group messages
  signature: z.string().optional(), // RFC 9421 signature for receipts
  receiptId: z.string().optional()  // Generated receipt ID
});

const DeliveryReceiptSchema = z.object({
  messageId: z.string().uuid(),
  recipientId: z.string(),
  deliveredAt: z.number(),
  signature: z.string()
});

type Message = z.infer<typeof MessageSchema>;
type DeliveryReceipt = z.infer<typeof DeliveryReceiptSchema>;

// Connection manager for WebSocket clients
class ConnectionManager {
  private connections = new Map<string, Set<any>>();
  
  addConnection(userId: string, socket: any) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(socket);
    
    socket.on('close', () => {
      this.connections.get(userId)?.delete(socket);
      if (this.connections.get(userId)?.size === 0) {
        this.connections.delete(userId);
      }
    });
  }
  
  getConnections(userId: string): Set<any> {
    return this.connections.get(userId) || new Set();
  }
  
  isUserOnline(userId: string): boolean {
    return this.connections.has(userId) && this.connections.get(userId)!.size > 0;
  }
}

// Chat delivery service
export class ChatDeliveryService {
  private redis: Redis;
  private connectionManager: ConnectionManager;
  private receiptSigner: RFC9421Signer | null = null;
  
  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    this.connectionManager = new ConnectionManager();
    this.initializeReceiptSigning();
  }
  
  private async initializeReceiptSigning(): Promise<void> {
    try {
      // In production, load from secure key management service
      const { privateKey } = await AtlasKeyManager.generateEd25519KeyPair();
      const keyId = process.env.RECEIPT_KEY_ID || 'chat-delivery-key';
      
      this.receiptSigner = new RFC9421Signer(privateKey, keyId, 'Ed25519');
      console.log('📝 Receipt signing initialized');
    } catch (error) {
      console.error('Failed to initialize receipt signing:', error);
    }
  }
  
  async deliverMessage(message: Message): Promise<void> {
    // Generate receipt for message delivery
    if (this.receiptSigner) {
      try {
        const receiptContent: AtlasReceiptContent = {
          messageId: message.id,
          conversationId: message.conversationId,
          participants: await this.getConversationParticipants(message.conversationId),
          deliveryStatus: 'sent',
          timestamp: message.timestamp,
          hash: message.id // Simplified - would use content hash
        };

        const receipt = await this.receiptSigner.createReceipt(
          `message:${message.id}`,
          message.senderId,
          'message.send',
          receiptContent,
          {
            conversationId: message.conversationId,
            mlsCommit: message.mlsCommit
          }
        );

        message.receiptId = receipt.id;
        
        // Store receipt for verification
        await this.redis.set(
          `receipt:${receipt.id}`,
          JSON.stringify(receipt),
          'EX', 
          90 * 24 * 60 * 60 // 90 days
        );
        
        console.log(`📝 Generated receipt ${receipt.id} for message ${message.id}`);
      } catch (error) {
        console.error('Failed to generate message receipt:', error);
      }
    }
    
    // Store message in Redis for offline delivery
    await this.redis.lpush(`messages:${message.conversationId}`, JSON.stringify(message));
    await this.redis.expire(`messages:${message.conversationId}`, 86400); // 24h TTL
    
    // Get conversation participants
    const participants = await this.getConversationParticipants(message.conversationId);
    
    // Deliver to online participants
    for (const participantId of participants) {
      if (participantId !== message.senderId) {
        this.deliverToUser(participantId, message);
      }
    }
  }
  
  private deliverToUser(userId: string, message: Message): void {
    const connections = this.connectionManager.getConnections(userId);
    
    for (const socket of connections) {
      try {
        socket.send(JSON.stringify({
          type: 'message',
          data: message
        }));
      } catch (error) {
        console.error(`Failed to deliver to ${userId}:`, error);
      }
    }
  }
  
  async getConversationParticipants(conversationId: string): Promise<string[]> {
    // Mock implementation - would fetch from database
    const participants = await this.redis.smembers(`conversation:${conversationId}:participants`);
    return participants;
  }
  
  async recordDeliveryReceipt(receipt: DeliveryReceipt): Promise<void> {
    await this.redis.set(
      `receipt:${receipt.messageId}:${receipt.recipientId}`,
      JSON.stringify(receipt),
      'EX', 86400 // 24h TTL
    );
  }

  // Get receipt by ID (S3)
  async getReceipt(receiptId: string): Promise<any> {
    const receiptData = await this.redis.get(`receipt:${receiptId}`);
    return receiptData ? JSON.parse(receiptData) : null;
  }
  
  handleWebSocketConnection(socket: any, userId: string): void {
    this.connectionManager.addConnection(userId, socket);
    
    // Send pending messages
    this.deliverPendingMessages(userId, socket);
    
    socket.on('message', async (data: string) => {
      try {
        const payload = JSON.parse(data);
        
        switch (payload.type) {
          case 'message':
            const message = MessageSchema.parse(payload.data);
            await this.deliverMessage(message);
            break;
            
          case 'receipt':
            const receipt = DeliveryReceiptSchema.parse(payload.data);
            await this.recordDeliveryReceipt(receipt);
            break;
            
          default:
            socket.send(JSON.stringify({ error: 'Unknown message type' }));
        }
      } catch (error) {
        socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
  }
  
  private async deliverPendingMessages(userId: string, socket: any): Promise<void> {
    // Get user's conversations and deliver pending messages
    const conversations = await this.redis.smembers(`user:${userId}:conversations`);
    
    for (const conversationId of conversations) {
      const messages = await this.redis.lrange(`messages:${conversationId}`, 0, 50);
      
      for (const messageStr of messages) {
        try {
          const message = JSON.parse(messageStr);
          if (message.senderId !== userId) {
            socket.send(JSON.stringify({
              type: 'message',
              data: message
            }));
          }
        } catch (error) {
          console.error('Failed to parse pending message:', error);
        }
      }
    }
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
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    }
  });
  
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  });
  
  await fastify.register(websocket);

  const chatService = new ChatDeliveryService();

  // WebSocket endpoint for real-time messaging
  fastify.register(async function (fastify) {
    fastify.get('/ws/:userId', { websocket: true }, (connection, req) => {
      const { userId } = req.params as { userId: string };
      chatService.handleWebSocketConnection(connection.socket, userId);
    });
  });

  // HTTP API endpoints
  fastify.post('/api/messages', async (request, reply) => {
    try {
      const message = MessageSchema.parse(request.body);
      await chatService.deliverMessage(message);
      
      reply.send({ success: true, messageId: message.id });
    } catch (error) {
      reply.status(400).send({ error: 'Invalid message format' });
    }
  });

  fastify.post('/api/receipts', async (request, reply) => {
    try {
      const receipt = DeliveryReceiptSchema.parse(request.body);
      await chatService.recordDeliveryReceipt(receipt);
      
      reply.send({ success: true });
    } catch (error) {
      reply.status(400).send({ error: 'Invalid receipt format' });
    }
  });

  // Get receipt by ID (S3)
  fastify.get('/api/receipts/:receiptId', async (request, reply) => {
    try {
      const { receiptId } = request.params as { receiptId: string };
      const receipt = await chatService.getReceipt(receiptId);
      
      if (!receipt) {
        return reply.status(404).send({ error: 'Receipt not found' });
      }
      
      reply.send(receipt);
    } catch (error) {
      reply.status(500).send({ error: 'Failed to retrieve receipt' });
    }
  });

  fastify.get('/api/health', async (request, reply) => {
    reply.send({ 
      status: 'healthy',
      service: 'chat-delivery',
      timestamp: Date.now()
    });
  });

  return fastify;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await createServer();
  
  try {
    const port = parseInt(process.env.PORT || '3010');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Chat delivery service running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}