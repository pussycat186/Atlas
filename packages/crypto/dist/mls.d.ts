/**
 * Tree node trong left-balanced binary tree
 */
interface TreeNode {
    publicKey: Uint8Array | null;
    privateKey?: Uint8Array;
    pathSecret?: Uint8Array;
}
/**
 * MLS Group state
 */
export interface MLSGroupState {
    groupId: string;
    epoch: number;
    epochSecret: Uint8Array;
    tree: TreeNode[];
    members: string[];
    myIndex: number;
    pathSecrets: Map<number, Uint8Array>;
}
/**
 * UpdatePath message (khi member update key hoặc commit change)
 */
export interface UpdatePath {
    senderIndex: number;
    leafPublicKey: Uint8Array;
    pathPublicKeys: Uint8Array[];
    epoch: number;
}
/**
 * Khởi tạo MLS group với founding member
 * @param groupId - Unique group identifier
 * @param memberId - ID của founding member
 */
export declare function initGroup(groupId: string, memberId: string): Promise<MLSGroupState>;
/**
 * Add member vào group (tạo UpdatePath)
 * @param state - Current group state
 * @param newMemberId - ID của member mới
 * @param newMemberPublicKey - Public key của member mới (X25519)
 */
export declare function addMember(state: MLSGroupState, newMemberId: string, newMemberPublicKey: Uint8Array): Promise<{
    updatePath: UpdatePath;
    newState: MLSGroupState;
}>;
/**
 * Remove member khỏi group
 * @param state - Current group state
 * @param memberIndex - Index của member cần remove
 */
export declare function removeMember(state: MLSGroupState, memberIndex: number): Promise<{
    updatePath: UpdatePath;
    newState: MLSGroupState;
}>;
/**
 * Process UpdatePath từ member khác
 * @param state - Current group state
 * @param updatePath - UpdatePath message từ sender
 */
export declare function processUpdatePath(state: MLSGroupState, updatePath: UpdatePath): Promise<MLSGroupState>;
/**
 * Export group state for debugging/testing
 */
export declare function exportGroupState(state: MLSGroupState): string;
export {};
//# sourceMappingURL=mls.d.ts.map