# Atlas Monorepo

Production-first monorepo for **Atlas** web applications with quantum-grade architecture.

## Live Applications

- **Proof Messenger**: https://atlas-proof-messenger.vercel.app
- **Admin Insights**: https://atlas-admin-insights.vercel.app  
- **Dev Portal**: https://atlas-dev-portal.vercel.app

### Prism UI Preview
- Proof `/prism`: https://atlas-proof-messenger.vercel.app/prism
- Insights `/prism`: https://atlas-admin-insights.vercel.app/prism
- Dev `/prism`: https://atlas-dev-portal.vercel.app/prism

> Each `/prism` page contains the marker: `ATLAS • Prism UI — Peak Preview`

## Quantum-Grade Architecture

**Runtime Strategy:**
- Server Components + Route Handlers (RSC-first)
- Edge runtime for IO-light endpoints
- No Node.js APIs in client code
- Client config via `NEXT_PUBLIC_*` only

**Performance Guardrails:**
- Minimal client JS bundles
- SVG-only icons (no PNG/bitmap)
- WASM-ready hot paths (feature-flagged)
- Low-overhead data adapters

**Build Strategy:**
- Single root build → prebuilt Vercel deploys
- Shared packages via pnpm workspace
- Transpiled packages for Next.js compatibility

## Repository Structure

```
apps/
├── admin-insights/     # Admin dashboard
├── dev-portal/         # Developer portal  
└── proof-messenger/    # Messaging app
packages/
├── @atlas/design-system/
├── config/
├── fabric-client/
├── fabric-crypto/
└── fabric-protocol/
services/               # Backend services
scripts/               # Build & audit tools
```

## Required Secrets

Configure in GitHub Repository Settings → Actions → Secrets:

- `VERCEL_TOKEN` - Vercel CLI authentication
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_PROOF` - proof-messenger project
- `VERCEL_PROJECT_ID_INSIGHTS` - admin-insights project  
- `VERCEL_PROJECT_ID_DEV` or `VERCEL_PROJECT_ID_DEVPORTAL` - dev-portal project (fallback)

## CI/CD Pipeline

**Trigger:** Push to `main` or manual dispatch

**Steps:**
1. **Secret Gate** - Validates all required secrets, computes DEV fallback
2. **Build** - Single root build with pnpm workspace
3. **Deploy** - Prebuilt deployment to Vercel per app
4. **Audit** - Validates `/prism` endpoints contain required marker

**Concurrency:** `deploy-frontends` group with cancel-in-progress

## Local Development

```bash
# Install dependencies
pnpm install

# Start all apps in development
pnpm --filter "./apps/*" dev

# Build all apps
pnpm --filter "./apps/*" build

# Run tests
pnpm test
```

## Deployment Runbook

### Manual Deploy
```bash
# Trigger via GitHub Actions
gh workflow run deploy-frontends.yml

# Or via GitHub UI: Actions → Deploy Frontends → Run workflow
```

### Emergency Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback via Vercel dashboard per app
```

### Audit Verification
```bash
# Run audit locally
node scripts/audit-prism.mjs

# Expected output (success):
{"admin_insights":{"status":200,"marker":true},"dev_portal":{"status":200,"marker":true},"proof_messenger":{"status":200,"marker":true}}
```

## Troubleshooting

| Code | Meaning / Fix |
|------|---------------|
| `BLOCKER_MISSING_SECRET:<NAME>` | Add missing secret in Repo Settings → Actions → Secrets |
| `BLOCKER_WORKFLOW_ERROR:deploy-frontends.yml` | Check workflow run logs for failing step |
| `BLOCKER_VERCEL_CONNECT_GIT:<project>` | Connect Vercel project to Git repository |

### Common Issues

**Build Failures:**
- Ensure pnpm version ≥8.0.0
- Check `pnpm-lock.yaml` is committed
- Verify workspace dependencies in `package.json`

**Deploy Failures:**  
- Validate Vercel project IDs match repository secrets
- Ensure Vercel CLI has proper permissions
- Check build outputs exist in `apps/*/dist` or `.next`

**Audit Failures:**
- Verify `/prism` routes return 200 status
- Check HTML contains exact marker text
- Ensure no redirect loops

## Acceptance Criteria

✅ `/prism` endpoints return 200 with marker: `ATLAS • Prism UI — Peak Preview`  
✅ Single robust GitHub Actions workflow with secret fallback  
✅ Prebuilt Vercel deployments from root build  
✅ SVG-only assets, no PNG references  
✅ Quantum-grade architecture (RSC + Edge + WASM-ready)

## License

MIT