/**
 * Atlas Admin Client
 * Client for admin dashboard operations
 */

import { AtlasFabricClient } from '@atlas/fabric-client';
import type { ConflictTicket, QuorumResult } from '@atlas/fabric-protocol';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

export const adminClient = new AtlasFabricClient(GATEWAY_URL);

export interface SystemMetrics {
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
}

export interface WitnessPerformance {
  witness_id: string;
  latency: number;
  success_rate: number;
  conflict_count: number;
  region: string;
}

export interface WitnessStatus {
  witness_id: string;
  status: 'active' | 'inactive' | 'error';
  last_seen: string;
  region: string;
}

export class AdminService {
  private client = adminClient;

  async getSystemMetrics(period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SystemMetrics> {
    try {
      const response = await fetch(`${GATEWAY_URL}/admin/metrics?period=${period}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      // Return mock data for development
      return {
        latency: { p50: 100, p95: 200, p99: 500 },
        quorum_rate: 0.95,
        conflict_rate: 0.02,
        witness_health: { w1: 1, w2: 1, w3: 1, w4: 1, w5: 0.8 },
        timestamp_skew: { min: 0, max: 1000, avg: 200 },
      };
    }
  }

  async getConflicts(options?: {
    since?: string;
    status?: 'open' | 'resolved' | 'escalated';
    limit?: number;
  }): Promise<ConflictTicket[]> {
    try {
      const params = new URLSearchParams();
      if (options?.since) params.append('since', options.since);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`${GATEWAY_URL}/api/conflicts?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch conflicts: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.conflicts;
    } catch (error) {
      console.error('Failed to get conflicts:', error);
      return [];
    }
  }

  async getConflict(conflictId: string): Promise<ConflictTicket | null> {
    try {
      const response = await fetch(`${GATEWAY_URL}/admin/conflicts/${conflictId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch conflict: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get conflict:', error);
      return null;
    }
  }

  async resolveConflict(
    conflictId: string,
    method: 'quorum_override' | 'manual',
    chosenAttestationId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${GATEWAY_URL}/admin/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          chosen_attestation_id: chosenAttestationId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve conflict: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }

  async getWitnessStatus(): Promise<WitnessStatus[]> {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/witnesses/status`);
      if (!response.ok) {
        throw new Error(`Failed to fetch witness status: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.witnesses;
    } catch (error) {
      console.error('Failed to get witness status:', error);
      return [];
    }
  }

  async getWitnessPerformance(period: '1h' | '24h' | '7d' = '24h'): Promise<WitnessPerformance[]> {
    try {
      const response = await fetch(`${GATEWAY_URL}/admin/witnesses/performance?period=${period}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch witness performance: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.witnesses;
    } catch (error) {
      console.error('Failed to get witness performance:', error);
      return [];
    }
  }

  async verifyRecord(recordId: string): Promise<QuorumResult | null> {
    try {
      return await this.client.verifyRecord(recordId);
    } catch (error) {
      console.error('Failed to verify record:', error);
      return null;
    }
  }
}

export const adminService = new AdminService();
