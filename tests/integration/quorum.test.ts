/**
 * Atlas Integration Tests
 * Tests for quorum consensus and witness coordination
 */

import { AtlasFabricClient } from '@atlas/fabric-client';
import { QuorumManager } from '../../services/gateway/src/quorum';
import { WitnessClient } from '../../services/gateway/src/witness-client';
import type { WitnessAttestation } from '@atlas/fabric-protocol';

describe('Atlas Integration Tests', () => {
  let quorumManager: QuorumManager;
  let witnessClient: WitnessClient;

  beforeEach(() => {
    quorumManager = new QuorumManager();
    witnessClient = new WitnessClient();
  });

  describe('Quorum Consensus', () => {
    it('should achieve quorum with 4 out of 5 witnesses', () => {
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: true,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:00:00.200Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:00:00.300Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w5',
          accept: false,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(true);
      expect(result.quorum_count).toBe(4);
      expect(result.required_quorum).toBe(4);
      expect(result.skew_ok).toBe(true);
      expect(result.max_skew_ms).toBe(400);
    });

    it('should fail quorum with only 3 out of 5 witnesses', () => {
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: true,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:00:00.200Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: false,
          ts: '2025-01-01T00:00:00.300Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w5',
          accept: false,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.quorum_count).toBe(3);
      expect(result.required_quorum).toBe(4);
    });

    it('should detect timestamp skew violations', () => {
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: true,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:00:00.200Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:00:03.000Z', // 3 seconds later - exceeds 2s limit
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:03.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.skew_ok).toBe(false);
      expect(result.max_skew_ms).toBe(3100);
    });

    it('should detect state view conflicts', () => {
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: true,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:00:00.200Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:00:00.300Z',
          state_view: { record_id: 'r1', order: 2, size: 200 }, // Different state view
        },
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 2, size: 200 }, // Different state view
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.consistent_attestations).toHaveLength(3);
      expect(result.conflicting_attestations).toHaveLength(2);
      expect(result.conflict_ticket).toBeDefined();
    });
  });

  describe('Conflict Detection', () => {
    it('should create conflict ticket for disagreements', () => {
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: false,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:00:00.200Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:00:00.300Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.conflict_ticket).toBeDefined();
      expect(result.conflict_ticket?.record_id).toBe('r1');
      expect(result.conflict_ticket?.disagreeing_witnesses).toContain('w2');
      expect(result.conflict_ticket?.status).toBe('open');
    });

    it('should resolve conflicts manually', () => {
      // First create a conflict
      const attestations: WitnessAttestation[] = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:00:00.000Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: false,
          ts: '2025-01-01T00:00:00.100Z',
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);
      const conflictId = result.conflict_ticket?.conflict_id;

      expect(conflictId).toBeDefined();

      // Resolve the conflict
      const resolved = quorumManager.resolveConflict(
        conflictId!,
        'manual',
        'w1',
        'Manual resolution - w1 is correct'
      );

      expect(resolved).toBe(true);

      const conflict = quorumManager.getConflict(conflictId!);
      expect(conflict?.status).toBe('resolved');
      expect(conflict?.resolution?.method).toBe('manual');
      expect(conflict?.resolution?.chosen_attestation.witness_id).toBe('w1');
    });
  });

  describe('Witness Client', () => {
    it('should handle witness failures gracefully', async () => {
      // Mock fetch to simulate witness failures
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            witness_id: 'w1',
            accept: true,
            ts: '2025-01-01T00:00:00.000Z',
            state_view: { record_id: 'r1', order: 1, size: 100 },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            witness_id: 'w3',
            accept: true,
            ts: '2025-01-01T00:00:00.200Z',
            state_view: { record_id: 'r1', order: 1, size: 100 },
          }),
        });

      global.fetch = mockFetch;

      const attestations = await witnessClient.submitToAllWitnesses(
        'chat',
        'r1',
        'test message',
        { room_id: 'general' }
      );

      // Should have 2 successful attestations despite 1 failure
      expect(attestations).toHaveLength(2);
      expect(attestations[0].witness_id).toBe('w1');
      expect(attestations[1].witness_id).toBe('w3');
    });
  });
});
