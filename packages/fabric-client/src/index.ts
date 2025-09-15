/**
 * Atlas Fabric Client SDK
 * Main export file for the client library
 */

export { AtlasFabricClient } from './client';
export * from './utils';
// export * from './telemetry'; // Temporarily disabled for build

// Re-export commonly used types
export type {
  AtlasRecord,
  WitnessAttestation,
  QuorumResult,
  ConflictTicket,
  LedgerEntry,
  FabricConfig
} from '@atlas/fabric-protocol';
