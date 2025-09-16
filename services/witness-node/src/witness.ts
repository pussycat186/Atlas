/**
 * Atlas Witness Node
 * Core witness service implementation
 */

// import { v4 as uuidv4 } from 'uuid'; // Unused for now
import pino from 'pino';
import {
  AtlasRecord,
  WitnessAttestation,
  // StateView, // Unused for now
  RecordMeta,
  DEFAULT_FABRIC_CONFIG,
  FabricConfig
} from '@atlas/fabric-protocol';
import { WitnessLedger } from './ledger';

export class WitnessNode {
  private witnessId: string;
  private region: string;
  private ledger: WitnessLedger;
  private startTime: number;
  private securityTrack: 'Z' | 'L';
  private logger: pino.Logger;
  private fabricConfig: FabricConfig;
  private observedSkew: number = 0;

  constructor(
    witnessId: string,
    region: string,
    ledgerPath: string,
    mirrorPath?: string,
    securityTrack: 'Z' | 'L' = 'Z',
    fabricConfig?: Partial<FabricConfig>
  ) {
    this.witnessId = witnessId;
    this.region = region;
    this.ledger = new WitnessLedger(ledgerPath, mirrorPath);
    this.startTime = Date.now();
    this.securityTrack = securityTrack;
    this.fabricConfig = { ...DEFAULT_FABRIC_CONFIG, ...fabricConfig };
    
    // Initialize structured logger
    const loggerConfig: pino.LoggerOptions = {
      level: process.env.LOG_LEVEL || 'info',
    };
    
    if (process.env.NODE_ENV === 'development') {
      loggerConfig.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      };
    }
    
    this.logger = pino(loggerConfig);
  }

  /**
   * Process a record and create an attestation with quorum enforcement
   */
  async processRecord(
    app: 'chat' | 'drive',
    recordId: string,
    payload: string,
    meta: RecordMeta,
    timestamp?: string
  ): Promise<WitnessAttestation> {
    const startTime = Date.now();
    const recordTimestamp = timestamp || new Date().toISOString();
    
    try {
      this.logger.info({ 
        record_id: recordId, 
        app, 
        payload_size: payload.length,
        witness_id: this.witnessId 
      }, 'Processing record');

      // Validate the record
      const validation = this.validateRecord(app, recordId, payload, meta);
      if (!validation.valid) {
        this.logger.warn({ 
          record_id: recordId, 
          reason: validation.reason,
          witness_id: this.witnessId 
        }, 'Record validation failed');
        return this.createRejectionAttestation(recordId, validation.reason || 'Validation failed');
      }

      // Check for timestamp skew (quorum enforcement)
      const skew = this.calculateTimestampSkew(recordTimestamp);
      if (skew > this.fabricConfig.max_timestamp_skew_ms) {
        this.logger.warn({ 
          record_id: recordId, 
          skew, 
          max_skew: this.fabricConfig.max_timestamp_skew_ms,
          witness_id: this.witnessId 
        }, 'Timestamp skew exceeds threshold');
        return this.createRejectionAttestation(recordId, `Timestamp skew too large: ${skew}ms > ${this.fabricConfig.max_timestamp_skew_ms}ms`);
      }

      // Update observed skew
      this.observedSkew = Math.max(this.observedSkew, skew);

      // Create the record with deterministic ordering
      const record: AtlasRecord = {
        record_id: recordId,
        ts: recordTimestamp,
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

      // Create attestation with observed skew
      const attestation: WitnessAttestation = {
        witness_id: this.witnessId,
        accept: true,
        ts: recordTimestamp,
        state_view: record.state_view,
      };

      // Add signature for Track-L
      if (this.securityTrack === 'L') {
        attestation.signature = this.signAttestation(attestation);
      }

      // Append to ledger (deterministic append-only)
      await this.ledger.appendRecord(record, attestation);

      const duration = Date.now() - startTime;
      this.logger.info({ 
        record_id: recordId, 
        duration, 
        skew,
        witness_id: this.witnessId 
      }, 'Record processed successfully');

      return attestation;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        record_id: recordId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        witness_id: this.witnessId 
      }, 'Failed to process record');
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
   * Calculate timestamp skew from current time
   */
  private calculateTimestampSkew(timestamp: string): number {
    const recordTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    return Math.abs(currentTime - recordTime);
  }

  /**
   * Get witness information including observed skew
   */
  getInfo(): {
    witness_id: string;
    region: string;
    version: string;
    security_track: 'Z' | 'L';
    uptime: number;
    observed_skew_ms: number;
    quorum_config: {
      total_witnesses: number;
      quorum_size: number;
      max_timestamp_skew_ms: number;
    };
  } {
    return {
      witness_id: this.witnessId,
      region: this.region,
      version: '1.0.0',
      security_track: this.securityTrack,
      uptime: Date.now() - this.startTime,
      observed_skew_ms: this.observedSkew,
      quorum_config: {
        total_witnesses: this.fabricConfig.total_witnesses,
        quorum_size: this.fabricConfig.quorum_size,
        max_timestamp_skew_ms: this.fabricConfig.max_timestamp_skew_ms,
      },
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
