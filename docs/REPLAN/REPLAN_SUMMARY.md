# REPLAN SUMMARY

- Kept count: 511
- Removed count: 39
- Size savings: 9561259 bytes (9.1 MB)

## Top removals by size
path | bytes
---- | -----
_reports/SBOM.spdx | 4001783
atlas-v20250918-2305.tar.gz | 1534742
atlas-v20250917-2315.tar.gz | 1508522
atlas-v20250917-1957.tar.gz | 1508490
playwright-report/index.html | 461559
_reports/depgraph.png | 304038
.github/workflows/atlas-v14-dual-service-self-healing-gate.yml | 33537
.github/workflows/atlas-v13-performance-gate.yml | 32104
.github/workflows/atlas-v12-performance-gate.yml | 24411
apps/dev-portal/src/app/page.tsx | 21845

## Zero-404 summary
overall ok: 21
overall non200: 2

## Localhost after replan
count: 149752

## Typecheck/build
result: success

## Risks and follow-ups
- Verify app route imports after move (alias updates).
- Address non-200 assets in proof app icons.