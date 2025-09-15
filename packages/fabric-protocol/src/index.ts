/**
 * Atlas Secure Fabric Protocol
 * Main export file for all protocol types and utilities
 */

export * from './schemas';

// Re-export commonly used types for convenience
export type {
  AtlasRecord,
  WitnessAttestation,
  ConflictTicket,
  QuorumResult,
  LedgerEntry,
  FabricConfig,
  WitnessConfig,
  RecordMeta,
  StateView,
  ConflictResolution,
  LedgerEntry as LedgerEntryType,
  WitnessConfig as WitnessConfigType
} from './schemas';

// API types are now defined in schemas.ts
export type {
  SubmitRecordRequest,
  SubmitRecordResponse,
  VerifyRecordResponse,
  GetConflictsResponse,
  WitnessStatusResponse,
  WitnessHealthResponse,
  WitnessInfoResponse,
  AdminMetricsResponse,
  ResolveConflictRequest,
  ResolveConflictResponse,
  WitnessPerformanceResponse
} from './schemas';
