import LIVE from '../../../LIVE_URLS.json';

export const PROOF_FRONTEND = LIVE?.proof ?? undefined;
export const ADMIN_FRONTEND = LIVE?.admin ?? undefined;
export const DEV_FRONTEND = LIVE?.dev ?? undefined;

export const LIVE_URLS = Object.freeze({
  proof: PROOF_FRONTEND,
  admin: ADMIN_FRONTEND,
  dev: DEV_FRONTEND,
  gateway: LIVE?.gateway ?? undefined,
});

export function getGatewayUrl(): string {
  if (typeof LIVE?.gateway === 'string' && LIVE.gateway.length > 0) {
    return LIVE.gateway;
  }
  throw new Error('BLOCKER_NO_LIVE_URLS');
}
