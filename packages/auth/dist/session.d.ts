import type { DPoPKeyPair } from '@atlas/crypto/dpop';
import type { Session } from './types.js';
/**
 * Tạo session mới với DPoP binding
 * @param userId - User identifier
 * @param dpopKeyPair - DPoP key pair từ client
 */
export declare function createSession(userId: string, dpopKeyPair: DPoPKeyPair): Promise<Session>;
/**
 * Validate session với DPoP proof
 * @param sessionId - Session ID từ cookie
 * @param dpopProofJWK - DPoP public key từ proof JWT header
 */
export declare function validateSession(sessionId: string, dpopProofJWK: JsonWebKey): Promise<Session>;
/**
 * Revoke session (logout)
 */
export declare function revokeSession(sessionId: string): void;
/**
 * Cleanup expired sessions (chạy định kỳ)
 */
export declare function cleanupExpiredSessions(): void;
//# sourceMappingURL=session.d.ts.map