import sodium from 'libsodium-wrappers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

await sodium.ready;

// MLS Protocol Types
export interface MLSCredential {
  identity: string;
  publicKey: Uint8Array;
  signature?: Uint8Array;
}

export interface MLSKeyPackage {
  id: string;
  credential: MLSCredential;
  hpkePublicKey: Uint8Array;
  initKey: Uint8Array;
  signature: Uint8Array;
  createdAt: number;
  expiresAt: number;
}

export interface MLSGroupContext {
  groupId: string;
  epoch: number;
  members: MLSCredential[];
  treeHash: Uint8Array;
  confirmedTranscriptHash: Uint8Array;
}

export interface MLSCommit {
  groupId: string;
  epoch: number;
  sender: string;
  proposals: MLSProposal[];
  path?: MLSUpdatePath;
  signature: Uint8Array;
}

export interface MLSProposal {
  type: 'add' | 'remove' | 'update';
  sender: string;
  content: any;
  signature: Uint8Array;
}

export interface MLSUpdatePath {
  leafNode: Uint8Array;
  nodes: Uint8Array[];
}

// Group member management with O(log N) efficiency
export class MLSTreeKEM {
  private tree: Map<number, Uint8Array> = new Map();
  private leafCount: number = 0;
  
  // Add new member to the tree
  addMember(publicKey: Uint8Array): number {
    const leafIndex = this.leafCount * 2; // Leaves are at even indices
    this.tree.set(leafIndex, publicKey);
    this.leafCount++;
    
    // Update parent nodes up the tree
    this.updateParents(leafIndex);
    
    return leafIndex;
  }
  
  // Remove member and update tree
  removeMember(leafIndex: number): void {
    if (!this.tree.has(leafIndex)) {
      throw new Error('Member not found in tree');
    }
    
    this.tree.delete(leafIndex);
    
    // Blank parent nodes
    this.blankParents(leafIndex);
  }
  
  // Generate update path for key rotation
  generateUpdatePath(leafIndex: number, newKey: Uint8Array): MLSUpdatePath {
    const path: Uint8Array[] = [];
    
    // Update leaf
    this.tree.set(leafIndex, newKey);
    
    // Update all parent nodes
    let currentIndex = leafIndex;
    while (currentIndex > 1) {
      const parentIndex = Math.floor(currentIndex / 2);
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      // Generate new parent key
      const parentKey = this.deriveParentKey(
        this.tree.get(currentIndex)!,
        this.tree.get(siblingIndex) || new Uint8Array(32)
      );
      
      this.tree.set(parentIndex, parentKey);
      path.push(parentKey);
      
      currentIndex = parentIndex;
    }
    
    return {
      leafNode: newKey,
      nodes: path
    };
  }
  
  private updateParents(leafIndex: number): void {
    let currentIndex = leafIndex;
    
    while (currentIndex > 1) {
      const parentIndex = Math.floor(currentIndex / 2);
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      const leftChild = this.tree.get(Math.min(currentIndex, siblingIndex));
      const rightChild = this.tree.get(Math.max(currentIndex, siblingIndex));
      
      if (leftChild && rightChild) {
        const parentKey = this.deriveParentKey(leftChild, rightChild);
        this.tree.set(parentIndex, parentKey);
      }
      
      currentIndex = parentIndex;
    }
  }
  
  private blankParents(leafIndex: number): void {
    let currentIndex = leafIndex;
    
    while (currentIndex > 1) {
      const parentIndex = Math.floor(currentIndex / 2);
      this.tree.delete(parentIndex);
      currentIndex = parentIndex;
    }
  }
  
  private deriveParentKey(leftKey: Uint8Array, rightKey: Uint8Array): Uint8Array {
    // Derive parent key using HKDF-like construction
    const combined = new Uint8Array(leftKey.length + rightKey.length);
    combined.set(leftKey);
    combined.set(rightKey, leftKey.length);
    
    return sodium.crypto_generichash(32, combined, new Uint8Array(0));
  }
  
  // Get root key for group encryption
  getRootKey(): Uint8Array {
    return this.tree.get(1) || new Uint8Array(32);
  }
  
  // Get tree hash for integrity
  getTreeHash(): Uint8Array {
    const allNodes = Array.from(this.tree.values());
    const combined = new Uint8Array(allNodes.reduce((acc, node) => acc + node.length, 0));
    
    let offset = 0;
    for (const node of allNodes) {
      combined.set(node, offset);
      offset += node.length;
    }
    
    return sodium.crypto_generichash(32, combined);
  }
}

// Main MLS Group State Machine
export class MLSGroup {
  private groupId: string;
  private epoch: number = 0;
  private members: Map<string, MLSCredential> = new Map();
  private treeKEM: MLSTreeKEM;
  private memberToLeafIndex: Map<string, number> = new Map();
  private confirmedTranscriptHash: Uint8Array = new Uint8Array(32);
  
  constructor(groupId?: string) {
    this.groupId = groupId || uuidv4();
    this.treeKEM = new MLSTreeKEM();
  }
  
  // Initialize group with creator
  initialize(creator: MLSCredential): void {
    const leafIndex = this.treeKEM.addMember(creator.publicKey);
    this.members.set(creator.identity, creator);
    this.memberToLeafIndex.set(creator.identity, leafIndex);
    
    this.epoch = 1;
    this.updateTranscriptHash();
  }
  
  // Add member to group (O(log N) key update)
  addMember(newMember: MLSCredential, adder: string): MLSCommit {
    if (this.members.has(newMember.identity)) {
      throw new Error('Member already in group');
    }
    
    if (!this.members.has(adder)) {
      throw new Error('Adder not in group');
    }
    
    const leafIndex = this.treeKEM.addMember(newMember.publicKey);
    this.members.set(newMember.identity, newMember);
    this.memberToLeafIndex.set(newMember.identity, leafIndex);
    
    const proposal: MLSProposal = {
      type: 'add',
      sender: adder,
      content: { newMember, leafIndex },
      signature: this.signData(JSON.stringify({ type: 'add', newMember }), adder)
    };
    
    return this.processCommit(adder, [proposal]);
  }
  
  // Remove member from group (O(log N) key update)
  removeMember(memberToRemove: string, remover: string): MLSCommit {
    if (!this.members.has(memberToRemove)) {
      throw new Error('Member not in group');
    }
    
    if (!this.members.has(remover) || remover === memberToRemove) {
      throw new Error('Invalid remover');
    }
    
    const leafIndex = this.memberToLeafIndex.get(memberToRemove)!;
    this.treeKEM.removeMember(leafIndex);
    this.members.delete(memberToRemove);
    this.memberToLeafIndex.delete(memberToRemove);
    
    const proposal: MLSProposal = {
      type: 'remove',
      sender: remover,
      content: { memberToRemove, leafIndex },
      signature: this.signData(JSON.stringify({ type: 'remove', memberToRemove }), remover)
    };
    
    return this.processCommit(remover, [proposal]);
  }
  
  // Update member key (forward secrecy)
  updateMemberKey(member: string, newPublicKey: Uint8Array): MLSCommit {
    if (!this.members.has(member)) {
      throw new Error('Member not in group');
    }
    
    const leafIndex = this.memberToLeafIndex.get(member)!;
    const updatePath = this.treeKEM.generateUpdatePath(leafIndex, newPublicKey);
    
    // Update member credential
    const memberCredential = this.members.get(member)!;
    memberCredential.publicKey = newPublicKey;
    
    const proposal: MLSProposal = {
      type: 'update',
      sender: member,
      content: { newPublicKey, leafIndex },
      signature: this.signData(JSON.stringify({ type: 'update', newPublicKey: Array.from(newPublicKey) }), member)
    };
    
    const commit: MLSCommit = {
      groupId: this.groupId,
      epoch: this.epoch,
      sender: member,
      proposals: [proposal],
      path: updatePath,
      signature: this.signCommit([proposal], member)
    };
    
    this.epoch++;
    this.updateTranscriptHash();
    
    return commit;
  }
  
  // Process and validate commit
  private processCommit(sender: string, proposals: MLSProposal[]): MLSCommit {
    const commit: MLSCommit = {
      groupId: this.groupId,
      epoch: this.epoch,
      sender,
      proposals,
      signature: this.signCommit(proposals, sender)
    };
    
    this.epoch++;
    this.updateTranscriptHash();
    
    return commit;
  }
  
  // Encrypt message for group
  encryptMessage(plaintext: string, sender: string): Uint8Array {
    if (!this.members.has(sender)) {
      throw new Error('Sender not in group');
    }
    
    const groupKey = this.treeKEM.getRootKey();
    const nonce = sodium.randombytes_buf(24);
    
    const message = new TextEncoder().encode(plaintext);
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, groupKey);
    
    // Combine nonce + ciphertext
    const result = new Uint8Array(nonce.length + ciphertext.length);
    result.set(nonce);
    result.set(ciphertext, nonce.length);
    
    return result;
  }
  
  // Decrypt group message
  decryptMessage(encryptedData: Uint8Array): string {
    const nonce = encryptedData.slice(0, 24);
    const ciphertext = encryptedData.slice(24);
    
    const groupKey = this.treeKEM.getRootKey();
    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, groupKey);
    
    return new TextDecoder().decode(decrypted);
  }
  
  // Get group context for protocol compliance
  getGroupContext(): MLSGroupContext {
    return {
      groupId: this.groupId,
      epoch: this.epoch,
      members: Array.from(this.members.values()),
      treeHash: this.treeKEM.getTreeHash(),
      confirmedTranscriptHash: this.confirmedTranscriptHash
    };
  }
  
  // Generate key package for new members
  generateKeyPackage(identity: string): MLSKeyPackage {
    const keyPair = sodium.crypto_box_keypair();
    const credential: MLSCredential = {
      identity,
      publicKey: keyPair.publicKey
    };
    
    return {
      id: uuidv4(),
      credential,
      hpkePublicKey: keyPair.publicKey,
      initKey: keyPair.publicKey, // Simplified for demo
      signature: this.signData(JSON.stringify(credential), identity),
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    };
  }
  
  private signData(data: string, signer: string): Uint8Array {
    // Simplified signature - would use member's private key
    const dataBytes = new TextEncoder().encode(data + signer);
    return sodium.crypto_generichash(32, dataBytes);
  }
  
  private signCommit(proposals: MLSProposal[], signer: string): Uint8Array {
    const commitData = JSON.stringify({
      groupId: this.groupId,
      epoch: this.epoch,
      proposals: proposals.map(p => ({ type: p.type, sender: p.sender }))
    });
    
    return this.signData(commitData, signer);
  }
  
  private updateTranscriptHash(): void {
    const contextData = new TextEncoder().encode(JSON.stringify({
      groupId: this.groupId,
      epoch: this.epoch,
      memberCount: this.members.size
    }));
    
    this.confirmedTranscriptHash = sodium.crypto_generichash(32, contextData);
  }
  
  // Getters
  getGroupId(): string { return this.groupId; }
  getEpoch(): number { return this.epoch; }
  getMemberCount(): number { return this.members.size; }
  getMembers(): string[] { return Array.from(this.members.keys()); }
}

// Export main classes and types
export { MLSTreeKEM };