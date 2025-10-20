// Atlas Security-Core: Double Ratchet Implementation
// Triển khai E2EE 1-1 messaging với Forward Secrecy + Post-Compromise Security
// Dựa trên Signal Protocol, sử dụng Web Crypto API + libsodium

import sodium from 'libsodium-wrappers';
import type { EncryptedMessage, PublicKeyJWK } from './types.js';
import { CryptoError } from './types.js';

/**
 * Chain key cho symmetric ratchet (derive sending/receiving keys)
 */
interface ChainKey {
  key: Uint8Array;      // 32 bytes chain key
  index: number;        // Message số thứ tự
}

/**
 * Ratchet state lưu trữ toàn bộ trạng thái session
 */
export interface RatchetState {
  // DH Ratchet (asymmetric)
  dhSend: Uint8Array;        // Our current DH private key (32 bytes)
  dhRecv: Uint8Array | null; // Their current DH public key (32 bytes)
  
  // Root chain (derive new chain keys khi DH ratchet)
  rootKey: Uint8Array;       // 32 bytes root key
  
  // Sending chain (symmetric ratchet)
  sendChain: ChainKey;
  
  // Receiving chain (symmetric ratchet)
  recvChain: ChainKey;
  
  // Replay protection
  receivedMessages: Set<number>; // Track message indices đã xử lý
  
  // Metadata
  sessionId: string;         // Unique session identifier
  createdAt: number;         // Unix timestamp
}

/**
 * Khởi tạo session với Alice (người khởi tạo)
 * @param bobPublicKey - Bob's initial X25519 public key
 * @param sharedSecret - Pre-shared secret từ X3DH handshake (32 bytes)
 */
export async function initAlice(
  bobPublicKey: Uint8Array,
  sharedSecret: Uint8Array
): Promise<RatchetState> {
  await sodium.ready;
  
  // Tạo DH key pair cho Alice
  const dhKeyPair = sodium.crypto_box_keypair();
  
  // Derive root key và sending chain từ shared secret
  const rootKey = await deriveKey(sharedSecret, new Uint8Array(32), 'root-init');
  const sendingKey = await deriveKey(sharedSecret, new Uint8Array(32), 'sending-init');
  
  return {
    dhSend: dhKeyPair.privateKey,
    dhRecv: bobPublicKey,
    rootKey,
    sendChain: { key: sendingKey, index: 0 },
    recvChain: { key: new Uint8Array(32), index: 0 },
    receivedMessages: new Set(),
    sessionId: sodium.to_hex(sodium.randombytes_buf(16)),
    createdAt: Date.now()
  };
}

/**
 * Khởi tạo session với Bob (người nhận)
 * @param dhPrivateKey - Bob's X25519 private key
 * @param sharedSecret - Pre-shared secret từ X3DH handshake
 */
export async function initBob(
  dhPrivateKey: Uint8Array,
  sharedSecret: Uint8Array
): Promise<RatchetState> {
  await sodium.ready;
  
  const rootKey = await deriveKey(sharedSecret, new Uint8Array(32), 'root-init');
  const receivingKey = await deriveKey(sharedSecret, new Uint8Array(32), 'sending-init');
  
  return {
    dhSend: dhPrivateKey,
    dhRecv: null, // Chưa nhận Alice's public key
    rootKey,
    sendChain: { key: new Uint8Array(32), index: 0 },
    recvChain: { key: receivingKey, index: 0 },
    receivedMessages: new Set(),
    sessionId: sodium.to_hex(sodium.randombytes_buf(16)),
    createdAt: Date.now()
  };
}

/**
 * Mã hóa plaintext message
 * @param state - Current ratchet state
 * @param plaintext - Message cần mã hóa (UTF-8 string)
 * @returns Encrypted message + updated state
 */
export async function encrypt(
  state: RatchetState,
  plaintext: string
): Promise<{ encrypted: EncryptedMessage; newState: RatchetState }> {
  await sodium.ready;
  
  // Derive message key từ sending chain
  const messageKey = await deriveKey(state.sendChain.key, new Uint8Array(32), 'message-key');
  const newChainKey = await deriveKey(state.sendChain.key, new Uint8Array(32), 'chain-key');
  
  // Mã hóa với ChaCha20-Poly1305 (libsodium default AEAD)
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
  const plaintextBytes = sodium.from_string(plaintext);
  
  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    plaintextBytes,
    null, // No additional data
    null, // Secret nonce (null = use provided nonce)
    nonce,
    messageKey
  );
  
  // Update sending chain
  const newState: RatchetState = {
    ...state,
    sendChain: {
      key: newChainKey,
      index: state.sendChain.index + 1
    }
  };
  
  // Xóa message key khỏi memory (security best practice)
  sodium.memzero(messageKey);
  
  return {
    encrypted: {
      ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.URLSAFE_NO_PADDING),
      nonce: sodium.to_base64(nonce, sodium.base64_variants.URLSAFE_NO_PADDING),
      sequence: state.sendChain.index,
      timestamp: new Date().toISOString()
    },
    newState
  };
}

/**
 * Giải mã encrypted message
 * @param state - Current ratchet state
 * @param encrypted - Encrypted message cần giải mã
 * @returns Decrypted plaintext + updated state
 */
export async function decrypt(
  state: RatchetState,
  encrypted: EncryptedMessage
): Promise<{ plaintext: string; newState: RatchetState }> {
  await sodium.ready;
  
  // Replay protection: kiểm tra sequence number
  if (state.receivedMessages.has(encrypted.sequence)) {
    throw new CryptoError('Message replayed', 'NONCE_REUSED', { sequence: encrypted.sequence });
  }
  
  // Derive message key từ receiving chain
  const messageKey = await deriveKey(state.recvChain.key, new Uint8Array(32), 'message-key');
  const newChainKey = await deriveKey(state.recvChain.key, new Uint8Array(32), 'chain-key');
  
  try {
    // Giải mã với ChaCha20-Poly1305
    const ciphertext = sodium.from_base64(encrypted.ciphertext, sodium.base64_variants.URLSAFE_NO_PADDING);
    const nonce = sodium.from_base64(encrypted.nonce, sodium.base64_variants.URLSAFE_NO_PADDING);
    
    const plaintextBytes = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
      null, // Secret nonce
      ciphertext,
      null, // No additional data
      nonce,
      messageKey
    );
    
    // Update receiving chain và replay protection
    const newState: RatchetState = {
      ...state,
      recvChain: {
        key: newChainKey,
        index: state.recvChain.index + 1
      },
      receivedMessages: new Set([...state.receivedMessages, encrypted.sequence])
    };
    
    // Xóa message key
    sodium.memzero(messageKey);
    
    return {
      plaintext: sodium.to_string(plaintextBytes),
      newState
    };
  } catch (err) {
    sodium.memzero(messageKey);
    throw new CryptoError('Decryption failed', 'DECRYPTION_FAILED', err);
  }
}

/**
 * Thực hiện DH ratchet step khi nhận public key mới từ peer
 * @param state - Current state
 * @param theirPublicKey - Peer's new DH public key
 */
export async function ratchetStep(
  state: RatchetState,
  theirPublicKey: Uint8Array
): Promise<RatchetState> {
  await sodium.ready;
  
  // Tạo DH key pair mới
  const newKeyPair = sodium.crypto_box_keypair();
  
  // Tính DH shared secret với peer's public key
  const dhOutput = sodium.crypto_scalarmult(state.dhSend, theirPublicKey);
  
  // Derive new root key và receiving chain key
  const newRootKey = await deriveKey(state.rootKey, dhOutput, 'root-ratchet');
  const newRecvKey = await deriveKey(newRootKey, new Uint8Array(32), 'recv-chain');
  
  // Derive new sending chain key
  const dhOutput2 = sodium.crypto_scalarmult(newKeyPair.privateKey, theirPublicKey);
  const newRootKey2 = await deriveKey(newRootKey, dhOutput2, 'root-ratchet-2');
  const newSendKey = await deriveKey(newRootKey2, new Uint8Array(32), 'send-chain');
  
  return {
    ...state,
    dhSend: newKeyPair.privateKey,
    dhRecv: theirPublicKey,
    rootKey: newRootKey2,
    sendChain: { key: newSendKey, index: 0 },
    recvChain: { key: newRecvKey, index: 0 }
  };
}

/**
 * Export public key hiện tại (để gửi cho peer)
 */
export function exportPublicKey(state: RatchetState): PublicKeyJWK {
  const publicKey = sodium.crypto_scalarmult_base(state.dhSend);
  
  return {
    kty: 'OKP',
    crv: 'X25519',
    x: sodium.to_base64(publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
    use: 'enc',
    kid: state.sessionId
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Derive key sử dụng HKDF-SHA256 (Web Crypto API)
 * @param ikm - Input key material
 * @param salt - Salt value
 * @param info - Context information
 */
async function deriveKey(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: string
): Promise<Uint8Array> {
  // Import IKM as raw key
  const key = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  // Derive 32 bytes using HKDF-SHA256
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: new TextEncoder().encode(info)
    },
    key,
    256 // 32 bytes = 256 bits
  );
  
  return new Uint8Array(derivedBits);
}
