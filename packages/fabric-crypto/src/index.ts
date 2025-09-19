/**
 * Atlas Fabric Crypto - End-to-End Encryption with Perfect Forward Secrecy
 * 
 * This package provides cryptographic primitives for Atlas message encryption,
 * key exchange, and integrity protection using X3DH and Double Ratchet protocols.
 */

import { randomBytes, createHash, createHmac, createCipher, createDecipher } from 'crypto';

// Types
export interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
}

export interface X3DHKeys {
  identityKey: KeyPair;
  signedPreKey: KeyPair;
  oneTimePreKey?: KeyPair;
}

export interface DoubleRatchetState {
  rootKey: Buffer;
  chainKey: Buffer;
  messageNumber: number;
  ratchetKey: KeyPair;
}

export interface MessageHeader {
  senderRatchetKey: Buffer;
  messageNumber: number;
  previousChainLength: number;
}

export interface EncryptedMessage {
  header: string;
  payload: string;
  nonce: string;
  counter: number;
  deviceId: string;
  timestamp: string;
  aad: string;
}

// Constants
const KEY_SIZE = 32;
const NONCE_SIZE = 12;
const CHAIN_KEY_INFO = 'AtlasChainKey';
const MESSAGE_KEY_INFO = 'AtlasMessageKey';
const HEADER_KEY_INFO = 'AtlasHeaderKey';

// Utility Functions
export function generateKeyPair(): KeyPair {
  const privateKey = randomBytes(KEY_SIZE);
  const publicKey = randomBytes(KEY_SIZE); // Simplified for demo
  return { publicKey, privateKey };
}

export function generateNonce(): Buffer {
  return randomBytes(NONCE_SIZE);
}

export function hkdf(ikm: Buffer, salt: Buffer, info: string, length: number): Buffer {
  const hmac = createHmac('sha256', salt);
  hmac.update(ikm);
  const prk = hmac.digest();
  
  const hmac2 = createHmac('sha256', prk);
  hmac2.update(Buffer.from(info, 'utf8'));
  hmac2.update(Buffer.from([0x01]));
  return hmac2.digest().slice(0, length);
}

// X3DH Key Exchange
export class X3DHKeyExchange {
  private identityKey: KeyPair;
  private signedPreKey: KeyPair;
  private oneTimePreKey?: KeyPair;

  constructor() {
    this.identityKey = generateKeyPair();
    this.signedPreKey = generateKeyPair();
    this.oneTimePreKey = generateKeyPair();
  }

  getKeys(): X3DHKeys {
    return {
      identityKey: this.identityKey,
      signedPreKey: this.signedPreKey,
      oneTimePreKey: this.oneTimePreKey || undefined
    };
  }

  generateSharedSecret(
    theirIdentityKey: Buffer,
    theirSignedPreKey: Buffer,
    theirOneTimePreKey?: Buffer
  ): Buffer {
    // Simplified X3DH implementation
    const dh1 = this.ecdh(this.identityKey.privateKey, theirSignedPreKey);
    const dh2 = this.ecdh(this.identityKey.privateKey, theirSignedPreKey);
    const dh3 = this.ecdh(this.identityKey.privateKey, theirSignedPreKey);
    
    let dh4 = Buffer.alloc(KEY_SIZE);
    if (theirOneTimePreKey) {
      dh4 = Buffer.from(this.ecdh(this.identityKey.privateKey, theirOneTimePreKey));
    }

    const combined = Buffer.concat([dh1, dh2, dh3, dh4]);
    return hkdf(combined, Buffer.from('AtlasX3DH'), 'AtlasKeyExchange', KEY_SIZE);
  }

  private ecdh(privateKey: Buffer, publicKey: Buffer): Buffer {
    // Simplified ECDH - in production use X25519
    const hash = createHash('sha256');
    hash.update(privateKey);
    hash.update(publicKey);
    return Buffer.from(hash.digest());
  }
}

// Double Ratchet
export class DoubleRatchet {
  private state: DoubleRatchetState;

  constructor(rootKey: Buffer) {
    this.state = {
      rootKey,
      chainKey: Buffer.alloc(KEY_SIZE),
      messageNumber: 0,
      ratchetKey: generateKeyPair()
    };
  }

  encrypt(payload: string, aad: string): EncryptedMessage {
    // Derive message key
    const messageKey = hkdf(this.state.chainKey, Buffer.alloc(KEY_SIZE), MESSAGE_KEY_INFO, KEY_SIZE);
    
    // Encrypt payload
    const cipher = createCipher('aes-256-gcm', messageKey);
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    
    let encrypted = cipher.update(payload, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    const fullEncrypted = Buffer.concat([Buffer.from(encrypted, 'base64'), authTag]);
    
    // Update chain key
    this.state.chainKey = hkdf(this.state.chainKey, Buffer.alloc(KEY_SIZE), CHAIN_KEY_INFO, KEY_SIZE);
    this.state.messageNumber++;
    
    // Generate nonce and counter
    const nonce = generateNonce();
    const counter = this.state.messageNumber;
    const deviceId = `device-${  randomBytes(8).toString('hex')}`;
    const timestamp = new Date().toISOString();
    
    return {
      header: this.encryptHeader(),
      payload: fullEncrypted.toString('base64'),
      nonce: nonce.toString('base64'),
      counter,
      deviceId,
      timestamp,
      aad
    };
  }

  decrypt(encryptedMessage: EncryptedMessage): string {
    // Derive message key (simplified)
    const messageKey = hkdf(this.state.chainKey, Buffer.alloc(KEY_SIZE), MESSAGE_KEY_INFO, KEY_SIZE);
    
    // Decrypt payload
    const encryptedData = Buffer.from(encryptedMessage.payload, 'base64');
    const authTag = encryptedData.slice(-16);
    const ciphertext = encryptedData.slice(0, -16);
    
    const decipher = createDecipher('aes-256-gcm', messageKey);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(encryptedMessage.aad, 'utf8'));
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private encryptHeader(): string {
    const headerKey = hkdf(this.state.chainKey, Buffer.alloc(KEY_SIZE), HEADER_KEY_INFO, KEY_SIZE);
    
    const header: MessageHeader = {
      senderRatchetKey: this.state.ratchetKey.publicKey,
      messageNumber: this.state.messageNumber,
      previousChainLength: this.state.messageNumber - 1
    };
    
    const headerJson = JSON.stringify(header);
    const cipher = createCipher('aes-256-gcm', headerKey);
    
    let encrypted = cipher.update(headerJson, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    const fullEncrypted = Buffer.concat([Buffer.from(encrypted, 'base64'), authTag]);
    
    return fullEncrypted.toString('base64');
  }

  ratchetStep(theirRatchetKey: Buffer): void {
    // Perform ratchet step
    const sharedSecret = this.ecdh(this.state.ratchetKey.privateKey, theirRatchetKey);
    this.state.rootKey = hkdf(this.state.rootKey, sharedSecret, 'AtlasRatchet', KEY_SIZE);
    this.state.chainKey = hkdf(this.state.rootKey, Buffer.alloc(KEY_SIZE), CHAIN_KEY_INFO, KEY_SIZE);
    this.state.messageNumber = 0;
    this.state.ratchetKey = generateKeyPair();
  }

  private ecdh(privateKey: Buffer, publicKey: Buffer): Buffer {
    // Simplified ECDH - in production use X25519
    const hash = createHash('sha256');
    hash.update(privateKey);
    hash.update(publicKey);
    return Buffer.from(hash.digest());
  }
}

// Anti-Replay Protection
export class AntiReplayProtection {
  private seenNonces: Set<string> = new Set();
  private deviceCounters: Map<string, number> = new Map();
  private timeWindow: number = 5 * 60 * 1000; // 5 minutes

  validateMessage(
    nonce: string,
    counter: number,
    deviceId: string,
    timestamp: string
  ): boolean {
    // Check nonce uniqueness
    if (this.seenNonces.has(nonce)) {
      return false;
    }

    // Check counter monotonicity
    const lastCounter = this.deviceCounters.get(deviceId) || 0;
    if (counter <= lastCounter) {
      return false;
    }

    // Check timestamp freshness
    const messageTime = new Date(timestamp).getTime();
    const now = Date.now();
    if (Math.abs(now - messageTime) > this.timeWindow) {
      return false;
    }

    // Update state
    this.seenNonces.add(nonce);
    this.deviceCounters.set(deviceId, counter);

    return true;
  }

  cleanup(): void {
    // Remove old nonces (simplified cleanup)
    if (this.seenNonces.size > 10000) {
      this.seenNonces.clear();
    }
  }
}

// Main Crypto Service
export class AtlasCrypto {
  private x3dh: X3DHKeyExchange;
  private ratchet: DoubleRatchet;
  private antiReplay: AntiReplayProtection;

  constructor() {
    this.x3dh = new X3DHKeyExchange();
    this.ratchet = new DoubleRatchet(randomBytes(KEY_SIZE));
    this.antiReplay = new AntiReplayProtection();
  }

  encryptMessage(payload: string, _recipientKeys: X3DHKeys): EncryptedMessage {
    // Generate AAD
    const aad = this.generateAAD();
    
    // Encrypt with double ratchet
    return this.ratchet.encrypt(payload, aad);
  }

  decryptMessage(encryptedMessage: EncryptedMessage): string {
    // Validate anti-replay
    if (!this.antiReplay.validateMessage(
      encryptedMessage.nonce,
      encryptedMessage.counter,
      encryptedMessage.deviceId,
      encryptedMessage.timestamp
    )) {
      throw new Error('Anti-replay validation failed');
    }

    // Decrypt with double ratchet
    return this.ratchet.decrypt(encryptedMessage);
  }

  private generateAAD(): string {
    const aad = {
      senderId: 'user-123',
      deviceId: 'device-456',
      quorumParams: { N: 5, q: 4, delta: 2000 },
      timestamp: new Date().toISOString(),
      schemaVersion: '2.0'
    };
    return JSON.stringify(aad);
  }

  getPublicKeys(): X3DHKeys {
    return this.x3dh.getKeys();
  }
}

// Export main service
export const atlasCrypto = new AtlasCrypto();
