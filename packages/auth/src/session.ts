// Atlas Security-Core: Session Management với DPoP Binding
// Session được bind với DPoP key để chống token theft

import type { DPoPKeyPair } from '@atlas/crypto/dpop';
import type { Session } from './types.js';

/**
 * Session store (production dùng Redis)
 */
const sessions = new Map<string, Session>();

/**
 * Session TTL: 24 giờ
 */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Tạo session mới với DPoP binding
 * @param userId - User identifier
 * @param dpopKeyPair - DPoP key pair từ client
 */
export async function createSession(
  userId: string,
  dpopKeyPair: DPoPKeyPair
): Promise<Session> {
  // Tính JWK thumbprint (RFC 7638) của DPoP public key
  const thumbprint = await computeThumbprint(dpopKeyPair.jwk);
  
  const session: Session = {
    sessionId: crypto.randomUUID(),
    userId,
    dpopKeyThumbprint: thumbprint,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  
  // Lưu session
  sessions.set(session.sessionId, session);
  setTimeout(() => sessions.delete(session.sessionId), SESSION_TTL_MS);
  
  return session;
}

/**
 * Validate session với DPoP proof
 * @param sessionId - Session ID từ cookie
 * @param dpopProofJWK - DPoP public key từ proof JWT header
 */
export async function validateSession(
  sessionId: string,
  dpopProofJWK: JsonWebKey
): Promise<Session> {
  const session = sessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    throw new Error('Session expired');
  }
  
  // Verify DPoP binding: thumbprint phải match
  const proofThumbprint = await computeThumbprint(dpopProofJWK);
  if (proofThumbprint !== session.dpopKeyThumbprint) {
    throw new Error('DPoP key mismatch - possible token theft');
  }
  
  return session;
}

/**
 * Revoke session (logout)
 */
export function revokeSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Cleanup expired sessions (chạy định kỳ)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Compute JWK thumbprint (RFC 7638)
 * SHA-256 hash của canonical JWK JSON
 */
async function computeThumbprint(jwk: JsonWebKey): Promise<string> {
  // Canonical JWK (chỉ required members, sorted alphabetically)
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y
  });
  
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(canonical));
  
  // Encode hash as base64url
  const hashBytes = new Uint8Array(hash);
  const base64 = btoa(String.fromCharCode(...hashBytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
