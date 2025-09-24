import { readFileSync } from 'fs';
import path from 'path';

export type LiveUrls = {
  proof: string;
  admin: string;
  dev: string;
  gateway: string;
};

const LIVE_URLS_PATH = path.resolve(process.cwd(), 'LIVE_URLS.json');
const LIVE_URLS: LiveUrls = JSON.parse(readFileSync(LIVE_URLS_PATH, 'utf-8'));

export const PROOF_FRONTEND = LIVE_URLS.proof;
export const ADMIN_FRONTEND = LIVE_URLS.admin;
export const DEV_FRONTEND = LIVE_URLS.dev;

export function getGatewayUrl(): string {
  if (!LIVE_URLS.gateway) {
    throw new Error("BLOCKER_NO_LIVE_URLS: gateway");
  }
  return LIVE_URLS.gateway;
}

export default LIVE_URLS;
