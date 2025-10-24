/**
 * Health Check Handler
 * Verifies KV, D1, and R2 connectivity
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleHealth(request: Request, env: Env): Promise<Response> {
  const checks: Record<string, boolean> = {};

  try {
    // Check JWKS KV
    await env.JWKS.list({ limit: 1 });
    checks.jwks = true;
  } catch {
    checks.jwks = false;
  }

  try {
    // Check DPOP_NONCE KV
    await env.DPOP_NONCE.list({ limit: 1 });
    checks.dpop_nonce = true;
  } catch {
    checks.dpop_nonce = false;
  }

  try {
    // Check D1
    await env.DB.prepare('SELECT 1').first();
    checks.database = true;
  } catch {
    checks.database = false;
  }

  try {
    // Check R2
    await env.MEDIA.list({ limit: 1 });
    checks.storage = true;
  } catch {
    checks.storage = false;
  }

  const allHealthy = Object.values(checks).every((v) => v);

  return jsonResponse(
    {
      ok: allHealthy,
      checks,
      timestamp: new Date().toISOString(),
    },
    allHealthy ? 200 : 503
  );
}
