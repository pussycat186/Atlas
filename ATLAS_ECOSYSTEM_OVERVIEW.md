# Atlas Ecosystem Overview

**Generated**: 2025-01-17 (OMNI_AGENT S1)  
**Scope**: Complete repository inventory and architecture map  
**Evidence**: See `evidence/` directory for detailed JSON artifacts

---

## Executive Summary

Atlas is a **monorepo** containing a secure messaging platform with 3 Next.js applications, shared design tokens, and comprehensive CI/CD automation.

- **Total Files**: 1,329 tracked files
- **Applications**: 3 (admin-insights, dev-portal, proof-messenger)
- **Workspaces**: 4 (root + 3 apps)
- **Primary Languages**: TypeScript/TSX (236 files), JSON (338 files), Markdown (138 files)
- **Workflows**: 95 GitHub Actions workflows
- **Next.js Routes**: ~30+ pages across all apps

---

## Architecture

### Monorepo Structure

```
Atlas/
├── apps/
│   ├── admin-insights/      # Admin dashboard with analytics, metrics, traces
│   ├── dev-portal/          # Developer documentation and API reference
│   └── proof-messenger/     # Main messaging app (Vietnamese UX)
├── packages/
│   └── tokens/              # Shared design tokens (colors, spacing, typography)
├── .github/workflows/       # 95 CI/CD workflows
├── evidence/                # Runtime inventory and analysis artifacts
└── docs/                    # Documentation and evidence

```

### Applications

#### 1. **proof-messenger** (Main App)
- **Purpose**: Secure, self-verifiable messaging platform
- **Routes**: `/` (landing), `/chat`, `/settings`, `/verify`, etc.
- **Tech**: Next.js 14 App Router, Vietnamese i18n
- **Deploy**: Vercel (atlas-proof-messenger.vercel.app)
- **Key Features**: Passkey auth, E2EE messaging, Prism transparency log

#### 2. **admin-insights** (Internal)
- **Purpose**: Admin dashboard for system monitoring
- **Routes**: `/analytics`, `/metrics`, `/prism`, `/system-status`, `/traces`, `/witnesses`
- **Tech**: Next.js 14 with analytics integrations
- **Deploy**: Vercel (atlas-admin-insights.vercel.app)

#### 3. **dev-portal** (Public)
- **Purpose**: Developer documentation and SDK guides
- **Routes**: `/api`, `/docs`, `/docs/sdk`, `/examples`
- **Tech**: Next.js 14 with MDX support
- **Deploy**: Vercel (atlas-dev-portal.vercel.app)

### Shared Packages

- **`@atlas/tokens`**: Design system primitives (colors, spacing, typography)
  - Used by all 3 apps via `transpilePackages` in next.config.js
  - Ensures consistent visual design across ecosystem

---

## Technology Stack

### Frontend
- **Next.js 14**: App Router with React Server Components
- **React 18**: UI framework
- **TypeScript**: Type safety across all code

### Build & Package Management
- **pnpm 9.x**: Workspace-aware package manager (`packageManager` field in root package.json)
- **Turborepo**: Monorepo orchestration (cached builds)

### Deployment
- **Vercel**: All 3 apps deployed via CLI in CI/CD
- **GitHub Actions**: 95 workflows for testing, deployment, security scanning

### Security & Compliance
- **Trivy**: Container/dependency scanning (SBOM generation)
- **Cosign**: Artifact signing and attestation
- **SLSA**: Provenance generation for supply chain security

---

## CI/CD Workflows (Key Samples)

Based on `evidence/workflows.json`:

- **atlas-commercializer-v8.yml**: Main CI pipeline (build, test, deploy)
- **atlas-force-live-ui.yml**: Vietnamese UI deployment workflow
- **atlas-acceptance.yml**: Automated acceptance testing (S8 stage)
- **trivy-*.yml**: Security scanning workflows for all apps
- **cosign-*.yml**: Artifact signing workflows

**Total**: 95 workflows (full list in `evidence/workflows.json`)

---

## File Distribution

| Extension | Count | Purpose |
|-----------|-------|---------|
| `.json` | 338 | Config, package manifests, artifacts |
| `.md` | 138 | Documentation |
| `.ts` | 118 | TypeScript source |
| `.tsx` | 118 | React components |
| `.yml` | 95 | GitHub workflows |
| `.txt` | 79 | Logs, evidence, triggers |
| `.js` | 54 | JavaScript source |
| `.ps1` | 23 | PowerShell scripts (Windows automation) |
| `.sh` | 19 | Bash scripts (Unix automation) |

**See**: `evidence/inventory.json` for complete file listing with sizes

---

## Next.js Routes Map

### admin-insights
- `/` - Dashboard home
- `/analytics` - Usage analytics
- `/metrics` - System metrics
- `/prism` - Transparency log viewer
- `/settings` - Admin settings
- `/system-status` - Health checks
- `/traces` - Request traces
- `/witnesses` - Witness nodes

### dev-portal
- `/` - Portal home
- `/api` - API reference
- `/docs` - Documentation hub
- `/docs/sdk` - SDK guides
- `/examples` - Code examples

### proof-messenger
- `/` - Landing page (Vietnamese UX)
- `/chat` - Messaging interface
- `/settings` - User settings
- `/verify` - Verification tools

**See**: `evidence/routes.json` for complete route mapping

---

## Package Dependencies

Based on `evidence/packages.json`:

- **Root Workspace**: 4 dependencies, 17 devDependencies
- **admin-insights**: ~16 dependencies
- **dev-portal**: ~14 dependencies
- **proof-messenger**: ~18 dependencies
- **tokens**: Minimal dependencies (design primitives only)

**Key Dependencies** (inferred from typical Next.js setup):
- Next.js, React, TypeScript (all apps)
- Tailwind CSS (styling)
- ESLint, Prettier (code quality)
- Vitest, Playwright (testing)

**Note**: Run `pnpm ls --depth=0` for current dependency tree

---

## Evidence Artifacts (S1 Outputs)

Generated in `evidence/` directory:

1. **`inventory.json`**: All 1,329 files with paths, extensions, sizes
2. **`packages.json`**: All package.json files with dependency counts
3. **`routes.json`**: Next.js route map (30+ routes)
4. **`workflows.json`**: GitHub Actions workflow inventory (95 workflows)

---

## Next Steps

- **S2**: Validate configs (packageManager, tsconfig, Next.js configs)
- **S3**: Semantic analysis and dead-code detection
- **S4-S9**: Cleanup, deploy, document, lock

---

## References

- [Next.js 14 Docs](https://nextjs.org/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vercel CLI](https://vercel.com/docs/cli)
- [SLSA Framework](https://slsa.dev/)
- [Atlas Repository](https://github.com/pussycat186/Atlas)
