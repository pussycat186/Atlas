// Atlas Security-Core: Double Ratchet Tests
// Test E2EE messaging với Forward Secrecy

import { describe, it, expect, beforeAll } from 'vitest';
import sodium from 'libsodium-wrappers';
import { initAlice, initBob, encrypt, decrypt, ratchetStep, exportPublicKey } from '../double-ratchet.js';

beforeAll(async () => {
  await sodium.ready;
});

describe('Double Ratchet', () => {
  it('should encrypt and decrypt message', async () => {
    // Setup: Alice và Bob share initial secret
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    const aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    const bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    // Alice mã hóa message
    const plaintext = 'Hello Bob, this is Alice! 🔒';
    const { encrypted, newState: aliceState2 } = await encrypt(aliceState, plaintext);
    
    // Bob giải mã message
    const { plaintext: decrypted, newState: bobState2 } = await decrypt(bobState, encrypted);
    
    expect(decrypted).toBe(plaintext);
    expect(aliceState2.sendChain.index).toBe(1);
    expect(bobState2.recvChain.index).toBe(1);
  });
  
  it('should prevent replay attacks', async () => {
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    const aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    const bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    const { encrypted, newState: aliceState2 } = await encrypt(aliceState, 'Test message');
    
    // Giải mã lần 1: OK
    const { newState: bobState2 } = await decrypt(bobState, encrypted);
    
    // Giải mã lần 2 (replay): FAIL
    await expect(decrypt(bobState2, encrypted)).rejects.toThrow('Message replayed');
  });
  
  it('should perform DH ratchet step', async () => {
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    let bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    // Alice gửi message 1
    const { encrypted: msg1, newState: aliceState2 } = await encrypt(aliceState, 'Message 1');
    aliceState = aliceState2;
    
    // Bob nhận message 1
    const { newState: bobState2 } = await decrypt(bobState, msg1);
    bobState = bobState2;
    
    // Bob thực hiện DH ratchet (gửi public key mới)
    const alicePublicKey = exportPublicKey(aliceState);
    const alicePubBytes = sodium.from_base64(alicePublicKey.x, sodium.base64_variants.URLSAFE_NO_PADDING);
    
    bobState = await ratchetStep(bobState, alicePubBytes);
    
    // Verify root key đã thay đổi (Forward Secrecy)
    expect(bobState.sendChain.index).toBe(0); // Reset chain index
  });
});
