import { describe, it, expect, beforeEach } from 'vitest';
import { verifyProof, cleanupJtiStore } from '../dpop';

describe('DPoP verify', () => {
  beforeEach(() => cleanupJtiStore());

  it('accepts valid proof jwt payload', () => {
    // build a simple unsigned jwt with claims
    const header = Buffer.from(JSON.stringify({ typ: 'dpop+jwt', alg: 'none' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ jti: 'j1', htm: 'GET', htu: 'https://example.com/messages', iat: Math.floor(Date.now()/1000) })).toString('base64url');
    const jwt = `${header}.${payload}.`;
    const ok = verifyProof(jwt, 'GET', 'https://example.com/messages');
    expect(ok).toBe(true);
  });

  it('rejects replayed jti', () => {
    const header = Buffer.from(JSON.stringify({ typ: 'dpop+jwt', alg: 'none' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ jti: 'j2', htm: 'GET', htu: 'https://example.com/messages', iat: Math.floor(Date.now()/1000) })).toString('base64url');
    const jwt = `${header}.${payload}.`;
    expect(verifyProof(jwt, 'GET', 'https://example.com/messages')).toBe(true);
    expect(() => verifyProof(jwt, 'GET', 'https://example.com/messages')).toThrow();
  });
});
