# Atlas Quantum-Grade Monorepo

Production-first monorepo for **Atlas** web applications with quantum-grade architecture featuring WASM-accelerated core, edge runtime optimization, and sub-200KB client bundles.

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

**Core Compute (WASM-first):**
- Rust crate `packages/core-rs` for hot-path operations (hashing, validation)
- WebAssembly via `wasm-pack` producing `@atlas/core-wasm` npm package
- TypeScript wrapper `@atlas/core` with graceful JS fallback

**Runtime Strategy:**
- Next.js 14 App Router with RSC streaming
- Edge runtime for lightweight API handlers (`export const runtime = 'edge'`)
- Turborepo build caching and incremental compilation
- Client bundles ≤ 200KB first-load per app

**Data & API:**
- Drizzle ORM + SQLite for minimal data layer
- tRPC over HTTP for type-safe APIs
- Health check endpoints at `/api/trpc/[trpc]`

**Performance & Security:**
- Strict CSP headers via Next.js config
- SVG-only assets, no bitmap images
- Tree-shaking with Turborepo cache
- OpenTelemetry-ready observability hooks

## Repository Structure

```
apps/
├── admin-insights/     # Admin dashboard
├── dev-portal/         # Developer portal  
└── proof-messenger/    # Messaging app
packages/
├── core-rs/           # Rust WASM core
├── core-wasm/         # Generated WASM package
├── core/              # TypeScript WASM wrapper
├── ui/                # Shared UI components
├── db/                # Database layer
├── config/            # Shared configs
├── fabric-client/     # Legacy client
├── fabric-crypto/     # Legacy crypto
└── fabric-protocol/   # Legacy protocol
```

## Local Development

### Prerequisites

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Node.js 20+ and pnpm
npm install -g pnpm@9.0.0
```

### Build & Run

```bash
# Install dependencies
pnpm install

# Build WASM core (required first)
pnpm build:wasm

# Build all packages and apps
pnpm build

# Start all apps in development
pnpm dev

# Run specific app
cd apps/proof-messenger && pnpm dev
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Deployment

### CI/CD Pipeline

**Trigger:** Push to `main` or manual dispatch via GitHub Actions

**Steps:**
1. **Secret Validation** - Checks all required Vercel secrets
2. **Turborepo Build** - Cached incremental builds
3. **WASM Compilation** - Rust → WebAssembly → npm package
4. **Multi-App Deploy** - Parallel Vercel deployments
5. **Prism Audit** - Validates `/prism` endpoints contain required marker

### Required Secrets

Configure in GitHub Repository Settings → Actions → Secrets:

- `VERCEL_TOKEN` - Vercel CLI authentication
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_PROOF` - proof-messenger project
- `VERCEL_PROJECT_ID_INSIGHTS` - admin-insights project  
- `VERCEL_PROJECT_ID_DEV` - dev-portal project

### Manual Deploy

```bash
# Trigger via GitHub CLI
gh workflow run deploy-frontends.yml

# Or via GitHub UI: Actions → Deploy Frontends → Run workflow
```

## Performance Metrics

- **Bundle Size**: ≤ 200KB first-load per app
- **Build Cache**: 80%+ cache hit rate via Turborepo
- **WASM Loading**: <50ms initialization with JS fallback
- **Edge Runtime**: <100ms cold start for API routes

## Troubleshooting

| Error | Solution |
|-------|----------|
| `BLOCKER_MISSING_SECRET:<NAME>` | Add missing secret in Repo Settings → Actions → Secrets |
| `wasm-pack not found` | Install via `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf \| sh` |
| `Build cache miss` | Check `.turbo/` directory permissions |
| `WASM load failed` | Verify `@atlas/core-wasm` package built correctly |

### Common Issues

**WASM Build Failures:**
- Ensure Rust toolchain installed: `rustup --version`
- Check wasm32 target: `rustup target list --installed`
- Verify wasm-pack: `wasm-pack --version`

**Bundle Size Violations:**
- Run `pnpm build` and check Next.js bundle analyzer
- Remove unused dependencies with `knip`
- Ensure tree-shaking working correctly

**Edge Runtime Errors:**
- Check Node.js APIs not used in edge handlers
- Verify `export const runtime = 'edge'` in API routes
- Use `@atlas/core` instead of Node-specific crypto

## Architecture Decision Records

See `docs/adr/0001-quantum-arch.md` for detailed rationale and trade-offs.

## License

MIT