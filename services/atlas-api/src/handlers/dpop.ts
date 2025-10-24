/**
 * DPoP (RFC 9449) Nonce Handler
 * Issues one-time nonces for DPoP proof replay prevention
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleDPoPNonce(request: Request, env: Env): Promise<Response> {
  try {
    // Generate random nonce (jti)
    const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
    const nonce = Array.from(nonceBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Store in KV with 5 minute TTL
    await env.DPOP_NONCE.put(nonce, '1', { expirationTtl: 300 });

    return jsonResponse(
      { nonce },
      200,
      {
        'Cache-Control': 'no-store',
        'DPoP-Nonce': nonce,
      }
    );
  } catch (error) {
    console.error('DPoP nonce error:', error);
    return errorResponse(500, 'NONCE_ERROR', 'Failed to generate nonce');
  }
}

/**
 * Verify DPoP proof
 */
export async function verifyDPoP(
  request: Request,
  env: Env,
  dpopHeader: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Parse DPoP JWT
    const [headerB64, payloadB64, signatureB64] = dpopHeader.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return { valid: false, error: 'Invalid DPoP format' };
    }

    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));

    // Verify typ is dpop+jwt
    if (header.typ !== 'dpop+jwt') {
      return { valid: false, error: 'Invalid typ header' };
    }

    // Verify required claims
    if (!payload.jti || !payload.htm || !payload.htu || !payload.iat) {
      return { valid: false, error: 'Missing required claims' };
    }

    // Verify htm matches request method
    if (payload.htm !== request.method) {
      return { valid: false, error: 'htm mismatch' };
    }

    // Verify htu matches request URL (without query/fragment)
    const requestUrl = new URL(request.url);
    const htuUrl = `${requestUrl.protocol}//${requestUrl.host}${requestUrl.pathname}`;
    if (payload.htu !== htuUrl) {
      return { valid: false, error: 'htu mismatch' };
    }

    // Verify iat is recent (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - payload.iat) > 300) {
      return { valid: false, error: 'iat too old or in future' };
    }

    // Verify jti hasn't been used (anti-replay)
    const used = await env.DPOP_NONCE.get(payload.jti);
    if (!used) {
      return { valid: false, error: 'Invalid or expired nonce' };
    }

    // Mark nonce as consumed
    await env.DPOP_NONCE.delete(payload.jti);

    // TODO: Verify signature with JWK from header
    // For now, basic validation passes

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'DPoP verification failed' };
  }
}
