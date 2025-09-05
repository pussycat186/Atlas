/**
 * Atlas Gateway Quorum Manager
 * Handles quorum verification and conflict detection
 */

import {
  WitnessAttestation,
  QuorumResult,
  ConflictTicket,
  FabricConfig,
  DEFAULT_FABRIC_CONFIG
} from '@atlas/fabric-protocol';
import { v4 as uuidv4 } from 'uuid';

export class QuorumManager {
  private config: FabricConfig;
  private conflicts: Map<string, ConflictTicket> = new Map();

  constructor(config?: Partial<FabricConfig>) {
    this.config = { ...DEFAULT_FABRIC_CONFIG, ...config };
  }

  /**
   * Get required quorum size for tracing
   */
  getRequiredQuorum(): number {
    return this.config.quorum_size;
  }

  /**
   * Verify quorum consensus from witness attestations
   */
  verifyQuorum(attestations: WitnessAttestation[]): QuorumResult {
    const acceptedAttestations = attestations.filter(a => a.accept);
    const rejectedAttestations = attestations.filter(a => !a.accept);

    // Check if we have enough accepted attestations for quorum
    const quorumCount = acceptedAttestations.length;
    const hasQuorum = quorumCount >= this.config.quorum_size;

    // Check timestamp skew
    const timestamps = acceptedAttestations.map(a => new Date(a.ts).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const maxSkewMs = maxTs - minTs;
    const skewOk = maxSkewMs <= this.config.max_timestamp_skew_ms;

    // Check for state consistency among accepted attestations
    const consistentAttestations = this.findConsistentAttestations(acceptedAttestations);
    const conflictingAttestations = acceptedAttestations.filter(
      a => !consistentAttestations.some(ca => ca.witness_id === a.witness_id)
    );

    const ok = hasQuorum && skewOk && consistentAttestations.length >= this.config.quorum_size;

    // Create conflict ticket if there are conflicts
    let conflictTicket: ConflictTicket | undefined;
    if (conflictingAttestations.length > 0 || !ok) {
      conflictTicket = this.createConflictTicket(
        attestations[0]?.state_view.record_id || 'unknown',
        [...conflictingAttestations, ...rejectedAttestations],
        consistentAttestations
      );
    }

    return {
      ok,
      quorum_count: consistentAttestations.length,
      required_quorum: this.config.quorum_size,
      total_witnesses: attestations.length,
      max_skew_ms: maxSkewMs,
      skew_ok: skewOk,
      consistent_attestations: consistentAttestations,
      conflicting_attestations: [...conflictingAttestations, ...rejectedAttestations],
      conflict_ticket: conflictTicket,
    };
  }

  /**
   * Find attestations with consistent state views
   */
  private findConsistentAttestations(attestations: WitnessAttestation[]): WitnessAttestation[] {
    if (attestations.length === 0) return [];

    // Group attestations by state view
    const stateGroups = new Map<string, WitnessAttestation[]>();
    
    for (const attestation of attestations) {
      const stateKey = this.getStateKey(attestation.state_view);
      if (!stateGroups.has(stateKey)) {
        stateGroups.set(stateKey, []);
      }
      stateGroups.get(stateKey)!.push(attestation);
    }

    // Find the largest group (majority consensus)
    let largestGroup: WitnessAttestation[] = [];
    for (const group of stateGroups.values()) {
      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    }

    return largestGroup;
  }

  /**
   * Generate a key for state view comparison
   */
  private getStateKey(stateView: any): string {
    return JSON.stringify({
      record_id: stateView.record_id,
      order: stateView.order,
      size: stateView.size,
      state_hash: stateView.state_hash,
      prev_record_id: stateView.prev_record_id,
    });
  }

  /**
   * Create a conflict ticket for conflicting attestations
   */
  private createConflictTicket(
    recordId: string,
    conflictingAttestations: WitnessAttestation[],
    consistentAttestations: WitnessAttestation[]
  ): ConflictTicket {
    const conflictId = `conflict_${Date.now()}_${uuidv4().substr(0, 8)}`;
    
    const disagreeingWitnesses = conflictingAttestations.map(a => a.witness_id);
    
    const conflictTicket: ConflictTicket = {
      conflict_id: conflictId,
      record_id: recordId,
      detected_at: new Date().toISOString(),
      disagreeing_witnesses: disagreeingWitnesses,
      attestations: [...conflictingAttestations, ...consistentAttestations],
      status: 'open',
    };

    // Store the conflict ticket
    this.conflicts.set(conflictId, conflictTicket);

    return conflictTicket;
  }

  /**
   * Get all conflicts
   */
  getConflicts(options?: {
    since?: string;
    status?: 'open' | 'resolved' | 'escalated';
    limit?: number;
  }): ConflictTicket[] {
    let conflicts = Array.from(this.conflicts.values());

    // Filter by status
    if (options?.status) {
      conflicts = conflicts.filter(c => c.status === options.status);
    }

    // Filter by date
    if (options?.since) {
      const sinceTs = new Date(options.since).getTime();
      conflicts = conflicts.filter(c => 
        new Date(c.detected_at).getTime() >= sinceTs
      );
    }

    // Sort by detection time (newest first)
    conflicts.sort((a, b) => 
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );

    // Apply limit
    if (options?.limit) {
      conflicts = conflicts.slice(0, options.limit);
    }

    return conflicts;
  }

  /**
   * Get a specific conflict by ID
   */
  getConflict(conflictId: string): ConflictTicket | null {
    return this.conflicts.get(conflictId) || null;
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflictId: string,
    method: 'quorum_override' | 'manual',
    chosenAttestationId: string,
    reason: string
  ): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return false;
    }

    const chosenAttestation = conflict.attestations.find(
      a => a.witness_id === chosenAttestationId
    );

    if (!chosenAttestation) {
      return false;
    }

    conflict.status = 'resolved';
    conflict.resolution = {
      method,
      resolved_at: new Date().toISOString(),
      chosen_attestation: chosenAttestation,
      reason,
    };

    return true;
  }

  /**
   * Get quorum statistics
   */
  getQuorumStats(): {
    totalConflicts: number;
    openConflicts: number;
    resolvedConflicts: number;
    conflictRate: number;
  } {
    const allConflicts = Array.from(this.conflicts.values());
    const openConflicts = allConflicts.filter(c => c.status === 'open').length;
    const resolvedConflicts = allConflicts.filter(c => c.status === 'resolved').length;
    
    // Calculate conflict rate (conflicts per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentConflicts = allConflicts.filter(c => 
      new Date(c.detected_at) > oneHourAgo
    ).length;
    
    return {
      totalConflicts: allConflicts.length,
      openConflicts,
      resolvedConflicts,
      conflictRate: recentConflicts, // conflicts in last hour
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FabricConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FabricConfig {
    return { ...this.config };
  }
}
