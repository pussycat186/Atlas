/**
 * JWKS Handler
 * Serves public keys from KV for signature verification
 * RFC 7517 (JSON Web Key)
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleJWKS(request: Request, env: Env): Promise<Response> {
  try {
    // Get all keys from KV namespace
    const { keys } = await env.JWKS.list();
    
    const jwks: any[] = [];
    
    for (const key of keys) {
      if (key.name !== 'current') {
        const jwk = await env.JWKS.get(key.name, 'json');
        if (jwk) {
          jwks.push(jwk);
        }
      }
    }

    if (jwks.length === 0) {
      return errorResponse(503, 'NO_KEYS', 'No signing keys available');
    }

    return jsonResponse(
      { keys: jwks },
      200,
      {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      }
    );
  } catch (error) {
    console.error('JWKS error:', error);
    return errorResponse(500, 'JWKS_ERROR', 'Failed to retrieve JWKS');
  }
}
