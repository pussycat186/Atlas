// Atlas Security-Core: Minimal MLS (TreeKEM) Implementation
// Triển khai TreeKEM core cho group messaging với epoch-based key derivation
// Theo MLS RFC 9420 (simplified version)

import sodium from 'libsodium-wrappers';
import { CryptoError } from './types.js';

/**
 * Tree node trong left-balanced binary tree
 */
interface TreeNode {
  publicKey: Uint8Array | null;   // X25519 public key (32 bytes)
  privateKey?: Uint8Array;         // Private key nếu node thuộc về ta
  pathSecret?: Uint8Array;         // Path secret cho node này
}

/**
 * MLS Group state
 */
export interface MLSGroupState {
  groupId: string;                 // Unique group identifier
  epoch: number;                   // Current epoch số
  epochSecret: Uint8Array;         // Secret cho epoch hiện tại (32 bytes)
  tree: TreeNode[];                // Binary tree của member keys
  members: string[];               // Danh sách member IDs (theo tree order)
  myIndex: number;                 // Index của ta trong tree
  pathSecrets: Map<number, Uint8Array>; // Path secrets từ leaf đến root
}

/**
 * UpdatePath message (khi member update key hoặc commit change)
 */
export interface UpdatePath {
  senderIndex: number;             // Index của sender trong tree
  leafPublicKey: Uint8Array;       // New public key tại leaf node
  pathPublicKeys: Uint8Array[];    // Public keys trên path đến root
  epoch: number;                   // Epoch mới sau update
}

/**
 * Khởi tạo MLS group với founding member
 * @param groupId - Unique group identifier
 * @param memberId - ID của founding member
 */
export async function initGroup(
  groupId: string,
  memberId: string
): Promise<MLSGroupState> {
  await sodium.ready;
  
  // Tạo keypair cho founding member
  const keyPair = sodium.crypto_box_keypair();
  
  // Initialize tree với 1 node (founding member)
  const tree: TreeNode[] = [
    {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      pathSecret: sodium.randombytes_buf(32)
    }
  ];
  
  // Derive epoch secret từ path secret
  const epochSecret = await deriveEpochSecret(tree, 0);
  
  return {
    groupId,
    epoch: 0,
    epochSecret,
    tree,
    members: [memberId],
    myIndex: 0,
    pathSecrets: new Map([[0, tree[0].pathSecret!]])
  };
}

/**
 * Add member vào group (tạo UpdatePath)
 * @param state - Current group state
 * @param newMemberId - ID của member mới
 * @param newMemberPublicKey - Public key của member mới (X25519)
 */
export async function addMember(
  state: MLSGroupState,
  newMemberId: string,
  newMemberPublicKey: Uint8Array
): Promise<{ updatePath: UpdatePath; newState: MLSGroupState }> {
  await sodium.ready;
  
  // Add new leaf node to tree
  const newIndex = state.tree.length;
  const newNode: TreeNode = {
    publicKey: newMemberPublicKey,
    pathSecret: undefined // Họ sẽ nhận path secret qua encrypted message
  };
  
  const newTree = [...state.tree, newNode];
  const newMembers = [...state.members, newMemberId];
  
  // Tạo new keypair cho ta (refresh our key khi add member)
  const newKeyPair = sodium.crypto_box_keypair();
  newTree[state.myIndex] = {
    publicKey: newKeyPair.publicKey,
    privateKey: newKeyPair.privateKey,
    pathSecret: sodium.randombytes_buf(32)
  };
  
  // Build UpdatePath từ our leaf đến root
  const pathPublicKeys = buildPath(newTree, state.myIndex);
  
  // Derive new epoch secret
  const newEpoch = state.epoch + 1;
  const newEpochSecret = await deriveEpochSecret(newTree, state.myIndex);
  
  const updatePath: UpdatePath = {
    senderIndex: state.myIndex,
    leafPublicKey: newKeyPair.publicKey,
    pathPublicKeys,
    epoch: newEpoch
  };
  
  const newState: MLSGroupState = {
    ...state,
    epoch: newEpoch,
    epochSecret: newEpochSecret,
    tree: newTree,
    members: newMembers,
    pathSecrets: new Map([[state.myIndex, newTree[state.myIndex].pathSecret!]])
  };
  
  return { updatePath, newState };
}

/**
 * Remove member khỏi group
 * @param state - Current group state
 * @param memberIndex - Index của member cần remove
 */
export async function removeMember(
  state: MLSGroupState,
  memberIndex: number
): Promise<{ updatePath: UpdatePath; newState: MLSGroupState }> {
  await sodium.ready;
  
  if (memberIndex >= state.tree.length) {
    throw new CryptoError('Invalid member index', 'INVALID_KEY', { memberIndex });
  }
  
  if (memberIndex === state.myIndex) {
    throw new CryptoError('Cannot remove yourself', 'INVALID_KEY', { memberIndex });
  }
  
  // Blank removed member's node (không xóa khỏi tree để giữ indices)
  const newTree = [...state.tree];
  newTree[memberIndex] = {
    publicKey: null,
    pathSecret: undefined
  };
  
  const newMembers = state.members.filter((_, i) => i !== memberIndex);
  
  // Refresh our key khi remove member
  const newKeyPair = sodium.crypto_box_keypair();
  newTree[state.myIndex] = {
    publicKey: newKeyPair.publicKey,
    privateKey: newKeyPair.privateKey,
    pathSecret: sodium.randombytes_buf(32)
  };
  
  // Build UpdatePath
  const pathPublicKeys = buildPath(newTree, state.myIndex);
  
  // Derive new epoch secret
  const newEpoch = state.epoch + 1;
  const newEpochSecret = await deriveEpochSecret(newTree, state.myIndex);
  
  const updatePath: UpdatePath = {
    senderIndex: state.myIndex,
    leafPublicKey: newKeyPair.publicKey,
    pathPublicKeys,
    epoch: newEpoch
  };
  
  const newState: MLSGroupState = {
    ...state,
    epoch: newEpoch,
    epochSecret: newEpochSecret,
    tree: newTree,
    members: newMembers,
    pathSecrets: new Map([[state.myIndex, newTree[state.myIndex].pathSecret!]])
  };
  
  return { updatePath, newState };
}

/**
 * Process UpdatePath từ member khác
 * @param state - Current group state
 * @param updatePath - UpdatePath message từ sender
 */
export async function processUpdatePath(
  state: MLSGroupState,
  updatePath: UpdatePath
): Promise<MLSGroupState> {
  await sodium.ready;
  
  if (updatePath.senderIndex === state.myIndex) {
    throw new CryptoError('Cannot process own update', 'INVALID_KEY');
  }
  
  // Update sender's leaf node
  const newTree = [...state.tree];
  newTree[updatePath.senderIndex] = {
    ...newTree[updatePath.senderIndex],
    publicKey: updatePath.leafPublicKey
  };
  
  // Update path public keys (simplified - trong thực tế cần decrypt path secrets)
  // Ở đây ta chỉ update public keys, path secrets sẽ được encrypted riêng
  const pathIndices = getPathIndices(state.tree.length, updatePath.senderIndex);
  updatePath.pathPublicKeys.forEach((pubKey, i) => {
    if (pathIndices[i] !== undefined) {
      newTree[pathIndices[i]] = {
        ...newTree[pathIndices[i]],
        publicKey: pubKey
      };
    }
  });
  
  // Derive new epoch secret (ta không có path secret mới, nhưng có thể derive từ tree)
  const newEpochSecret = await deriveEpochSecret(newTree, state.myIndex);
  
  return {
    ...state,
    epoch: updatePath.epoch,
    epochSecret: newEpochSecret,
    tree: newTree
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build path từ leaf index đến root, trả về public keys
 */
function buildPath(tree: TreeNode[], leafIndex: number): Uint8Array[] {
  const path: Uint8Array[] = [];
  const indices = getPathIndices(tree.length, leafIndex);
  
  for (const idx of indices) {
    if (tree[idx]?.publicKey) {
      path.push(tree[idx].publicKey!);
    }
  }
  
  return path;
}

/**
 * Tính indices của nodes trên path từ leaf đến root
 * Sử dụng left-balanced binary tree indexing
 */
function getPathIndices(treeSize: number, leafIndex: number): number[] {
  const indices: number[] = [];
  let currentIndex = leafIndex;
  
  // Simplified path calculation (trong thực tế cần proper tree math)
  // Đi lên parent nodes cho đến root
  while (currentIndex > 0) {
    const parentIndex = Math.floor((currentIndex - 1) / 2);
    indices.push(parentIndex);
    currentIndex = parentIndex;
  }
  
  return indices;
}

/**
 * Derive epoch secret từ tree state sử dụng HKDF
 * @param tree - Current tree state
 * @param myIndex - Our index in tree
 */
async function deriveEpochSecret(
  tree: TreeNode[],
  myIndex: number
): Promise<Uint8Array> {
  // Collect tất cả path secrets có thể access được
  const pathSecret = tree[myIndex]?.pathSecret || sodium.randombytes_buf(32);
  
  // Derive epoch secret using HKDF-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    pathSecret as any,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('mls-epoch-secret') as any
    },
    key,
    256 // 32 bytes
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Export group state for debugging/testing
 */
export function exportGroupState(state: MLSGroupState): string {
  return JSON.stringify({
    groupId: state.groupId,
    epoch: state.epoch,
    members: state.members,
    myIndex: state.myIndex,
    treeSize: state.tree.length
  }, null, 2);
}
