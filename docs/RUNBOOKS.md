# Atlas Messenger - Operations Runbook# Atlas Runbooks



**Version**: 2.0  ## 1. Key Leak Response

**Last Updated**: 2025-10-25  

**Platform**: Cloudflare (Workers + Pages + KV + D1 + R2)**Trigger**: Private key exposed in logs/code



## Deployment**Actions**:

1. Rotate JWKS immediately (emergency rotation)

### Initial Setup2. Revoke compromised kid

3. Notify users (in-app banner)

1. **Provision Resources** (one-time):4. Audit all receipts signed with compromised key

   ```bash5. Post-mortem within 24h

   wrangler kv:namespace create JWKS

   wrangler kv:namespace create DPOP_NONCE## 2. Performance Regression

   wrangler kv:namespace create IDEMPOTENCY

   wrangler kv:namespace create RATE_LIMIT**Trigger**: p95 latency > 200ms for 10 minutes

   wrangler d1 create atlas

   wrangler r2 bucket create atlas-media**Actions**:

   ```1. Check Cloud Run metrics (CPU, memory, concurrency)

2. Review recent deployments (rollback if needed)

2. **Run D1 Migrations**:3. Check database queries (Firestore)

   ```bash4. Scale up instances if needed

   cd services/atlas-api5. Create incident report

   wrangler d1 migrations apply atlas --remote

   ```## 3. Supply-Chain Alert



3. **Generate JWKS**:**Trigger**: Trivy finds HIGH/CRITICAL vulnerability

   ```bash

   cd infra/cloudflare/seed**Actions**:

   pnpm install1. Block deployment (CI gate)

   tsx seed_jwks.ts2. Assess impact (reachable? exploitable?)

   # Follow output instructions to upload to KV3. Update dependency or apply patch

   ```4. Re-scan and verify fix

5. Deploy patched version

### Deploy Workers6. Announce in Trust Portal



```bash---

cd services/atlas-api

pnpm install && pnpm run build**Ngày tạo**: 2025-10-21

wrangler deploy
```

### Deploy Pages

```bash
cd apps/messenger-web
pnpm install && pnpm run pages:build
wrangler pages deploy .vercel/output/static --project-name=atlas-messenger
```

## JWKS Rotation

**Frequency**: Every 90 days  
**Overlap**: Keep old keys for 7 days

```bash
cd infra/cloudflare/seed
tsx rotate_jwks.ts
# Upload new key to KV
# Update current pointer
# Wait 7 days before removing old key
```

## Rollback

### Pages
```bash
wrangler pages deployment list --project-name=atlas-messenger
wrangler pages deployment promote <deployment-id> --project-name=atlas-messenger
```

### Workers
```bash
git checkout <previous-commit>
cd services/atlas-api
wrangler deploy
```

## Monitoring

### Health Check
```bash
curl https://atlas-api.workers.dev/healthz
```

### Logs
```bash
wrangler tail atlas-api
```

## Quotas

- Workers: 100K req/day (free), 10M req/day (paid $5/mo)
- KV: 100K reads/day, 1K writes/day (free)
- D1: 5M rows read/day, 100K rows write/day
- R2: 10 GB storage (free)
