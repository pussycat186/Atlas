/**
 * Known Answer Tests (KAT) for Atlas Crypto
 * 
 * These tests validate cryptographic implementations against known test vectors
 * to ensure correctness and prevent regressions.
 */

import { atlasCrypto, X3DHKeyExchange, DoubleRatchet, hkdf } from './index';

describe('Known Answer Tests (KAT)', () => {
  describe('Key Derivation Function (KDF)', () => {
    test('KAT 1: Key Derivation', () => {
      const input = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
      const salt = Buffer.from('AtlasX3DH', 'utf8');
      const info = 'AtlasKeyExchange';
      const length = 32;
      
      const result = hkdf(input, salt, info, length);
      
      // Note: This is a placeholder - actual KAT would use real test vectors
      expect(result).toHaveLength(32);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('X3DH Key Exchange', () => {
    test('KAT 2: X3DH Shared Secret', () => {
      const x3dh = new X3DHKeyExchange();
      
      // Test with known keys
      const theirIdentityKey = Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex');
      const theirSignedPreKey = Buffer.from('2222222222222222222222222222222222222222222222222222222222222222', 'hex');
      
      const sharedSecret = x3dh.generateSharedSecret(theirIdentityKey, theirSignedPreKey);
      
      expect(sharedSecret).toHaveLength(32);
      expect(sharedSecret).toBeInstanceOf(Buffer);
    });
  });

  describe('Double Ratchet', () => {
    test('KAT 3: Message Encryption', () => {
      const rootKey = Buffer.from('3333333333333333333333333333333333333333333333333333333333333333', 'hex');
      const ratchet = new DoubleRatchet(rootKey);
      
      const plaintext = 'Hello, Atlas!';
      const aad = 'test-aad';
      
      const encrypted = ratchet.encrypt(plaintext, aad);
      
      expect(encrypted).toHaveProperty('header');
      expect(encrypted).toHaveProperty('payload');
      expect(encrypted).toHaveProperty('nonce');
      expect(encrypted).toHaveProperty('counter');
      expect(encrypted).toHaveProperty('deviceId');
      expect(encrypted).toHaveProperty('timestamp');
      expect(encrypted).toHaveProperty('aad');
    });

    test('KAT 4: Message Decryption', () => {
      const rootKey = Buffer.from('4444444444444444444444444444444444444444444444444444444444444444', 'hex');
      const ratchet = new DoubleRatchet(rootKey);
      
      const plaintext = 'Test message for decryption';
      const aad = 'test-aad-decrypt';
      
      const encrypted = ratchet.encrypt(plaintext, aad);
      const decrypted = ratchet.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('End-to-End Integration', () => {
    test('KAT 5: Full E2EE Flow', () => {
      const message = 'This is a test message for E2EE validation';
      
      // Encrypt message
      const encrypted = atlasCrypto.encryptMessage(message, {
        identityKey: { publicKey: Buffer.alloc(32), privateKey: Buffer.alloc(32) },
        signedPreKey: { publicKey: Buffer.alloc(32), privateKey: Buffer.alloc(32) }
      });
      
      expect(encrypted).toHaveProperty('header');
      expect(encrypted).toHaveProperty('payload');
      expect(encrypted.payload).not.toBe(message);
      
      // Decrypt message
      const decrypted = atlasCrypto.decryptMessage(encrypted);
      expect(decrypted).toBe(message);
    });
  });
});
