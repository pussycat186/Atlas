/**
 * Atlas Fabric Client
 * Main client for interacting with Atlas Secure Fabric
 */

import {
  AtlasRecord,
  WitnessAttestation,
  QuorumResult,
  ConflictTicket,
  LedgerEntry,
  FabricConfig,
  DEFAULT_FABRIC_CONFIG
} from '@atlas/fabric-protocol';

export class AtlasFabricClient {
  private config: FabricConfig;
  private gatewayEndpoint: string;

  constructor(gatewayEndpoint: string, config?: Partial<FabricConfig>) {
    this.gatewayEndpoint = gatewayEndpoint;
    this.config = { ...DEFAULT_FABRIC_CONFIG, ...config };
  }

  /**
   * Submit a record to the Atlas fabric
   */
  async submitRecord(
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: Record<string, any>
  ): Promise<QuorumResult> {
    const response = await fetch(`${this.gatewayEndpoint}/api/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app,
        record_id: recordId,
        payload,
        meta,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit record: ${response.statusText}`);
    }

    const result = await response.json();
    return this.verifyQuorum(result.attestations);
  }

  /**
   * Core API: verifyRecord with witness URLs, quorum, and delta parameters
   */
  async verifyRecord(
    recordId: string, 
    witnessUrls?: string[], 
    quorum?: number, 
    deltaMs?: number
  ): Promise<QuorumResult> {
    // Use provided parameters or fall back to config
    const targetQuorum = quorum || this.config.quorum_size;
    const targetDelta = deltaMs || this.config.max_timestamp_skew_ms;
    const targetWitnesses = witnessUrls || this.config.witnesses.map(w => w.endpoint);

    // Fetch attestations from specified witnesses
    const attestations: WitnessAttestation[] = [];
    
    for (const witnessUrl of targetWitnesses) {
      try {
        const response = await fetch(`${witnessUrl}/witness/records/${recordId}`);
        if (response.ok) {
          const result = await response.json();
          attestations.push(result.attestation);
        }
      } catch (error) {
        console.warn(`Failed to fetch attestation from ${witnessUrl}:`, error);
      }
    }

    if (attestations.length === 0) {
      throw new Error(`No attestations found for record ${recordId}`);
    }

    // Verify quorum with custom parameters
    return this.verifyQuorumWithParams(attestations, targetQuorum, targetDelta);
  }

  /**
   * Legacy verifyRecord method for backward compatibility
   */
  async verifyRecordLegacy(recordId: string): Promise<QuorumResult> {
    const response = await fetch(`${this.gatewayEndpoint}/api/records/${recordId}/verify`);
    
    if (!response.ok) {
      throw new Error(`Failed to verify record: ${response.statusText}`);
    }

    const result = await response.json();
    return this.verifyQuorum(result.attestations);
  }

  /**
   * Get all conflicts from the system
   */
  async getConflicts(options?: {
    since?: string;
    status?: 'open' | 'resolved' | 'escalated';
    limit?: number;
  }): Promise<ConflictTicket[]> {
    const params = new URLSearchParams();
    if (options?.since) params.append('since', options.since);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${this.gatewayEndpoint}/api/conflicts?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get conflicts: ${response.statusText}`);
    }

    const result = await response.json();
    return result.conflicts;
  }

  /**
   * Get witness status information
   */
  async getWitnessStatus(): Promise<Array<{
    witness_id: string;
    status: 'active' | 'inactive' | 'error';
    last_seen: string;
    region: string;
  }>> {
    const response = await fetch(`${this.gatewayEndpoint}/api/witnesses/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get witness status: ${response.statusText}`);
    }

    const result = await response.json();
    return result.witnesses;
  }

  /**
   * Verify quorum consensus from witness attestations with custom parameters
   */
  verifyQuorumWithParams(
    attestations: WitnessAttestation[], 
    requiredQuorum: number, 
    maxSkewMs: number
  ): QuorumResult {
    const acceptedAttestations = attestations.filter(a => a.accept);
    const rejectedAttestations = attestations.filter(a => !a.accept);

    // Check if we have enough accepted attestations for quorum
    const quorumCount = acceptedAttestations.length;
    const hasQuorum = quorumCount >= requiredQuorum;

    // Check timestamp skew
    const timestamps = acceptedAttestations.map(a => new Date(a.ts).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const actualSkewMs = maxTs - minTs;
    const skewOk = actualSkewMs <= maxSkewMs;

    // Check for state consistency among accepted attestations
    const consistentAttestations = this.findConsistentAttestations(acceptedAttestations);
    const conflictingAttestations = acceptedAttestations.filter(
      a => !consistentAttestations.some(ca => ca.witness_id === a.witness_id)
    );

    const ok = hasQuorum && skewOk && consistentAttestations.length >= requiredQuorum;

    return {
      ok,
      quorum_count: consistentAttestations.length,
      required_quorum: requiredQuorum,
      total_witnesses: attestations.length,
      max_skew_ms: actualSkewMs,
      skew_ok: skewOk,
      consistent_attestations: consistentAttestations,
      conflicting_attestations: [...conflictingAttestations, ...rejectedAttestations],
    };
  }

  /**
   * Verify quorum consensus from witness attestations (using config defaults)
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
    const stateViews = acceptedAttestations.map(a => a.state_view);
    const consistentAttestations = this.findConsistentAttestations(acceptedAttestations);
    const conflictingAttestations = acceptedAttestations.filter(
      a => !consistentAttestations.some(ca => ca.witness_id === a.witness_id)
    );

    const ok = hasQuorum && skewOk && consistentAttestations.length >= this.config.quorum_size;

    return {
      ok,
      quorum_count: consistentAttestations.length,
      required_quorum: this.config.quorum_size,
      total_witnesses: attestations.length,
      max_skew_ms: maxSkewMs,
      skew_ok: skewOk,
      consistent_attestations: consistentAttestations,
      conflicting_attestations: [...conflictingAttestations, ...rejectedAttestations],
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
   * Fetch ledger entries from a specific witness
   */
  async fetchWitnessLedger(
    witnessId: string,
    options?: { since?: string; limit?: number }
  ): Promise<LedgerEntry[]> {
    const witness = this.config.witnesses.find(w => w.witness_id === witnessId);
    if (!witness) {
      throw new Error(`Witness ${witnessId} not found in configuration`);
    }

    const params = new URLSearchParams();
    if (options?.since) params.append('since', options.since);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${witness.endpoint}/witness/ledger?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ledger from ${witnessId}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.entries;
  }

  /**
   * Get configuration
   */
  getConfig(): FabricConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FabricConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
