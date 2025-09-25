import LIVE from '../../../LIVE_URLS.json';

export const PROOF_FRONTEND: string | undefined = (LIVE as any)?.proof_messenger ?? undefined;
export const ADMIN_FRONTEND: string | undefined = (LIVE as any)?.admin_insights ?? undefined;
export const DEV_FRONTEND: string | undefined = (LIVE as any)?.dev_portal ?? undefined;

export const LIVE_URLS = Object.freeze({
  proof: PROOF_FRONTEND,
  admin: ADMIN_FRONTEND,
  dev: DEV_FRONTEND,
  gateway: (LIVE as any)?.gateway ?? undefined,
});

export function getGatewayUrl(): string {
  const gw = (LIVE as any)?.gateway;
  if (typeof gw === 'string' && gw.startsWith('https://')) return gw;
  throw new Error('BLOCKER_NO_LIVE_URLS');
}
