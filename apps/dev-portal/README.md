# Atlas Dev Portal

## Purpose
Production-only developer portal with plugins registry and SDK documentation.

## Key Routes
- `/` — Overview and quickstarts
- `/api` — API reference overview
- `/docs` — Documentation hub
- `/docs/sdk` — SDK documentation
- `/examples` — Examples gallery
- `/plugins` — Plugins registry
- `/sdk` — SDK landing page

## Data-testid Contract (subset)
- N/A (static content); ensure top-level headings and buttons remain accessible

## Gateway Usage
If any network requests are added, they must use `packages/config/src/live.ts:getGatewayUrl()` and resolve to production from `LIVE_URLS.json`.

## SKU Notes
- Basic: read-only docs and registry
- Pro: may unlock partner plugin listings and authenticated docs
