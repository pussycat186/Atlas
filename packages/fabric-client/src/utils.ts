/**
 * Atlas Fabric Client Utilities
 * Helper functions for common operations
 */

import { WitnessAttestation, QuorumResult, AtlasRecord, LedgerEntry } from '@atlas/fabric-protocol';

/**
 * Generate a unique record ID
 */
export function generateRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format quorum result for display
 */
export function formatQuorumResult(result: QuorumResult): string {
  const status = result.ok ? 'VERIFIED' : 'CONFLICT';
  const skew = result.skew_ok ? `${result.max_skew_ms}ms` : `${result.max_skew_ms}ms (EXCEEDED)`;
  
  return `Integrity: ${status} q=${result.quorum_count}/${result.required_quorum} Δ=${skew}`;
}

/**
 * Check if a record is fully verified
 */
export function isRecordVerified(result: QuorumResult): boolean {
  return result.ok && result.quorum_count >= result.required_quorum && result.skew_ok;
}

/**
 * Calculate consensus percentage
 */
export function getConsensusPercentage(result: QuorumResult): number {
  return (result.quorum_count / result.required_quorum) * 100;
}

/**
 * Get witness health status
 */
export function getWitnessHealth(attestations: WitnessAttestation[]): Record<string, 'healthy' | 'unhealthy'> {
  const health: Record<string, 'healthy' | 'unhealthy'> = {};
  
  for (const attestation of attestations) {
    health[attestation.witness_id] = attestation.accept ? 'healthy' : 'unhealthy';
  }
  
  return health;
}

/**
 * Parse ledger entry from NDJSON line
 */
export function parseLedgerEntry(line: string): LedgerEntry | null {
  try {
    return JSON.parse(line.trim());
  } catch (error) {
    console.warn('Failed to parse ledger entry:', error);
    return null;
  }
}

/**
 * Parse complete ledger from NDJSON content
 */
export function parseLedger(ndjsonContent: string): LedgerEntry[] {
  const lines = ndjsonContent.split('\n').filter(line => line.trim());
  const entries: LedgerEntry[] = [];
  
  for (const line of lines) {
    const entry = parseLedgerEntry(line);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Convert ledger entries to NDJSON format
 */
export function ledgerToNDJSON(entries: LedgerEntry[]): string {
  return entries.map(entry => JSON.stringify(entry)).join('\n');
}

/**
 * Filter ledger entries by criteria
 */
export function filterLedgerEntries(
  entries: LedgerEntry[],
  criteria: {
    app?: 'chat' | 'drive';
    since?: string;
    until?: string;
    recordId?: string;
    witnessId?: string;
  }
): LedgerEntry[] {
  return entries.filter(entry => {
    if (criteria.app && entry.record.app !== criteria.app) return false;
    if (criteria.recordId && entry.record.record_id !== criteria.recordId) return false;
    if (criteria.witnessId && entry.attestation.witness_id !== criteria.witnessId) return false;
    
    if (criteria.since) {
      const entryTs = new Date(entry.record.ts).getTime();
      const sinceTs = new Date(criteria.since).getTime();
      if (entryTs < sinceTs) return false;
    }
    
    if (criteria.until) {
      const entryTs = new Date(entry.record.ts).getTime();
      const untilTs = new Date(criteria.until).getTime();
      if (entryTs > untilTs) return false;
    }
    
    return true;
  });
}

/**
 * Sort ledger entries by timestamp
 */
export function sortLedgerEntries(entries: LedgerEntry[], ascending = true): LedgerEntry[] {
  return [...entries].sort((a, b) => {
    const aTs = new Date(a.record.ts).getTime();
    const bTs = new Date(b.record.ts).getTime();
    return ascending ? aTs - bTs : bTs - aTs;
  });
}

/**
 * Get unique record IDs from ledger entries
 */
export function getUniqueRecordIds(entries: LedgerEntry[]): string[] {
  const recordIds = new Set(entries.map(entry => entry.record.record_id));
  return Array.from(recordIds);
}

/**
 * Group ledger entries by record ID
 */
export function groupEntriesByRecordId(entries: LedgerEntry[]): Record<string, LedgerEntry[]> {
  const groups: Record<string, LedgerEntry[]> = {};
  
  for (const entry of entries) {
    const recordId = entry.record.record_id;
    if (!groups[recordId]) {
      groups[recordId] = [];
    }
    groups[recordId].push(entry);
  }
  
  return groups;
}

/**
 * Calculate ledger statistics
 */
export function calculateLedgerStats(entries: LedgerEntry[]): {
  totalEntries: number;
  uniqueRecords: number;
  apps: Record<string, number>;
  witnesses: Record<string, number>;
  timeRange: { start: string; end: string } | null;
} {
  const uniqueRecords = new Set(entries.map(e => e.record.record_id));
  const apps: Record<string, number> = {};
  const witnesses: Record<string, number> = {};
  
  for (const entry of entries) {
    apps[entry.record.app] = (apps[entry.record.app] || 0) + 1;
    witnesses[entry.attestation.witness_id] = (witnesses[entry.attestation.witness_id] || 0) + 1;
  }
  
  const timestamps = entries.map(e => new Date(e.record.ts).getTime());
  const timeRange = timestamps.length > 0 ? {
    start: new Date(Math.min(...timestamps)).toISOString(),
    end: new Date(Math.max(...timestamps)).toISOString()
  } : null;
  
  return {
    totalEntries: entries.length,
    uniqueRecords: uniqueRecords.size,
    apps,
    witnesses,
    timeRange
  };
}
