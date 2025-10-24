/**
 * Messages Handler
 * Handles E2EE message sending with DPoP, idempotency, and receipts
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { verifyDPoP } from './dpop';

interface MessageRequest {
  conversationId: string;
  encryptedPayload: string;
  timestamp: number;
  class?: string;
}

export async function handleMessages(request: Request, env: Env): Promise<Response> {
  try {
    // Verify DPoP header
    const dpopHeader = request.headers.get('DPoP');
    if (!dpopHeader) {
      return errorResponse(401, 'MISSING_DPOP', 'DPoP header required');
    }

    const dpopResult = await verifyDPoP(request, env, dpopHeader);
    if (!dpopResult.valid) {
      return errorResponse(401, 'INVALID_DPOP', dpopResult.error || 'DPoP verification failed');
    }

    // Check idempotency key
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return errorResponse(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header required');
    }

    // Check if already processed
    const cached = await env.IDEMPOTENCY.get(idempotencyKey);
    if (cached) {
      return new Response(cached, {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: MessageRequest = await request.json();

    if (!body.conversationId || !body.encryptedPayload) {
      return errorResponse(400, 'INVALID_MESSAGE', 'Missing required fields');
    }

    // Generate message ID
    const messageId = generateId();

    // Store message metadata in D1
    await env.DB.prepare(
      `INSERT INTO messages_meta (id, conversation_id, sender_id, timestamp, size, class)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        messageId,
        body.conversationId,
        'user-id-from-dpop', // TODO: Extract from DPoP
        body.timestamp || Date.now(),
        body.encryptedPayload.length,
        body.class || 'text'
      )
      .run();

    // Store encrypted payload in R2
    const r2Key = `/conv/${body.conversationId}/${messageId}/payload`;
    await env.MEDIA.put(r2Key, body.encryptedPayload);

    // Update message with R2 key
    await env.DB.prepare(`UPDATE messages_meta SET r2_key = ? WHERE id = ?`)
      .bind(r2Key, messageId)
      .run();

    // Generate receipt (RFC 9421)
    const receipt = await generateReceipt(messageId, env);

    const response = jsonResponse(
      {
        id: messageId,
        status: 'sent',
        receipt,
      },
      201
    );

    // Cache response for idempotency (24 hours)
    await env.IDEMPOTENCY.put(idempotencyKey, await response.clone().text(), {
      expirationTtl: 86400,
    });

    return response;
  } catch (error) {
    console.error('Messages error:', error);
    return errorResponse(500, 'MESSAGE_ERROR', 'Failed to send message');
  }
}

function generateId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateReceipt(messageId: string, env: Env): Promise<string> {
  // Simplified receipt generation
  // Full implementation would sign with private key from secrets
  const timestamp = new Date().toISOString();
  const receiptData = {
    messageId,
    timestamp,
    status: 'sent',
  };

  return btoa(JSON.stringify(receiptData));
}
