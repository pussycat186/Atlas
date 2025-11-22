// Atlas Security-Core: Auth Types

/**
 * User credential lưu trong database
 */
export interface UserCredential {
  id: string;              // Credential ID (base64url)
  userId: string;          // User identifier
  publicKey: string;       // Public key (base64url)
  counter: number;         // Signature counter (replay protection)
  transports: string[];    // Authenticator transports
  createdAt: string;       // ISO 8601 timestamp
}

/**
 * Session với DPoP binding
 */
export interface Session {
  sessionId: string;
  userId: string;
  dpopKeyThumbprint: string;  // SHA-256 hash of DPoP public key
  createdAt: number;          // Unix timestamp
  expiresAt: number;          // Unix timestamp
}

/**
 * WebAuthn registration result
 */
export interface RegistrationResult {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

/**
 * WebAuthn authentication result
 */
export interface AuthenticationResult {
  credentialId: string;
  userId: string;
  newCounter: number;
}
