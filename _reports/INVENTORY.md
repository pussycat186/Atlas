# ATLAS v12 Inventory Report

## Repository Structure

### Root Configuration
- **Node.js**: 20.x LTS (enforced via engines.node)
- **Package Manager**: pnpm workspaces
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier configured

### Workspace Packages

#### Core Packages
- `packages/fabric-protocol/` - Core protocol definitions and schemas
- `packages/fabric-client/` - Client SDK with validation and idempotency

#### Applications
- `apps/web/` - Next.js web application
- `apps/admin/` - Admin dashboard (Next.js)

#### Services
- `services/gateway/` - Main API gateway service
- `services/witness-node/` - Witness node service for quorum consensus
- `services/chat/` - Chat service (referenced but not present)
- `services/drive/` - Drive service (referenced but not present)

### Infrastructure
- `infra/docker/` - Docker configurations
- `infra/k8s/` - Kubernetes manifests
- `observability/` - OpenTelemetry, Prometheus, Grafana configs

### Testing
- `tests/integration/` - Integration tests
- `tests/chaos/` - Chaos engineering tests
- `tests/e2e/` - End-to-end tests
- `tests/performance/` - Performance tests

## Service Endpoints & Ports

### Gateway Service
- **Port**: 3000
- **Endpoints**:
  - `POST /record` - Primary record submission
  - `POST /api/records` - Legacy record submission
  - `GET /health` - Health check
  - `GET /metrics` - Prometheus metrics

### Witness Nodes
- **Ports**: 3001-3005 (5 witness nodes)
- **Endpoints**:
  - `POST /witness/process` - Process records
  - `GET /witness/info` - Witness information
  - `GET /health` - Health check
  - `GET /metrics` - Prometheus metrics

### Web Application
- **Port**: 3006
- **Endpoints**: Next.js application routes

### Admin Application
- **Port**: 3007
- **Endpoints**: Admin dashboard routes

## Docker Services

### Core Services
- `atlas-gateway` - Main API gateway
- `atlas-witness-1` through `atlas-witness-5` - Witness nodes
- `atlas-web` - Web application
- `atlas-admin` - Admin dashboard

### Observability Stack
- `otel-collector` - OpenTelemetry collector
- `jaeger` - Distributed tracing
- `prometheus` - Metrics collection
- `grafana` - Visualization dashboard
- `loki` - Log aggregation
- `promtail` - Log shipping

## Dependencies Analysis

### Unused Files (31)
- Various k6 performance test files
- Unused React components
- Generated TypeScript declaration files
- CI utility scripts

### Unused Dependencies (37)
- OpenTelemetry packages (not yet integrated)
- UI component libraries
- Development tools

### Unused Exports (11)
- UI component variants
- Admin service types
- Feature flag utilities

## Current State
- **Build Status**: ✅ Working
- **Test Coverage**: Partial
- **Observability**: Configured but not fully integrated
- **Performance**: Not yet measured
- **Security**: Basic scanning configured

## Next Steps
1. Clean up unused files and dependencies
2. Integrate OpenTelemetry instrumentation
3. Implement performance testing
4. Complete observability setup
5. Add supply chain security measures