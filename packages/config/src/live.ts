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

export async function getGatewayUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim();
  if (env) return env;
  // @ts-ignore
  const g = (globalThis as any).__LIVE_URLS__?.gateway;
  if (g) return g;
  const res = await fetch('/LIVE_URLS.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('LIVE_URLS.json not found');
  const j = await res.json();
  if (!j?.gateway) throw new Error('LIVE_URLS.json missing gateway');
  return j.gateway;
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
