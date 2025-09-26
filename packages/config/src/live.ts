// Browser-safe config without filesystem imports
// Static fallback URLs for production deployment
export const PROOF_FRONTEND: string = 'https://atlas-proof-messenger.vercel.app';
export const ADMIN_FRONTEND: string = 'https://atlas-admin-insights.vercel.app';
export const DEV_FRONTEND: string = 'https://atlas-dev-portal.vercel.app';

export const LIVE_URLS = Object.freeze({
  proof: PROOF_FRONTEND,
  admin: ADMIN_FRONTEND,
  dev: DEV_FRONTEND,
  gateway: 'https://atlas-gateway.sonthenguyen186.workers.dev',
});

export function getGatewayUrl(): string {
  // Return static gateway URL for browser compatibility
  return 'https://atlas-gateway.sonthenguyen186.workers.dev';
}
