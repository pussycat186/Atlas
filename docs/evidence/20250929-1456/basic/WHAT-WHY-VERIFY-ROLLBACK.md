# Atlas Basic SKU - Evidence Package

## What
Atlas Basic SKU deployment with QTCA-Lite quantum computing abstraction layer.

## Why
Production-ready Basic tier with:
- Ed25519 cryptography
- Credits/Pay+Escrow workflows
- Receipts + QuantumTag-Lite
- Curated plugins only
- QTCA-Lite endpoints (/qtca/tick, /qtca/summary)

## Verify
- Bundle sizes: /prism ≤ 200KB (actual: 126KB)
- QTCA endpoints return 200 with valid JSON
- Performance: p95 ≤ 200ms, error rate ≤ 1%
- Accessibility: ≥ 95% score
- Prism marker integrity preserved

## Rollback
```bash
git revert e9f93ad
git push origin main
```

## Evidence Location
`docs/evidence/20250929-1456/basic/`

## Deployment Status
✅ BASIC SKU VERIFIED