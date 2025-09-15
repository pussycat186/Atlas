/**
 * Atlas Secure Fabric Protocol Zod Schemas
 * Runtime validation for all protocol types
 */

import { z } from 'zod';

// Base schemas
export const RecordMetaSchema = z.object({
  room_id: z.string().optional(),
  chunk_id: z.string().optional(),
  filename: z.string().optional(),
  message_type: z.enum(['text', 'file', 'system']).optional(),
  size: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  parent_id: z.string().optional(),
  user_id: z.string().optional(),
});

export const StateViewSchema = z.object({
  record_id: z.string().uuid(),
  order: z.number().int().positive(),
  size: z.number().int().positive(),
  state_hash: z.string().optional(),
  prev_record_id: z.string().uuid().optional(),
});

export const WitnessAttestationSchema = z.object({
  witness_id: z.string().min(1),
  accept: z.boolean(),
  ts: z.string().datetime(),
  state_view: StateViewSchema,
  conflict_ref: z.string().optional(),
  signature: z.string().optional(),
});

export const ConflictResolutionSchema = z.object({
  method: z.enum(['quorum_override', 'manual', 'timeout']),
  resolved_at: z.string().datetime(),
  chosen_attestation: WitnessAttestationSchema,
  reason: z.string().min(1),
});

export const ConflictTicketSchema = z.object({
  conflict_id: z.string().uuid(),
  record_id: z.string().uuid(),
  detected_at: z.string().datetime(),
  disagreeing_witnesses: z.array(z.string().min(1)),
  attestations: z.array(WitnessAttestationSchema),
  status: z.enum(['open', 'resolved', 'escalated']),
  resolution: ConflictResolutionSchema.optional(),
});

export const QuorumResultSchema = z.object({
  ok: z.boolean(),
  quorum_count: z.number().int().min(0),
  required_quorum: z.number().int().positive(),
  total_witnesses: z.number().int().positive(),
  max_skew_ms: z.number().int().min(0),
  skew_ok: z.boolean(),
  consistent_attestations: z.array(WitnessAttestationSchema),
  conflicting_attestations: z.array(WitnessAttestationSchema),
  conflict_ticket: ConflictTicketSchema.optional(),
});

export const LedgerEntrySchema = z.object({
  record: z.object({
    record_id: z.string().uuid(),
    ts: z.string().datetime(),
    app: z.enum(['chat', 'drive']),
    payload: z.string().min(1),
    meta: RecordMetaSchema,
    state_view: StateViewSchema,
  }),
  attestation: WitnessAttestationSchema,
  ledger_ts: z.string().datetime(),
});

export const WitnessConfigSchema = z.object({
  witness_id: z.string().min(1),
  endpoint: z.string().url(),
  region: z.string().min(1),
  active: z.boolean(),
  public_key: z.string().optional(),
});

export const FabricConfigSchema = z.object({
  total_witnesses: z.number().int().positive(),
  quorum_size: z.number().int().positive(),
  max_timestamp_skew_ms: z.number().int().positive(),
  witnesses: z.array(WitnessConfigSchema),
  mirror_endpoints: z.array(z.string().url()),
  security_track: z.enum(['Z', 'L']),
});

// API request/response schemas
export const SubmitRecordRequestSchema = z.object({
  app: z.enum(['chat', 'drive']),
  record_id: z.string().uuid(),
  payload: z.string().min(1),
  meta: RecordMetaSchema,
});

export const SubmitRecordResponseSchema = z.object({
  success: z.boolean(),
  record_id: z.string().uuid(),
  attestations: z.array(WitnessAttestationSchema),
  quorum_result: z.object({
    ok: z.boolean(),
    quorum_count: z.number().int().min(0),
    max_skew_ms: z.number().int().min(0),
    conflict_ticket: z.string().optional(),
  }),
});

export const VerifyRecordResponseSchema = z.object({
  record_id: z.string().uuid(),
  verified: z.boolean(),
  attestations: z.array(WitnessAttestationSchema),
  quorum_result: z.object({
    ok: z.boolean(),
    quorum_count: z.number().int().min(0),
    max_skew_ms: z.number().int().min(0),
  }),
});

export const GetConflictsResponseSchema = z.object({
  conflicts: z.array(ConflictTicketSchema),
  total: z.number().int().min(0),
});

export const WitnessStatusResponseSchema = z.object({
  witnesses: z.array(z.object({
    witness_id: z.string().min(1),
    status: z.enum(['active', 'inactive', 'error']),
    last_seen: z.string().datetime(),
    region: z.string().min(1),
  })),
});

export const WitnessHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  witness_id: z.string().min(1),
  uptime: z.number().int().min(0),
  ledger_size: z.number().int().min(0),
  last_record_ts: z.string().datetime(),
});

export const WitnessInfoResponseSchema = z.object({
  witness_id: z.string().min(1),
  region: z.string().min(1),
  version: z.string().min(1),
  security_track: z.enum(['Z', 'L']),
  public_key: z.string().optional(),
});

export const AdminMetricsResponseSchema = z.object({
  latency: z.object({
    p50: z.number().min(0),
    p95: z.number().min(0),
    p99: z.number().min(0),
  }),
  quorum_rate: z.number().min(0).max(1),
  conflict_rate: z.number().min(0).max(1),
  witness_health: z.record(z.string(), z.number().min(0).max(1)),
  timestamp_skew: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    avg: z.number().min(0),
  }),
});

export const ResolveConflictRequestSchema = z.object({
  method: z.enum(['quorum_override', 'manual']),
  chosen_attestation_id: z.string().min(1),
  reason: z.string().min(1),
});

export const ResolveConflictResponseSchema = z.object({
  success: z.boolean(),
  resolution: ConflictResolutionSchema.optional(),
});

export const WitnessPerformanceResponseSchema = z.object({
  witnesses: z.array(z.object({
    witness_id: z.string().min(1),
    latency: z.number().min(0),
    success_rate: z.number().min(0).max(1),
    conflict_count: z.number().int().min(0),
    region: z.string().min(1),
  })),
});

// WebSocket event schemas
export const RecordAttestedEventSchema = z.object({
  record_id: z.string().uuid(),
  attestation: WitnessAttestationSchema,
});

export const ConflictDetectedEventSchema = z.object({
  conflict_ticket: ConflictTicketSchema,
});

export const ConflictResolvedEventSchema = z.object({
  conflict_id: z.string().uuid(),
  resolution: ConflictResolutionSchema,
});

export const WitnessStatusChangedEventSchema = z.object({
  witness_id: z.string().min(1),
  status: z.enum(['active', 'inactive', 'error']),
});

// Type exports for TypeScript
export type RecordMeta = z.infer<typeof RecordMetaSchema>;
export type StateView = z.infer<typeof StateViewSchema>;
export type WitnessAttestation = z.infer<typeof WitnessAttestationSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;
export type ConflictTicket = z.infer<typeof ConflictTicketSchema>;
export type QuorumResult = z.infer<typeof QuorumResultSchema>;
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
export type WitnessConfig = z.infer<typeof WitnessConfigSchema>;
export type FabricConfig = z.infer<typeof FabricConfigSchema>;

// API types
export type SubmitRecordRequest = z.infer<typeof SubmitRecordRequestSchema>;
export type SubmitRecordResponse = z.infer<typeof SubmitRecordResponseSchema>;
export type VerifyRecordResponse = z.infer<typeof VerifyRecordResponseSchema>;
export type GetConflictsResponse = z.infer<typeof GetConflictsResponseSchema>;
export type WitnessStatusResponse = z.infer<typeof WitnessStatusResponseSchema>;
export type WitnessHealthResponse = z.infer<typeof WitnessHealthResponseSchema>;
export type WitnessInfoResponse = z.infer<typeof WitnessInfoResponseSchema>;
export type AdminMetricsResponse = z.infer<typeof AdminMetricsResponseSchema>;
export type ResolveConflictRequest = z.infer<typeof ResolveConflictRequestSchema>;
export type ResolveConflictResponse = z.infer<typeof ResolveConflictResponseSchema>;
export type WitnessPerformanceResponse = z.infer<typeof WitnessPerformanceResponseSchema>;

// WebSocket event types
export type RecordAttestedEvent = z.infer<typeof RecordAttestedEventSchema>;
export type ConflictDetectedEvent = z.infer<typeof ConflictDetectedEventSchema>;
export type ConflictResolvedEvent = z.infer<typeof ConflictResolvedEventSchema>;
export type WitnessStatusChangedEvent = z.infer<typeof WitnessStatusChangedEventSchema>;
