import type { HTTPSignature } from './types.js';
/**
 * Parse Signature header (RFC 9421 format)
 * Example: sig1=:signature_bytes:; keyid="key-123"; created=1618884475; alg="ed25519"
 */
export declare function parseSignatureHeader(signatureHeader: string): HTTPSignature;
/**
 * Build signature base string (RFC 9421 Section 2.5)
 * @param method - HTTP method
 * @param path - Request path
 * @param headers - HTTP headers object
 * @param signedHeaders - List of header names to include
 */
export declare function buildSignatureBase(method: string, path: string, headers: Record<string, string>, signedHeaders: string[]): string;
/**
 * Verify HTTP signature
 * @param signature - Parsed signature metadata
 * @param signatureBase - Signature base string
 * @param jwksUri - URI to fetch JWKS (e.g., /.well-known/jwks.json)
 */
export declare function verifySignature(signature: HTTPSignature, signatureBase: string, jwksUri: string): Promise<boolean>;
/**
 * Sign HTTP message (for server-side signing)
 * @param privateKey - Ed25519 private key (CryptoKey)
 * @param signatureBase - Signature base string
 * @param keyId - Key identifier
 */
export declare function signMessage(privateKey: CryptoKey, signatureBase: string, keyId: string, signedHeaders: string[]): Promise<string>;
//# sourceMappingURL=http-signatures.d.ts.map