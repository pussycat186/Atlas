import type { DPoPProof, ExtendedJWK } from './types.js';
/**
 * DPoP key pair lưu trữ private/public keys
 */
export interface DPoPKeyPair {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    jwk: ExtendedJWK;
}
/**
 * Tạo ES256 key pair cho DPoP
 * @returns Key pair với private key + public JWK
 */
export declare function generateKeyPair(): Promise<DPoPKeyPair>;
/**
 * Tạo DPoP proof JWT
 * @param keyPair - DPoP key pair
 * @param method - HTTP method (GET, POST, etc.)
 * @param uri - Full request URI (không bao gồm query/fragment)
 * @param accessToken - Optional access token (để tính ath claim)
 */
export declare function createProof(keyPair: DPoPKeyPair, method: string, uri: string, accessToken?: string): Promise<string>;
/**
 * Verify DPoP proof JWT
 * @param proof - DPoP JWT string
 * @param method - Expected HTTP method
 * @param uri - Expected request URI
 * @param accessToken - Optional access token (để verify ath claim)
 */
export declare function verifyProof(proof: string, method: string, uri: string, accessToken?: string): Promise<DPoPProof>;
//# sourceMappingURL=dpop.d.ts.map