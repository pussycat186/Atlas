import { describe, it, expect } from 'vitest';
import { 
  buildSignatureBase, 
  signEd25519, 
  verifyEd25519,
  parseSignatureInput,
  verifyHttpSignature,
  type SignatureInput
} from '../http-signature.js';

describe('HTTP Message Signatures (RFC 9421)', () => {
  // Test Ed25519 key pair (hex format for @noble/ed25519)
  const privateKeyHex = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
  const publicKeyHex = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

  it('should build signature base correctly', () => {
    const input: SignatureInput = {
      method: 'POST',
      path: '/messages',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '123'
      },
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: 1618884473
      }
    };

    const signatureBase = buildSignatureBase(input);
    
    expect(signatureBase).toContain('"@method": POST');
    expect(signatureBase).toContain('"@path": /messages');
    expect(signatureBase).toContain('"content-length": 123');
    expect(signatureBase).toContain('"content-type": application/json');
    expect(signatureBase).toContain('"@signature-params":');
    expect(signatureBase).toContain('created=1618884473');
    expect(signatureBase).toContain('keyid="key-1"');
    expect(signatureBase).toContain('alg="ed25519"');
  });

  it('should sign and verify Ed25519 signature', async () => {
    const message = '"@method": POST\n"@path": /test\n"@signature-params": ("@method" "@path");created=1234;keyid="test";alg="ed25519"';
    
    const signature = await signEd25519(message, privateKeyHex);
    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');
    
    const valid = await verifyEd25519(message, signature, publicKeyHex);
    expect(valid).toBe(true);
  });

  it('should reject invalid Ed25519 signature', async () => {
    const message = '"@method": POST\n"@path": /test';
    const signature = await signEd25519(message, privateKeyHex);
    
    // Tampering with message
    const tamperedMessage = '"@method": GET\n"@path": /test';
    const valid = await verifyEd25519(tamperedMessage, signature, publicKeyHex);
    
    expect(valid).toBe(false);
  });

  it('should parse Signature-Input header', () => {
    const header = 'sig1=("@method" "@path" "content-type");created=1618884473;keyid="key-1";alg="ed25519";expires=1618885073';
    
    const parsed = parseSignatureInput(header);
    
    expect(parsed.keyid).toBe('key-1');
    expect(parsed.algorithm).toBe('ed25519');
    expect(parsed.created).toBe(1618884473);
    expect(parsed.expires).toBe(1618885073);
  });

  it('should verify full HTTP signature', async () => {
    const now = Math.floor(Date.now() / 1000);
    
    const input: SignatureInput = {
      method: 'POST',
      path: '/messages',
      headers: {
        'Content-Type': 'application/json'
      },
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: now
      }
    };

    const signatureBase = buildSignatureBase(input);
    const signature = await signEd25519(signatureBase, privateKeyHex);
    
    const valid = await verifyHttpSignature(input, signature, publicKeyHex);
    expect(valid).toBe(true);
  });

  it('should reject expired signature', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = now - 600; // 10 minutes ago (beyond 5min tolerance)
    
    const input: SignatureInput = {
      method: 'POST',
      path: '/messages',
      headers: {},
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: expired
      }
    };

    const signatureBase = buildSignatureBase(input);
    const signature = await signEd25519(signatureBase, privateKeyHex);
    
    await expect(
      verifyHttpSignature(input, signature, publicKeyHex)
    ).rejects.toThrow('Signature timestamp out of tolerance');
  });

  it('should reject signature with wrong algorithm', async () => {
    const now = Math.floor(Date.now() / 1000);
    
    const input: SignatureInput = {
      method: 'POST',
      path: '/messages',
      headers: {},
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'hs2019', // Wrong algorithm
        created: now
      }
    };

    const signatureBase = buildSignatureBase(input);
    const signature = await signEd25519(signatureBase, privateKeyHex);
    
    await expect(
      verifyHttpSignature(input, signature, publicKeyHex)
    ).rejects.toThrow('Unsupported algorithm');
  });
});
