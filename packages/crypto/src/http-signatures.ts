// Atlas Security-Core: HTTP Message Signatures (RFC 9421)
// Verify Ed25519 signatures trên HTTP receipts
// Sử dụng Web Crypto API

import type { HTTPSignature, ExtendedJWK } from './types.js';
import { CryptoError } from './types.js';

/**
 * JWKS cache (production nên dùng Redis với TTL)
 */
const jwksCache = new Map<string, ExtendedJWK>();
const JWKS_TTL_MS = 300_000; // 5 phút

/**
 * Parse Signature and Signature-Input headers (RFC 9421 format)
 * 
 * P1 FIX: Must parse Signature-Input header to get exact field order and parameters.
 * 
 * Example:
 *   Signature: sig1=:MEUCIQDtest123==:
 *   Signature-Input: sig1=("@method" "@path" "content-digest");created=1618884475;keyid="key-123";alg="ed25519"
 * 
 * @param signatureHeader - Value of Signature header
 * @param signatureInputHeader - Value of Signature-Input header (contains params and field order)
 */
export function parseSignatureHeader(
  signatureHeader: string,
  signatureInputHeader: string
): HTTPSignature {
  // Parse signature value (sig1=:base64:)
  const sigMatch = signatureHeader.match(/sig1=:([^:]+):/);
  if (!sigMatch) {
    throw new CryptoError('Invalid signature format', 'SIGNATURE_INVALID');
  }
  const signature = sigMatch[1];
  
  // P1 FIX: Parse Signature-Input to get exact field order and parameters
  // Format: sig1=("field1" "field2");created=123;keyid="key";alg="ed25519"
  const inputMatch = signatureInputHeader.match(/sig1=\(([^)]+)\)(.*)$/);
  if (!inputMatch) {
    throw new CryptoError('Invalid Signature-Input format', 'SIGNATURE_INVALID');
  }
  
  // Extract covered fields in exact order
  const coveredFields = inputMatch[1]
    .split(/\s+/)
    .map(field => field.replace(/"/g, ''))
    .filter(Boolean);
  
  // Parse parameters from the remainder
  const params: Record<string, string> = {};
  const paramsPart = inputMatch[2];
  const paramMatches = paramsPart.matchAll(/;?\s*(\w+)=("?[^";]+"?|[^;]+)/g);
  
  for (const match of paramMatches) {
    const key = match[1];
    const value = match[2].replace(/"/g, '');
    params[key] = value;
  }
  
  return {
    signature,
    keyId: params.keyid || '',
    algorithm: (params.alg as 'ed25519') || 'ed25519',
    created: parseInt(params.created || '0', 10),
    expires: params.expires ? parseInt(params.expires, 10) : undefined,
    headers: coveredFields
  };
}

/**
 * Build signature base string (RFC 9421 Section 2.5)
 * 
 * CRITICAL FIX (P1): Headers MUST be in the exact order specified in signedHeaders array.
 * RFC 9421 Section 3.1: The signature covers fields in the order they appear in the
 * Signature-Input header. Reordering invalidates the signature.
 * 
 * @param method - HTTP method
 * @param path - Request path
 * @param headers - HTTP headers object
 * @param signedHeaders - List of header names in EXACT order to include
 */
export function buildSignatureBase(
  method: string,
  path: string,
  headers: Record<string, string>,
  signedHeaders: string[]
): string {
  const lines: string[] = [];
  
  // P1 FIX: Iterate in EXACT order of signedHeaders (do NOT reorder)
  for (const headerName of signedHeaders) {
    if (headerName === '@method') {
      lines.push(`"@method": ${method.toUpperCase()}`);
    } else if (headerName === '@path') {
      lines.push(`"@path": ${path}`);
    } else if (headerName === '@signature-params') {
      // P1 FIX: Include @signature-params with all metadata per RFC 9421 Section 3.1
      // This MUST include created, keyid, alg, expires, and the list of covered fields
      // The params string is built from the signedHeaders array
      const params = signedHeaders.filter(h => h !== '@signature-params').map(h => `"${h}"`).join(' ');
      lines.push(`"@signature-params": (${params})`);
    } else {
      // Regular header - preserve exact case from signedHeaders
      const value = headers[headerName.toLowerCase()];
      if (value !== undefined) {
        lines.push(`"${headerName.toLowerCase()}": ${value}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Verify HTTP signature
 * @param signature - Parsed signature metadata
 * @param signatureBase - Signature base string
 * @param jwksUri - URI to fetch JWKS (e.g., /.well-known/jwks.json)
 */
export async function verifySignature(
  signature: HTTPSignature,
  signatureBase: string,
  jwksUri: string
): Promise<boolean> {
  // Check expiration
  if (signature.expires && Date.now() / 1000 > signature.expires) {
    throw new CryptoError('Signature expired', 'EXPIRED', { expires: signature.expires });
  }
  
  // Check algorithm
  if (signature.algorithm !== 'ed25519') {
    throw new CryptoError('Unsupported algorithm', 'SIGNATURE_INVALID', { alg: signature.algorithm });
  }
  
  // Fetch public key từ JWKS
  const publicJWK = await fetchPublicKey(jwksUri, signature.keyId);
  
  // Import Ed25519 public key
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJWK,
    {
      name: 'Ed25519'
    },
    false,
    ['verify']
  );
  
  // Decode signature từ base64
  const signatureBytes = base64DecodeBytes(signature.signature);
  
  // Verify signature
  const encoder = new TextEncoder();
  // @ts-ignore - TS5.3+ has ArrayBuffer/SharedArrayBuffer type confusion with DOM types
  const isValid = await crypto.subtle.verify(
    'Ed25519',
    publicKey,
    signatureBytes as any,
    encoder.encode(signatureBase) as any
  );
  
  if (!isValid) {
    throw new CryptoError('Signature verification failed', 'SIGNATURE_INVALID');
  }
  
  return true;
}

/**
 * Fetch public key từ JWKS endpoint
 * @param jwksUri - JWKS URI (e.g., https://example.com/.well-known/jwks.json)
 * @param keyId - Key ID to lookup
 */
async function fetchPublicKey(jwksUri: string, keyId: string): Promise<ExtendedJWK> {
  // Check cache
  const cached = jwksCache.get(`${jwksUri}:${keyId}`);
  if (cached) {
    return cached;
  }
  
  // Fetch JWKS (production nên add retry + timeout)
  const response = await fetch(jwksUri);
  if (!response.ok) {
    throw new CryptoError('Failed to fetch JWKS', 'INVALID_KEY', { status: response.status });
  }
  
  const jwks = await response.json() as { keys: ExtendedJWK[] };
  
  // Find key by kid
  const key = jwks.keys.find(k => k.kid === keyId);
  if (!key) {
    throw new CryptoError('Key not found in JWKS', 'INVALID_KEY', { keyId });
  }
  
  // Validate key type
  if (key.kty !== 'OKP' || key.crv !== 'Ed25519') {
    throw new CryptoError('Invalid key type', 'INVALID_KEY', { kty: key.kty, crv: key.crv });
  }
  
  // Cache key
  jwksCache.set(`${jwksUri}:${keyId}`, key);
  setTimeout(() => jwksCache.delete(`${jwksUri}:${keyId}`), JWKS_TTL_MS);
  
  return key;
}

/**
 * Sign HTTP message (for server-side signing)
 * @param privateKey - Ed25519 private key (CryptoKey)
 * @param signatureBase - Signature base string
 * @param keyId - Key identifier
 */
export async function signMessage(
  privateKey: CryptoKey,
  signatureBase: string,
  keyId: string,
  signedHeaders: string[]
): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    encoder.encode(signatureBase)
  );
  
  const signatureB64 = base64Encode(signature);
  const created = Math.floor(Date.now() / 1000);
  
  // Format theo RFC 9421
  const headersList = signedHeaders.map(h => `"${h}"`).join(' ');
  return `sig1=:${signatureB64}:; keyid="${keyId}"; created=${created}; alg="ed25519"; headers=(${headersList})`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Base64 encode (standard, với padding)
 */
function base64Encode(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Base64 decode to Uint8Array
 */
function base64DecodeBytes(input: string): Uint8Array {
  const decoded = atob(input);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}
