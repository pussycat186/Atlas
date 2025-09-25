# ATLAS REPLAN BLUEPRINT

## Target Directory Layout
apps/
proof-messenger/ (Next app/; Messenger UX)
admin-insights/ (Status/metrics/QTCA dashboards)
dev-portal/ (Plugins registry + SDK docs)
services/
gateway/ (Workers API; receipts/credits/QTCA)
witness*/ (evidence/ledger)
packages/
config/ (LIVE_URLS + getGatewayUrl)
design-system/ (tokens/components used)
pqc/ (PQC + Ed25519 fallback) [if referenced]
quantum-sync/ (QTCA hooks/SDK) [if referenced]
docs/
evidence/<ts>/
REPLAN/*

## Old → New Mapping (examples)
| from | to | reason |
|------|----|--------|
| apps/*/src/app/** | apps/*/app/** | Next 13+ app dir, unify |
| examples/** | (removed) | demo/POC |
| tests/e2e/** (local) | (removed) | localhost |

## SKU Flags
ATLAS_SKU=basic|pro; ATLAS_QTCA=lite|full; ATLAS_PQC=0|1; ATLAS_MULTI_TENANT=0|1; ATLAS_PLUGINS_MODE=curated|market

## Zero-404 Contract
All nav in 3 apps must resolve 200 on production URLs from LIVE_URLS.json.

## Keep/Delete/Move Rules
- Keep: prod apps, Workers, used packages, root configs.
- Delete: demos/storybook/examples/local e2e/legacy workflows.
- Move: legacy `src/app`  → `app` ; update imports/paths.
