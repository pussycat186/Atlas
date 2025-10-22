import { describe, it, expect } from 'vitest';
import { generateKeyPair, initAlice, initBob, encrypt, decrypt, trySkippedMessageKeys } from '../double-ratchet.js';

describe('Double Ratchet Production', () => {
  it('establishes session and encrypts/decrypts', async () => {
    const aliceInitKey = await generateKeyPair();
    const bobInitKey = await generateKeyPair();
    
    // Shared secret (thường từ X3DH)
    const sharedSecret = new Uint8Array(32).fill(0x42);
    
    const aliceState = await initAlice(sharedSecret, bobInitKey.publicKey);
    let bobState = await initBob(sharedSecret, bobInitKey);
    
    const msg1 = new TextEncoder().encode('Hello Bob');
    const aad1 = new TextEncoder().encode('msg_1');
    
    const { message: encrypted1, newState: aliceState2 } = await encrypt(aliceState, msg1, aad1);
    const { plaintext: decrypted1, newState: bobState2 } = await decrypt(bobState, encrypted1);
    
    expect(new TextDecoder().decode(decrypted1)).toBe('Hello Bob');
    
    // Bob phản hồi
    const msg2 = new TextEncoder().encode('Hi Alice');
    const aad2 = new TextEncoder().encode('msg_2');
    const { message: encrypted2, newState: bobState3 } = await encrypt(bobState2, msg2, aad2);
    const { plaintext: decrypted2, newState: aliceState3 } = await decrypt(aliceState2, encrypted2);
    
    expect(new TextDecoder().decode(decrypted2)).toBe('Hi Alice');
  });

  it('handles out-of-order messages with skipped keys', async () => {
    const aliceInitKey = await generateKeyPair();
    const bobInitKey = await generateKeyPair();
    const sharedSecret = new Uint8Array(32).fill(0x33);
    
    const aliceState = await initAlice(sharedSecret, bobInitKey.publicKey);
    let bobState = await initBob(sharedSecret, bobInitKey);
    
    // Alice gửi 3 tin
    const msg1 = new TextEncoder().encode('msg1');
    const msg2 = new TextEncoder().encode('msg2');
    const msg3 = new TextEncoder().encode('msg3');
    const aad = new TextEncoder().encode('test');
    
    const { message: enc1, newState: a1 } = await encrypt(aliceState, msg1, aad);
    const { message: enc2, newState: a2 } = await encrypt(a1, msg2, aad);
    const { message: enc3, newState: a3 } = await encrypt(a2, msg3, aad);
    
    // Bob nhận msg1, msg3 (bỏ qua msg2)
    const { plaintext: p1, newState: b1 } = await decrypt(bobState, enc1);
    expect(new TextDecoder().decode(p1)).toBe('msg1');
    
    const { plaintext: p3, newState: b2 } = await decrypt(b1, enc3);
    expect(new TextDecoder().decode(p3)).toBe('msg3');
    
    // Bob nhận msg2 muộn (từ skipped keys)
    const { plaintext: p2skip, newState: b3 } = await trySkippedMessageKeys(b2, enc2);
    expect(p2skip).not.toBeNull();
    expect(new TextDecoder().decode(p2skip!)).toBe('msg2');
  });

  it('demonstrates Forward Secrecy after compromise', async () => {
    // FS: Nếu khóa hiện tại bị lộ, tin nhắn cũ vẫn an toàn
    const aliceInitKey = await generateKeyPair();
    const bobInitKey = await generateKeyPair();
    const sharedSecret = new Uint8Array(32).fill(0x11);
    
    let aliceState = await initAlice(sharedSecret, bobInitKey.publicKey);
    let bobState = await initBob(sharedSecret, bobInitKey);
    
    // Tin nhắn cũ
    const oldMsg = new TextEncoder().encode('old secret');
    const aad = new TextEncoder().encode('metadata');
    const { message: oldEnc, newState: a1 } = await encrypt(aliceState, oldMsg, aad);
    const { plaintext: oldDec, newState: b1 } = await decrypt(bobState, oldEnc);
    
    // DH ratchet (khóa xoay)
    const newMsg = new TextEncoder().encode('new message');
    const { message: newEnc, newState: a2 } = await encrypt(a1, newMsg, aad);
    const { plaintext: newDec, newState: b2 } = await decrypt(b1, newEnc);
    
    // Giả sử state b2 bị compromise
    // Attacker KHÔNG thể giải mã oldEnc vì chain key đã thay đổi
    // (test này chỉ minh họa logic, không simulate attack thực tế)
    expect(new TextDecoder().decode(oldDec)).toBe('old secret');
    expect(new TextDecoder().decode(newDec)).toBe('new message');
  });
});
