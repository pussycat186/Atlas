/**
 * Atlas Witness Ledger
 * Append-only ledger implementation for witness nodes
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { AtlasRecord, WitnessAttestation, LedgerEntry } from '@atlas/fabric-protocol';

export class WitnessLedger {
  private ledgerPath: string;
  private mirrorPath: string | undefined;
  private orderCounter: number = 0;

  constructor(ledgerPath: string, mirrorPath?: string) {
    this.ledgerPath = ledgerPath;
    this.mirrorPath = mirrorPath ?? undefined;
    this.initializeLedger();
  }

  /**
   * Initialize the ledger file and load existing order counter
   */
  private async initializeLedger(): Promise<void> {
    await fs.ensureDir(path.dirname(this.ledgerPath));
    
    if (await fs.pathExists(this.ledgerPath)) {
      // Load existing ledger to get the last order number
      const content = await fs.readFile(this.ledgerPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        try {
          const lastEntry = JSON.parse(lines[lines.length - 1]!);
          this.orderCounter = lastEntry.attestation.state_view.order;
        } catch (error) {
          console.warn('Failed to parse last ledger entry, starting from 0');
          this.orderCounter = 0;
        }
      }
    } else {
      // Create new ledger file
      await fs.writeFile(this.ledgerPath, '');
    }
  }

  /**
   * Append a record to the ledger
   */
  async appendRecord(
    record: AtlasRecord,
    attestation: WitnessAttestation
  ): Promise<void> {
    const ledgerEntry: LedgerEntry = {
      record,
      attestation,
      ledger_ts: new Date().toISOString(),
    };

    const ndjsonLine = JSON.stringify(ledgerEntry) + '\n';
    
    // Append to main ledger
    await fs.appendFile(this.ledgerPath, ndjsonLine);
    
    // Mirror to public location if configured
    if (this.mirrorPath) {
      await this.mirrorToPublic(ndjsonLine);
    }
  }

  /**
   * Mirror ledger entry to public location
   */
  private async mirrorToPublic(ndjsonLine: string): Promise<void> {
    if (!this.mirrorPath) return;

    try {
      await fs.ensureDir(path.dirname(this.mirrorPath));
      await fs.appendFile(this.mirrorPath, ndjsonLine);
    } catch (error) {
      console.error('Failed to mirror ledger entry:', error);
      // Don't throw - mirroring failure shouldn't stop the main operation
    }
  }

  /**
   * Get the next order number for a new record
   */
  getNextOrder(): number {
    return ++this.orderCounter;
  }

  /**
   * Read ledger entries with optional filtering
   */
  async readLedger(options?: {
    since?: string;
    limit?: number;
    offset?: number;
  }): Promise<LedgerEntry[]> {
    const content = await fs.readFile(this.ledgerPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let entries: LedgerEntry[] = [];
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LedgerEntry;
        entries.push(entry);
      } catch (error) {
        console.warn('Failed to parse ledger entry:', error);
      }
    }

    // Apply filtering
    if (options?.since) {
      const sinceTs = new Date(options.since).getTime();
      entries = entries.filter(entry => 
        new Date(entry.record.ts).getTime() >= sinceTs
      );
    }

    // Apply offset and limit
    if (options?.offset) {
      entries = entries.slice(options.offset);
    }
    
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(recordId: string): Promise<LedgerEntry | null> {
    const entries = await this.readLedger();
    return entries.find(entry => entry.record.record_id === recordId) || null;
  }

  /**
   * Get ledger statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    lastEntryTs: string | null;
    ledgerSize: number;
    orderCounter: number;
  }> {
    const entries = await this.readLedger();
    const stats = await fs.stat(this.ledgerPath);
    
    return {
      totalEntries: entries.length,
      lastEntryTs: entries.length > 0 ? entries[entries.length - 1]?.record.ts ?? null : null,
      ledgerSize: stats.size,
      orderCounter: this.orderCounter,
    };
  }

  /**
   * Get the public mirror URL for this ledger
   */
  getPublicMirrorUrl(): string | null {
    if (!this.mirrorPath) return null;
    
    // This would be configured based on your mirror setup
    // For example, S3 bucket URL or IPFS hash
    const baseUrl = process.env.LEDGER_MIRROR_BASE_URL || 'https://ledger-mirror.atlas.dev';
    const fileName = path.basename(this.mirrorPath);
    return `${baseUrl}/${fileName}`;
  }

  /**
   * Export ledger as NDJSON for public consumption
   */
  async exportAsNDJSON(): Promise<string> {
    const content = await fs.readFile(this.ledgerPath, 'utf-8');
    return content.trim();
  }

  /**
   * Validate ledger integrity
   */
  async validateIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const entries = await this.readLedger();
      
      // Check for duplicate record IDs
      const recordIds = new Set<string>();
      for (const entry of entries) {
        if (recordIds.has(entry.record.record_id)) {
          errors.push(`Duplicate record ID: ${entry.record.record_id}`);
        }
        recordIds.add(entry.record.record_id);
      }
      
      // Check order sequence
      let expectedOrder = 1;
      for (const entry of entries) {
        if (entry.attestation.state_view.order !== expectedOrder) {
          warnings.push(`Order sequence gap at ${entry.record.record_id}: expected ${expectedOrder}, got ${entry.attestation.state_view.order}`);
        }
        expectedOrder = entry.attestation.state_view.order + 1;
      }
      
      // Check timestamp ordering
      for (let i = 1; i < entries.length; i++) {
        const prevTs = new Date(entries[i - 1]?.record.ts ?? '').getTime();
        const currTs = new Date(entries[i]?.record.ts ?? '').getTime();
        if (currTs < prevTs) {
          warnings.push(`Timestamp out of order at ${entries[i]?.record.record_id ?? 'unknown'}`);
        }
      }
      
    } catch (error) {
      errors.push(`Failed to read ledger: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
