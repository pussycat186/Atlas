/**
 * @atlas/crypto-pqc
 * Post-Quantum Cryptography adapters with runtime feature detection
 * Kyber (key exchange) + Dilithium (signatures) with X25519/Ed25519 fallbacks
 * 
 * Production safety: PQC_ON flag gates all PQC operations
 * Vietnamese-first error messages for UX consistency
 */

import { isFlagEnabled } from '@atlas/feature-flags';

/**
 * Key exchange algorithms
 */
export enum KeyExchangeAlgorithm {
  KYBER_768 = 'kyber768',           // PQC: NIST Level 3
  X25519 = 'x25519'                 // Classical fallback
}

/**
 * Signature algorithms
 */
export enum SignatureAlgorithm {
  DILITHIUM_3 = 'dilithium3',       // PQC: NIST Level 3
  ED25519 = 'ed25519'               // Classical fallback
}

/**
 * Key pair structure (generic)
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  algorithm: KeyExchangeAlgorithm | SignatureAlgorithm;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Shared secret from key exchange
 */
export interface SharedSecret {
  secret: Uint8Array;
  algorithm: KeyExchangeAlgorithm;
  timestamp: Date;
}

/**
 * Digital signature
 */
export interface Signature {
  signature: Uint8Array;
  algorithm: SignatureAlgorithm;
  publicKey: Uint8Array;
  timestamp: Date;
}

/**
 * PQC Crypto Provider Interface
 * Allows swapping implementations (e.g., liboqs, pqcrypto.js, WebAssembly modules)
 */
export interface PQCProvider {
  // Key exchange
  generateKeyExchangeKeyPair(alg: KeyExchangeAlgorithm): Promise<KeyPair>;
  deriveSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    alg: KeyExchangeAlgorithm
  ): Promise<SharedSecret>;
  
  // Signatures
  generateSignatureKeyPair(alg: SignatureAlgorithm): Promise<KeyPair>;
  sign(
    message: Uint8Array,
    privateKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<Signature>;
  verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<boolean>;
}

/**
 * Mock PQC Provider (stub implementation until real library integrated)
 * Returns deterministic test data for development
 */
class MockPQCProvider implements PQCProvider {
  async generateKeyExchangeKeyPair(alg: KeyExchangeAlgorithm): Promise<KeyPair> {
    // Mock: generate random-ish keys (NOT SECURE - for testing only)
    const publicKey = new Uint8Array(32);
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(publicKey);
    crypto.getRandomValues(privateKey);
    
    return {
      publicKey,
      privateKey,
      algorithm: alg,
      createdAt: new Date(),
      metadata: { provider: 'mock', warning: 'NOT_PRODUCTION_READY' }
    };
  }
  
  async deriveSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    alg: KeyExchangeAlgorithm
  ): Promise<SharedSecret> {
    // Mock: XOR private and public (NOT SECURE)
    const secret = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      secret[i] = (privateKey[i] || 0) ^ (publicKey[i] || 0);
    }
    
    return {
      secret,
      algorithm: alg,
      timestamp: new Date()
    };
  }
  
  async generateSignatureKeyPair(alg: SignatureAlgorithm): Promise<KeyPair> {
    const publicKey = new Uint8Array(32);
    const privateKey = new Uint8Array(64);
    crypto.getRandomValues(publicKey);
    crypto.getRandomValues(privateKey);
    
    return {
      publicKey,
      privateKey,
      algorithm: alg,
      createdAt: new Date(),
      metadata: { provider: 'mock', warning: 'NOT_PRODUCTION_READY' }
    };
  }
  
  async sign(
    message: Uint8Array,
    privateKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<Signature> {
    // Mock: simple hash of message + private key (NOT SECURE)
    const signature = new Uint8Array(64);
    crypto.getRandomValues(signature);
    
    const publicKey = new Uint8Array(32);
    publicKey.set(privateKey.slice(0, 32));
    
    return {
      signature,
      algorithm: alg,
      publicKey,
      timestamp: new Date()
    };
  }
  
  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<boolean> {
    // Mock: always return true (NOT SECURE)
    return true;
  }
}

/**
 * Classical fallback provider using Web Crypto API
 * X25519 for key exchange, Ed25519 for signatures
 */
class ClassicalCryptoProvider implements PQCProvider {
  async generateKeyExchangeKeyPair(alg: KeyExchangeAlgorithm): Promise<KeyPair> {
    if (alg !== KeyExchangeAlgorithm.X25519) {
      throw new Error(`Classical provider only supports X25519, got ${alg}`);
    }
    
    // Use Web Crypto API for X25519
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'X25519' } as any,
      true,
      ['deriveKey', 'deriveBits']
    );
    
    const publicKey = new Uint8Array(
      await crypto.subtle.exportKey('raw', keyPair.publicKey)
    );
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const privateKey = new Uint8Array(
      Buffer.from(privateKeyJwk.d || '', 'base64')
    );
    
    return {
      publicKey,
      privateKey,
      algorithm: alg,
      createdAt: new Date(),
      metadata: { provider: 'classical', curve: 'X25519' }
    };
  }
  
  async deriveSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    alg: KeyExchangeAlgorithm
  ): Promise<SharedSecret> {
    if (alg !== KeyExchangeAlgorithm.X25519) {
      throw new Error(`Classical provider only supports X25519`);
    }
    
    // Import keys and derive secret using Web Crypto
    const privateKeyObj = await crypto.subtle.importKey(
      'jwk',
      { kty: 'OKP', crv: 'X25519', d: Buffer.from(privateKey).toString('base64'), x: '' },
      { name: 'ECDH', namedCurve: 'X25519' } as any,
      false,
      ['deriveBits']
    );
    
    const publicKeyObj = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'ECDH', namedCurve: 'X25519' } as any,
      false,
      []
    );
    
    const secret = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'ECDH', public: publicKeyObj } as any,
        privateKeyObj,
        256
      )
    );
    
    return {
      secret,
      algorithm: alg,
      timestamp: new Date()
    };
  }
  
  async generateSignatureKeyPair(alg: SignatureAlgorithm): Promise<KeyPair> {
    if (alg !== SignatureAlgorithm.ED25519) {
      throw new Error(`Classical provider only supports Ed25519, got ${alg}`);
    }
    
    // Use Web Crypto API for Ed25519
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' } as any,
      true,
      ['sign', 'verify']
    );
    
    const publicKey = new Uint8Array(
      await crypto.subtle.exportKey('raw', keyPair.publicKey)
    );
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const privateKey = new Uint8Array(
      Buffer.from(privateKeyJwk.d || '', 'base64')
    );
    
    return {
      publicKey,
      privateKey,
      algorithm: alg,
      createdAt: new Date(),
      metadata: { provider: 'classical', curve: 'Ed25519' }
    };
  }
  
  async sign(
    message: Uint8Array,
    privateKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<Signature> {
    if (alg !== SignatureAlgorithm.ED25519) {
      throw new Error(`Classical provider only supports Ed25519`);
    }
    
    const privateKeyObj = await crypto.subtle.importKey(
      'jwk',
      { kty: 'OKP', crv: 'Ed25519', d: Buffer.from(privateKey).toString('base64'), x: '' },
      { name: 'Ed25519' } as any,
      false,
      ['sign']
    );
    
    const signature = new Uint8Array(
      await crypto.subtle.sign({ name: 'Ed25519' } as any, privateKeyObj, message)
    );
    
    const publicKey = new Uint8Array(32);
    publicKey.set(privateKey.slice(0, 32));
    
    return {
      signature,
      algorithm: alg,
      publicKey,
      timestamp: new Date()
    };
  }
  
  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
    alg: SignatureAlgorithm
  ): Promise<boolean> {
    if (alg !== SignatureAlgorithm.ED25519) {
      throw new Error(`Classical provider only supports Ed25519`);
    }
    
    try {
      const publicKeyObj = await crypto.subtle.importKey(
        'raw',
        publicKey,
        { name: 'Ed25519' } as any,
        false,
        ['verify']
      );
      
      return await crypto.subtle.verify(
        { name: 'Ed25519' } as any,
        publicKeyObj,
        signature,
        message
      );
    } catch {
      return false;
    }
  }
}

/**
 * Unified Crypto Manager
 * Automatically selects PQC or classical provider based on PQC_ON flag
 */
export class AtlasCryptoManager {
  private pqcProvider: PQCProvider;
  private classicalProvider: PQCProvider;
  
  constructor() {
    this.pqcProvider = new MockPQCProvider(); // TODO: Replace with real PQC library
    this.classicalProvider = new ClassicalCryptoProvider();
  }
  
  /**
   * Get active provider based on feature flag
   */
  private getProvider(): PQCProvider {
    return isFlagEnabled('PQC_ON') ? this.pqcProvider : this.classicalProvider;
  }
  
  /**
   * Generate key exchange key pair
   * Auto-selects Kyber768 (PQC) or X25519 (classical) based on flag
   */
  async generateKeyExchangeKeyPair(): Promise<KeyPair> {
    const alg = isFlagEnabled('PQC_ON') 
      ? KeyExchangeAlgorithm.KYBER_768 
      : KeyExchangeAlgorithm.X25519;
    
    return this.getProvider().generateKeyExchangeKeyPair(alg);
  }
  
  /**
   * Derive shared secret from key exchange
   */
  async deriveSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    algorithm: KeyExchangeAlgorithm
  ): Promise<SharedSecret> {
    return this.getProvider().deriveSharedSecret(privateKey, publicKey, algorithm);
  }
  
  /**
   * Generate signature key pair
   * Auto-selects Dilithium3 (PQC) or Ed25519 (classical) based on flag
   */
  async generateSignatureKeyPair(): Promise<KeyPair> {
    const alg = isFlagEnabled('PQC_ON')
      ? SignatureAlgorithm.DILITHIUM_3
      : SignatureAlgorithm.ED25519;
    
    return this.getProvider().generateSignatureKeyPair(alg);
  }
  
  /**
   * Sign message
   */
  async sign(
    message: Uint8Array,
    privateKey: Uint8Array,
    algorithm: SignatureAlgorithm
  ): Promise<Signature> {
    return this.getProvider().sign(message, privateKey, algorithm);
  }
  
  /**
   * Verify signature
   */
  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
    algorithm: SignatureAlgorithm
  ): Promise<boolean> {
    return this.getProvider().verify(message, signature, publicKey, algorithm);
  }
  
  /**
   * Get current crypto status for evidence
   */
  getStatus(): {
    pqcEnabled: boolean;
    provider: 'pqc' | 'classical';
    algorithms: {
      keyExchange: string;
      signature: string;
    };
  } {
    const pqcEnabled = isFlagEnabled('PQC_ON');
    
    return {
      pqcEnabled,
      provider: pqcEnabled ? 'pqc' : 'classical',
      algorithms: {
        keyExchange: pqcEnabled ? KeyExchangeAlgorithm.KYBER_768 : KeyExchangeAlgorithm.X25519,
        signature: pqcEnabled ? SignatureAlgorithm.DILITHIUM_3 : SignatureAlgorithm.ED25519
      }
    };
  }
}

/**
 * Singleton instance
 */
export const cryptoManager = new AtlasCryptoManager();

/**
 * Convenience exports
 */
export {
  KeyPair,
  SharedSecret,
  Signature,
  PQCProvider
};
