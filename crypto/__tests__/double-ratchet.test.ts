import { describe, it, expect } from 'vitest';
import { generateKeyPair, initSession } from '../double-ratchet';

describe('Double Ratchet basic', () => {
  it('establishes session and encrypts/decrypts', async () => {
    const a = await generateKeyPair();
    const b = await generateKeyPair();
    const alice = await initSession(a.privateKey, b.publicKey);
    const bob = await initSession(b.privateKey, a.publicKey);

    const msg = new TextEncoder().encode('hello atlas');
    const c = await alice.encrypt(msg);
    const p = await bob.decrypt(c);
    expect(new TextDecoder().decode(p)).toBe('hello atlas');
  });
});
