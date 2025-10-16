/**
 * Enhanced CSRF Protection for Atlas Applications
 * Multi-layer defense against Cross-Site Request Forgery attacks
 * 
 * Implements:
 * 1. CSRF tokens with cryptographic binding
 * 2. Fetch Metadata header validation (Sec-Fetch-*)  
 * 3. Origin/Referer header verification
 * 4. SameSite cookie enforcement
 */

import { webcrypto } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const crypto = webcrypto;

interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  secretKey: string;
  maxAge: number;
}

export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'atlas_csrf',
      secretKey: process.env.CSRF_SECRET_KEY || this.generateSecretKey(),
      maxAge: 3600, // 1 hour
      ...config
    };
  }

  /**
   * Generate CSRF token for form/AJAX requests
   * @param {string} sessionId - User session identifier
   * @returns {Promise<string>} CSRF token
   */
  async generateToken(sessionId: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ sessionId, timestamp });
    
    // Create HMAC signature
    const key = await this.importSecretKey();
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    );

    const token = `${this.base64UrlEncode(payload)}.${this.base64UrlEncode(signature)}`;
    
    console.log('🔐 CSRF token generated for session:', sessionId.substring(0, 8));
    return token;
  }

  /**
   * Validate CSRF token from request
   * @param {NextRequest} request - Next.js request object
   * @param {string} sessionId - Current user session ID
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateToken(request: NextRequest, sessionId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      // Skip validation for safe methods
      if (this.isSafeMethod(request.method)) {
        return { valid: true };
      }

      // Check CSRF token in header or form data
      let token = request.headers.get(this.config.headerName);
      
      if (!token) {
        // Try to get from form data for POST requests
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          token = formData.get(this.config.tokenName) as string;
        }
      }

      if (!token) {
        return { valid: false, error: 'Missing CSRF token' };
      }

      // Validate token structure
      const parts = token.split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'Invalid CSRF token format' };
      }

      // Decode payload
      const payloadStr = this.base64UrlDecode(parts[0]);
      const payload = JSON.parse(payloadStr);

      // Check session match
      if (payload.sessionId !== sessionId) {
        return { valid: false, error: 'CSRF token session mismatch' };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (now - payload.timestamp > this.config.maxAge) {
        return { valid: false, error: 'CSRF token expired' };
      }

      // Verify signature
      const key = await this.importSecretKey();
      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payloadStr)
      );

      const providedSignature = this.base64UrlDecodeToBuffer(parts[1]);
      
      if (!this.constantTimeEqual(new Uint8Array(expectedSignature), new Uint8Array(providedSignature))) {
        return { valid: false, error: 'Invalid CSRF token signature' };
      }

      console.log('✅ CSRF token validated successfully');
      return { valid: true };

    } catch (error) {
      console.error('❌ CSRF validation error:', error);
      return { valid: false, error: 'CSRF validation failed' };
    }
  }

  /**
   * Validate Fetch Metadata headers (Sec-Fetch-*)
   * Helps prevent CSRF attacks from cross-origin contexts
   */
  validateFetchMetadata(request: NextRequest): {
    valid: boolean;
    error?: string;
  } {
    const site = request.headers.get('Sec-Fetch-Site');
    const mode = request.headers.get('Sec-Fetch-Mode');
    const dest = request.headers.get('Sec-Fetch-Dest');

    // Allow same-origin requests
    if (site === 'same-origin') {
      return { valid: true };
    }

    // Allow same-site requests for navigation
    if (site === 'same-site' && mode === 'navigate') {
      return { valid: true };
    }

    // Allow cross-site navigation (user clicking links)
    if (site === 'cross-site' && mode === 'navigate' && dest === 'document') {
      return { valid: true };
    }

    // Allow prefetch for performance
    if (mode === 'no-cors' && dest === 'empty') {
      return { valid: true };
    }

    // Block suspicious cross-origin requests
    if (site === 'cross-site' && !this.isSafeMethod(request.method)) {
      return { 
        valid: false, 
        error: `Cross-site ${request.method} request blocked by Fetch Metadata policy` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate Origin and Referer headers
   */
  validateOrigin(request: NextRequest): {
    valid: boolean;
    error?: string;
  } {
    // Skip for safe methods
    if (this.isSafeMethod(request.method)) {
      return { valid: true };
    }

    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');
    const host = request.headers.get('Host');

    if (!host) {
      return { valid: false, error: 'Missing Host header' };
    }

    const allowedOrigins = [
      `https://${host}`,
      'https://atlas-dev-portal.vercel.app',
      'https://atlas-admin-insights.vercel.app',
      'https://atlas-proof-messenger.vercel.app'
    ];

    // Check Origin header
    if (origin) {
      if (!allowedOrigins.includes(origin)) {
        return { valid: false, error: `Origin ${origin} not allowed` };
      }
      return { valid: true };
    }

    // Check Referer header as fallback
    if (referer) {
      const refererHost = new URL(referer).origin;
      if (!allowedOrigins.includes(refererHost)) {
        return { valid: false, error: `Referer ${refererHost} not allowed` };
      }
      return { valid: true };
    }

    return { valid: false, error: 'Missing Origin and Referer headers' };
  }

  /**
   * Set secure CSRF cookie
   */
  setCsrfCookie(response: NextResponse, token: string): void {
    const cookieOptions = [
      `${this.config.cookieName}=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${this.config.maxAge}`,
      'Path=/'
    ].join('; ');

    response.headers.set('Set-Cookie', cookieOptions);
  }

  /**
   * Check if HTTP method is considered safe (no side effects)
   */
  private isSafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
  }

  /**
   * Generate secret key for HMAC operations
   */
  private generateSecretKey(): string {
    const key = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(key, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Import secret key for HMAC operations
   */
  private async importSecretKey(): Promise<CryptoKey> {
    const keyBytes = new Uint8Array(
      this.config.secretKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  /**
   * Constant-time buffer comparison to prevent timing attacks
   */
  private constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  /**
   * Base64URL encode
   */
  private base64UrlEncode(data: string | ArrayBuffer): string {
    let binary: string;
    
    if (typeof data === 'string') {
      binary = btoa(unescape(encodeURIComponent(data)));
    } else {
      const bytes = new Uint8Array(data);
      binary = btoa(String.fromCharCode(...bytes));
    }
    
    return binary.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
}

// Export singleton for Atlas applications
export const atlasCSRF = new CSRFProtection({
  secretKey: process.env.ATLAS_CSRF_SECRET || undefined
});