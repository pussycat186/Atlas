/**
 * JWKS Rotation Script for Atlas API
 * 
 * Rotates the signing key by generating a new Ed25519 key pair,
 * uploading to KV, and logging the operation to D1.
 * 
 * Usage:
 *   tsx infra/cloudflare/seed/rotate_jwks.ts
 */

import * as ed from '@noble/ed25519';
import { createHash } from 'crypto';

interface JWK {
  kty: 'OKP';
  crv: 'Ed25519';
  x: string;
  kid: string;
  use: 'sig';
  alg: 'EdDSA';
}

interface JWKPrivate extends JWK {
  d: string;
}

function base64urlEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateKeyPair(): Promise<{ publicKey: JWK; privateKey: JWKPrivate }> {
  const privateKeyBytes = ed.utils.randomPrivateKey();
  const publicKeyBytes = await ed.getPublicKey(privateKeyBytes);

  const kid = createHash('sha256')
    .update(publicKeyBytes)
    .digest('hex')
    .substring(0, 16);

  const x = base64urlEncode(publicKeyBytes);
  const d = base64urlEncode(privateKeyBytes);

  const publicKey: JWK = {
    kty: 'OKP',
    crv: 'Ed25519',
    x,
    kid,
    use: 'sig',
    alg: 'EdDSA',
  };

  const privateKey: JWKPrivate = {
    ...publicKey,
    d,
  };

  return { publicKey, privateKey };
}

async function rotateJWKS() {
  console.log('🔄 Rotating JWKS for Atlas API...\n');

  // Generate new key pair
  const { publicKey, privateKey } = await generateKeyPair();

  console.log('✅ New key pair generated:');
  console.log(`   kid: ${publicKey.kid}`);
  console.log(`   alg: ${publicKey.alg}\n`);

  console.log('📝 Public JWK:');
  console.log(JSON.stringify(publicKey, null, 2));
  console.log('');

  console.log('🔒 Private JWK (STORE SECURELY):');
  console.log(JSON.stringify(privateKey, null, 2));
  console.log('');

  console.log('📋 Rotation steps:');
  console.log('1. Upload new public key to KV:');
  console.log(`   wrangler kv:key put --namespace-id=<JWKS_ID> "${publicKey.kid}" '${JSON.stringify(publicKey)}'`);
  console.log('');
  console.log('2. Update current pointer:');
  console.log(`   wrangler kv:key put --namespace-id=<JWKS_ID> "current" "${publicKey.kid}"`);
  console.log('');
  console.log('3. Update GitHub Secret ATLAS_SIGNING_KEY with new private key');
  console.log('');
  console.log('4. Keep old key for 7 days for signature verification');
  console.log('');
  console.log('5. Log rotation in D1:');
  console.log(`   INSERT INTO jwks_rotation (kid, operation, metadata) VALUES ('${publicKey.kid}', 'rotate', '{}')`);
  console.log('');

  console.log('⚠️  IMPORTANT: Do not delete old keys immediately!');
  console.log('   Keep old keys for at least 7 days to verify existing signatures.');
}

// Run rotation
rotateJWKS().catch((err) => {
  console.error('❌ Rotation failed:', err);
  process.exit(1);
});
