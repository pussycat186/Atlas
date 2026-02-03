import { createHash } from 'crypto';
import { webcrypto } from 'crypto';

/**
 * DPoP (RFC 9449) - Production Implementation
 * 
 * Verifier với ES256 signature verification, JKT thumbprint, multi-session replay protection
 */

const { subtle } = webcrypto;

const usedJtis = new Set<string>();
const JTI_EXPIRY_MS = 60 * 1000; // 60 seconds

export interface DPoPProof {
  jti: string;
  htm: string;
  htu: string;
  iat: number;
  jwk: JsonWebKey;
  jwt?: string; // raw jwt if present
}

export function base64UrlEncode(input: Uint8Array): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecodeToString(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b, 'base64').toString('utf8');
}

export function base64UrlDecodeToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return new Uint8Array(Buffer.from(b, 'base64'));
}

export function parseJwt(jwt: string): { header: any; payload: any; signature: string } {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('invalid jwt');
  const header = JSON.parse(base64UrlDecodeToString(parts[0]));
  const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
  return { header, payload, signature: parts[2] };
}

/**
 * Tính JWK Thumbprint (JKT) theo RFC 7638
 * @param jwk - JSON Web Key
 * @returns Base64url-encoded SHA-256 thumbprint
 */
export function computeJKT(jwk: JsonWebKey): string {
  // Chỉ lấy required members theo thứ tự lexicographic
  const required: any = { kty: jwk.kty };
  
  if (jwk.kty === 'EC') {
    required.crv = jwk.crv;
    required.x = jwk.x;
    required.y = jwk.y;
  } else if (jwk.kty === 'RSA') {
    required.e = jwk.e;
    required.n = jwk.n;
  }
  
  // Canonical JSON (no whitespace, lexicographic order)
  const canonical = JSON.stringify(required, Object.keys(required).sort());
  const hash = createHash('sha256').update(canonical).digest();
  return base64UrlEncode(hash);
}

/**
 * Import JWK to CryptoKey for ES256 verification
 * @param jwk - JSON Web Key (EC P-256)
 * @returns CryptoKey for verification
 */
async function importJWK(jwk: JsonWebKey): Promise<CryptoKey> {
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') {
    throw new Error('Only ES256 (EC P-256) supported');
  }
  
  return await subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

/**
 * Verify ES256 signature on JWT
 * @param jwt - Full JWT string
 * @param publicKey - CryptoKey for verification
 * @returns true if signature valid
 */
async function verifyES256(jwt: string, publicKey: CryptoKey): Promise<boolean> {
  const parts = jwt.split('.');
  if (parts.length !== 3) return false;
  
  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecodeToBytes(parts[2]);
  
  try {
    return await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      signedData
    );
  } catch (e) {
    return false;
  }
}

/**
 * Verify DPoP proof với full ES256 signature verification
 * @param proofJwt - DPoP JWT proof
 * @param expectedMethod - Expected HTTP method
 * @param expectedHtu - Expected HTTP URI
 * @param now - Current timestamp (for testing)
 * @returns true if valid
 */
export async function verifyProof(
  proofJwt: string,
  expectedMethod: string,
  expectedHtu: string,
  now: number = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  try {
    const { header, payload } = parseJwt(proofJwt);
    
    // Kiểm tra header
    if (header.typ !== 'dpop+jwt') return false;
    if (header.alg !== 'ES256') return false;
    if (!header.jwk) return false;
    
    // Kiểm tra payload claims
    const { jti, htm, htu, iat } = payload;
    if (!jti || !htm || !htu || typeof iat !== 'number') return false;
    if (htm.toLowerCase() !== expectedMethod.toLowerCase()) return false;
    if (htu !== expectedHtu) return false;
    if (Math.abs(iat - now) > 300) return false; // ±5 minutes
    
    // Kiểm tra replay
    if (usedJtis.has(jti)) return false;
    
    // Verify ES256 signature
    const publicKey = await importJWK(header.jwk);
    const signatureValid = await verifyES256(proofJwt, publicKey);
    
    if (!signatureValid) return false;
    
    // Mark JTI as used
    usedJtis.add(jti);
    setTimeout(() => usedJtis.delete(jti), JTI_EXPIRY_MS);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify với session binding (JKT check)
 * @param proofJwt - DPoP JWT
 * @param expectedMethod - HTTP method
 * @param expectedHtu - HTTP URI
 * @param sessionJKT - Expected JKT từ session
 * @param now - Current timestamp
 * @returns true if valid and JKT matches
 */
export async function verifyProofWithSession(
  proofJwt: string,
  expectedMethod: string,
  expectedHtu: string,
  sessionJKT: string,
  now: number = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  const { header } = parseJwt(proofJwt);
  
  // Compute JKT from proof's JWK
  const proofJKT = computeJKT(header.jwk);
  
  // Check JKT matches session
  if (proofJKT !== sessionJKT) {
    return false;
  }
  
  // Then verify proof normally
  return await verifyProof(proofJwt, expectedMethod, expectedHtu, now);
}

export function cleanupJtiStore(): void {
  usedJtis.clear();
}

