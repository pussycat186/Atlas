import { randomBytes } from 'crypto';

// DPoP verifier minimal implementation (Node-friendly)
// Focus: verify method (htm), url (htu), iat (clock skew), jti anti-replay.

const usedJtis = new Set<string>();
const JTI_EXPIRY_MS = 60 * 1000; // 60 seconds

export interface DPoPProof {
  jti: string;
  htm: string;
  htu: string;
  iat: number;
  jwt?: string; // raw jwt if present
}

export function base64UrlEncode(input: Uint8Array) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecodeToString(input: string) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b, 'base64').toString('utf8');
}

export function parseJwt(jwt: string) {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('invalid jwt');
  const header = JSON.parse(base64UrlDecodeToString(parts[0]));
  const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
  return { header, payload, signature: parts[2] };
}

export function verifyProof(proofJwt: string, expectedMethod: string, expectedHtu: string, now = Math.floor(Date.now() / 1000)) {
  const { payload } = parseJwt(proofJwt);
  const jti = payload.jti;
  const htm = payload.htm;
  const htu = payload.htu;
  const iat = payload.iat;

  if (!jti || !htm || !htu || !iat) throw new Error('missing claims');
  if (htm.toLowerCase() !== expectedMethod.toLowerCase()) throw new Error('htm mismatch');
  if (htu !== expectedHtu) throw new Error('htu mismatch');
  if (Math.abs(iat - now) > 300) throw new Error('iat skew');
  if (usedJtis.has(jti)) throw new Error('replay');

  usedJtis.add(jti);
  setTimeout(() => usedJtis.delete(jti), JTI_EXPIRY_MS);
  return true;
}

export function cleanupJtiStore() {
  usedJtis.clear();
}

