import type { EncryptedMessage, PublicKeyJWK } from './types.js';
/**
 * Chain key cho symmetric ratchet (derive sending/receiving keys)
 */
interface ChainKey {
    key: Uint8Array;
    index: number;
}
/**
 * Ratchet state lưu trữ toàn bộ trạng thái session
 */
export interface RatchetState {
    dhSend: Uint8Array;
    dhRecv: Uint8Array | null;
    rootKey: Uint8Array;
    sendChain: ChainKey;
    recvChain: ChainKey;
    receivedMessages: Set<number>;
    skippedKeys: Map<string, Uint8Array>;
    sessionId: string;
    createdAt: number;
}
/**
 * Khởi tạo session với Alice (người khởi tạo)
 * @param bobPublicKey - Bob's initial X25519 public key
 * @param sharedSecret - Pre-shared secret từ X3DH handshake (32 bytes)
 */
export declare function initAlice(bobPublicKey: Uint8Array, sharedSecret: Uint8Array): Promise<RatchetState>;
/**
 * Khởi tạo session với Bob (người nhận)
 * @param dhPrivateKey - Bob's X25519 private key
 * @param sharedSecret - Pre-shared secret từ X3DH handshake
 */
export declare function initBob(dhPrivateKey: Uint8Array, sharedSecret: Uint8Array): Promise<RatchetState>;
/**
 * Mã hóa plaintext message
 * @param state - Current ratchet state
 * @param plaintext - Message cần mã hóa (UTF-8 string)
 * @returns Encrypted message + updated state
 */
export declare function encrypt(state: RatchetState, plaintext: string): Promise<{
    encrypted: EncryptedMessage;
    newState: RatchetState;
}>;
/**
 * Giải mã encrypted message với hỗ trợ out-of-order delivery
 * @param state - Current ratchet state
 * @param encrypted - Encrypted message cần giải mã
 * @returns Decrypted plaintext + updated state
 */
export declare function decrypt(state: RatchetState, encrypted: EncryptedMessage): Promise<{
    plaintext: string;
    newState: RatchetState;
}>;
/**
 * Thực hiện DH ratchet step khi nhận public key mới từ peer
 * @param state - Current state
 * @param theirPublicKey - Peer's new DH public key
 */
export declare function ratchetStep(state: RatchetState, theirPublicKey: Uint8Array): Promise<RatchetState>;
/**
 * Export public key hiện tại (để gửi cho peer)
 */
export declare function exportPublicKey(state: RatchetState): PublicKeyJWK;
export {};
//# sourceMappingURL=double-ratchet.d.ts.map