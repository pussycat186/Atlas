# Atlas Proof Messenger

## Purpose
Production-only proof messaging application showcasing receipts, verification, and a zero-404 navigation contract.

## Key Routes
- `/` — Home (composer, receipts, quickstart)
- `/messages` — Messages list
- `/receipts` — Receipts viewer
- `/settings` — App settings
- `/evidence` — Evidence page
- `/offline` — Offline fallback

## Data-testid Contract (subset)
- `tab-messenger`, `tab-admin`, `tab-dev`
- `sku-basic`, `sku-pro`
- `composer-input`, `send-btn`, `verify-btn`, `receipt`
- `copy-javascript`, `copy-curl`, `theme-toggle`, `minimap-toggle`

## Gateway Usage
All gateway calls use `packages/config/src/live.ts:getGatewayUrl()` and must resolve to production from `LIVE_URLS.json`.

## SKU Behavior Notes
- Basic: default UI, no QTCA badges
- Pro: additional badges (tenant, PQC, QTCA hooks)
