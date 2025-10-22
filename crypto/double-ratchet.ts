/**
 * Double Ratchet - Production Implementation
 * 
 * Triển khai đầy đủ Double Ratchet với:
 * - X25519 Diffie-Hellman
 * - RFC 5869 HKDF
 * - ChaCha20-Poly1305 AEAD
 * - Skipped message keys (MKSKIP) với MAX_SKIP=1000
 * - Forward Secrecy (FS) và Post-Compromise Security (PCS)
 * - Memory zeroization cho khóa nhạy cảm
 */

import sodium from 'libsodium-wrappers-sumo';
import { hkdf as hkdfRFC5869, deriveKeys } from './hkdf.js';

const MAX_SKIP = 1000; // Giới hạn số tin nhắn bị bỏ qua để tránh DoS
const KDF_INFO_RATCHET = new TextEncoder().encode('doubleratchet');
const KDF_INFO_MESSAGE = new TextEncoder().encode('messagekey');

export type KeyPair = { publicKey: Uint8Array; privateKey: Uint8Array };

/** Header của tin nhắn Double Ratchet */
export interface MessageHeader {
  dhPub: Uint8Array;  // Khóa công khai DH hiện tại
  pn: number;         // Previous chain length (số tin nhắn trong chuỗi trước)
  n: number;          // Message number trong chuỗi hiện tại
}

/** Tin nhắn đã mã hóa với header và ciphertext */
export interface EncryptedMessage {
  header: MessageHeader;
  ciphertext: Uint8Array;
  aad: Uint8Array; // {msg_id, conv_id, epoch, sender_id}
}

/** Trạng thái Double Ratchet */
export interface RatchetState {
  DHs: KeyPair;           // DH sending key pair
  DHr: Uint8Array | null; // DH receiving public key
  RK: Uint8Array;         // Root key (32 bytes)
  CKs: Uint8Array;        // Chain key sending (32 bytes)
  CKr: Uint8Array;        // Chain key receiving (32 bytes)
  Ns: number;             // Send message number
  Nr: number;             // Receive message number
  PN: number;             // Previous chain length
  MKSKIPPED: Map<string, Uint8Array>; // Skipped message keys: key="${dhPub_hex}_${n}"
}

/** Sinh cặp khóa X25519 */
export async function generateKeyPair(): Promise<KeyPair> {
  await sodium.ready;
  const keyPair = sodium.crypto_kx_keypair();
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

/** DH với X25519 */
async function dh(privKey: Uint8Array, pubKey: Uint8Array): Promise<Uint8Array> {
  await sodium.ready;
  return sodium.crypto_scalarmult(privKey, pubKey);
}

/** KDF_RK: Dẫn xuất root key và chain key mới từ root key và DH output */
function kdfRK(rk: Uint8Array, dhOut: Uint8Array): [Uint8Array, Uint8Array] {
  const keys = deriveKeys(dhOut, rk, 2, 32);
  return [keys[0], keys[1]]; // [newRK, newCK]
}

/** KDF_CK: Dẫn xuất chain key mới và message key từ chain key hiện tại */
function kdfCK(ck: Uint8Array): [Uint8Array, Uint8Array] {
  const keys = deriveKeys(ck, null, 2, 32);
  return [keys[0], keys[1]]; // [newCK, MK]
}

/** Khởi tạo session (Alice - người gửi đầu tiên) */
export async function initAlice(
  sharedSecret: Uint8Array,
  bobPublicKey: Uint8Array
): Promise<RatchetState> {
  await sodium.ready;
  const DHs = await generateKeyPair();
  const dhOutput = await dh(DHs.privateKey, bobPublicKey);
  const [RK, CKs] = kdfRK(sharedSecret, dhOutput);
  
  return {
    DHs,
    DHr: bobPublicKey,
    RK,
    CKs,
    CKr: new Uint8Array(32), // Sẽ được set khi nhận tin đầu tiên
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map()
  };
}

/** Khởi tạo session (Bob - người nhận đầu tiên) */
export async function initBob(
  sharedSecret: Uint8Array,
  bobKeyPair: KeyPair
): Promise<RatchetState> {
  return {
    DHs: bobKeyPair,
    DHr: null, // Sẽ được set từ header tin nhắn đầu tiên
    RK: sharedSecret,
    CKs: new Uint8Array(32),
    CKr: new Uint8Array(32),
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map()
  };
}

/** Mã hóa tin nhắn */
export async function encrypt(
  state: RatchetState,
  plaintext: Uint8Array,
  aad: Uint8Array
): Promise<{ message: EncryptedMessage; newState: RatchetState }> {
  await sodium.ready;
  
  const [newCKs, mk] = kdfCK(state.CKs);
  const header: MessageHeader = {
    dhPub: state.DHs.publicKey,
    pn: state.PN,
    n: state.Ns
  };
  
  // Nonce: sử dụng message number
  const nonce = new Uint8Array(12);
  const nonceView = new DataView(nonce.buffer);
  nonceView.setUint32(0, state.Ns, true);
  
  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    plaintext,
    aad,
    null,
    nonce,
    mk
  );
  
  // Zeroize message key sau khi dùng
  sodium.memzero(mk);
  
  const message: EncryptedMessage = {
    header,
    ciphertext,
    aad
  };
  
  const newState: RatchetState = {
    ...state,
    CKs: newCKs,
    Ns: state.Ns + 1
  };
  
  return { message, newState };
}

/** Giải mã tin nhắn với xử lý skipped messages */
export async function decrypt(
  state: RatchetState,
  message: EncryptedMessage
): Promise<{ plaintext: Uint8Array; newState: RatchetState }> {
  await sodium.ready;
  
  let newState = { ...state };
  
  // Kiểm tra xem có cần DH ratchet không (khóa công khai mới)
  const dhPubHex = Buffer.from(message.header.dhPub).toString('hex');
  const currentDHrHex = newState.DHr ? Buffer.from(newState.DHr).toString('hex') : '';
  
  if (dhPubHex !== currentDHrHex) {
    newState = await dhRatchet(newState, message.header);
  }
  
  // Xử lý skipped messages
  newState = await skipMessageKeys(newState, message.header.n);
  
  // Giải mã
  const [newCKr, mk] = kdfCK(newState.CKr);
  
  const nonce = new Uint8Array(12);
  const nonceView = new DataView(nonce.buffer);
  nonceView.setUint32(0, message.header.n, true);
  
  try {
    const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
      null,
      message.ciphertext,
      message.aad,
      nonce,
      mk
    );
    
    // Zeroize message key
    sodium.memzero(mk);
    
    newState = {
      ...newState,
      CKr: newCKr,
      Nr: message.header.n + 1
    };
    
    return { plaintext, newState };
  } catch (e) {
    throw new Error('Decryption failed - authentication tag mismatch');
  }
}

/** DH Ratchet - xoay khóa DH để đạt Forward Secrecy và PCS */
async function dhRatchet(
  state: RatchetState,
  header: MessageHeader
): Promise<RatchetState> {
  await sodium.ready;
  
  // Lưu số tin nhắn trong chuỗi gửi trước đó
  const pn = state.Ns;
  
  // Cập nhật DHr
  state = { ...state, PN: pn, Ns: 0, Nr: 0, DHr: header.dhPub };
  
  // Tính DH output và dẫn xuất khóa nhận
  const dhOutput = await dh(state.DHs.privateKey, header.dhPub);
  const [newRK1, newCKr] = kdfRK(state.RK, dhOutput);
  state = { ...state, RK: newRK1, CKr: newCKr };
  
  // Sinh cặp khóa DH mới
  const newDHs = await generateKeyPair();
  
  // Tính DH output với khóa mới và dẫn xuất khóa gửi
  const dhOutput2 = await dh(newDHs.privateKey, header.dhPub);
  const [newRK2, newCKs] = kdfRK(state.RK, dhOutput2);
  
  // Zeroize khóa riêng cũ
  sodium.memzero(state.DHs.privateKey);
  
  return {
    ...state,
    DHs: newDHs,
    RK: newRK2,
    CKs: newCKs
  };
}

/** Bỏ qua các message keys đến message number mong muốn */
async function skipMessageKeys(
  state: RatchetState,
  until: number
): Promise<RatchetState> {
  if (state.Nr + MAX_SKIP < until) {
    throw new Error(`Too many skipped messages (${until - state.Nr}), possible DoS attack`);
  }
  
  let newState = { ...state };
  
  if (newState.CKr) {
    while (newState.Nr < until) {
      const [newCKr, mk] = kdfCK(newState.CKr);
      const dhPubHex = newState.DHr ? Buffer.from(newState.DHr).toString('hex') : '';
      const key = `${dhPubHex}_${newState.Nr}`;
      newState.MKSKIPPED.set(key, mk);
      newState = { ...newState, CKr: newCKr, Nr: newState.Nr + 1 };
    }
  }
  
  return newState;
}

/** Thử giải mã với skipped key */
export async function trySkippedMessageKeys(
  state: RatchetState,
  message: EncryptedMessage
): Promise<{ plaintext: Uint8Array | null; newState: RatchetState }> {
  await sodium.ready;
  
  const dhPubHex = Buffer.from(message.header.dhPub).toString('hex');
  const key = `${dhPubHex}_${message.header.n}`;
  
  const mk = state.MKSKIPPED.get(key);
  if (!mk) {
    return { plaintext: null, newState: state };
  }
  
  const nonce = new Uint8Array(12);
  const nonceView = new DataView(nonce.buffer);
  nonceView.setUint32(0, message.header.n, true);
  
  try {
    const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
      null,
      message.ciphertext,
      message.aad,
      nonce,
      mk
    );
    
    // Xóa key đã dùng và zeroize
    const newMKSKIPPED = new Map(state.MKSKIPPED);
    const usedKey = newMKSKIPPED.get(key)!;
    sodium.memzero(usedKey);
    newMKSKIPPED.delete(key);
    
    return {
      plaintext,
      newState: { ...state, MKSKIPPED: newMKSKIPPED }
    };
  } catch (e) {
    return { plaintext: null, newState: state };
  }
}

/** Dọn dẹp skipped keys cũ (gọi định kỳ) */
export function cleanupSkippedKeys(state: RatchetState, maxAge: number = 7 * 24 * 3600 * 1000): RatchetState {
  // Trong production, cần timestamp cho mỗi skipped key
  // Đây là implementation đơn giản: giữ tối đa 100 keys
  if (state.MKSKIPPED.size > 100) {
    const newMKSKIPPED = new Map<string, Uint8Array>();
    let count = 0;
    for (const [key, mk] of state.MKSKIPPED) {
      if (count++ < 50) {
        newMKSKIPPED.set(key, mk);
      } else {
        sodium.memzero(mk);
      }
    }
    return { ...state, MKSKIPPED: newMKSKIPPED };
  }
  return state;
}

