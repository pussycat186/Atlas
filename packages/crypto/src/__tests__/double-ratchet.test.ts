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
  
  it('should handle out-of-order messages với skipped keys', async () => {
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    const bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    // Alice tạo 3 messages
    const { encrypted: msg0, newState: aliceState1 } = await encrypt(aliceState, 'Message 0');
    const { encrypted: msg1, newState: aliceState2 } = await encrypt(aliceState1, 'Message 1');
    const { encrypted: msg2, newState: aliceState3 } = await encrypt(aliceState2, 'Message 2');
    aliceState = aliceState3;
    
    // Bob nhận messages theo thứ tự: 0, 2, 1 (out-of-order)
    
    // Nhận message 0 (in-order)
    const { plaintext: pt0, newState: bobState1 } = await decrypt(bobState, msg0);
    expect(pt0).toBe('Message 0');
    expect(bobState1.recvChain.index).toBe(1);
    
    // Nhận message 2 (skip message 1)
    const { plaintext: pt2, newState: bobState2 } = await decrypt(bobState1, msg2);
    expect(pt2).toBe('Message 2');
    expect(bobState2.recvChain.index).toBe(3); // Jumped to index 3
    expect(bobState2.skippedKeys.size).toBe(1); // Key cho message 1 được lưu
    
    // Nhận message 1 (delayed, dùng skipped key)
    const { plaintext: pt1, newState: bobState3 } = await decrypt(bobState2, msg1);
    expect(pt1).toBe('Message 1');
    expect(bobState3.skippedKeys.size).toBe(0); // Skipped key đã được dùng và xóa
  });
  
  it('should reject messages vượt quá MAX_SKIP', async () => {
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    const bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    // Alice tạo message đầu tiên
    const { encrypted: msg0, newState: aliceState1 } = await encrypt(aliceState, 'First message');
    aliceState = aliceState1;
    
    // Alice tạo 1001 messages nữa (skip quá nhiều)
    for (let i = 0; i < 1001; i++) {
      const { newState } = await encrypt(aliceState, `Skip ${i}`);
      aliceState = newState;
    }
    
    // Alice tạo message cuối cùng
    const { encrypted: msgFar } = await encrypt(aliceState, 'Far future message');
    
    // Bob nhận first message OK
    const { newState: bobState1 } = await decrypt(bobState, msg0);
    
    // Bob cố nhận message xa quá (skip > 1000): FAIL
    // Message này có sequence = 1002 nhưng Bob đang ở sequence 1
    await expect(decrypt(bobState1, msgFar)).rejects.toThrow(/MAX_SKIP|Too many/);
  });
  
  it('should maintain Forward Secrecy khi compromise', async () => {
    const sharedSecret = sodium.randombytes_buf(32);
    const bobKeyPair = sodium.crypto_box_keypair();
    
    let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);
    let bobState = await initBob(bobKeyPair.privateKey, sharedSecret);
    
    // Exchange một vài messages
    const { encrypted: msg1, newState: aliceState1 } = await encrypt(aliceState, 'Message 1');
    const { newState: bobState1 } = await decrypt(bobState, msg1);
    
    const { encrypted: msg2, newState: aliceState2 } = await encrypt(aliceState1, 'Message 2');
    const { newState: bobState2 } = await decrypt(bobState1, msg2);
    
    // Lưu old root key (simulate compromise)
    const oldRootKey = new Uint8Array(bobState2.rootKey);
    
    // DH Ratchet step (refresh keys)
    const alicePubKey = exportPublicKey(aliceState2);
    const alicePubBytes = sodium.from_base64(alicePubKey.x, sodium.base64_variants.URLSAFE_NO_PADDING);
    const bobState3 = await ratchetStep(bobState2, alicePubBytes);
    
    // Verify new root key khác hoàn toàn (Forward Secrecy)
    expect(bobState3.rootKey).not.toEqual(oldRootKey);
    expect(bobState3.dhSend).not.toEqual(bobState2.dhSend);
  });
});
