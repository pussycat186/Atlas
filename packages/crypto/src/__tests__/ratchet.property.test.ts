import { describe, it } from 'vitest';import { describe, it } from 'vitest';import { describe, it } from 'vitest';

import fc from 'fast-check';

import sodium from 'libsodium-wrappers';import fc from 'fast-check';import fc from 'fast-check';

import { initAlice, initBob, encrypt, decrypt } from '../double-ratchet.js';

import sodium from 'libsodium-wrappers';import { generateKeyPair, initAlice, initBob, encrypt, decrypt } from '../double-ratchet.js';

/**

 * Property-based tests cho Double Ratchetimport { initAlice, initBob, encrypt, decrypt } from '../double-ratchet.js';

 * Sử dụng fast-check để verify các invariants

 *//**



describe('Double Ratchet Property Tests', () => {/** * Property-based tests cho Double Ratchet

  it('property: encrypt then decrypt returns original plaintext', async () => {

    await sodium.ready; * Property-based tests cho Double Ratchet * Sử dụng fast-check để verify các invariants

    

    await fc.assert( * Sử dụng fast-check để verify các invariants */

      fc.asyncProperty(

        fc.string({ minLength: 1, maxLength: 256 }), // plaintext string */

        async (plaintext) => {

          const sharedSecret = new Uint8Array(32).fill(0x42);describe('Double Ratchet Property Tests', () => {

          const bobKeyPair = sodium.crypto_box_keypair();

          describe('Double Ratchet Property Tests', () => {  it('property: encrypt then decrypt returns original plaintext', async () => {

          const aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);

          let bobState = await initBob(bobKeyPair.privateKey, sharedSecret);  it('property: encrypt then decrypt returns original plaintext', async () => {    await fc.assert(

          

          const { encrypted, newState: aliceState2 } = await encrypt(aliceState, plaintext);    await sodium.ready;      fc.asyncProperty(

          const { plaintext: decrypted, newState: bobState2 } = await decrypt(bobState, encrypted);

                      fc.uint8Array({ minLength: 1, maxLength: 256 }), // plaintext

          // Invariant: decrypt(encrypt(m)) = m

          return decrypted === plaintext;    await fc.assert(        fc.uint8Array({ minLength: 1, maxLength: 64 }),  // aad

        }

      ),      fc.asyncProperty(        async (plaintext, aad) => {

      { numRuns: 20 }

    );        fc.uint8Array({ minLength: 1, maxLength: 256 }), // plaintext          const sharedSecret = new Uint8Array(32).fill(0x42);

  });

        async (plaintext) => {          const bobKey = await generateKeyPair();

  it('property: message indices strictly increase', async () => {

    await sodium.ready;          const sharedSecret = new Uint8Array(32).fill(0x42);          

    

    await fc.assert(          const bobKeyPair = sodium.crypto_box_keypair();          const aliceState = await initAlice(sharedSecret, bobKey.publicKey);

      fc.asyncProperty(

        fc.array(fc.string({ minLength: 1, maxLength: 32 }), { minLength: 2, maxLength: 10 }),                    let bobState = await initBob(sharedSecret, bobKey);

        async (plaintexts) => {

          const sharedSecret = new Uint8Array(32).fill(0x11);          const aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);          

          const bobKeyPair = sodium.crypto_box_keypair();

                    let bobState = await initBob(bobKeyPair.privateKey, sharedSecret);          const { message, newState: aliceState2 } = await encrypt(aliceState, plaintext, aad);

          let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);

                              const { plaintext: decrypted, newState: bobState2 } = await decrypt(bobState, message);

          const messageIndices: number[] = [];

                    const { message, newState: aliceState2 } = await encrypt(aliceState, plaintext);          

          for (const pt of plaintexts) {

            const { encrypted, newState } = await encrypt(aliceState, pt);          const { plaintext: decrypted, newState: bobState2 } = await decrypt(bobState, message);          // Invariant: decrypt(encrypt(m)) = m

            messageIndices.push(encrypted.sequence);

            aliceState = newState;                    return (

          }

                    // Invariant: decrypt(encrypt(m)) = m            decrypted.length === plaintext.length &&

          // Invariant: indices strictly increase (0, 1, 2, ...)

          return messageIndices.every((n, i) => n === i);          return (            decrypted.every((byte, i) => byte === plaintext[i])

        }

      ),            decrypted.length === plaintext.length &&          );

      { numRuns: 10 }

    );            decrypted.every((byte, i) => byte === plaintext[i])        }

  });

          );      ),

  it('property: no key reuse - same plaintext produces different ciphertexts', async () => {

    await sodium.ready;        }      { numRuns: 20 } // 20 runs for speed

    

    await fc.assert(      ),    );

      fc.asyncProperty(

        fc.constant('Hello World'), // same plaintext      { numRuns: 20 }  });

        fc.integer({ min: 2, max: 5 }), // number of encryptions

        async (plaintext, count) => {    );

          const sharedSecret = new Uint8Array(32).fill(0x55);

          const bobKeyPair = sodium.crypto_box_keypair();  });  it('property: message numbers strictly increase', async () => {

          

          let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);    await fc.assert(

          

          const ciphertexts: string[] = [];  it('property: message indices strictly increase', async () => {      fc.asyncProperty(

          

          for (let i = 0; i < count; i++) {    await sodium.ready;        fc.array(fc.uint8Array({ minLength: 1, maxLength: 32 }), { minLength: 2, maxLength: 10 }),

            const { encrypted, newState } = await encrypt(aliceState, plaintext);

            ciphertexts.push(encrypted.ciphertext);            async (plaintexts) => {

            aliceState = newState;

          }    await fc.assert(          const sharedSecret = new Uint8Array(32).fill(0x11);

          

          // Invariant: Mặc dù plaintext giống nhau, ciphertext phải khác (do key evolution)      fc.asyncProperty(          const bobKey = await generateKeyPair();

          const uniqueCiphertexts = new Set(ciphertexts);

          return uniqueCiphertexts.size === ciphertexts.length;        fc.array(fc.uint8Array({ minLength: 1, maxLength: 32 }), { minLength: 2, maxLength: 10 }),          

        }

      ),        async (plaintexts) => {          let aliceState = await initAlice(sharedSecret, bobKey.publicKey);

      { numRuns: 10 }

    );          const sharedSecret = new Uint8Array(32).fill(0x11);          const aad = new Uint8Array(8);

  });

});          const bobKeyPair = sodium.crypto_box_keypair();          


                    const messageNumbers: number[] = [];

          let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);          

                    for (const pt of plaintexts) {

          const messageIndices: number[] = [];            const { message, newState } = await encrypt(aliceState, pt, aad);

                      messageNumbers.push(message.header.n);

          for (const pt of plaintexts) {            aliceState = newState;

            const { message, newState } = await encrypt(aliceState, pt);          }

            messageIndices.push(aliceState.sendChain.index);          

            aliceState = newState;          // Invariant: Ns strictly increases (0, 1, 2, ...)

          }          return messageNumbers.every((n, i) => n === i);

                  }

          // Invariant: indices strictly increase (0, 1, 2, ...)      ),

          return messageIndices.every((n, i) => n === i);      { numRuns: 10 }

        }    );

      ),  });

      { numRuns: 10 }

    );  it('property: no key reuse across messages', async () => {

  });    // Khó test trực tiếp vì keys internal, nhưng có thể test via ciphertext uniqueness

    await fc.assert(

  it('property: no key reuse - same plaintext produces different ciphertexts', async () => {      fc.asyncProperty(

    await sodium.ready;        fc.constant(new Uint8Array(32).fill(0xAA)), // same plaintext

            fc.integer({ min: 2, max: 5 }), // number of encryptions

    await fc.assert(        async (plaintext, count) => {

      fc.asyncProperty(          const sharedSecret = new Uint8Array(32).fill(0x55);

        fc.constant(new Uint8Array(32).fill(0xAA)), // same plaintext          const bobKey = await generateKeyPair();

        fc.integer({ min: 2, max: 5 }), // number of encryptions          

        async (plaintext, count) => {          let aliceState = await initAlice(sharedSecret, bobKey.publicKey);

          const sharedSecret = new Uint8Array(32).fill(0x55);          const aad = new Uint8Array(4);

          const bobKeyPair = sodium.crypto_box_keypair();          

                    const ciphertexts: string[] = [];

          let aliceState = await initAlice(bobKeyPair.publicKey, sharedSecret);          

                    for (let i = 0; i < count; i++) {

          const ciphertexts: string[] = [];            const { message, newState } = await encrypt(aliceState, plaintext, aad);

                      ciphertexts.push(Buffer.from(message.ciphertext).toString('hex'));

          for (let i = 0; i < count; i++) {            aliceState = newState;

            const { message, newState } = await encrypt(aliceState, plaintext);          }

            ciphertexts.push(Buffer.from(message.ciphertext).toString('hex'));          

            aliceState = newState;          // Invariant: Mặc dù plaintext giống nhau, ciphertext phải khác (do key khác)

          }          const uniqueCiphertexts = new Set(ciphertexts);

                    return uniqueCiphertexts.size === ciphertexts.length;

          // Invariant: Mặc dù plaintext giống nhau, ciphertext phải khác (do key evolution)        }

          const uniqueCiphertexts = new Set(ciphertexts);      ),

          return uniqueCiphertexts.size === ciphertexts.length;      { numRuns: 10 }

        }    );

      ),  });

      { numRuns: 10 }});

    );
  });
});
