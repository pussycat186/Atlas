/**
 * Atlas Secure Fabric Protocol
 * Main export file for all protocol types and utilities
 */

export * from './types';
export * from './api';

// Re-export commonly used types for convenience
export type {
  AtlasRecord,
  WitnessAttestation,
  ConflictTicket,
  QuorumResult,
  LedgerEntry,
  FabricConfig,
  WitnessConfig
} from './types';

export type {
  GatewayAPI,
  WitnessAPI,
  AdminAPI,
  WebSocketEvents
} from './api';
