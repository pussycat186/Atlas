/**
 * DPoP (Demonstrating Proof-of-Possession) Server Validation
 * RFC 9449 compliant server-side validation for Atlas applications
 * 
 * Validates DPoP proofs to ensure token binding and prevent replay attacks
 */

import { webcrypto } from 'crypto';
import type { NextRequest } from 'next/server';

const crypto = webcrypto;

interface DPoPProof {
  header: {
    alg: string;
    typ: string;
    jwk: JsonWebKey;
  };
  payload: {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
    exp: number;
    ath?: string;
  };
  signature: string;
}

export class DPoPValidator {
  private usedNonces: Set<string> = new Set();
  private readonly maxNonceAge = 300; // 5 minutes

  /**
   * Validate DPoP proof from request headers
   * @param {NextRequest} request - Next.js request object
   * @returns {Promise<{valid: boolean, error?: string, jwk?: JsonWebKey}>}
   */
  async validateDPoPProof(request: NextRequest): Promise<{
    valid: boolean;
    error?: string;
    jwk?: JsonWebKey;
  }> {
    try {
      // Extract DPoP header
      const dpopHeader = request.headers.get('DPoP');
      if (!dpopHeader) {
        return { valid: false, error: 'Missing DPoP header' };
      }

      // Parse JWT
      const proof = this.parseJWT(dpopHeader);
      if (!proof) {
        return { valid: false, error: 'Invalid DPoP JWT format' };
      }

      // Validate header
      if (proof.header.alg !== 'ES256' || proof.header.typ !== 'dpop+jwt') {
        return { valid: false, error: 'Invalid DPoP JWT header' };
      }

      // Validate JWK
      if (!this.isValidJWK(proof.header.jwk)) {
        return { valid: false, error: 'Invalid JWK in DPoP proof' };
      }

      // Validate payload
      const validationResult = await this.validatePayload(proof.payload, request);
      if (!validationResult.valid) {
        return validationResult;
      }

      // Verify signature
      const signatureValid = await this.verifySignature(dpopHeader, proof.header.jwk);
      if (!signatureValid) {
        return { valid: false, error: 'Invalid DPoP proof signature' };
      }

      // Check nonce replay
      if (this.usedNonces.has(proof.payload.jti)) {
        return { valid: false, error: 'DPoP proof replay detected' };
      }

      // Store nonce to prevent replay
      this.usedNonces.add(proof.payload.jti);
      this.cleanupExpiredNonces();

      console.log('✅ DPoP proof validated successfully');
      return { valid: true, jwk: proof.header.jwk };

    } catch (error) {
      console.error('❌ DPoP validation error:', error);
      return { valid: false, error: 'DPoP validation failed' };
    }
  }

  /**
   * Validate DPoP proof payload
   */
  private async validatePayload(
    payload: DPoPProof['payload'], 
    request: NextRequest
  ): Promise<{ valid: boolean; error?: string }> {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp < now) {
      return { valid: false, error: 'DPoP proof expired' };
    }

    // Check not-before (allow 60s clock skew)
    if (payload.iat > now + 60) {
      return { valid: false, error: 'DPoP proof not yet valid' };
    }

    // Validate HTTP method
    const requestMethod = request.method.toUpperCase();
    if (payload.htm !== requestMethod) {
      return { valid: false, error: `HTTP method mismatch: expected ${requestMethod}, got ${payload.htm}` };
    }

    // Validate HTTP URI
    const requestUrl = request.url;
    if (payload.htu !== requestUrl) {
      return { valid: false, error: `HTTP URI mismatch: expected ${requestUrl}, got ${payload.htu}` };
    }

    // Validate access token hash if present
    if (payload.ath) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return { valid: false, error: 'Access token hash present but no Bearer token found' };
      }

      const accessToken = authHeader.substring(7);
      const expectedHash = await this.sha256Hash(accessToken);
      if (payload.ath !== expectedHash) {
        return { valid: false, error: 'Access token hash mismatch' };
      }
    }

    return { valid: true };
  }

  /**
   * Parse JWT into components
   */
  private parseJWT(jwt: string): DPoPProof | null {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      
      return {
        header,
        payload,
        signature: parts[2]
      };
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Validate JWK format and parameters
   */
  private isValidJWK(jwk: JsonWebKey): boolean {
    return (
      jwk.kty === 'EC' &&
      jwk.crv === 'P-256' &&
      typeof jwk.x === 'string' &&
      typeof jwk.y === 'string' &&
      jwk.use === undefined || jwk.use === 'sig' // Optional use parameter
    );
  }

  /**
   * Verify JWT signature using JWK public key
   */
  private async verifySignature(jwt: string, jwk: JsonWebKey): Promise<boolean> {
    try {
      const parts = jwt.split('.');
      const signatureInput = `${parts[0]}.${parts[1]}`;
      const signature = this.base64UrlDecodeToBuffer(parts[2]);

      // Import public key
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );

      // Verify signature
      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        signature,
        new TextEncoder().encode(signatureInput)
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Create SHA-256 hash (base64url encoded)
   */
  private async sha256Hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.base64UrlEncode(hashBuffer);
  }

  /**
   * Base64URL decode to string
   */
  private base64UrlDecode(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return decodeURIComponent(escape(atob(padded)));
  }

  /**
   * Base64URL decode to ArrayBuffer
   */
  private base64UrlDecodeToBuffer(data: string): ArrayBuffer {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Base64URL encode
   */
  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = String.fromCharCode(...bytes);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Clean up expired nonces to prevent memory leaks
   */
  private cleanupExpiredNonces(): void {
    // In production, this should use a more sophisticated cleanup mechanism
    // For now, clear all nonces if we have more than 10000
    if (this.usedNonces.size > 10000) {
      this.usedNonces.clear();
      console.log('🧹 DPoP nonce cache cleared');
    }
  }
}

// Singleton instance for the application
let dpopValidator: DPoPValidator | null = null;

export function getDPoPValidator(): DPoPValidator {
  if (!dpopValidator) {
    dpopValidator = new DPoPValidator();
  }
  return dpopValidator;
}