// Import LIVE_URLS.json at build time
import LIVE from '../../../LIVE_URLS.json';

export const PROOF_FRONTEND = LIVE.proof;
export const ADMIN_FRONTEND = LIVE.admin;
export const DEV_FRONTEND = LIVE.dev;

export function getGatewayUrl(): string {
  if (!LIVE.gateway) throw new Error('BLOCKER_NO_LIVE_URLS');
  return LIVE.gateway;
}

export const LIVE_URLS = Object.freeze(LIVE);

export type LiveUrls = {
  frontends?: { 
    proof?: string; 
    admin?: string; 
    dev?: string; 
  };
  gateway: string;
  witnesses?: string[];
};

export function readLiveUrls(): LiveUrls {
  const env = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim();
  const gw = env || (globalThis as any).__LIVE_URLS__?.gateway;
  if (!gw) throw new Error("LIVE_URLS not present: gateway");
  return {
    gateway: gw,
    frontends: (globalThis as any).__LIVE_URLS__?.frontends || {},
    witnesses: (globalThis as any).__LIVE_URLS__?.witnesses || [],
  };
}

export function getFrontendUrl(app: 'proof' | 'admin' | 'dev'): string | undefined {
  return readLiveUrls().frontends?.[app];
}

export function getWitnessUrls(): string[] {
  return readLiveUrls().witnesses || [];
}

// Helper to inject LIVE_URLS into globalThis for SSR
export function injectLiveUrls(urls: LiveUrls): void {
  (globalThis as any).__LIVE_URLS__ = urls;
}
