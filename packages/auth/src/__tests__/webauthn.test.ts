import { describe, it, expect, beforeEach } from 'vitest';
import {
  beginRegistration,
  verifyRegistration,
  beginAuthentication,
  verifyAuthentication,
} from '../webauthn.js';

describe('WebAuthn/Passkey Authentication', () => {
  const rpConfig = {
    name: 'Atlas Test',
    id: 'localhost',
    origin: 'http://localhost:3000',
  };

  beforeEach(() => {
    // Clear any stale challenges
  });

  it('should generate registration options with correct RP config', async () => {
    const options = await beginRegistration('user-123', 'testuser@example.com', rpConfig);

    expect(options).toBeDefined();
    expect(options).toHaveProperty('challenge');
    expect(options).toHaveProperty('rp');
    expect((options as any).rp.name).toBe('Atlas Test');
    expect((options as any).rp.id).toBe('localhost');
    expect((options as any).user.id).toBeDefined();
    expect((options as any).user.name).toBe('testuser@example.com');
  });

  it('should require platform authenticator for passkeys', async () => {
    const options = await beginRegistration('user-123', 'testuser@example.com', rpConfig);

    expect((options as any).authenticatorSelection).toBeDefined();
    expect((options as any).authenticatorSelection.residentKey).toBe('required');
    expect((options as any).authenticatorSelection.userVerification).toBe('required');
    expect((options as any).authenticatorSelection.authenticatorAttachment).toBe('platform');
  });

  it('should generate authentication options with correct RP ID', async () => {
    const options = await beginAuthentication(rpConfig);

    expect(options).toBeDefined();
    expect(options).toHaveProperty('challenge');
    expect((options as any).rpId).toBe('localhost');
    expect((options as any).userVerification).toBe('required');
    expect((options as any).timeout).toBe(300_000); // 5 minutes
  });

  it('should include allowed credentials when provided', async () => {
    // Use valid base64url credential ID (from @simplewebauthn examples)
    const credentials = [
      {
        id: 'KEDetlG7u8Qq7dW_BSLNXBxMXpkqBpbRQDnrFKgCPBRCDOpGxR-b8SPRPr6eCfLyG5h-MYqNdNF0G5BNkAH0J1id2-bZ3JqcmLCYHO8-qOWjXMlKcjWjYlmIPi0MsqHX8dNbmzxDQHTFVVUSjIGmHODYnTB3cQcHmqveCs7pQUM', // Long credential ID
        publicKey: 'pQECAyYgASFYIKTdK...', // Truncated for brevity
        counter: 0,
        userId: 'user-123',
        transports: ['internal'],
        createdAt: new Date().toISOString(),
      },
    ];

    const options = await beginAuthentication(rpConfig, credentials);

    expect((options as any).allowCredentials).toBeDefined();
    expect((options as any).allowCredentials).toHaveLength(1);
    expect((options as any).allowCredentials[0].type).toBe('public-key');
  });

  it('should set correct timeout and attestation type', async () => {
    const options = await beginRegistration('user-123', 'testuser@example.com', rpConfig);

    expect((options as any).timeout).toBe(300_000); // 5 minutes
    expect((options as any).attestation).toBe('none'); // No attestation required
  });

  it('should support ES256 and RS256 algorithms', async () => {
    const options = await beginRegistration('user-123', 'testuser@example.com', rpConfig);

    expect((options as any).pubKeyCredParams).toBeDefined();
    const algIds = (options as any).pubKeyCredParams.map((p: any) => p.alg);
    expect(algIds).toContain(-7);   // ES256
    expect(algIds).toContain(-257); // RS256
  });
});
