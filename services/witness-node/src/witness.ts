/**
 * Atlas Witness Node
 * Core witness service implementation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AtlasRecord,
  WitnessAttestation,
  StateView,
  RecordMeta,
  DEFAULT_FABRIC_CONFIG
} from '@atlas/fabric-protocol';
import { WitnessLedger } from './ledger';

export class WitnessNode {
  private witnessId: string;
  private region: string;
  private ledger: WitnessLedger;
  private startTime: number;
  private securityTrack: 'Z' | 'L';

  constructor(
    witnessId: string,
    region: string,
    ledgerPath: string,
    mirrorPath?: string,
    securityTrack: 'Z' | 'L' = 'Z'
  ) {
    this.witnessId = witnessId;
    this.region = region;
    this.ledger = new WitnessLedger(ledgerPath, mirrorPath);
    this.startTime = Date.now();
    this.securityTrack = securityTrack;
  }

  /**
   * Process a record and create an attestation
   */
  async processRecord(
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: RecordMeta
  ): Promise<WitnessAttestation> {
    try {
      // Validate the record
      const validation = this.validateRecord(app, recordId, payload, meta);
      if (!validation.valid) {
        return this.createRejectionAttestation(recordId, validation.reason || 'Validation failed');
      }

      // Create the record
      const record: AtlasRecord = {
        record_id: recordId,
        ts: new Date().toISOString(),
        app,
        payload,
        meta,
        state_view: {
          record_id: recordId,
          order: this.ledger.getNextOrder(),
          size: this.calculateRecordSize(payload, meta),
        },
      };

      // Add state hash for Track-L
      if (this.securityTrack === 'L') {
        record.state_view.state_hash = this.calculateStateHash(record);
      }

      // Create attestation
      const attestation: WitnessAttestation = {
        witness_id: this.witnessId,
        accept: true,
        ts: record.ts,
        state_view: record.state_view,
      };

      // Add signature for Track-L
      if (this.securityTrack === 'L') {
        attestation.signature = this.signAttestation(attestation);
      }

      // Append to ledger
      await this.ledger.appendRecord(record, attestation);

      return attestation;
    } catch (error) {
      console.error('Failed to process record:', error);
      return this.createRejectionAttestation(recordId, `Processing error: ${error}`);
    }
  }

  /**
   * Validate a record before processing
   */
  private validateRecord(
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: RecordMeta
  ): { valid: boolean; reason?: string } {
    // Check record ID format
    if (!recordId || typeof recordId !== 'string') {
      return { valid: false, reason: 'Invalid record ID' };
    }

    // Check payload
    if (!payload || typeof payload !== 'string') {
      return { valid: false, reason: 'Invalid payload' };
    }

    // Check payload size limits
    const maxPayloadSize = this.getMaxPayloadSize(app);
    if (payload.length > maxPayloadSize) {
      return { valid: false, reason: `Payload too large: ${payload.length} > ${maxPayloadSize}` };
    }

    // App-specific validation
    if (app === 'chat') {
      if (!meta.room_id) {
        return { valid: false, reason: 'Chat records require room_id' };
      }
    } else if (app === 'drive') {
      if (!meta.chunk_id && !meta.filename) {
        return { valid: false, reason: 'Drive records require chunk_id or filename' };
      }
    }

    return { valid: true };
  }

  /**
   * Create a rejection attestation
   */
  private createRejectionAttestation(
    recordId: string,
    reason: string
  ): WitnessAttestation {
    return {
      witness_id: this.witnessId,
      accept: false,
      ts: new Date().toISOString(),
      state_view: {
        record_id: recordId,
        order: 0,
        size: 0,
      },
      conflict_ref: `rejection_${Date.now()}_${reason.replace(/\s+/g, '_')}`,
    };
  }

  /**
   * Calculate record size in bytes
   */
  private calculateRecordSize(payload: string, meta: RecordMeta): number {
    const metaSize = JSON.stringify(meta).length;
    return payload.length + metaSize;
  }

  /**
   * Calculate state hash for Track-L
   */
  private calculateStateHash(record: AtlasRecord): string {
    // Simple hash implementation for Track-L
    // In production, this would use a proper cryptographic hash
    const data = JSON.stringify({
      record_id: record.record_id,
      ts: record.ts,
      app: record.app,
      payload: record.payload,
      meta: record.meta,
    });
    
    // Simple hash function (replace with crypto.createHash in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Sign attestation for Track-L
   */
  private signAttestation(attestation: WitnessAttestation): string {
    // Simple signature implementation for Track-L
    // In production, this would use proper digital signatures
    const data = JSON.stringify({
      witness_id: attestation.witness_id,
      accept: attestation.accept,
      ts: attestation.ts,
      state_view: attestation.state_view,
    });
    
    // Simple signature (replace with proper crypto in production)
    let sig = 0;
    for (let i = 0; i < data.length; i++) {
      sig = (sig + data.charCodeAt(i) * (i + 1)) % 1000000;
    }
    
    return `sig_${this.witnessId}_${sig}`;
  }

  /**
   * Get maximum payload size for an app
   */
  private getMaxPayloadSize(app: 'chat' | 'drive'): number {
    switch (app) {
      case 'chat':
        return 1024 * 1024; // 1MB for chat messages
      case 'drive':
        return 100 * 1024 * 1024; // 100MB for file chunks
      default:
        return 1024 * 1024; // 1MB default
    }
  }

  /**
   * Get witness information
   */
  getInfo(): {
    witness_id: string;
    region: string;
    version: string;
    security_track: 'Z' | 'L';
    uptime: number;
  } {
    return {
      witness_id: this.witnessId,
      region: this.region,
      version: '1.0.0',
      security_track: this.securityTrack,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    witness_id: string;
    uptime: number;
    ledger_size: number;
    last_record_ts: string | null;
  }> {
    const stats = await this.ledger.getStats();
    
    return {
      status: 'healthy', // Could add more sophisticated health checks
      witness_id: this.witnessId,
      uptime: Date.now() - this.startTime,
      ledger_size: stats.totalEntries,
      last_record_ts: stats.lastEntryTs,
    };
  }

  /**
   * Get ledger instance
   */
  getLedger(): WitnessLedger {
    return this.ledger;
  }

  /**
   * Get witness ID
   */
  getWitnessId(): string {
    return this.witnessId;
  }

  /**
   * Get region
   */
  getRegion(): string {
    return this.region;
  }
}
