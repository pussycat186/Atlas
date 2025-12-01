/**
 * Signature metadata theo RFC 9421
 */
export interface SignatureMetadata {
    keyid: string;
    algorithm: string;
    created: number;
    expires?: number;
    nonce?: string;
}
/**
 * HTTP signature input (signature base components)
 */
export interface SignatureInput {
    method: string;
    path: string;
    headers: Record<string, string>;
    signatureParams: SignatureMetadata;
}
/**
 * Build signature base theo RFC 9421 Section 2.5
 * Format: "@method": METHOD\n"@path": PATH\n"header": value\n"@signature-params": (...)
 */
export declare function buildSignatureBase(input: SignatureInput): string;
/**
 * Sign signature base với Ed25519 (using @noble/ed25519)
 * @param signatureBase - Output từ buildSignatureBase()
 * @param privateKeyHex - Ed25519 private key (64 hex chars)
 * @returns base64url signature
 */
export declare function signEd25519(signatureBase: string, privateKeyHex: string): Promise<string>;
/**
 * Verify Ed25519 signature (using @noble/ed25519)
 * @param signatureBase - Reconstructed signature base
 * @param signature - base64url signature string
 * @param publicKeyHex - Ed25519 public key (64 hex chars)
 * @returns true if valid
 */
export declare function verifyEd25519(signatureBase: string, signature: string, publicKeyHex: string): Promise<boolean>;
/**
 * Parse Signature-Input header (RFC 9421 Section 4.1)
 * Format: sig1=("@method" "@path" "content-type");created=1234;keyid="key-1";alg="ed25519"
 * @returns SignatureMetadata hoặc throw nếu invalid
 */
export declare function parseSignatureInput(header: string): SignatureMetadata;
/**
 * Verify HTTP signature với clock skew tolerance
 * @param signatureInput - Parsed signature-input header
 * @param signature - Signature value từ Signature header
 * @param publicKeyHex - Ed25519 public key từ JWKS (hex string)
 * @param clockSkewSeconds - Tolerance (default 300s = 5 phút)
 */
export declare function verifyHttpSignature(signatureInput: SignatureInput, signature: string, publicKeyHex: string, clockSkewSeconds?: number): Promise<boolean>;
//# sourceMappingURL=http-signature.d.ts.map