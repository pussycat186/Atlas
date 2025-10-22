// Atlas Security-Core: MLS TreeKEM Tests
// Test minimal MLS implementation với add/remove member + epoch derivation

import { describe, it, expect } from 'vitest';
import {
  initGroup,
  addMember,
  removeMember,
  processUpdatePath,
  exportGroupState,
  type MLSGroupState
} from '../mls.js';
import sodium from 'libsodium-wrappers';

describe('MLS TreeKEM', () => {
  it('should initialize group với founding member', async () => {
    await sodium.ready;
    
    const groupId = 'test-group-1';
    const memberId = 'alice';
    
    const state = await initGroup(groupId, memberId);
    
    expect(state.groupId).toBe(groupId);
    expect(state.epoch).toBe(0);
    expect(state.members).toEqual([memberId]);
    expect(state.myIndex).toBe(0);
    expect(state.tree.length).toBe(1);
    expect(state.epochSecret).toHaveLength(32);
    expect(state.tree[0].publicKey).toHaveLength(32);
  });
  
  it('should add member và tạo UpdatePath', async () => {
    await sodium.ready;
    
    // Alice khởi tạo group
    const aliceState = await initGroup('group-1', 'alice');
    
    // Bob tạo keypair
    const bobKeyPair = sodium.crypto_box_keypair();
    
    // Alice add Bob
    const { updatePath, newState } = await addMember(
      aliceState,
      'bob',
      bobKeyPair.publicKey
    );
    
    // Verify UpdatePath
    expect(updatePath.senderIndex).toBe(0); // Alice's index
    expect(updatePath.leafPublicKey).toHaveLength(32);
    expect(updatePath.epoch).toBe(1); // Epoch incremented
    
    // Verify new state
    expect(newState.epoch).toBe(1);
    expect(newState.members).toEqual(['alice', 'bob']);
    expect(newState.tree.length).toBe(2);
    expect(newState.tree[1].publicKey).toEqual(bobKeyPair.publicKey);
    
    // Epoch secret should change khi add member
    expect(newState.epochSecret).not.toEqual(aliceState.epochSecret);
  });
  
  it('should remove member và update epoch', async () => {
    await sodium.ready;
    
    // Setup group với 3 members
    const aliceState = await initGroup('group-1', 'alice');
    const bobKeyPair = sodium.crypto_box_keypair();
    const charlieKeyPair = sodium.crypto_box_keypair();
    
    const { newState: stateWithBob } = await addMember(aliceState, 'bob', bobKeyPair.publicKey);
    const { newState: stateWith3 } = await addMember(stateWithBob, 'charlie', charlieKeyPair.publicKey);
    
    expect(stateWith3.members).toEqual(['alice', 'bob', 'charlie']);
    expect(stateWith3.epoch).toBe(2);
    
    // Alice remove Bob (index 1)
    const { updatePath, newState } = await removeMember(stateWith3, 1);
    
    // Verify removal
    expect(updatePath.epoch).toBe(3); // Epoch incremented
    expect(newState.members).toEqual(['alice', 'charlie']);
    expect(newState.tree[1].publicKey).toBeNull(); // Bob's node blanked
    
    // Epoch secret phải khác sau khi remove
    expect(newState.epochSecret).not.toEqual(stateWith3.epochSecret);
  });
  
  it('should process UpdatePath từ member khác', async () => {
    await sodium.ready;
    
    // Alice và Bob trong group
    const aliceState = await initGroup('group-1', 'alice');
    const bobKeyPair = sodium.crypto_box_keypair();
    const { updatePath, newState: aliceNewState } = await addMember(
      aliceState,
      'bob',
      bobKeyPair.publicKey
    );
    
    // Bob có initial state (giả sử Bob đã nhận initial commit)
    const bobState: MLSGroupState = {
      ...aliceNewState,
      myIndex: 1, // Bob's index
      tree: [
        { publicKey: aliceNewState.tree[0].publicKey },
        {
          publicKey: bobKeyPair.publicKey,
          privateKey: bobKeyPair.privateKey,
          pathSecret: sodium.randombytes_buf(32)
        }
      ]
    };
    
    // Alice update key (simulate)
    const newAliceKeyPair = sodium.crypto_box_keypair();
    const aliceUpdatePath = {
      senderIndex: 0,
      leafPublicKey: newAliceKeyPair.publicKey,
      pathPublicKeys: [newAliceKeyPair.publicKey],
      epoch: 2
    };
    
    // Bob process Alice's UpdatePath
    const bobNewState = await processUpdatePath(bobState, aliceUpdatePath);
    
    // Verify Bob's state updated
    expect(bobNewState.epoch).toBe(2);
    expect(bobNewState.tree[0].publicKey).toEqual(newAliceKeyPair.publicKey);
    expect(bobNewState.epochSecret).toHaveLength(32);
  });
  
  it('should derive khác epoch secrets cho mỗi epoch', async () => {
    await sodium.ready;
    
    const state0 = await initGroup('group-1', 'alice');
    const bobKeyPair = sodium.crypto_box_keypair();
    
    const { newState: state1 } = await addMember(state0, 'bob', bobKeyPair.publicKey);
    const charlieKeyPair = sodium.crypto_box_keypair();
    const { newState: state2 } = await addMember(state1, 'charlie', charlieKeyPair.publicKey);
    
    // Mỗi epoch phải có unique epoch secret
    expect(state0.epochSecret).not.toEqual(state1.epochSecret);
    expect(state1.epochSecret).not.toEqual(state2.epochSecret);
    expect(state0.epochSecret).not.toEqual(state2.epochSecret);
  });
  
  it('should export group state cho debugging', () => {
    const mockState: MLSGroupState = {
      groupId: 'test-group',
      epoch: 5,
      epochSecret: new Uint8Array(32),
      tree: [
        { publicKey: new Uint8Array(32) },
        { publicKey: new Uint8Array(32) }
      ],
      members: ['alice', 'bob'],
      myIndex: 0,
      pathSecrets: new Map()
    };
    
    const exported = exportGroupState(mockState);
    const parsed = JSON.parse(exported);
    
    expect(parsed.groupId).toBe('test-group');
    expect(parsed.epoch).toBe(5);
    expect(parsed.members).toEqual(['alice', 'bob']);
    expect(parsed.myIndex).toBe(0);
    expect(parsed.treeSize).toBe(2);
  });
});
