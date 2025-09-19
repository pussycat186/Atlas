/**
 * OPA Policy Tests
 * 
 * Tests for Atlas authorization policies to ensure they work correctly
 * and enforce zero-trust principles.
 */

import { evaluate } from '@openpolicyagent/opa-wasm';

describe('OPA Policy Tests', () => {
  describe('Gateway Policy', () => {
    test('should allow health checks from any source', async () => {
      const input = {
        method: 'GET',
        path: '/health',
        source: { type: 'external', workload_id: 'unknown' },
        auth: { authenticated: false }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(true);
    });

    test('should allow metrics from monitoring', async () => {
      const input = {
        method: 'GET',
        path: '/metrics',
        source: { type: 'internal', workload_id: 'monitoring' },
        auth: { authenticated: false }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(true);
    });

    test('should allow message submission from proof-messenger', async () => {
      const input = {
        method: 'POST',
        path: '/record',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(true);
    });

    test('should deny message submission without authentication', async () => {
      const input = {
        method: 'POST',
        path: '/record',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: false }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(false);
    });

    test('should allow admin operations with admin role', async () => {
      const input = {
        method: 'GET',
        path: '/admin',
        source: { type: 'internal', workload_id: 'admin-insights' },
        auth: { authenticated: true, role: 'admin' }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(true);
    });

    test('should deny admin operations without admin role', async () => {
      const input = {
        method: 'GET',
        path: '/admin',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, role: 'user' }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(false);
    });
  });

  describe('Witness Policy', () => {
    test('should allow health checks', async () => {
      const input = {
        method: 'GET',
        path: '/witness/health',
        source: { type: 'external', workload_id: 'unknown' },
        auth: { workload_verified: false }
      };

      const result = await evaluate('atlas.witness', input);
      expect(result.allow).toBe(true);
    });

    test('should allow ledger operations from gateway', async () => {
      const input = {
        method: 'POST',
        path: '/witness/ledger',
        source: { type: 'internal', workload_id: 'gateway' },
        auth: { workload_verified: true }
      };

      const result = await evaluate('atlas.witness', input);
      expect(result.allow).toBe(true);
    });

    test('should allow witness-to-witness consensus', async () => {
      const input = {
        method: 'POST',
        path: '/witness/consensus',
        source: { type: 'internal', workload_id: 'witness-node' },
        auth: { workload_verified: true, witness_id: 'w1' }
      };

      const result = await evaluate('atlas.witness', input);
      expect(result.allow).toBe(true);
    });

    test('should deny external access to internal endpoints', async () => {
      const input = {
        method: 'POST',
        path: '/witness/ledger',
        source: { type: 'external', workload_id: 'unknown' },
        auth: { workload_verified: false }
      };

      const result = await evaluate('atlas.witness', input);
      expect(result.allow).toBe(false);
    });
  });

  describe('Drive Policy', () => {
    test('should allow health checks', async () => {
      const input = {
        method: 'GET',
        path: '/health',
        source: { type: 'external', workload_id: 'unknown' },
        auth: { authenticated: false }
      };

      const result = await evaluate('atlas.drive', input);
      expect(result.allow).toBe(true);
    });

    test('should allow file upload from proof-messenger', async () => {
      const input = {
        method: 'POST',
        path: '/files',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' },
        file_size: 1024
      };

      const result = await evaluate('atlas.drive', input);
      expect(result.allow).toBe(true);
    });

    test('should allow file retrieval from proof-messenger', async () => {
      const input = {
        method: 'GET',
        path: '/files',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' }
      };

      const result = await evaluate('atlas.drive', input);
      expect(result.allow).toBe(true);
    });

    test('should deny file operations without authentication', async () => {
      const input = {
        method: 'POST',
        path: '/files',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: false },
        file_size: 1024
      };

      const result = await evaluate('atlas.drive', input);
      expect(result.allow).toBe(false);
    });

    test('should enforce file size limits', async () => {
      const input = {
        method: 'POST',
        path: '/files',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' },
        file_size: 10485760 + 1 // Exceeds 10MB limit
      };

      const result = await evaluate('atlas.drive', input);
      expect(result.allow).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      const input = {
        method: 'POST',
        path: '/record',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' },
        rate_limit: { current: 500, limit: 1000 }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(true);
    });

    test('should deny requests exceeding rate limit', async () => {
      const input = {
        method: 'POST',
        path: '/record',
        source: { type: 'internal', workload_id: 'proof-messenger' },
        auth: { authenticated: true, user_id: 'user-123' },
        rate_limit: { current: 1001, limit: 1000 }
      };

      const result = await evaluate('atlas.gateway', input);
      expect(result.allow).toBe(false);
    });
  });
});
