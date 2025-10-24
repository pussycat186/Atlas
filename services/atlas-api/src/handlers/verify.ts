/**
 * RFC 9421 HTTP Message Signatures Verification Handler
 * Verifies signature of requests/responses using Ed25519
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import * as ed from '@noble/ed25519';

interface VerifyRequest {
  message: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  signature: string;
  signatureInput: string;
}

export async function handleVerify(request: Request, env: Env): Promise<Response> {
  try {
    const body: VerifyRequest = await request.json();

    if (!body.message || !body.signature || !body.signatureInput) {
      return errorResponse(400, 'INVALID_REQUEST', 'Missing required fields');
    }

    // Parse signature input to extract kid
    const kidMatch = body.signatureInput.match(/keyid="([^"]+)"/);
    if (!kidMatch) {
      return errorResponse(400, 'INVALID_SIGNATURE_INPUT', 'Missing keyid in signature input');
    }

    const kid = kidMatch[1];

    // Fetch public key from JWKS
    const jwkData = await env.JWKS.get(kid, 'json');
    if (!jwkData) {
      return errorResponse(404, 'KEY_NOT_FOUND', `Key ${kid} not found`);
    }

    const jwk = jwkData as any;

    // Decode public key from JWK
    const publicKeyBytes = base64urlDecode(jwk.x);

    // Build signature base (simplified - full implementation would parse signatureInput)
    const signatureBase = buildSignatureBase(body.message, body.signatureInput);

    // Decode signature
    const signatureBytes = base64urlDecode(body.signature);

    // Verify signature
    const isValid = await ed.verify(
      signatureBytes,
      new TextEncoder().encode(signatureBase),
      publicKeyBytes
    );

    if (isValid) {
      return jsonResponse({
        valid: true,
        kid,
        algorithm: 'ed25519',
      });
    } else {
      return errorResponse(401, 'INVALID_SIGNATURE', 'Signature verification failed');
    }
  } catch (error) {
    console.error('Verify error:', error);
    return errorResponse(500, 'VERIFY_ERROR', 'Verification failed');
  }
}

function buildSignatureBase(message: any, signatureInput: string): string {
  // RFC 9421 signature base construction
  // Simplified version - full implementation would parse covered components
  const lines: string[] = [];

  // Add covered components in order
  lines.push(`"@method": ${message.method}`);
  lines.push(`"@target-uri": ${message.url}`);

  if (message.headers) {
    for (const [name, value] of Object.entries(message.headers)) {
      lines.push(`"${name.toLowerCase()}": ${value}`);
    }
  }

  // Add signature params
  lines.push(`"@signature-params": ${signatureInput}`);

  return lines.join('\n');
}

function base64urlDecode(str: string): Uint8Array {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  // Convert base64url to base64
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  // Decode
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
