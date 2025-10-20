// Atlas Security-Core: DPoP Tests
// Test RFC 9449 Proof-of-Possession

import { describe, it, expect } from 'vitest';
import { generateKeyPair, createProof, verifyProof } from '../src/dpop.js';

describe('DPoP', () => {
  it('should generate ES256 key pair with JWK', async () => {
    const keyPair = await generateKeyPair();
    
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.jwk.kty).toBe('EC');
    expect(keyPair.jwk.crv).toBe('P-256');
    expect(keyPair.jwk.alg).toBe('ES256');
    expect(keyPair.jwk.kid).toBeDefined();
  });
  
  it('should create and verify DPoP proof', async () => {
    const keyPair = await generateKeyPair();
    const method = 'POST';
    const uri = 'https://api.example.com/messages';
    
    // Tạo proof
    const proof = await createProof(keyPair, method, uri);
    
    expect(proof).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/); // JWT format
    
    // Verify proof
    const payload = await verifyProof(proof, method, uri);
    
    expect(payload.htm).toBe('POST');
    expect(payload.htu).toBe(uri);
    expect(payload.jti).toBeDefined();
    expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  
  it('should include ath claim when access token provided', async () => {
    const keyPair = await generateKeyPair();
    const accessToken = 'example-access-token-12345';
    
    const proof = await createProof(keyPair, 'GET', 'https://api.example.com/data', accessToken);
    
    // Verify với access token
    const payload = await verifyProof(proof, 'GET', 'https://api.example.com/data', accessToken);
    
    expect(payload.ath).toBeDefined();
  });
  
  it('should reject proof with wrong method', async () => {
    const keyPair = await generateKeyPair();
    const proof = await createProof(keyPair, 'POST', 'https://api.example.com/messages');
    
    await expect(verifyProof(proof, 'GET', 'https://api.example.com/messages'))
      .rejects.toThrow('Method mismatch');
  });
  
  it('should reject proof with wrong URI', async () => {
    const keyPair = await generateKeyPair();
    const proof = await createProof(keyPair, 'POST', 'https://api.example.com/messages');
    
    await expect(verifyProof(proof, 'POST', 'https://api.example.com/other'))
      .rejects.toThrow('URI mismatch');
  });
  
  it('should reject replayed JTI', async () => {
    const keyPair = await generateKeyPair();
    const proof = await createProof(keyPair, 'POST', 'https://api.example.com/messages');
    
    // Verify lần 1: OK
    await verifyProof(proof, 'POST', 'https://api.example.com/messages');
    
    // Verify lần 2 (replay): FAIL
    await expect(verifyProof(proof, 'POST', 'https://api.example.com/messages'))
      .rejects.toThrow('JTI reused');
  });
});
