/**
 * Atlas API - Cloudflare Workers
 * Main entry point and router
 */

import { handleJWKS } from './handlers/jwks';
import { handleVerify } from './handlers/verify';
import { handleDPoPNonce } from './handlers/dpop';
import { handleMessages } from './handlers/messages';
import { handleHealth } from './handlers/health';
import { securityHeaders } from './middleware/security-headers';
import { errorResponse, jsonResponse } from './utils/response';

export interface Env {
  JWKS: KVNamespace;
  DPOP_NONCE: KVNamespace;
  IDEMPOTENCY: KVNamespace;
  RATE_LIMIT: KVNamespace;
  DB: D1Database;
  MEDIA: R2Bucket;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Apply security headers to all responses
    const wrapResponse = (response: Response) => securityHeaders(response);

    try {
      // CORS preflight
      if (method === 'OPTIONS') {
        return wrapResponse(
          new Response(null, {
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, DPoP, Idempotency-Key',
              'Access-Control-Max-Age': '86400',
            },
          })
        );
      }

      // Route handlers
      if (path === '/.well-known/jwks.json' && method === 'GET') {
        return wrapResponse(await handleJWKS(request, env));
      }

      if (path === '/verify' && method === 'POST') {
        return wrapResponse(await handleVerify(request, env));
      }

      if (path === '/dpop/nonce' && method === 'POST') {
        return wrapResponse(await handleDPoPNonce(request, env));
      }

      if (path === '/messages' && method === 'POST') {
        return wrapResponse(await handleMessages(request, env));
      }

      if (path === '/healthz' && method === 'GET') {
        return wrapResponse(await handleHealth(request, env));
      }

      // 404 Not Found
      return wrapResponse(
        errorResponse(404, 'NOT_FOUND', 'Endpoint not found')
      );
    } catch (error) {
      console.error('Unhandled error:', error);
      return wrapResponse(
        errorResponse(500, 'INTERNAL_ERROR', 'Internal server error')
      );
    }
  },
};
