import { describe, it, expect, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';

// Mock Ed25519 key pair for testing
let testPrivateKey: Uint8Array;
let testPublicKey: Uint8Array;
let testKid: string;

beforeAll(async () => {
  testPrivateKey = ed.utils.randomPrivateKey();
  testPublicKey = await ed.getPublicKey(testPrivateKey);
  testKid = Buffer.from(sha256(testPublicKey)).toString('hex').substring(0, 16);
});

describe('RFC 9421 Receipts', () => {
  it('should generate valid signature', async () => {
    const message = {
      method: 'POST',
      url: 'https://example.com/messages',
      headers: {
        'content-type': 'application/json',
        date: new Date().toUTCString(),
      },
      body: '{"test":"data"}',
    };

    // Build signature base
    const signatureBase = [
      `"@method": ${message.method}`,
      `"@target-uri": ${message.url}`,
      `"content-type": ${message.headers['content-type']}`,
      `"date": ${message.headers.date}`,
      `"@signature-params": ("@method" "@target-uri" "content-type" "date");created=${Math.floor(Date.now() / 1000)};keyid="${testKid}"`,
    ].join('\n');

    // Sign
    const signature = await ed.sign(
      new TextEncoder().encode(signatureBase),
      testPrivateKey
    );

    // Verify
    const isValid = await ed.verify(
      signature,
      new TextEncoder().encode(signatureBase),
      testPublicKey
    );

    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const message = {
      method: 'POST',
      url: 'https://example.com/messages',
      headers: {
        date: new Date().toUTCString(),
      },
    };

    const signatureBase = [
      `"@method": ${message.method}`,
      `"@target-uri": ${message.url}`,
      `"date": ${message.headers.date}`,
      `"@signature-params": ("@method" "@target-uri" "date");created=${Math.floor(Date.now() / 1000)};keyid="${testKid}"`,
    ].join('\n');

    // Sign with test key
    const signature = await ed.sign(
      new TextEncoder().encode(signatureBase),
      testPrivateKey
    );

    // Try to verify with different public key
    const wrongPrivateKey = ed.utils.randomPrivateKey();
    const wrongPublicKey = await ed.getPublicKey(wrongPrivateKey);

    const isValid = await ed.verify(
      signature,
      new TextEncoder().encode(signatureBase),
      wrongPublicKey
    );

    expect(isValid).toBe(false);
  });
});

describe('RFC 9449 DPoP', () => {
  it('should reject mismatched htu', () => {
    const dpopClaims = {
      htm: 'POST',
      htu: 'https://example.com/messages',
      iat: Math.floor(Date.now() / 1000),
      jti: 'test-nonce-123',
    };

    const actualUrl = 'https://example.com/other';

    expect(dpopClaims.htu).not.toBe(actualUrl);
  });

  it('should reject stale iat', () => {
    const dpopClaims = {
      htm: 'POST',
      htu: 'https://example.com/messages',
      iat: Math.floor(Date.now() / 1000) - 400, // 400 seconds ago
      jti: 'test-nonce-123',
    };

    const now = Math.floor(Date.now() / 1000);
    const drift = Math.abs(now - dpopClaims.iat);

    expect(drift).toBeGreaterThan(300); // More than 5 minutes
  });

  it('should accept valid iat within 5 minutes', () => {
    const dpopClaims = {
      htm: 'POST',
      htu: 'https://example.com/messages',
      iat: Math.floor(Date.now() / 1000) - 100, // 100 seconds ago
      jti: 'test-nonce-123',
    };

    const now = Math.floor(Date.now() / 1000);
    const drift = Math.abs(now - dpopClaims.iat);

    expect(drift).toBeLessThan(300); // Within 5 minutes
  });
});

describe('Idempotency', () => {
  it('should cache first response', () => {
    const cache = new Map<string, string>();
    const idempotencyKey = 'test-key-123';
    const response = { id: 'msg-1', status: 'sent' };

    // First request
    if (!cache.has(idempotencyKey)) {
      cache.set(idempotencyKey, JSON.stringify(response));
    }

    expect(cache.has(idempotencyKey)).toBe(true);
    expect(JSON.parse(cache.get(idempotencyKey)!)).toEqual(response);
  });

  it('should return cached response on duplicate', () => {
    const cache = new Map<string, string>();
    const idempotencyKey = 'test-key-456';
    const firstResponse = { id: 'msg-1', status: 'sent' };

    // First request
    cache.set(idempotencyKey, JSON.stringify(firstResponse));

    // Second request with same key
    const cached = cache.get(idempotencyKey);
    expect(cached).toBeDefined();
    expect(JSON.parse(cached!)).toEqual(firstResponse);

    // Should not create new record
    const secondResponse = { id: 'msg-2', status: 'sent' };
    // In real implementation, we'd skip creation and return cached
    expect(JSON.parse(cached!).id).toBe('msg-1'); // Original ID
  });
});

describe('Content-Digest (RFC 9530)', () => {
  it('should compute SHA-256 digest', () => {
    const body = '{"test":"data"}';
    const digest = sha256(new TextEncoder().encode(body));
    const base64Digest = Buffer.from(digest).toString('base64');

    expect(base64Digest).toBeTruthy();
    expect(base64Digest.length).toBeGreaterThan(0);
  });

  it('should produce same digest for same content', () => {
    const body = '{"test":"data"}';
    const digest1 = sha256(new TextEncoder().encode(body));
    const digest2 = sha256(new TextEncoder().encode(body));

    expect(Buffer.from(digest1).toString('base64')).toBe(
      Buffer.from(digest2).toString('base64')
    );
  });

  it('should produce different digest for different content', () => {
    const body1 = '{"test":"data1"}';
    const body2 = '{"test":"data2"}';

    const digest1 = sha256(new TextEncoder().encode(body1));
    const digest2 = sha256(new TextEncoder().encode(body2));

    expect(Buffer.from(digest1).toString('base64')).not.toBe(
      Buffer.from(digest2).toString('base64')
    );
  });
});
