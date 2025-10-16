/**
 * DPoP (Demonstrating Proof-of-Possession) Client Implementation
 * RFC 9449 compliant token binding for Atlas applications
 * 
 * Provides cryptographic proof that the client possesses the private key
 * corresponding to the public key bound to the OAuth access token
 */

import { webcrypto } from 'crypto';

// Use Web Crypto API (works in both Node.js 16+ and browsers)
const crypto = webcrypto;

export class DPoPClient {
  private keyPair: CryptoKeyPair | null = null;
  private publicKeyJWK: JsonWebKey | null = null;

  /**
   * Generate ES256 keypair for DPoP proof generation
   */
  async generateKeyPair(): Promise<void> {
    try {
      this.keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export public key as JWK for inclusion in DPoP proof
      this.publicKeyJWK = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
      
      console.log('🔑 DPoP keypair generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate DPoP keypair:', error);
      throw new Error('DPoP keypair generation failed');
    }
  }

  /**
   * Create DPoP proof JWT for API request
   * @param {string} httpMethod - HTTP method (GET, POST, etc.)
   * @param {string} httpUri - Full URI of the request
   * @param {string} [accessToken] - OAuth access token hash (optional)
   * @returns {Promise<string>} DPoP proof JWT
   */
  async createProof(
    httpMethod: string, 
    httpUri: string, 
    accessToken?: string
  ): Promise<string> {
    if (!this.keyPair || !this.publicKeyJWK) {
      throw new Error('DPoP keypair not initialized. Call generateKeyPair() first.');
    }

    // Create DPoP JWT header
    const header = {
      alg: 'ES256',
      typ: 'dpop+jwt',
      jwk: this.publicKeyJWK
    };

    // Create DPoP JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload: any = {
      jti: crypto.getRandomValues(new Uint8Array(16)).join(''), // Unique identifier
      htm: httpMethod.toUpperCase(),
      htu: httpUri,
      iat: now,
      exp: now + 300 // 5 minute expiration
    };

    // Include access token hash if provided
    if (accessToken) {
      const tokenHash = await this.sha256Hash(accessToken);
      payload.ath = tokenHash;
    }

    // Create JWT
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Sign with private key
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.keyPair.privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const signatureB64 = this.base64UrlEncode(signature);
    
    const dpopProof = `${headerB64}.${payloadB64}.${signatureB64}`;
    
    console.log('🔐 DPoP proof created for', httpMethod, httpUri);
    return dpopProof;
  }

  /**
   * Get public key JWK for server registration
   */
  getPublicKeyJWK(): JsonWebKey | null {
    return this.publicKeyJWK;
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
   * Base64URL encode (RFC 7515)
   */
  private base64UrlEncode(data: string | ArrayBuffer): string {
    let binary: string;
    
    if (typeof data === 'string') {
      binary = btoa(unescape(encodeURIComponent(data)));
    } else {
      // ArrayBuffer
      const bytes = new Uint8Array(data);
      binary = btoa(String.fromCharCode(...bytes));
    }
    
    return binary
      .replace(/\+/g, '-')
      .replace(/\//g, '_')  
      .replace(/=/g, '');
  }
}

/**
 * Helper function to add DPoP header to fetch requests
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @param {DPoPClient} dpopClient - Initialized DPoP client
 * @returns {Promise<RequestInit>} Updated fetch options with DPoP header
 */
export async function addDPoPHeader(
  url: string,
  options: RequestInit = {},
  dpopClient: DPoPClient
): Promise<RequestInit> {
  const method = options.method || 'GET';
  const accessToken = options.headers?.['Authorization']?.replace('Bearer ', '');
  
  try {
    const dpopProof = await dpopClient.createProof(method, url, accessToken);
    
    return {
      ...options,
      headers: {
        ...options.headers,
        'DPoP': dpopProof
      }
    };
  } catch (error) {
    console.error('❌ Failed to add DPoP header:', error);
    // Return original options if DPoP fails (graceful degradation)
    return options;
  }
}

/**
 * Atlas-specific DPoP client singleton
 */
export class AtlasDPoPClient {
  private static instance: DPoPClient | null = null;

  static async getInstance(): Promise<DPoPClient> {
    if (!AtlasDPoPClient.instance) {
      AtlasDPoPClient.instance = new DPoPClient();
      await AtlasDPoPClient.instance.generateKeyPair();
    }
    return AtlasDPoPClient.instance;
  }

  /**
   * Enhanced fetch with automatic DPoP header injection
   */
  static async secFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const client = await AtlasDPoPClient.getInstance();
    const enhancedOptions = await addDPoPHeader(url, options, client);
    
    console.log('🛡️ Making DPoP-secured request to:', url);
    return fetch(url, enhancedOptions);
  }
}