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

  // P1 CRITICAL TESTS: RFC 9421 Compliance
  
  it('P1: should preserve exact header order (RFC 9421 Section 3.1)', () => {
    // Test that headers appear in signature base in EXACT order specified
    const input: SignatureInput = {
      method: 'POST',
      path: '/messages',
      headers: {
        'x-custom-header': 'value1',
        'content-type': 'application/json',
        'content-length': '42'
      },
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: 1618884473
      }
    };

    const signatureBase = buildSignatureBase(input);
    const lines = signatureBase.split('\n');
    
    // Verify order: @method, @path, then headers in order they were added
    expect(lines[0]).toContain('"@method":');
    expect(lines[1]).toContain('"@path":');
    expect(lines[2]).toContain('"x-custom-header":'); // First added
    expect(lines[3]).toContain('"content-type":');     // Second added
    expect(lines[4]).toContain('"content-length":');   // Third added
    
    // Last line should be @signature-params
    expect(lines[lines.length - 1]).toContain('"@signature-params":');
  });

  it('P1: should include @signature-params with all metadata', () => {
    const input: SignatureInput = {
      method: 'POST',
      path: '/api/endpoint',
      headers: {
        'content-type': 'application/json'
      },
      signatureParams: {
        keyid: 'test-key-123',
        algorithm: 'ed25519',
        created: 1618884473,
        expires: 1618885073
      }
    };

    const signatureBase = buildSignatureBase(input);
    
    // @signature-params MUST be present
    expect(signatureBase).toContain('"@signature-params":');
    
    // Must include all covered fields
    expect(signatureBase).toContain('"@method"');
    expect(signatureBase).toContain('"@path"');
    expect(signatureBase).toContain('"content-type"');
    
    // Must include parameters
    expect(signatureBase).toContain('created=1618884473');
    expect(signatureBase).toContain('keyid="test-key-123"');
    expect(signatureBase).toContain('alg="ed25519"');
    expect(signatureBase).toContain('expires=1618885073');
  });

  it('P1: changing header order should produce different signature base', () => {
    const input1: SignatureInput = {
      method: 'POST',
      path: '/test',
      headers: {
        'header-a': 'value-a',
        'header-b': 'value-b'
      },
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: 1618884473
      }
    };

    const input2: SignatureInput = {
      method: 'POST',
      path: '/test',
      headers: {
        'header-b': 'value-b',  // Swapped order
        'header-a': 'value-a'
      },
      signatureParams: {
        keyid: 'key-1',
        algorithm: 'ed25519',
        created: 1618884473
      }
    };

    const base1 = buildSignatureBase(input1);
    const base2 = buildSignatureBase(input2);
    
    // Different order = different base string
    expect(base1).not.toBe(base2);
  });
});
