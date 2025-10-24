/**
 * JWKS Seed Script for Atlas API
 * 
 * Generates initial Ed25519 key pair for signing receipts (RFC 9421)
 * and stores public key in KV namespace for /.well-known/jwks.json
 */

import * as ed from '@noble/ed25519';
import { createHash, randomBytes } from 'crypto';

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
  // Generate Ed25519 key pair
  const privateKeyBytes = ed.utils.randomPrivateKey();
  const publicKeyBytes = await ed.getPublicKey(privateKeyBytes);

  // Generate kid (key ID) from public key hash
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

async function seedJWKS() {
  console.log('🔐 Generating JWKS for Atlas API...\n');

  const { publicKey, privateKey } = await generateKeyPair();

  console.log('✅ Key pair generated:');
  console.log(`   kid: ${publicKey.kid}`);
  console.log(`   alg: ${publicKey.alg}`);
  console.log(`   crv: ${publicKey.crv}\n`);

  console.log('📝 Public JWK (for JWKS):');
  console.log(JSON.stringify(publicKey, null, 2));
  console.log('');

  console.log('🔒 Private JWK (STORE SECURELY - DO NOT COMMIT):');
  console.log(JSON.stringify(privateKey, null, 2));
  console.log('');

  console.log('📋 Wrangler KV commands:');
  console.log(`   wrangler kv:key put --namespace-id=<JWKS_ID> "${publicKey.kid}" '${JSON.stringify(publicKey)}'`);
  console.log(`   wrangler kv:key put --namespace-id=<JWKS_ID> "current" "${publicKey.kid}"`);
  console.log('');

  console.log('⚠️  Save the private key to GitHub Secrets as ATLAS_SIGNING_KEY');
  console.log('⚠️  Never commit private keys to version control');
}

// Run seed
seedJWKS().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
