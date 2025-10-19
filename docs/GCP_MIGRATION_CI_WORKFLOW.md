# GCP Cloud Run Migration - CI-Only Workflow

## Status: ✅ WORKFLOW DEPLOYED

**Commit**: `3e0defc`  
**Workflow File**: `.github/workflows/atlas-gcp-migrate.yml`  
**Trigger File**: `.atlas/autorun/gcp-20251019-060547.txt`  
**Evidence**: `docs/evidence/gcp-migration/20251019-060700/`

## Overview

A complete CI-only migration orchestrator has been created to migrate the Atlas monorepo from Vercel to GCP Cloud Run. The workflow requires **NO local environment variables** and executes entirely within GitHub Actions.

## Required GitHub Secrets

The workflow validates these secrets at runtime (S0_secrets_audit job):

### Critical (Required)
- `GH_ADMIN_TOKEN` - GitHub PAT with repo admin permissions
- `GCP_PROJECT_ID` - GCP project ID
- `GCP_PROJECT_NUMBER` - GCP project number
- `GCP_REGION` - Deployment region (e.g., `asia-southeast1`)
- `GCP_WORKLOAD_ID_PROVIDER` - Workload Identity Federation provider
- `GCP_DEPLOYER_SA` - Service account for deployments
- `ARTIFACT_REPO` - Artifact Registry repository name
- `DOMAINS_JSON` - JSON mapping: `{"proof_messenger":"domain","admin_insights":"domain","dev_portal":"domain"}`

### Optional
- `EXTRA_ENV_JSON` - Additional runtime environment variables
- `FIGMA_TOKEN`, `FIGMA_FILE_KEY` - For design token sync
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` - For CDN integration
- `KMS_KEY_RESOURCE` - For enhanced encryption

## Workflow Stages

### Phase 1: Prerequisites & Validation
- **S0_secrets_audit**: Validates all required secrets present
  - Output: `READY_NO_SECRETS:[...]` if any missing
  - Creates: `S0_secrets_audit.json`

### Phase 2: Repository Preparation
- **S1_repo_patches**: Ensures Next.js configs and Dockerfiles
  - Adds `output: 'standalone'` to all apps
  - Creates multi-stage Dockerfiles if missing
  - Commits changes if needed
  - Creates: `S1_repo_patches.json`

- **S2_infra_scripts**: Creates GCP infrastructure scripts
  - `bootstrap.sh` - Enable APIs, create Artifact Registry
  - `map-domains.sh` - Domain mapping and SSL certificates
  - `secrets-sync.sh` - Sync secrets to Secret Manager
  - Creates: `S2_infra_scripts.json`

### Phase 3: Build & Deploy
- **S3_build_and_push**: Docker build + push (matrix: 3 apps)
  - Authenticates via OIDC (Workload Identity Federation)
  - Builds: `admin-insights`, `dev-portal`, `proof-messenger`
  - Tags: `$GCP_REGION-docker.pkg.dev/$PROJECT/$REPO/$APP:$SHA`
  - Creates: `S3_images.json` with digests

- **S4_cloud_run_deploy_canary**: Deploy to Cloud Run
  - First deploy: 100% traffic
  - Subsequent: 10% canary / 90% stable
  - Config: min=1, max=50 instances, concurrency=80
  - Creates: `S4_deploy.json`

- **S5_map_domains_and_certs**: Domain mapping and SSL
  - Creates Serverless NEG + Global HTTPS LB
  - Requests Google Managed Certificates
  - Enables Cloud CDN
  - Creates: `S5_domains.json`

### Phase 4: Validation & Quality
- **S6_headers_validate_and_fix**: Security headers check
  - Validates CSP, HSTS, COOP, COEP on `/prism`
  - Auto-fix ≤5 attempts if missing
  - Creates: `S6_headers_report.txt`, `S6_headers_result.json`

- **S7_quality_gates**: Performance and functionality tests
  - **LHCI**: 5 routes, thresholds perf≥0.90, a11y≥0.95
  - **k6**: Load test `/prism`, p95≤200ms, error<1%
  - **Playwright**: E2E happy path tests
  - Creates: `S7_lhci.json`, `S7_k6-summary.json`, `S7_playwright-report.html`

- **S8_supply_chain**: SBOM, SLSA, signing
  - Syft SBOM (CycloneDX format)
  - SLSA v1 provenance (in-toto)
  - Cosign image signing
  - Creates: `S8_*_sbom.cyclonedx.json`, `S8_supply_chain.json`

### Phase 5: Promotion & Operations
- **S9_promote_or_rollback**: Traffic management
  - If S6-S8 PASS → promote to 100% traffic
  - If FAIL → rollback to previous stable
  - Creates: `S9_*_traffic.json`

- **S10_operate_and_schedules**: Operational workflows
  - Validates `atlas-scheduled.yml` exists
  - Schedules: headers (15min), quality (daily), receipts (hourly), supply chain (weekly)
  - Creates: `S10_schedules.json`

- **S11_cost_scaling_guards**: Document scaling config
  - Records: min/max instances, concurrency, budget
  - Creates: `S11_scaling.json`

- **S12_ux_vi_happy_path**: Vietnamese UX validation
  - Checks text markers: "Nhắn tin. An toàn. Tự kiểm chứng.", etc.
  - Creates: `S12_ux_check.json`

### Phase 6: Finalization
- **S13_figma_optional**: Design token sync (if `FIGMA_TOKEN` present)
  - Skipped if no Figma credentials
  - Creates: `S13_figma_sync.json`

- **S14_vercel_decommission_plan**: Decommission documentation
  - Creates 7-day park period plan
  - Documents rollback procedures
  - Creates: `docs/VERCEL_DECOMMISSION_PLAN.md`, `S14_vercel_plan.json`

- **S17_finalize**: Aggregate evidence and complete
  - Downloads all stage evidence
  - Creates `FINAL.json` with service URLs and status
  - Commits evidence to `docs/evidence/gcp-migration/<timestamp>/`
  - **Output**: `GCP_MIGRATION_DONE`

## Trigger Mechanism

### Automatic Trigger
Push a file to `.atlas/autorun/gcp-*.txt` with content `RUN`

```bash
# Create trigger file
timestamp=$(date -u +%Y%m%d-%H%M%S)
mkdir -p .atlas/autorun
echo "RUN" > .atlas/autorun/gcp-$timestamp.txt

# Commit and push
git add .atlas/autorun/
git commit -m "chore(gcp): trigger migration orchestrator"
git push origin main
```

### Manual Trigger
Go to: https://github.com/pussycat186/Atlas/actions/workflows/atlas-gcp-migrate.yml
Click "Run workflow"

## Monitoring

**GitHub Actions**: https://github.com/pussycat186/Atlas/actions

Watch for:
- ✅ All jobs pass → `GCP_MIGRATION_DONE`
- ❌ S0 fails → `READY_NO_SECRETS:[...]` (missing secrets)
- ❌ S5 fails → `BLOCKER_INFRA_PERMS:...` (insufficient GCP permissions)
- ❌ S7 fails → `BLOCKER_QUALITY:...` (quality gates not met)
- ❌ Other fails → `BLOCKER_GCP_MIGRATION:<stage>:<reason>`

## Evidence Collection

All evidence stored in:
```
docs/evidence/gcp-migration/<github-run-id>-<run-number>/
├── S0_secrets_audit.json
├── S1_repo_patches.json
├── S2_infra_scripts.json
├── S3_images.json
├── S4_deploy.json
├── S5_domains.json
├── S6_headers_*
├── S7_lhci.json, S7_k6-summary.json
├── S8_*_sbom.cyclonedx.json
├── S9_*_traffic.json
├── S10_schedules.json
├── S11_scaling.json
├── S12_ux_check.json
├── S13_figma_sync.json (optional)
├── S14_vercel_plan.json
└── FINAL.json
```

Evidence is also copied to:
```
docs/evidence/gcp-migration/<UTC-YYYYMMDD-HHMMSS>/
```

## Rollback

### During Deployment (S0-S9)
- Workflow automatically rolls back on failure
- Previous Cloud Run revision remains available

### After Successful Deployment (S10+)
Use `atlas-rollback.yml` workflow:
1. Go to: https://github.com/pussycat186/Atlas/actions/workflows/atlas-rollback.yml
2. Click "Run workflow"
3. Select service and target revision

### Vercel Rollback (Park Period Only)
During 7-day park period:
1. Update DNS to point back to Vercel
2. Verify Vercel deployments still active
3. Monitor traffic switch

**After Day 30**: Vercel rollback NOT possible

## Success Criteria

1. **All secrets validated** (S0)
2. **3 images built and pushed** (S3)
3. **3 Cloud Run services deployed** (S4)
4. **Domains mapped with SSL** (S5)
5. **Security headers pass** (S6)
6. **Quality gates pass** (S7: LHCI, k6, Playwright)
7. **Supply chain validated** (S8: SBOM, SLSA, Cosign)
8. **Traffic promoted to 100%** (S9)
9. **Schedules operational** (S10)
10. **Evidence collected** (S17)

## Expected Output

### Success
```
GCP_MIGRATION_DONE
```

### Failure
```
READY_NO_SECRETS:[GH_ADMIN_TOKEN,GCP_PROJECT_ID,...]
```
or
```
BLOCKER_INFRA_PERMS:lb_or_cert:<detail>
```
or
```
BLOCKER_QUALITY:<substage>:<detail>
```
or
```
BLOCKER_GCP_MIGRATION:<stage>:<reason>
```

## Next Steps

1. **Configure GitHub Secrets**: Add all required secrets to repository
2. **Monitor Workflow**: Watch GitHub Actions for progress
3. **Validate Deployment**: Check Cloud Run services after S9
4. **Review Evidence**: Examine `FINAL.json` for service URLs
5. **Test Production**: Validate all services operational
6. **Decommission Vercel**: Follow 7-day park period plan

## Architecture

```
GitHub Actions (OIDC)
    ↓
Google Cloud Workload Identity Federation
    ↓
GCP Deployer Service Account
    ↓
┌─────────────────────────────────────┐
│  Artifact Registry                  │
│  - admin-insights:sha               │
│  - dev-portal:sha                   │
│  - proof-messenger:sha              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Cloud Run (3 services)             │
│  - Min: 1, Max: 50 instances        │
│  - Concurrency: 80                  │
│  - CPU: 1, Memory: 512Mi            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Global HTTPS Load Balancer         │
│  - Serverless NEG per service       │
│  - Google Managed SSL Certs         │
│  - Cloud CDN enabled                │
│  - Cloud Armor (optional)           │
└─────────────────────────────────────┘
    ↓
Custom Domains (from DOMAINS_JSON)
```

## Contact

For issues or questions:
- **GitHub Issues**: https://github.com/pussycat186/Atlas/issues
- **Workflow Logs**: https://github.com/pussycat186/Atlas/actions
- **Evidence**: Check `docs/evidence/gcp-migration/` for detailed logs

---

**Created**: 2025-10-19T06:07:00Z  
**Status**: Workflow deployed, awaiting secret configuration  
**Next Action**: Configure GitHub secrets and monitor workflow execution
