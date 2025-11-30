import { describe, it, expect, beforeEach } from 'vitest';
import { verifyProof, cleanupJtiStore, computeJKT, verifyProofWithSession, base64UrlEncode } from '../dpop.js';
import { webcrypto } from 'crypto';

const { subtle } = webcrypto;

describe('DPoP ES256 Production', () => {
  beforeEach(() => cleanupJtiStore());

  async function createES256Proof(method: string, uri: string, jti: string, iat: number): Promise<{ jwt: string; jkt: string }> {
    // Generate ES256 key pair
    const keyPair = await subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    
    // Export JWK
    const jwk = await subtle.exportKey('jwk', keyPair.publicKey);
    
    // Compute JKT
    const jkt = computeJKT(jwk);
    
    // Create header
    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk
    };
    
    // Create payload
    const payload = {
      jti,
      htm: method,
      htu: uri,
      iat
    };
    
    // Encode
    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    
    // Sign
    const signature = await subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.privateKey,
      signedData
    );
    
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;
    
    return { jwt, jkt };
  }

  it('accepts valid ES256 DPoP proof', async () => {
    const { jwt } = await createES256Proof('GET', 'https://api.example.com/messages', 'jti-001', Math.floor(Date.now() / 1000));
    const valid = await verifyProof(jwt, 'GET', 'https://api.example.com/messages');
    expect(valid).toBe(true);
  });

  it('rejects replayed jti', async () => {
    const { jwt } = await createES256Proof('POST', 'https://api.example.com/send', 'jti-002', Math.floor(Date.now() / 1000));
    const valid1 = await verifyProof(jwt, 'POST', 'https://api.example.com/send');
    expect(valid1).toBe(true);
    
    const valid2 = await verifyProof(jwt, 'POST', 'https://api.example.com/send');
    expect(valid2).toBe(false); // Replay detected
  });

  it('rejects wrong HTTP method', async () => {
    const { jwt } = await createES256Proof('GET', 'https://api.example.com/data', 'jti-003', Math.floor(Date.now() / 1000));
    const valid = await verifyProof(jwt, 'POST', 'https://api.example.com/data'); // Wrong method
    expect(valid).toBe(false);
  });

  it('rejects wrong URI', async () => {
    const { jwt } = await createES256Proof('GET', 'https://api.example.com/foo', 'jti-004', Math.floor(Date.now() / 1000));
    const valid = await verifyProof(jwt, 'GET', 'https://api.example.com/bar'); // Wrong URI
    expect(valid).toBe(false);
  });

  it('rejects expired iat (clock skew)', async () => {
    const oldIat = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const { jwt } = await createES256Proof('GET', 'https://api.example.com/test', 'jti-005', oldIat);
    const valid = await verifyProof(jwt, 'GET', 'https://api.example.com/test');
    expect(valid).toBe(false); // Outside ±300s window
  });

  it('binds DPoP to session via JKT', async () => {
    const { jwt: jwt1, jkt } = await createES256Proof('GET', 'https://api.example.com/me', 'jti-006', Math.floor(Date.now() / 1000));
    
    // First request establishes session with JKT
    const valid1 = await verifyProofWithSession(jwt1, 'GET', 'https://api.example.com/me', jkt);
    expect(valid1).toBe(true);
    
    // Different key (different JKT) should fail session binding
    const { jwt: jwt2, jkt: differentJKT } = await createES256Proof('GET', 'https://api.example.com/me', 'jti-007', Math.floor(Date.now() / 1000));
    const valid2 = await verifyProofWithSession(jwt2, 'GET', 'https://api.example.com/me', jkt); // Wrong JKT
    expect(valid2).toBe(false);
  });
});
