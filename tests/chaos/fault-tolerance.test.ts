/**
 * Atlas Chaos Tests
 * Tests for fault tolerance and Byzantine fault handling
 */

import { QuorumManager } from '../../services/gateway/src/quorum';
import type { WitnessAttestation } from '@atlas/fabric-protocol';

describe('Atlas Chaos Tests', () => {
  let quorumManager: QuorumManager;

  beforeEach(() => {
    quorumManager = new QuorumManager();
  });

  describe('Byzantine Fault Tolerance', () => {
    it('should handle 1 Byzantine witness (4-of-5 consensus)', () => {
      const attestations: WitnessAttestation[] = [
        // 4 honest witnesses with consistent state
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
        // 1 Byzantine witness with conflicting state
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 999, size: 999999 }, // Malicious state
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(true);
      expect(result.quorum_count).toBe(4);
      expect(result.consistent_attestations).toHaveLength(4);
      expect(result.conflicting_attestations).toHaveLength(1);
      expect(result.conflicting_attestations[0].witness_id).toBe('w5');
    });

    it('should fail with 2 Byzantine witnesses', () => {
      const attestations: WitnessAttestation[] = [
        // 3 honest witnesses
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
        // 2 Byzantine witnesses with different conflicting states
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:00:00.300Z',
          state_view: { record_id: 'r1', order: 2, size: 200 },
        },
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:00.400Z',
          state_view: { record_id: 'r1', order: 3, size: 300 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.quorum_count).toBe(3);
      expect(result.consistent_attestations).toHaveLength(3);
      expect(result.conflicting_attestations).toHaveLength(2);
    });

    it('should handle network partitions', () => {
      // Simulate network partition where only 3 witnesses are reachable
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
        // w4 and w5 are unreachable due to network partition
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.quorum_count).toBe(3);
      expect(result.total_witnesses).toBe(3);
    });
  });

  describe('Timing Attacks', () => {
    it('should detect timestamp manipulation attempts', () => {
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
        // Malicious witness with manipulated timestamp (far in the future)
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:10.000Z', // 10 seconds later
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(false);
      expect(result.skew_ok).toBe(false);
      expect(result.max_skew_ms).toBe(10000);
    });

    it('should handle clock skew between regions', () => {
      const attestations: WitnessAttestation[] = [
        // US East witnesses
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
        // EU West witnesses (with clock skew)
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
        // AP Southeast witness (with larger clock skew)
        {
          witness_id: 'w5',
          accept: true,
          ts: '2025-01-01T00:00:01.500Z', // 1.5 seconds skew
          state_view: { record_id: 'r1', order: 1, size: 100 },
        },
      ];

      const result = quorumManager.verifyQuorum(attestations);

      expect(result.ok).toBe(true);
      expect(result.skew_ok).toBe(true);
      expect(result.max_skew_ms).toBe(1500);
    });
  });

  describe('Load and Stress Testing', () => {
    it('should handle high-frequency record submissions', () => {
      const results: any[] = [];
      
      // Simulate 100 rapid submissions
      for (let i = 0; i < 100; i++) {
        const attestations: WitnessAttestation[] = [
          {
            witness_id: 'w1',
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i).padStart(3, '0')}Z`,
            state_view: { record_id: `r${i}`, order: i + 1, size: 100 },
          },
          {
            witness_id: 'w2',
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i + 1).padStart(3, '0')}Z`,
            state_view: { record_id: `r${i}`, order: i + 1, size: 100 },
          },
          {
            witness_id: 'w3',
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i + 2).padStart(3, '0')}Z`,
            state_view: { record_id: `r${i}`, order: i + 1, size: 100 },
          },
          {
            witness_id: 'w4',
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i + 3).padStart(3, '0')}Z`,
            state_view: { record_id: `r${i}`, order: i + 1, size: 100 },
          },
          {
            witness_id: 'w5',
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i + 4).padStart(3, '0')}Z`,
            state_view: { record_id: `r${i}`, order: i + 1, size: 100 },
          },
        ];

        const result = quorumManager.verifyQuorum(attestations);
        results.push(result);
      }

      // All should succeed
      expect(results.every(r => r.ok)).toBe(true);
      expect(results.every(r => r.quorum_count === 5)).toBe(true);
    });

    it('should handle mixed success/failure scenarios', () => {
      const scenarios = [
        // Scenario 1: All witnesses agree
        { expected: true, witnesses: 5, failures: 0 },
        // Scenario 2: 1 witness fails
        { expected: true, witnesses: 4, failures: 1 },
        // Scenario 3: 2 witnesses fail
        { expected: false, witnesses: 3, failures: 2 },
        // Scenario 4: Network partition (only 3 reachable)
        { expected: false, witnesses: 3, failures: 2 },
      ];

      scenarios.forEach((scenario, index) => {
        const attestations: WitnessAttestation[] = [];
        
        // Add successful witnesses
        for (let i = 0; i < scenario.witnesses; i++) {
          attestations.push({
            witness_id: `w${i + 1}`,
            accept: true,
            ts: `2025-01-01T00:00:00.${String(i * 100).padStart(3, '0')}Z`,
            state_view: { record_id: `r${index}`, order: index + 1, size: 100 },
          });
        }

        // Add failed witnesses
        for (let i = scenario.witnesses; i < scenario.witnesses + scenario.failures; i++) {
          attestations.push({
            witness_id: `w${i + 1}`,
            accept: false,
            ts: `2025-01-01T00:00:00.${String(i * 100).padStart(3, '0')}Z`,
            state_view: { record_id: `r${index}`, order: index + 1, size: 100 },
          });
        }

        const result = quorumManager.verifyQuorum(attestations);
        expect(result.ok).toBe(scenario.expected);
      });
    });
  });

  describe('Recovery and Resilience', () => {
    it('should recover from temporary witness failures', () => {
      // Initial state: 4 witnesses working, 1 failed
      let attestations: WitnessAttestation[] = [
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

      let result = quorumManager.verifyQuorum(attestations);
      expect(result.ok).toBe(true);

      // Recovery: w5 comes back online
      attestations = [
        {
          witness_id: 'w1',
          accept: true,
          ts: '2025-01-01T00:01:00.000Z',
          state_view: { record_id: 'r2', order: 2, size: 100 },
        },
        {
          witness_id: 'w2',
          accept: true,
          ts: '2025-01-01T00:01:00.100Z',
          state_view: { record_id: 'r2', order: 2, size: 100 },
        },
        {
          witness_id: 'w3',
          accept: true,
          ts: '2025-01-01T00:01:00.200Z',
          state_view: { record_id: 'r2', order: 2, size: 100 },
        },
        {
          witness_id: 'w4',
          accept: true,
          ts: '2025-01-01T00:01:00.300Z',
          state_view: { record_id: 'r2', order: 2, size: 100 },
        },
        {
          witness_id: 'w5',
          accept: true, // Now working
          ts: '2025-01-01T00:01:00.400Z',
          state_view: { record_id: 'r2', order: 2, size: 100 },
        },
      ];

      result = quorumManager.verifyQuorum(attestations);
      expect(result.ok).toBe(true);
      expect(result.quorum_count).toBe(5);
    });
  });
});
