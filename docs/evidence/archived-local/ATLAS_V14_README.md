# ATLAS v14 — Dual-Service Self-Healing Gate (2-vCPU, Guidance-Only)

## Mission
Flip the Product & Performance gate to GREEN in one production-like window: RPS ≥ 500, p95 ≤ 200 ms, error ≤ 1%. Operate only via CI/infra/proxy/runtime (no source edits). Return exactly one final packet: either PROGRESS (GREEN + full evidence) or one BLOCKER.

## Architecture

### Dual-Service Container Setup
- **App Service**: Prebuilt production image on port 3000
- **NGINX Service**: nginx:alpine on port 8080 with micro-cache
- **Networking**: Service name networking (app:3000) via Docker network

### Key Components

1. **GitHub Actions Workflow** (`.github/workflows/atlas-v14-dual-service-self-healing-gate.yml`)
   - Builds production app image
   - Sets up dual-service containers
   - Implements self-healing loop
   - Runs performance tests
   - Collects evidence

2. **NGINX Configuration** (Micro-cache with proofs)
   - 60s TTL for GET routes
   - 30s stale-while-revalidate
   - Cache key: path + normalized query + Accept-Encoding
   - Ignores cookies on read
   - Keep-alive enabled

3. **k6 Performance Tests**
   - `k6-v14-dual-service-test.js`: Main 500 RPS test for 60s
   - `k6-v14-priming-test.js`: Cache priming test
   - Constant arrival rate model
   - 90% dynamic routes, 10% static assets

4. **Lighthouse Tests** (`lighthouserc-v14.json`)
   - 4 routes: /, /keys, /playground, /metrics
   - Performance, accessibility, best practices, SEO
   - Headless Chrome with proper flags

5. **Playwright E2E Tests** (`tests/e2e/atlas-v14-dual-service.spec.ts`)
   - Tests all 4 main routes via NGINX proxy
   - Responsive design testing
   - Cache header validation
   - Performance timing checks

6. **Self-Healing Diagnostics** (`scripts/atlas-v14-self-healing-diagnostics.sh`)
   - OBSERVE → DIAGNOSE → PLAN → ACT → VERIFY → REFLECT
   - Automatic cache optimization
   - Service health monitoring
   - Performance analysis

7. **Evidence Collection** (`scripts/atlas-v14-evidence-collection.sh`)
   - Collects all required artifacts
   - Generates manifest with SHA256 hashes
   - Creates CPU proof and trace IDs
   - Produces comprehensive summary

## Usage

### Running the Workflow
1. Go to GitHub Actions
2. Select "ATLAS v14 — Dual-Service Self-Healing Gate"
3. Click "Run workflow"
4. Configure parameters (optional):
   - Process count: 2
   - Proxy TTL: 60s
   - k6 arrival rate: 500 req/s
   - Cache hit target: 98%

### Local Testing
```bash
# Run self-healing diagnostics
./scripts/atlas-v14-self-healing-diagnostics.sh

# Run evidence collection
./scripts/atlas-v14-evidence-collection.sh

# Run k6 performance test
k6 run k6-v14-dual-service-test.js

# Run Playwright tests
npx playwright test tests/e2e/atlas-v14-dual-service.spec.ts
```

## Performance Targets

- **RPS**: ≥ 500 requests per second
- **p95 Latency**: ≤ 200ms
- **Error Rate**: ≤ 1%
- **Cache Hit Ratio**: ≥ 98%
- **Total Requests**: ~30,000 ±1% (29,000-31,000)

## Evidence Required

### Performance Tests
- `k6-results.json`: k6 performance metrics
- `k6-summary.txt`: Human-readable k6 summary

### Lighthouse Tests
- `lighthouse-home.json`: Home page performance
- `lighthouse-keys.json`: API Keys page performance
- `lighthouse-playground.json`: Playground page performance
- `lighthouse-metrics.json`: Metrics page performance

### E2E Tests
- `playwright-report.html`: Playwright test results
- `e2e-screenshot.png`: E2E test screenshot

### Observability
- `trace-id.txt`: 32-hex trace ID
- `observability.png`: Grafana/Tempo screenshots

### Infrastructure
- `nginx-cache-status.txt`: NGINX cache status
- `cpu-proof.txt`: Runner CPU/RAM proof
- `artifact-manifest.csv`: All artifacts with SHA256

### Documentation
- `knobs-notes.txt`: WHAT/WHY/VERIFY/ROLLBACK for all knobs

## Self-Healing Loop

The system implements a comprehensive self-healing loop:

1. **OBSERVE**: Check service health, connectivity, cache status
2. **DIAGNOSE**: Identify issues (SC-NET, SC-NAME, K6-INSTALL, CACHE-MISS, POLICY)
3. **PLAN**: Determine strongest CI/infra fix
4. **ACT**: Apply fix (no source edits)
5. **VERIFY**: Confirm fix works, check thresholds
6. **REFLECT**: Document what failed, what worked, why

## Troubleshooting

### Common Issues

1. **SC-NET (ECONNREFUSED localhost:8080)**
   - Check if NGINX service container is running
   - Verify port 8080 is published
   - Check GitHub Actions service configuration

2. **SC-NAME (NGINX can't reach app:3000)**
   - Verify service name networking
   - Check app container health
   - Ensure both containers are on same network

3. **CACHE-MISS (hit < 98%)**
   - Tighten micro-cache settings
   - Enable proxy_cache_lock
   - Set proxy_ignore_headers Set-Cookie
   - Verify cache key includes all components

4. **K6-INSTALL (k6 not available)**
   - Use official Grafana k6 actions
   - Avoid manual apt/snap installation
   - Check GitHub Actions runner environment

### Rollback Procedures

Each knob has a specific rollback procedure documented in `knobs-notes.txt`. Common rollbacks:

- **NGINX Cache**: Remove proxy_cache directive
- **Service Networking**: Use host.docker.internal
- **k6 Actions**: Use manual installation
- **Cache Headers**: Remove add_header directives

## References

- [NGINX Caching Guide](https://docs.nginx.com/nginx/admin-guide/content-cache/nginx-caching/)
- [GitHub Service Containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
- [k6 Performance Testing](https://k6.io/docs/using-k6/http-requests/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright Testing](https://playwright.dev/)

## Success Criteria

The gate is considered GREEN when:
- All performance thresholds are met simultaneously
- Cache hit ratio ≥ 98%
- All 4 routes accessible via NGINX proxy
- Self-healing loop successfully resolves issues
- Complete evidence package collected
- No policy blockers encountered

## Failure Modes

The gate returns BLOCKER when:
- GitHub Actions UI run is disabled
- Service containers/ports are forbidden
- External policy controls prevent execution
- Critical infrastructure unavailable

In case of BLOCKER, the system returns:
- Exact toggle name and Settings path
- Logs/screenshots as proof
- Documentation URL
- Best-achieved numbers
