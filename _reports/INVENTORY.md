# ATLAS Monorepo Inventory Report
**Generated**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")  
**Branch**: reboot/atlas-hardening-v1  
**Phase**: 0 - Inventory & Baseline

## 🏗️ Repository Structure

### Workspace Configuration
- **Package Manager**: pnpm@9.0.0
- **Node.js Version**: v20.19.4 (current), >=18.0.0 (required)
- **TypeScript**: ^5.3.0
- **Workspace Pattern**: `apps/*`, `services/*`, `packages/*`

### Directory Tree
```
atlas/
├── apps/                    # Next.js applications
│   ├── admin/              # Admin dashboard (port 3007)
│   │   ├── src/
│   │   │   ├── app/        # Next.js app router
│   │   │   ├── lib/        # Admin client library
│   │   │   └── components/ # UI components
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                # Main web application (port 3006)
│       ├── src/
│       │   ├── app/        # Next.js app router
│       │   ├── components/ # UI components
│       │   ├── lib/        # Atlas client library
│       │   └── stories/    # Storybook stories
│       ├── tests/          # E2E tests
│       ├── package.json
│       └── tsconfig.json
├── services/               # Backend services
│   ├── gateway/            # API gateway (port 3000)
│   │   ├── src/
│   │   │   ├── index.ts    # Main entry point
│   │   │   ├── server.ts   # Fastify server
│   │   │   ├── quorum.ts   # Quorum management
│   │   │   └── witness-client.ts
│   │   ├── dist/           # Compiled output
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── witness-node/       # Witness nodes (ports 3001-3005)
│       ├── src/
│       │   ├── index.ts    # Main entry point
│       │   ├── server.ts   # Fastify server
│       │   ├── witness.ts  # Witness logic
│       │   └── ledger.ts   # Ledger management
│       ├── data/           # Persistent ledger data
│       ├── dist/           # Compiled output
│       ├── package.json
│       └── tsconfig.json
├── packages/               # Shared libraries
│   ├── fabric-protocol/    # Protocol schemas & validation
│   │   ├── src/
│   │   │   ├── types.ts    # TypeScript types
│   │   │   ├── api.ts      # API definitions
│   │   │   └── schemas.ts  # Zod validation schemas
│   │   ├── dist/           # Compiled output
│   │   └── package.json
│   └── fabric-client/      # Client SDK
│       ├── src/
│       │   ├── client.ts   # Main client class
│       │   ├── utils.ts    # Utility functions
│       │   └── telemetry.ts # OpenTelemetry setup
│       ├── dist/           # Compiled output
│       └── package.json
├── observability/          # Monitoring stack
│   ├── docker-compose.yml  # Full observability stack
│   ├── grafana/            # Dashboards & provisioning
│   ├── otel-collector-config.yaml
│   ├── prometheus.yml
│   └── tempo-config.yaml
├── infra/                  # Infrastructure
│   ├── docker/             # Docker configurations
│   └── k8s/                # Kubernetes manifests
├── tests/                  # Test suites
│   ├── e2e/                # End-to-end tests
│   ├── integration/        # Integration tests
│   └── chaos/              # Chaos engineering tests
├── scripts/                # Automation scripts
│   └── cleanup.sh          # Cleanup automation
├── _reports/               # Analysis reports
│   ├── INVENTORY.md        # This file
│   ├── BASELINE.md         # Performance baselines
│   ├── KNIP.md             # Dependency analysis
│   ├── TSPRUNE.txt         # Unused exports
│   └── depcruise.json      # Dependency graph
└── .github/workflows/      # CI/CD pipelines
```

## 🔌 Port Configuration

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| gateway | 3000 | Main API gateway | ✅ Active |
| witness-1 | 3001 | US East witness | ✅ Active |
| witness-2 | 3002 | US West witness | ✅ Active |
| witness-3 | 3003 | EU West witness | ✅ Active |
| witness-4 | 3004 | AP Southeast witness | ✅ Active |
| witness-5 | 3005 | AP Northeast witness | ✅ Active |
| web | 3006 | Web application | ✅ Active |
| admin | 3007 | Admin dashboard | ✅ Active |
| nginx | 80/443 | Reverse proxy | ✅ Active |
| grafana | 3030 | Monitoring UI | ✅ Active |
| prometheus | 9090 | Metrics | ✅ Active |
| jaeger | 16686 | Tracing UI | ✅ Active |
| otel-collector | 4317/4318 | Telemetry collection | ✅ Active |

## 📦 Package Analysis

### Root Package
- **Name**: atlas
- **Version**: 1.0.0
- **Package Manager**: pnpm@9.0.0
- **Node Version**: >=18.0.0 (needs upgrade to 20)
- **Workspaces**: apps/*, services/*, packages/*

### Applications
#### apps/web
- **Framework**: Next.js 14
- **Port**: 3006
- **Dependencies**: React, Tailwind CSS, Playwright
- **Features**: Main web application, E2E tests, Storybook

#### apps/admin
- **Framework**: Next.js 14
- **Port**: 3007
- **Dependencies**: React, Tailwind CSS, Playwright
- **Features**: Admin dashboard, metrics visualization

### Services
#### services/gateway
- **Framework**: Fastify
- **Port**: 3000
- **Dependencies**: @atlas/fabric-protocol, @atlas/fabric-client, OpenTelemetry
- **Features**: API gateway, quorum management, witness coordination

#### services/witness-node
- **Framework**: Fastify
- **Ports**: 3001-3005
- **Dependencies**: @atlas/fabric-protocol, OpenTelemetry
- **Features**: Witness attestation, ledger management, consensus

### Packages
#### packages/fabric-protocol
- **Type**: Protocol schemas
- **Dependencies**: Zod validation
- **Features**: TypeScript types, API definitions, runtime validation

#### packages/fabric-client
- **Type**: Client SDK
- **Dependencies**: @atlas/fabric-protocol, Zod, OpenTelemetry
- **Features**: Idempotency, retry logic, validation, telemetry

## 🧪 Test Coverage

### Unit Tests
- **fabric-client**: Jest tests with validation
- **Services**: Jest configuration ready

### Integration Tests
- **quorum.test.ts**: Quorum functionality tests
- **fault-tolerance.test.ts**: Chaos engineering tests

### E2E Tests
- **Playwright**: 5 test files covering user journeys
- **Performance**: k6 load testing scripts

## 🔧 CI/CD Pipeline

### Existing Workflows
- **atlas-v12-performance-gate.yml**: Performance testing
- **atlas-v12-public-demo.yml**: Public demo deployment
- **atlas-v12-quality-gates.yml**: Quality assurance
- **atlas-v14-dual-service-self-healing-gate.yml**: Self-healing performance gate
- **atlas-v14-oidc-cloudrun.yml**: OIDC Cloud Run deployment
- **release.yml**: Release automation

### Performance Testing
- **k6**: Load testing with constant-arrival-rate
- **Lighthouse**: Performance and accessibility testing
- **Playwright**: E2E testing

## 📊 Observability Status

### Current State
- **OpenTelemetry**: Partially implemented
- **Metrics**: Prometheus endpoints configured
- **Logging**: Pino structured logging
- **Tracing**: Jaeger integration ready
- **Monitoring**: Grafana dashboards configured

### Required Implementation
- Complete OpenTelemetry instrumentation
- Service-specific metrics collection
- Distributed tracing implementation
- Alerting configuration

## 🔒 Security & Supply Chain

### Current State
- **SBOM**: Generated (3 files available)
- **Vulnerability Scanning**: Trivy reports available
- **Signing**: Not implemented
- **Provenance**: Not implemented

### Required Implementation
- cosign keyless signing
- SLSA provenance
- SBOM generation in CI
- Vulnerability scanning in CI

## 📈 Performance Baselines

### Current Thresholds
- **RPS**: ≥500 requests/second
- **P95 Latency**: ≤200ms
- **Error Rate**: ≤1%
- **Cache Hit Ratio**: ≥98%
- **Test Duration**: 60 seconds
- **Warm-up**: 15-30 seconds

### Test Configuration
- **Load Testing**: k6 with constant-arrival-rate
- **VUs**: 100-1000 (preAllocatedVUs: 100, maxVUs: 1000)
- **Routes**: 90% dynamic, 10% static
- **Caching**: NGINX micro-cache with SWR

## 🐳 Docker Configuration

### Services
- **Gateway**: Custom Dockerfile with OpenTelemetry
- **Witness Nodes**: 5 witness nodes with persistent storage
- **Web/Admin**: Next.js applications
- **NGINX**: Reverse proxy with micro-caching
- **Observability**: Full monitoring stack

### Volumes
- witness-1-data through witness-5-data (persistent ledger storage)
- prometheus_data (metrics storage)
- grafana_data (dashboard storage)

## 📋 Dependency Analysis

### Root Dependencies
- **Dev Dependencies**: 10 packages (ESLint, Prettier, TypeScript, Jest, Playwright)
- **Package Manager**: pnpm@9.0.0
- **Node Version**: >=18.0.0 (needs upgrade to 20)

### Service Dependencies
- **Gateway**: Fastify ecosystem, Pino logging, OpenTelemetry
- **Witness**: Fastify ecosystem, fs-extra, OpenTelemetry
- **Web/Admin**: Next.js ecosystem

### Package Dependencies
- **fabric-protocol**: Zod validation, no external dependencies
- **fabric-client**: Zod validation, idempotency, retry logic

## 🔍 Code Quality Status

### TypeScript Configuration
- **Strict Mode**: Enabled
- **Target**: ES2020
- **Module**: CommonJS
- **Incremental**: Not configured

### Linting
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Configured for code formatting

### Build System
- **TypeScript Compiler**: Used for all packages
- **Incremental Builds**: Not configured
- **Build Order**: Protocol → Client → Services

## 🎯 Next Steps

1. **Phase 1**: Clean sweep - identify deletion candidates
2. **Phase 2**: Monorepo strictness - enforce Node 20, strict TypeScript
3. **Phase 3**: Observability - implement OpenTelemetry stack
4. **Phase 4**: CI/CD & Supply Chain - implement signing and provenance
5. **Phase 5**: Evidence Pack - generate comprehensive artifacts

## 📊 Metrics to Track

### Performance Metrics
- RPS (requests per second)
- P95 latency (milliseconds)
- Error rate (percentage)
- Cache hit ratio (percentage)

### Quality Metrics
- Test coverage (percentage)
- Lint errors (count)
- TypeScript errors (count)
- Security vulnerabilities (count)

### Build Metrics
- Build time (seconds)
- Bundle size (bytes)
- Dependency count (number)
- Circular dependencies (count)

## 🔄 Continuous Improvement

### Weekly Reviews
- Performance threshold compliance
- Security vulnerability updates
- Dependency updates
- Test coverage improvements

### Monthly Reviews
- Architecture decisions
- Technology stack updates
- Process improvements
- Documentation updates

### Quarterly Reviews
- Strategic technology decisions
- Major refactoring opportunities
- Performance optimization
- Security posture assessment