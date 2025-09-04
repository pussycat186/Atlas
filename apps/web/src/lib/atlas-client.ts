/**
 * Atlas Client Configuration
 * Client-side configuration for Atlas services
 */

import { AtlasFabricClient } from '@atlas/fabric-client';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

export const atlasClient = new AtlasFabricClient(GATEWAY_URL);

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  timestamp: string;
  integrity_status: 'verified' | 'conflict' | 'pending';
  quorum_count?: number;
  max_skew_ms?: number;
}

export interface DriveFile {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  chunks: DriveChunk[];
  uploaded_at: string;
  integrity_status: 'verified' | 'conflict' | 'pending';
}

export interface DriveChunk {
  id: string;
  chunk_id: string;
  data: string;
  order: number;
  integrity_status: 'verified' | 'conflict' | 'pending';
}

export class ChatService {
  private client = atlasClient;

  async sendMessage(roomId: string, userId: string, content: string): Promise<ChatMessage> {
    const recordId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.client.submitRecord('chat', recordId, content, {
      room_id: roomId,
      user_id: userId,
      message_type: 'text',
    });

    return {
      id: recordId,
      room_id: roomId,
      user_id: userId,
      content,
      timestamp: new Date().toISOString(),
      integrity_status: result.ok ? 'verified' : 'conflict',
      quorum_count: result.quorum_count,
      max_skew_ms: result.max_skew_ms,
    };
  }

  async verifyMessage(messageId: string): Promise<ChatMessage | null> {
    try {
      const result = await this.client.verifyRecord(messageId);
      
      if (result.consistent_attestations.length === 0) {
        return null;
      }

      const attestation = result.consistent_attestations[0];
      const record = attestation.state_view;

      return {
        id: record.record_id,
        room_id: 'unknown', // Would need to fetch from record meta
        user_id: 'unknown', // Would need to fetch from record meta
        content: 'unknown', // Would need to fetch from record payload
        timestamp: attestation.ts,
        integrity_status: result.ok ? 'verified' : 'conflict',
        quorum_count: result.quorum_count,
        max_skew_ms: result.max_skew_ms,
      };
    } catch (error) {
      console.error('Failed to verify message:', error);
      return null;
    }
  }
}

export class DriveService {
  private client = atlasClient;

  async uploadFile(filename: string, content: string, mimeType: string): Promise<DriveFile> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks: DriveChunk[] = [];

    // Split content into chunks
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunkContent = content.slice(i, i + chunkSize);
      const chunkId = `${fileId}_chunk_${Math.floor(i / chunkSize)}`;
      
      const result = await this.client.submitRecord('drive', chunkId, chunkContent, {
        filename,
        chunk_id: chunkId,
        size: chunkContent.length,
        mime_type: mimeType,
      });

      chunks.push({
        id: chunkId,
        chunk_id: chunkId,
        data: chunkContent,
        order: Math.floor(i / chunkSize),
        integrity_status: result.ok ? 'verified' : 'conflict',
      });
    }

    return {
      id: fileId,
      filename,
      size: content.length,
      mime_type: mimeType,
      chunks,
      uploaded_at: new Date().toISOString(),
      integrity_status: chunks.every(c => c.integrity_status === 'verified') ? 'verified' : 'conflict',
    };
  }

  async verifyFile(fileId: string): Promise<DriveFile | null> {
    try {
      // This would need to be implemented to fetch all chunks for a file
      // For now, return null as a placeholder
      return null;
    } catch (error) {
      console.error('Failed to verify file:', error);
      return null;
    }
  }
}

export const chatService = new ChatService();
export const driveService = new DriveService();
