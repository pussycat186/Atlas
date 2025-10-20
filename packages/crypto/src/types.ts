// Atlas Security-Core Crypto Types
// Định nghĩa types dùng chung cho tất cả các module mật mã

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
  x: string; // base64url encoded public key
  use?: 'enc' | 'sig';
  kid?: string; // Key ID
}

/**
 * DPoP proof JWT payload (RFC 9449)
 */
export interface DPoPProof {
  jti: string;          // Unique token identifier
  htm: string;          // HTTP method (uppercase)
  htu: string;          // HTTP URI (without query/fragment)
  iat: number;          // Issued at (Unix timestamp)
  ath?: string;         // Access token hash (base64url of SHA-256)
}

/**
 * HTTP Signature metadata (RFC 9421)
 */
export interface HTTPSignature {
  signature: string;        // Base64 encoded signature
  keyId: string;           // Key identifier
  algorithm: 'ed25519';    // Signature algorithm
  created: number;         // Unix timestamp
  expires?: number;        // Optional expiration
  headers: string[];       // Signed header names
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
export class CryptoError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_KEY' | 'DECRYPTION_FAILED' | 'SIGNATURE_INVALID' | 'NONCE_REUSED' | 'EXPIRED',
    public details?: unknown
  ) {
    super(message);
    this.name = 'CryptoError';
  }
}
