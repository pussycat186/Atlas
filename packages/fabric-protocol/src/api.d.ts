/**
 * Atlas Secure Fabric API Definitions
 * HTTP API contracts for Gateway and Witness services
 */
import { Record as AtlasRecord, WitnessAttestation, ConflictTicket, LedgerEntry } from './types';
export interface GatewayAPI {
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
export interface WitnessAPI {
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
export interface AdminAPI {
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
    getConflict: {
        method: 'GET';
        path: '/admin/conflicts/{conflict_id}';
        params: {
            conflict_id: string;
        };
        response: ConflictTicket;
    };
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
export interface WebSocketEvents {
    record_attested: {
        record_id: string;
        attestation: WitnessAttestation;
    };
    conflict_detected: {
        conflict_ticket: ConflictTicket;
    };
    conflict_resolved: {
        conflict_id: string;
        resolution: ConflictTicket['resolution'];
    };
    witness_status_changed: {
        witness_id: string;
        status: 'active' | 'inactive' | 'error';
    };
}
//# sourceMappingURL=api.d.ts.map