# Atlas Monorepo

Production-first monorepo for the **Atlas** web apps.

## Live

- Proof Messenger: **https://atlas-proof-messenger.vercel.app**
- Admin Insights: **https://atlas-admin-insights.vercel.app**
- Dev Portal: **https://atlas-dev-portal.vercel.app**

### Prism UI Preview
- Proof `/prism` : **https://atlas-proof-messenger.vercel.app/prism**
- Insights `/prism` : **https://atlas-admin-insights.vercel.app/prism**
- Dev `/prism` : **https://atlas-dev-portal.vercel.app/prism**

> Each `/prism`  page includes the marker text: `ATLAS • Prism UI — Peak Preview` .

## Structure

apps/
proof-messenger/
admin-insights/
dev-portal/
packages/
scripts/
docs/

python
Sao chép mã

## Quickstart (local)

```bash
pnpm -w i
pnpm --filter "./apps/*" dev
Build
bash
Sao chép mã
pnpm --filter "./apps/*" build
Deploy (CI)
This repo uses GitHub Actions + Vercel CLI. Required repo Secrets:

VERCEL_TOKEN

VERCEL_ORG_ID

VERCEL_PROJECT_ID_PROOF

VERCEL_PROJECT_ID_INSIGHTS

VERCEL_PROJECT_ID_DEV

Workflow: .github/workflows/deploy-frontends.yml

Navigation Audit
Asset-aware audit script:

bash
Sao chép mã
node scripts/replan-nav-audit.js
Checks each app for: /, /prism, /favicon.svg, /manifest.json

Accepts 2xx/3xx; /prism must contain the marker text.

Writes: docs/REPLAN/NAV_AUDIT.json and timestamped evidence.

Troubleshooting (CI gates)
Code	Meaning / Fix
BLOCKER_MISSING_SECRET:<NAME>	Add the missing secret in Repo Settings → Actions → Secrets.
BLOCKER_NAV_ASSETS	Fix manifest/icons (SVG-only) and redeploy.
BLOCKER_LIVE_URLS	Ensure LIVE_URLS.json matches the required schema.
BLOCKER_WORKFLOW_ERROR:<file>	Open the workflow run, check the failing step/logs.

License
MIT

