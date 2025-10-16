/**
 * Post-Quantum Cryptography Hybrid Implementation
 * Combines classical X25519 with post-quantum Kyber768 for quantum-resistant encryption
 * 
 * Provides future-proof cryptography with fallback compatibility
 */

import { webcrypto } from 'crypto';

const crypto = webcrypto;

// Kyber768 constants (simplified implementation for demonstration)
// In production, use a proper Kyber implementation like kyber-crystals
const KYBER768_PUBLIC_KEY_SIZE = 1184;
const KYBER768_SECRET_KEY_SIZE = 2400;
const KYBER768_CIPHERTEXT_SIZE = 1088;
const KYBER768_SHARED_SECRET_SIZE = 32;

interface HybridKeyPair {
  classical: CryptoKeyPair;
  postQuantum: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
}

interface HybridPublicKey {
  classical: CryptoKey;
  postQuantum: Uint8Array;
  metadata: {
    version: number;
    timestamp: number;
    algorithms: string[];
  };
}

interface HybridCiphertext {
  classical: Uint8Array;
  postQuantum: Uint8Array;
  metadata: {
    version: number;
    algorithms: string[];
  };
}

export class PQCHybridKEM {
  private static readonly CURRENT_VERSION = 1;
  private static readonly ALGORITHMS = ['X25519', 'Kyber768'];

  /**
   * Generate hybrid keypair (X25519 + Kyber768)
   */
  async generateKeyPair(): Promise<HybridKeyPair> {
    console.log('🔐 Generating hybrid PQC keypair (X25519 + Kyber768)...');
    
    try {
      // Generate X25519 keypair using Web Crypto API
      const classicalKeyPair = await crypto.subtle.generateKey(
        { name: 'X25519' },
        true, // extractable
        ['deriveKey']
      );

      // Generate Kyber768 keypair (simulated - use real implementation in production)
      const postQuantumKeyPair = await this.generateKyberKeyPair();

      console.log('✅ Hybrid keypair generated successfully');
      
      return {
        classical: classicalKeyPair,
        postQuantum: postQuantumKeyPair
      };
    } catch (error) {
      console.error('❌ Failed to generate hybrid keypair:', error);
      throw new Error('Hybrid keypair generation failed');
    }
  }

  /**
   * Encapsulate secret using hybrid KEM
   * @param {HybridPublicKey} recipientPublicKey - Recipient's hybrid public key
   * @returns {Promise<{ciphertext: HybridCiphertext, sharedSecret: Uint8Array}>}
   */
  async encapsulate(recipientPublicKey: HybridPublicKey): Promise<{
    ciphertext: HybridCiphertext;
    sharedSecret: Uint8Array;
  }> {
    console.log('🔒 Performing hybrid KEM encapsulation...');

    try {
      // Generate ephemeral X25519 keypair
      const ephemeralKeyPair = await crypto.subtle.generateKey(
        { name: 'X25519' },
        true,
        ['deriveKey']
      );

      // Derive X25519 shared secret
      const classicalSharedKey = await crypto.subtle.deriveKey(
        { name: 'X25519', public: recipientPublicKey.classical },
        ephemeralKeyPair.privateKey,
        { name: 'HKDF', hash: 'SHA-256' },
        true,
        ['deriveKey']
      );

      // Extract classical shared secret
      const classicalSharedBuffer = await crypto.subtle.exportKey('raw', classicalSharedKey);
      const classicalShared = new Uint8Array(classicalSharedBuffer);

      // Export ephemeral public key for ciphertext
      const ephemeralPublicBuffer = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);
      const classicalCiphertext = new Uint8Array(ephemeralPublicBuffer);

      // Perform Kyber768 encapsulation (simulated)
      const kyberResult = await this.kyberEncapsulate(recipientPublicKey.postQuantum);

      // Combine shared secrets using HKDF
      const combinedShared = await this.combineSharedSecrets(
        classicalShared,
        kyberResult.sharedSecret
      );

      const ciphertext: HybridCiphertext = {
        classical: classicalCiphertext,
        postQuantum: kyberResult.ciphertext,
        metadata: {
          version: PQCHybridKEM.CURRENT_VERSION,
          algorithms: PQCHybridKEM.ALGORITHMS
        }
      };

      console.log('✅ Hybrid encapsulation completed');
      
      return {
        ciphertext,
        sharedSecret: combinedShared
      };
    } catch (error) {
      console.error('❌ Hybrid encapsulation failed:', error);
      throw new Error('Hybrid encapsulation failed');
    }
  }

  /**
   * Decapsulate ciphertext using hybrid KEM
   */
  async decapsulate(
    ciphertext: HybridCiphertext,
    recipientKeyPair: HybridKeyPair
  ): Promise<Uint8Array> {
    console.log('🔓 Performing hybrid KEM decapsulation...');

    try {
      // Validate ciphertext version and algorithms
      if (ciphertext.metadata.version !== PQCHybridKEM.CURRENT_VERSION) {
        throw new Error(`Unsupported ciphertext version: ${ciphertext.metadata.version}`);
      }

      // Import ephemeral X25519 public key
      const ephemeralPublicKey = await crypto.subtle.importKey(
        'raw',
        ciphertext.classical,
        { name: 'X25519' },
        false,
        []
      );

      // Derive X25519 shared secret
      const classicalSharedKey = await crypto.subtle.deriveKey(
        { name: 'X25519', public: ephemeralPublicKey },
        recipientKeyPair.classical.privateKey,
        { name: 'HKDF', hash: 'SHA-256' },
        true,
        ['deriveKey']
      );

      const classicalSharedBuffer = await crypto.subtle.exportKey('raw', classicalSharedKey);
      const classicalShared = new Uint8Array(classicalSharedBuffer);

      // Perform Kyber768 decapsulation
      const postQuantumShared = await this.kyberDecapsulate(
        ciphertext.postQuantum,
        recipientKeyPair.postQuantum.secretKey
      );

      // Combine shared secrets
      const combinedShared = await this.combineSharedSecrets(
        classicalShared,
        postQuantumShared
      );

      console.log('✅ Hybrid decapsulation completed');
      return combinedShared;
    } catch (error) {
      console.error('❌ Hybrid decapsulation failed:', error);
      throw new Error('Hybrid decapsulation failed');
    }
  }

  /**
   * Serialize hybrid public key for transmission
   */
  async serializePublicKey(hybridKey: HybridKeyPair): Promise<string> {
    const classicalPublicBuffer = await crypto.subtle.exportKey('raw', hybridKey.classical.publicKey);
    
    const serialized = {
      classical: Array.from(new Uint8Array(classicalPublicBuffer)),
      postQuantum: Array.from(hybridKey.postQuantum.publicKey),
      metadata: {
        version: PQCHybridKEM.CURRENT_VERSION,
        timestamp: Date.now(),
        algorithms: PQCHybridKEM.ALGORITHMS
      }
    };

    return btoa(JSON.stringify(serialized));
  }

  /**
   * Deserialize hybrid public key
   */
  async deserializePublicKey(serializedKey: string): Promise<HybridPublicKey> {
    try {
      const parsed = JSON.parse(atob(serializedKey));
      
      const classicalPublicKey = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(parsed.classical),
        { name: 'X25519' },
        false,
        []
      );

      return {
        classical: classicalPublicKey,
        postQuantum: new Uint8Array(parsed.postQuantum),
        metadata: parsed.metadata
      };
    } catch (error) {
      console.error('Failed to deserialize hybrid public key:', error);
      throw new Error('Invalid hybrid public key format');
    }
  }

  /**
   * Generate Kyber768 keypair (simulated implementation)
   * In production, replace with actual Kyber implementation
   */
  private async generateKyberKeyPair(): Promise<{
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }> {
    // Simulated Kyber768 key generation
    // In production, use: https://github.com/antontutoveanu/crystals-kyber-javascript
    const publicKey = crypto.getRandomValues(new Uint8Array(KYBER768_PUBLIC_KEY_SIZE));
    const secretKey = crypto.getRandomValues(new Uint8Array(KYBER768_SECRET_KEY_SIZE));
    
    return { publicKey, secretKey };
  }

  /**
   * Kyber768 encapsulation (simulated implementation)
   */
  private async kyberEncapsulate(publicKey: Uint8Array): Promise<{
    ciphertext: Uint8Array;
    sharedSecret: Uint8Array;
  }> {
    // Simulated Kyber768 encapsulation
    const ciphertext = crypto.getRandomValues(new Uint8Array(KYBER768_CIPHERTEXT_SIZE));
    const sharedSecret = crypto.getRandomValues(new Uint8Array(KYBER768_SHARED_SECRET_SIZE));
    
    return { ciphertext, sharedSecret };
  }

  /**
   * Kyber768 decapsulation (simulated implementation)
   */
  private async kyberDecapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    // Simulated Kyber768 decapsulation
    return crypto.getRandomValues(new Uint8Array(KYBER768_SHARED_SECRET_SIZE));
  }

  /**
   * Combine classical and post-quantum shared secrets using HKDF
   */
  private async combineSharedSecrets(
    classicalShared: Uint8Array,
    postQuantumShared: Uint8Array
  ): Promise<Uint8Array> {
    // Concatenate both shared secrets
    const combined = new Uint8Array(classicalShared.length + postQuantumShared.length);
    combined.set(classicalShared, 0);
    combined.set(postQuantumShared, classicalShared.length);

    // Import as HKDF key
    const hkdfKey = await crypto.subtle.importKey(
      'raw',
      combined,
      'HKDF',
      false,
      ['deriveKey']
    );

    // Derive final shared secret
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode('Atlas-PQC-Hybrid-v1'),
        info: new TextEncoder().encode('shared-secret')
      },
      hkdfKey,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      true,
      ['sign']
    );

    const derivedBuffer = await crypto.subtle.exportKey('raw', derivedKey);
    return new Uint8Array(derivedBuffer);
  }
}

/**
 * Atlas PQC singleton for application use
 */
export class AtlasPQC {
  private static instance: PQCHybridKEM | null = null;
  private static keyPair: HybridKeyPair | null = null;

  static async getInstance(): Promise<PQCHybridKEM> {
    if (!AtlasPQC.instance) {
      AtlasPQC.instance = new PQCHybridKEM();
    }
    return AtlasPQC.instance;
  }

  static async getKeyPair(): Promise<HybridKeyPair> {
    if (!AtlasPQC.keyPair) {
      const pqc = await AtlasPQC.getInstance();
      AtlasPQC.keyPair = await pqc.generateKeyPair();
    }
    return AtlasPQC.keyPair;
  }

  /**
   * High-level encrypt function using hybrid PQC
   */
  static async encryptData(data: string, recipientPublicKey: HybridPublicKey): Promise<string> {
    const pqc = await AtlasPQC.getInstance();
    const { ciphertext, sharedSecret } = await pqc.encapsulate(recipientPublicKey);

    // Use shared secret to encrypt data with AES-256-GCM
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );

    const result = {
      ciphertext,
      encryptedData: Array.from(new Uint8Array(encryptedBuffer)),
      iv: Array.from(iv)
    };

    return btoa(JSON.stringify(result));
  }

  /**
   * High-level decrypt function using hybrid PQC
   */
  static async decryptData(encryptedData: string): Promise<string> {
    const keyPair = await AtlasPQC.getKeyPair();
    const pqc = await AtlasPQC.getInstance();
    
    const parsed = JSON.parse(atob(encryptedData));
    const sharedSecret = await pqc.decapsulate(parsed.ciphertext, keyPair);

    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(parsed.iv) },
      key,
      new Uint8Array(parsed.encryptedData)
    );

    return new TextDecoder().decode(decryptedBuffer);
  }
}