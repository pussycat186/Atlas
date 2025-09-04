/**
 * Atlas Secure Fabric API Definitions
 * HTTP API contracts for Gateway and Witness services
 */

import { AtlasRecord, WitnessAttestation, ConflictTicket, LedgerEntry } from './types';

// Gateway API endpoints
export interface GatewayAPI {
  // Record submission
  submitRecord: {
    method: 'POST';
    path: '/api/records';
    body: {
      app: 'chat' | 'drive';
      record_id: string;
      payload: string;
      meta: Record<string, any>;
    };
    response: {
      success: boolean;
      record_id: string;
      attestations: WitnessAttestation[];
      quorum_result: {
        ok: boolean;
        quorum_count: number;
        max_skew_ms: number;
        conflict_ticket?: string;
      };
    };
  };

  // Record verification
  verifyRecord: {
    method: 'GET';
    path: '/api/records/{record_id}/verify';
    params: {
      record_id: string;
    };
    response: {
      record_id: string;
      verified: boolean;
      attestations: WitnessAttestation[];
      quorum_result: {
        ok: boolean;
        quorum_count: number;
        max_skew_ms: number;
      };
    };
  };

  // Get conflicts
  getConflicts: {
    method: 'GET';
    path: '/api/conflicts';
    query: {
      since?: string;
      status?: 'open' | 'resolved' | 'escalated';
      limit?: number;
    };
    response: {
      conflicts: ConflictTicket[];
      total: number;
    };
  };

  // Get witness status
  getWitnessStatus: {
    method: 'GET';
    path: '/api/witnesses/status';
    response: {
      witnesses: Array<{
        witness_id: string;
        status: 'active' | 'inactive' | 'error';
        last_seen: string;
        region: string;
      }>;
    };
  };
}

// Witness API endpoints
export interface WitnessAPI {
  // Record submission to witness
  submitRecord: {
    method: 'POST';
    path: '/witness/record';
    body: {
      app: 'chat' | 'drive';
      record_id: string;
      payload: string;
      meta: Record<string, any>;
    };
    response: WitnessAttestation;
  };

  // Get witness ledger
  getLedger: {
    method: 'GET';
    path: '/witness/ledger';
    query: {
      since?: string;
      limit?: number;
    };
    response: {
      entries: LedgerEntry[];
      total: number;
      witness_id: string;
    };
  };

  // Get specific record from witness
  getRecord: {
    method: 'GET';
    path: '/witness/records/{record_id}';
    params: {
      record_id: string;
    };
    response: {
      record: AtlasRecord;
      attestation: WitnessAttestation;
    } | null;
  };

  // Health check
  health: {
    method: 'GET';
    path: '/witness/health';
    response: {
      status: 'healthy' | 'unhealthy';
      witness_id: string;
      uptime: number;
      ledger_size: number;
      last_record_ts: string;
    };
  };

  // Get witness info
  info: {
    method: 'GET';
    path: '/witness/info';
    response: {
      witness_id: string;
      region: string;
      version: string;
      security_track: 'Z' | 'L';
      public_key?: string;
    };
  };
}

// Admin API endpoints
export interface AdminAPI {
  // Get system metrics
  getMetrics: {
    method: 'GET';
    path: '/admin/metrics';
    query: {
      period?: '1h' | '24h' | '7d' | '30d';
    };
    response: {
      latency: {
        p50: number;
        p95: number;
        p99: number;
      };
      quorum_rate: number;
      conflict_rate: number;
      witness_health: Record<string, number>;
      timestamp_skew: {
        min: number;
        max: number;
        avg: number;
      };
    };
  };

  // Get conflict details
  getConflict: {
    method: 'GET';
    path: '/admin/conflicts/{conflict_id}';
    params: {
      conflict_id: string;
    };
    response: ConflictTicket;
  };

  // Resolve conflict
  resolveConflict: {
    method: 'POST';
    path: '/admin/conflicts/{conflict_id}/resolve';
    params: {
      conflict_id: string;
    };
    body: {
      method: 'quorum_override' | 'manual';
      chosen_attestation_id: string;
      reason: string;
    };
    response: {
      success: boolean;
      resolution: ConflictTicket['resolution'];
    };
  };

  // Get witness performance
  getWitnessPerformance: {
    method: 'GET';
    path: '/admin/witnesses/performance';
    query: {
      period?: '1h' | '24h' | '7d';
    };
    response: {
      witnesses: Array<{
        witness_id: string;
        latency: number;
        success_rate: number;
        conflict_count: number;
        region: string;
      }>;
    };
  };
}

// WebSocket events for real-time updates
export interface WebSocketEvents {
  // New record attestation
  record_attested: {
    record_id: string;
    attestation: WitnessAttestation;
  };

  // Conflict detected
  conflict_detected: {
    conflict_ticket: ConflictTicket;
  };

  // Conflict resolved
  conflict_resolved: {
    conflict_id: string;
    resolution: ConflictTicket['resolution'];
  };

  // Witness status change
  witness_status_changed: {
    witness_id: string;
    status: 'active' | 'inactive' | 'error';
  };
}
