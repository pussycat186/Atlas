/**
 * Atlas Gateway Witness Client
 * HTTP client for communicating with witness nodes
 */

import {
  WitnessAttestation,
  WitnessConfig,
  FabricConfig,
  DEFAULT_FABRIC_CONFIG
} from '@atlas/fabric-protocol';

export class WitnessClient {
  private config: FabricConfig;

  constructor(config?: Partial<FabricConfig>) {
    this.config = { ...DEFAULT_FABRIC_CONFIG, ...config };
  }

  /**
   * Submit a record to all witness nodes
   */
  async submitToAllWitnesses(
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: Record<string, any>
  ): Promise<WitnessAttestation[]> {
    const promises = this.config.witnesses
      .filter(w => w.active)
      .map(witness => this.submitToWitness(witness, app, recordId, payload, meta));

    const results = await Promise.allSettled(promises);
    
    const attestations: WitnessAttestation[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      const witness = this.config.witnesses[index];
      if (result.status === 'fulfilled') {
        attestations.push(result.value);
      } else {
        const witnessId = witness?.witness_id ?? 'unknown';
        errors.push(`Witness ${witnessId}: ${result.reason}`);
        console.error(`Failed to submit to witness ${witnessId}:`, result.reason);
      }
    });

    if (errors.length > 0) {
      console.warn('Some witnesses failed:', errors);
    }

    return attestations;
  }

  /**
   * Submit a record to a specific witness
   */
  private async submitToWitness(
    witness: WitnessConfig,
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: Record<string, any>
  ): Promise<WitnessAttestation> {
    const response = await fetch(`${witness.endpoint}/witness/record`, {
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get witness health status
   */
  async getWitnessHealth(): Promise<Array<{
    witness_id: string;
    status: 'active' | 'inactive' | 'error';
    last_seen: string;
    region: string;
  }>> {
    const promises = this.config.witnesses
      .filter(w => w.active)
      .map(witness => this.checkWitnessHealth(witness));

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      const witness = this.config.witnesses[index];
      const witnessId = witness?.witness_id ?? 'unknown';
      const region = witness?.region ?? 'unknown';
      
      if (result.status === 'fulfilled') {
        return {
          witness_id: witnessId,
          status: 'active' as const,
          last_seen: new Date().toISOString(),
          region: region,
        };
      } else {
        return {
          witness_id: witnessId,
          status: 'error' as const,
          last_seen: new Date().toISOString(),
          region: region,
        };
      }
    });
  }

  /**
   * Check health of a specific witness
   */
  private async checkWitnessHealth(witness: WitnessConfig): Promise<void> {
    const response = await fetch(`${witness.endpoint}/witness/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const health = await response.json();
    if (health.status !== 'healthy') {
      throw new Error(`Witness reports unhealthy status: ${health.status}`);
    }
  }

  /**
   * Get witness info
   */
  async getWitnessInfo(): Promise<Array<{
    witness_id: string;
    region: string;
    version: string;
    security_track: 'Z' | 'L';
    public_key?: string;
  }>> {
    const promises = this.config.witnesses
      .filter(w => w.active)
      .map(witness => this.getWitnessInfoSingle(witness));

    const results = await Promise.allSettled(promises);
    
    return results
      .map((result, index) => {
        const witness = this.config.witnesses[index];
        const witnessId = witness?.witness_id ?? 'unknown';
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to get info from witness ${witnessId}:`, result.reason);
          return null;
        }
      })
      .filter((info): info is NonNullable<typeof info> => info !== null);
  }

  /**
   * Get info from a specific witness
   */
  private async getWitnessInfoSingle(witness: WitnessConfig): Promise<{
    witness_id: string;
    region: string;
    version: string;
    security_track: 'Z' | 'L';
    public_key?: string;
  }> {
    const response = await fetch(`${witness.endpoint}/witness/info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Info request failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get ledger from a specific witness
   */
  async getWitnessLedger(
    witnessId: string,
    options?: { since?: string; limit?: number }
  ): Promise<any> {
    const witness = this.config.witnesses.find(w => w.witness_id === witnessId);
    if (!witness) {
      throw new Error(`Witness ${witnessId} not found`);
    }

    const params = new URLSearchParams();
    if (options?.since) params.append('since', options.since);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${witness.endpoint}/witness/ledger?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Ledger request failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get a specific record from a witness
   */
  async getWitnessRecord(witnessId: string, recordId: string): Promise<any> {
    const witness = this.config.witnesses.find(w => w.witness_id === witnessId);
    if (!witness) {
      throw new Error(`Witness ${witnessId} not found`);
    }

    const response = await fetch(`${witness.endpoint}/witness/records/${recordId}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Record request failed: ${response.status}`);
    }

    return await response.json();
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
