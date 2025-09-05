/**
 * Atlas Secure Fabric Protocol Types
 * Zero-crypto messaging and storage platform with multi-witness quorum
 */

export interface AtlasRecord {
  /** Unique identifier for this record */
  record_id: string;
  /** Timestamp when record was created (ISO 8601) */
  ts: string;
  /** Application context (chat, drive, etc.) */
  app: 'chat' | 'drive';
  /** The actual payload data */
  payload: string;
  /** Additional metadata */
  meta: RecordMeta;
  /** Current state view from witness perspective */
  state_view: StateView;
}

export interface RecordMeta {
  /** Room ID for chat messages */
  room_id?: string;
  /** Chunk ID for file storage */
  chunk_id?: string;
  /** File name for drive operations */
  filename?: string;
  /** Message type for chat */
  message_type?: 'text' | 'file' | 'system';
  /** File size in bytes */
  size?: number;
  /** MIME type for files */
  mime_type?: string;
  /** Parent record ID for threading */
  parent_id?: string;
  /** User ID who created this record */
  user_id?: string;
}

export interface StateView {
  /** Record ID this state view refers to */
  record_id: string;
  /** Sequential order in witness ledger */
  order: number;
  /** Size of the record in bytes */
  size: number;
  /** Witness-specific state hash (optional for Track-L) */
  state_hash?: string;
  /** Previous record ID in chain */
  prev_record_id?: string;
}

export interface WitnessAttestation {
  /** Unique witness identifier */
  witness_id: string;
  /** Whether witness accepts this record */
  accept: boolean;
  /** Timestamp when witness processed record */
  ts: string;
  /** Witness's state view of the record */
  state_view: StateView;
  /** Reference to conflict ticket if any */
  conflict_ref?: string;
  /** Witness signature (optional for Track-L) */
  signature?: string;
}

export interface ConflictTicket {
  /** Unique conflict identifier */
  conflict_id: string;
  /** Record ID that caused the conflict */
  record_id: string;
  /** Timestamp when conflict was detected */
  detected_at: string;
  /** Witnesses that disagree */
  disagreeing_witnesses: string[];
  /** Conflicting attestations */
  attestations: WitnessAttestation[];
  /** Resolution status */
  status: 'open' | 'resolved' | 'escalated';
  /** Resolution details if resolved */
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  /** How the conflict was resolved */
  method: 'quorum_override' | 'manual' | 'timeout';
  /** Timestamp when resolved */
  resolved_at: string;
  /** Which attestation was chosen as correct */
  chosen_attestation: WitnessAttestation;
  /** Reason for resolution */
  reason: string;
}

export interface QuorumResult {
  /** Whether quorum was achieved */
  ok: boolean;
  /** Number of consistent attestations */
  quorum_count: number;
  /** Required quorum size */
  required_quorum: number;
  /** Total witnesses consulted */
  total_witnesses: number;
  /** Maximum timestamp skew in milliseconds */
  max_skew_ms: number;
  /** Whether timestamp skew is within acceptable range */
  skew_ok: boolean;
  /** Consistent attestations */
  consistent_attestations: WitnessAttestation[];
  /** Conflicting attestations */
  conflicting_attestations: WitnessAttestation[];
  /** Conflict ticket if generated */
  conflict_ticket?: ConflictTicket;
}

export interface LedgerEntry {
  /** Record data */
  record: AtlasRecord;
  /** Witness attestation */
  attestation: WitnessAttestation;
  /** Timestamp when added to ledger */
  ledger_ts: string;
}

export interface WitnessConfig {
  /** Witness identifier */
  witness_id: string;
  /** Witness endpoint URL */
  endpoint: string;
  /** Geographic region */
  region: string;
  /** Whether witness is currently active */
  active: boolean;
  /** Witness public key (for Track-L) */
  public_key?: string;
}

export interface FabricConfig {
  /** Total number of witness nodes */
  total_witnesses: number;
  /** Required quorum size */
  quorum_size: number;
  /** Maximum acceptable timestamp skew in milliseconds */
  max_timestamp_skew_ms: number;
  /** List of witness configurations */
  witnesses: WitnessConfig[];
  /** Ledger mirror endpoints */
  mirror_endpoints: string[];
  /** Security track (Z for zero-crypto, L for crypto-lite) */
  security_track: 'Z' | 'L';
}

// Default Atlas configuration
export const DEFAULT_FABRIC_CONFIG: FabricConfig = {
  total_witnesses: 5,
  quorum_size: 4,
  max_timestamp_skew_ms: 2000,
  witnesses: [
    { witness_id: 'w1', endpoint: 'http://witness-1:3001', region: 'us-east-1', active: true },
    { witness_id: 'w2', endpoint: 'http://witness-2:3001', region: 'us-west-2', active: true },
    { witness_id: 'w3', endpoint: 'http://witness-3:3001', region: 'eu-west-1', active: true },
    { witness_id: 'w4', endpoint: 'http://witness-4:3001', region: 'ap-southeast-1', active: true },
    { witness_id: 'w5', endpoint: 'http://witness-5:3001', region: 'ap-northeast-1', active: true }
  ],
  mirror_endpoints: [
    'https://ledger-mirror-1.s3.amazonaws.com',
    'https://ipfs.io/ipfs/ledger-mirror-2'
  ],
  security_track: 'Z'
};
