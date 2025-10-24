#!/usr/bin/env bash
# Provision Cloudflare Resources for Atlas
# Creates KV namespaces, D1 database, and R2 bucket if they don't exist
# Updates wrangler.toml with actual resource IDs

set -euo pipefail

echo "🚀 Provisioning Cloudflare resources for Atlas..."
echo ""

# Create KV namespaces
echo "📦 Creating KV namespaces..."

JWKS_ID=$(wrangler kv:namespace create JWKS --json 2>/dev/null | jq -r '.id' || echo "")
if [ -z "$JWKS_ID" ]; then
  echo "   JWKS namespace already exists or creation failed"
  JWKS_ID=$(wrangler kv:namespace list --json | jq -r '.[] | select(.title | contains("JWKS")) | .id' | head -n1)
fi
echo "   ✅ JWKS: $JWKS_ID"

DPOP_NONCE_ID=$(wrangler kv:namespace create DPOP_NONCE --json 2>/dev/null | jq -r '.id' || echo "")
if [ -z "$DPOP_NONCE_ID" ]; then
  echo "   DPOP_NONCE namespace already exists or creation failed"
  DPOP_NONCE_ID=$(wrangler kv:namespace list --json | jq -r '.[] | select(.title | contains("DPOP_NONCE")) | .id' | head -n1)
fi
echo "   ✅ DPOP_NONCE: $DPOP_NONCE_ID"

IDEMPOTENCY_ID=$(wrangler kv:namespace create IDEMPOTENCY --json 2>/dev/null | jq -r '.id' || echo "")
if [ -z "$IDEMPOTENCY_ID" ]; then
  echo "   IDEMPOTENCY namespace already exists or creation failed"
  IDEMPOTENCY_ID=$(wrangler kv:namespace list --json | jq -r '.[] | select(.title | contains("IDEMPOTENCY")) | .id' | head -n1)
fi
echo "   ✅ IDEMPOTENCY: $IDEMPOTENCY_ID"

RATE_LIMIT_ID=$(wrangler kv:namespace create RATE_LIMIT --json 2>/dev/null | jq -r '.id' || echo "")
if [ -z "$RATE_LIMIT_ID" ]; then
  echo "   RATE_LIMIT namespace already exists or creation failed"
  RATE_LIMIT_ID=$(wrangler kv:namespace list --json | jq -r '.[] | select(.title | contains("RATE_LIMIT")) | .id' | head -n1)
fi
echo "   ✅ RATE_LIMIT: $RATE_LIMIT_ID"

echo ""

# Create D1 database
echo "🗄️  Creating D1 database..."
D1_ID=$(wrangler d1 create atlas --json 2>/dev/null | jq -r '.database_id' || echo "")
if [ -z "$D1_ID" ]; then
  echo "   Database already exists or creation failed"
  D1_ID=$(wrangler d1 list --json | jq -r '.[] | select(.name == "atlas") | .uuid' | head -n1)
fi
echo "   ✅ D1 atlas: $D1_ID"

echo ""

# Create R2 bucket
echo "🪣  Creating R2 bucket..."
wrangler r2 bucket create atlas-media 2>/dev/null || echo "   Bucket already exists"
echo "   ✅ R2 atlas-media created"

echo ""

# Update wrangler.toml
echo "📝 Updating wrangler.toml with resource IDs..."

if [ -f "services/atlas-api/wrangler.toml" ]; then
  cp services/atlas-api/wrangler.toml services/atlas-api/wrangler.toml.bak
fi

sed -e "s/__JWKS_NAMESPACE_ID__/${JWKS_ID}/g" \
    -e "s/__DPOP_NONCE_NAMESPACE_ID__/${DPOP_NONCE_ID}/g" \
    -e "s/__IDEMPOTENCY_NAMESPACE_ID__/${IDEMPOTENCY_ID}/g" \
    -e "s/__RATE_LIMIT_NAMESPACE_ID__/${RATE_LIMIT_ID}/g" \
    -e "s/__D1_DATABASE_ID__/${D1_ID}/g" \
    infra/cloudflare/wrangler.template.toml > services/atlas-api/wrangler.toml

echo "   ✅ wrangler.toml updated"

echo ""

# Run migrations
echo "🔄 Running D1 migrations..."
wrangler d1 migrations apply atlas --local
wrangler d1 migrations apply atlas --remote

echo "   ✅ Migrations applied"

echo ""
echo "✅ Provisioning complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: tsx infra/cloudflare/seed/seed_jwks.ts"
echo "   2. Upload JWKS to KV using the commands from seed output"
echo "   3. Deploy: wrangler deploy"
