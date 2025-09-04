/**
 * Atlas Fabric Client SDK
 * Main export file for the client library
 */

export { AtlasFabricClient } from './client';
export * from './utils';

// Re-export commonly used types
export type {
  Record,
  WitnessAttestation,
  QuorumResult,
  ConflictTicket,
  LedgerEntry,
  FabricConfig
} from '@atlas/fabric-protocol';
