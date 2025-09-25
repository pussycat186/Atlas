# Atlas Admin Insights

## Purpose
Production-only dashboards for status, metrics, and witness network insights.

## Key Routes
- `/` — Admin dashboard overview
- `/analytics` — Usage analytics
- `/metrics` — Live system metrics view
- `/system-status` — Overall component health
- `/witnesses` — Witness network status
- `/traces` — Tracing placeholder
- `/settings` — Admin preferences

## Data-testid Contract (subset)
- `metrics-page`, `metrics-title`, `metrics-cards`
- `rps-card`, `p95-card`, `error-rate-card`, `witness-quorum-card`
- `uptime-value`, `total-records-value`, `verified-records-value`, `pending-records-value`

## Gateway Usage
Use `packages/config/src/live.ts:getGatewayUrl()` for all API calls.

## SKU Notes
- Basic: standard metrics
- Pro: may surface QTCA and multi-tenant insights
