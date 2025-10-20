/**
 * Kết quả mã hóa bao gồm ciphertext và metadata
 */
export interface EncryptedMessage {
    /** Ciphertext đã mã hóa (base64url) */
    ciphertext: string;
    /** Authentication tag (base64url) */
    tag?: string;
    /** Nonce/IV (base64url) */
    nonce: string;
    /** Số thứ tự message (để phát hiện replay) */
    sequence: number;
    /** Timestamp tạo message (ISO 8601) */
    timestamp: string;
}
/**
 * Public key dạng JWK (JSON Web Key)
 */
export interface PublicKeyJWK {
    kty: 'OKP' | 'EC';
    crv: 'X25519' | 'Ed25519' | 'P-256';
    x: string;
    use?: 'enc' | 'sig';
    kid?: string;
}
/**
 * Extended JsonWebKey with additional DPoP/JWS fields
 */
export interface ExtendedJWK extends JsonWebKey {
    alg?: string;
    kid?: string;
    use?: string;
}
/**
 * DPoP proof JWT payload (RFC 9449)
 */
export interface DPoPProof {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
    ath?: string;
}
/**
 * HTTP Signature metadata (RFC 9421)
 */
export interface HTTPSignature {
    signature: string;
    keyId: string;
    algorithm: 'ed25519';
    created: number;
    expires?: number;
    headers: string[];
}
/**
 * PQC Feature Flags
 */
export interface PQCConfig {
    /** Bật ML-KEM-768 (Kyber) cho key encapsulation */
    enableKyber: boolean;
    /** Bật ML-DSA-3 (Dilithium) cho chữ ký */
    enableDilithium: boolean;
}
/**
 * Error types cho crypto operations
 */
export declare class CryptoError extends Error {
    code: 'INVALID_KEY' | 'DECRYPTION_FAILED' | 'SIGNATURE_INVALID' | 'NONCE_REUSED' | 'EXPIRED';
    details?: unknown;
    constructor(message: string, code: 'INVALID_KEY' | 'DECRYPTION_FAILED' | 'SIGNATURE_INVALID' | 'NONCE_REUSED' | 'EXPIRED', details?: unknown);
}
//# sourceMappingURL=types.d.ts.map