/**
 * Atlas Fabric Client Utils Tests
 */

import {
  generateRecordId,
  formatQuorumResult,
  isRecordVerified,
  getConsensusPercentage,
  getWitnessHealth,
  parseLedgerEntry,
  parseLedger,
  ledgerToNDJSON,
  filterLedgerEntries,
  sortLedgerEntries,
  getUniqueRecordIds,
  groupEntriesByRecordId,
  calculateLedgerStats,
} from './utils';
import type { QuorumResult, LedgerEntry } from '@atlas/fabric-protocol';

describe('Atlas Fabric Client Utils', () => {
  describe('generateRecordId', () => {
    it('should generate unique record IDs', () => {
      const id1 = generateRecordId();
      const id2 = generateRecordId();
      
      expect(id1).toMatch(/^rec_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^rec_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatQuorumResult', () => {
    it('should format verified result correctly', () => {
      const result: QuorumResult = {
        ok: true,
        quorum_count: 4,
        required_quorum: 4,
        total_witnesses: 5,
        max_skew_ms: 150,
        skew_ok: true,
        consistent_attestations: [],
        conflicting_attestations: [],
      };

      const formatted = formatQuorumResult(result);
      expect(formatted).toBe('Integrity: VERIFIED q=4/4 Δ=150ms');
    });

    it('should format conflict result correctly', () => {
      const result: QuorumResult = {
        ok: false,
        quorum_count: 2,
        required_quorum: 4,
        total_witnesses: 5,
        max_skew_ms: 3000,
        skew_ok: false,
        consistent_attestations: [],
        conflicting_attestations: [],
      };

      const formatted = formatQuorumResult(result);
      expect(formatted).toBe('Integrity: CONFLICT q=2/4 Δ=3000ms (EXCEEDED)');
    });
  });

  describe('isRecordVerified', () => {
    it('should return true for verified record', () => {
      const result: QuorumResult = {
        ok: true,
        quorum_count: 4,
        required_quorum: 4,
        total_witnesses: 5,
        max_skew_ms: 150,
        skew_ok: true,
        consistent_attestations: [],
        conflicting_attestations: [],
      };

      expect(isRecordVerified(result)).toBe(true);
    });

    it('should return false for unverified record', () => {
      const result: QuorumResult = {
        ok: false,
        quorum_count: 2,
        required_quorum: 4,
        total_witnesses: 5,
        max_skew_ms: 3000,
        skew_ok: false,
        consistent_attestations: [],
        conflicting_attestations: [],
      };

      expect(isRecordVerified(result)).toBe(false);
    });
  });

  describe('getConsensusPercentage', () => {
    it('should calculate consensus percentage correctly', () => {
      const result: QuorumResult = {
        ok: true,
        quorum_count: 3,
        required_quorum: 4,
        total_witnesses: 5,
        max_skew_ms: 150,
        skew_ok: true,
        consistent_attestations: [],
        conflicting_attestations: [],
      };

      expect(getConsensusPercentage(result)).toBe(75);
    });
  });

  describe('getWitnessHealth', () => {
    it('should categorize witness health correctly', () => {
      const attestations = [
        { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } },
        { witness_id: 'w2', accept: false, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } },
        { witness_id: 'w3', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } },
      ];

      const health = getWitnessHealth(attestations);
      
      expect(health.w1).toBe('healthy');
      expect(health.w2).toBe('unhealthy');
      expect(health.w3).toBe('healthy');
    });
  });

  describe('parseLedgerEntry', () => {
    it('should parse valid ledger entry', () => {
      const entry = {
        record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } },
        attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } },
        ledger_ts: '2025-01-01T00:00:00Z'
      };

      const parsed = parseLedgerEntry(JSON.stringify(entry));
      expect(parsed).toEqual(entry);
    });

    it('should return null for invalid JSON', () => {
      const parsed = parseLedgerEntry('invalid json');
      expect(parsed).toBeNull();
    });
  });

  describe('parseLedger', () => {
    it('should parse multiple ledger entries', () => {
      const entries = [
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'chat', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
      ];

      const ndjson = entries.map(e => JSON.stringify(e)).join('\n');
      const parsed = parseLedger(ndjson);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.record.record_id).toBe('r1');
      expect(parsed[1]?.record.record_id).toBe('r2');
    });
  });

  describe('ledgerToNDJSON', () => {
    it('should convert ledger entries to NDJSON', () => {
      const entries: LedgerEntry[] = [
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'chat', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
      ];

      const ndjson = ledgerToNDJSON(entries);
      const lines = ndjson.split('\n');
      
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]!).record.record_id).toBe('r1');
      expect(JSON.parse(lines[1]!).record.record_id).toBe('r2');
    });
  });

  describe('filterLedgerEntries', () => {
    const entries: LedgerEntry[] = [
      { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
      { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'drive', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w2', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
    ];

    it('should filter by app', () => {
      const filtered = filterLedgerEntries(entries, { app: 'chat' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.record.app).toBe('chat');
    });

    it('should filter by record ID', () => {
      const filtered = filterLedgerEntries(entries, { recordId: 'r1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.record.record_id).toBe('r1');
    });

    it('should filter by witness ID', () => {
      const filtered = filterLedgerEntries(entries, { witnessId: 'w1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.attestation.witness_id).toBe('w1');
    });
  });

  describe('sortLedgerEntries', () => {
    it('should sort entries by timestamp ascending', () => {
      const entries: LedgerEntry[] = [
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'chat', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
      ];

      const sorted = sortLedgerEntries(entries, true);
      expect(sorted[0]?.record.record_id).toBe('r1');
      expect(sorted[1]?.record.record_id).toBe('r2');
    });
  });

  describe('getUniqueRecordIds', () => {
    it('should return unique record IDs', () => {
      const entries: LedgerEntry[] = [
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w2', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'chat', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
      ];

      const uniqueIds = getUniqueRecordIds(entries);
      expect(uniqueIds).toEqual(['r1', 'r2']);
    });
  });

  describe('groupEntriesByRecordId', () => {
    it('should group entries by record ID', () => {
      const entries: LedgerEntry[] = [
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w2', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'chat', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
      ];

      const grouped = groupEntriesByRecordId(entries);
      expect(grouped.r1).toHaveLength(2);
      expect(grouped.r2).toHaveLength(1);
    });
  });

  describe('calculateLedgerStats', () => {
    it('should calculate ledger statistics', () => {
      const entries: LedgerEntry[] = [
        { record: { record_id: 'r1', ts: '2025-01-01T00:00:00Z', app: 'chat', payload: 'test1', meta: {}, state_view: { record_id: 'r1', order: 1, size: 100 } }, attestation: { witness_id: 'w1', accept: true, ts: '2025-01-01T00:00:00Z', state_view: { record_id: 'r1', order: 1, size: 100 } }, ledger_ts: '2025-01-01T00:00:00Z' },
        { record: { record_id: 'r2', ts: '2025-01-01T00:01:00Z', app: 'drive', payload: 'test2', meta: {}, state_view: { record_id: 'r2', order: 2, size: 100 } }, attestation: { witness_id: 'w2', accept: true, ts: '2025-01-01T00:01:00Z', state_view: { record_id: 'r2', order: 2, size: 100 } }, ledger_ts: '2025-01-01T00:01:00Z' },
      ];

      const stats = calculateLedgerStats(entries);
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.uniqueRecords).toBe(2);
      expect(stats.apps.chat).toBe(1);
      expect(stats.apps.drive).toBe(1);
      expect(stats.witnesses.w1).toBe(1);
      expect(stats.witnesses.w2).toBe(1);
      expect(stats.timeRange).toBeDefined();
    });
  });
});
