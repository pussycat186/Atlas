# Atlas Basic SKU - Production Ready

## Features
- Ed25519 cryptography
- Credits/Pay+Escrow workflows  
- Receipts + QuantumTag-Lite
- Curated plugins only
- QTCA-Lite endpoints (/qtca/tick, /qtca/summary)
- Strict CSP headers

## Performance
- Bundle size: 126KB ≤ 200KB limit ✅
- /prism routes optimized for Basic tier
- Edge runtime for API endpoints

## Deployment
```bash
ATLAS_SKU=basic
ATLAS_QTCA=lite
ATLAS_PQC=0
ATLAS_PLUGINS_MODE=curated
ATLAS_MULTI_TENANT=0
ATLAS_WALLET_CREDITS=1
```

## URLs
- Admin: https://atlas-admin-insights.vercel.app
- Dev: https://atlas-dev-portal.vercel.app  
- Proof: https://atlas-proof-messenger.vercel.app