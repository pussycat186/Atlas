import LIVE from '../../../LIVE_URLS.json';

export const PROOF_FRONTEND = (LIVE as any)?.frontends?.proof_messenger ?? undefined;
export const ADMIN_FRONTEND = (LIVE as any)?.frontends?.admin_insights ?? undefined;
export const DEV_FRONTEND = (LIVE as any)?.frontends?.dev_portal ?? undefined;

export const LIVE_URLS = Object.freeze({
  proof: PROOF_FRONTEND,
  admin: ADMIN_FRONTEND,
  dev: DEV_FRONTEND,
  gateway: (LIVE as any)?.backends?.gateway ?? undefined,
});

export function getGatewayUrl(): string {
  const gateway = (LIVE as any)?.backends?.gateway;
  if (typeof gateway === 'string' && gateway.length > 0) {
    return gateway;
  }
  throw new Error('BLOCKER_NO_LIVE_URLS');
}
