# Atlas Ultimate One-Prompt Orchestrator - Complete Guide

**Status**: ✅ DEPLOYED  
**Commit**: `41aaf1d`  
**Workflow**: `.github/workflows/atlas-ultimate.yml`  
**Trigger**: `.atlas/autorun/ultimate-20251019-065046.txt`

---

## Overview

The **Atlas Ultimate Orchestrator** is a comprehensive, single-workflow automation that takes Atlas from understanding through production deployment. It executes 20 stages (U0-U20) covering:

- **Understand**: Repository comprehension + ecosystem documentation
- **Clean**: Guarded cleanup with safety checks
- **Ship**: Security baseline + UX enhancements + MLS E2EE scaffold
- **Build**: Docker images + Cloud Run deployment
- **Validate**: Headers + quality gates + supply chain trust
- **Operate**: Scheduled monitors + observability
- **Scale**: Cost guards + SLO tracking
- **Finalize**: Complete evidence pack + live URLs

---

## Mission

Ship Atlas as a **secure, verifiable, low-latency, Vietnam-first messaging ecosystem** that can surpass Zalo/Telegram/Signal by delivering:

- **Uncompromising Security**: MLS E2EE + DPoP + PQC ready
- **User-First UX**: Vietnamese-first ("Hiển thị lớn"), a11y AA
- **Instant Onboarding**: Passkey-first authentication
- **Performance**: <200ms p95 latency
- **Reliability**: SLO 99.99% uptime
- **Supply Chain Trust**: SBOM + SLSA + Cosign
- **Global Operations**: Zero manual clicks, full automation

---

## Workflow Stages (U0-U20)

### U0 - Secrets Audit (Hard Gate)
**Duration**: 1-2 minutes  
**Purpose**: Validate all required GitHub secrets

**Required Secrets** (8):
1. `GH_ADMIN_TOKEN` - GitHub PAT with repo admin
2. `GCP_PROJECT_ID` - GCP project ID
3. `GCP_PROJECT_NUMBER` - GCP project number
4. `GCP_REGION` - Deployment region
5. `GCP_WORKLOAD_ID_PROVIDER` - WIF provider path
6. `GCP_DEPLOYER_SA` - Service account email
7. `ARTIFACT_REPO` - Artifact Registry repo name
8. `DOMAINS_JSON` - Domain mapping JSON

**Output on Failure**: `READY_NO_SECRETS:[missing_list]`

**Evidence**: `U0_secrets.json`

---

### U1 - Repository Comprehension
**Duration**: 3-5 minutes  
**Purpose**: Map the entire ecosystem

**Actions**:
- Generate file inventory (`U1_files.json`)
- Map package.json files (`U1_packages.json`)
- Document workflows (`U1_workflows.json`)
- Map Next.js routes (`U1_routes.json`)

**Outputs**:
- `docs/ATLAS_ECOSYSTEM_OVERVIEW.md` - Architecture
- `docs/ATLAS_CAPABILITIES.md` - Current state
- `docs/ATLAS_GAPS.md` - Missing features

**Evidence**: `U1_inventory.json`

---

### U2 - Guarded Cleanup
**Duration**: 2-3 minutes  
**Purpose**: Identify cleanup candidates (safe mode)

**Actions**:
- Detect duplicate evidence files
- Find stale logs (>30 days)
- Identify potential dead imports
- **NO DELETIONS** - analysis only

**Evidence**: `U2_cleanup_plan.json`

---

### U3 - Security Baseline
**Duration**: 3-5 minutes  
**Purpose**: Ensure foundational security configs

**Actions**:
- Patch Next.js configs: `output: 'standalone'`, `transpilePackages`, `outputFileTracingRoot`
- Create/verify Dockerfiles for all 3 apps
- Create `.dockerignore`

**Evidence**: `U3_security_patch.json`

---

### U4 - Product UX Boost
**Duration**: 2-4 minutes  
**Purpose**: Scaffold core user-facing routes

**Actions**:
- Scaffold proof-messenger routes:
  - `/` (home)
  - `/onboarding` (passkey)
  - `/chats` (list)
  - `/chats/[id]` (conversation)
  - `/verify` (receipt verification)
  - `/contacts`
  - `/security`
  - `/settings`
- Add Vietnamese text markers

**Evidence**: `U4_ux_files.json`

---

### U5 - E2EE Core Readiness
**Duration**: 2-3 minutes  
**Purpose**: Scaffold MLS E2EE package (non-breaking)

**Actions**:
- Create `packages/@atlas/mls-core`
- Define interfaces: `MLSKeyPackage`, `MLSGroupContext`, `MLSMessage`
- Placeholder functions (throw errors - integration pending)

**Note**: Interfaces only, no crypto implementation

**Evidence**: `U5_mls_scaffold.json`

---

### U6 - Build & Push Images
**Duration**: 10-15 minutes  
**Purpose**: Build Docker images for all apps

**Actions**:
- Authenticate to GCP via OIDC (Workload Identity Federation)
- Build 3 images (admin-insights, dev-portal, proof-messenger)
- Push to Artifact Registry: `${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${SERVICE}:${SHA}`

**Evidence**: `U6_images.json`

---

### U7 - Cloud Run Deploy
**Duration**: 10-15 minutes  
**Purpose**: Deploy services to Cloud Run

**Actions**:
- Enable GCP APIs (run, artifactregistry, compute)
- Deploy 3 services:
  - Min instances: 1
  - Max instances: 50
  - Concurrency: 80
  - CPU: 1
  - Memory: 512Mi
  - Timeout: 300s

**Evidence**: `U7_deploy.json`

---

### U8 - Domains & CDN
**Duration**: 5-10 minutes  
**Purpose**: Map custom domains + SSL + CDN

**Actions**:
- Map domains from `DOMAINS_JSON`
- Create managed SSL certificates
- Configure HTTPS Load Balancer
- Enable Cloud CDN

**Output on Failure**: `BLOCKER_INFRA_PERMS:lb_or_cert`

**Evidence**: `U8_domains.json`

---

### U9 - Security Headers Verification
**Duration**: 2-3 minutes  
**Purpose**: Validate security headers on live services

**Actions**:
- Curl `/prism` endpoint
- Verify headers:
  - CSP: nonce + strict-dynamic
  - Trusted-Types: nextjs#bundler
  - COOP: same-origin
  - COEP: require-corp
  - HSTS: preload

**Auto-fix**: Patch middleware + redeploy (≤5 retries)

**Evidence**: `U9_headers.json`, `U9_headers_report.txt`

---

### U10 - Quality Gates
**Duration**: 5-15 minutes  
**Purpose**: Validate performance, accessibility, reliability

**Tests**:
1. **Availability**: HTTP 200 status
2. **LHCI** (Lighthouse CI):
   - Performance ≥ 0.90
   - Accessibility ≥ 0.95
   - Best Practices ≥ 0.95
   - SEO ≥ 0.95
3. **k6** (Load Testing):
   - p95 ≤ 200ms
   - Error rate < 1%
4. **Playwright** (E2E):
   - Onboarding flow
   - Chat creation
   - Message send
   - Receipt verification

**Auto-optimization**: Adjust min-instances, code-split, stabilize selectors (≤5 retries)

**Output on Failure**: `BLOCKER_QUALITY:<substage>:<detail>`

**Evidence**: `U10_lhci.json`, `U10_k6.json`, `U10_playwright.html`

---

### U11 - Supply Chain Trust
**Duration**: 5-10 minutes  
**Purpose**: Generate attestations and verify provenance

**Actions**:
1. **SBOM**: Generate CycloneDX Software Bill of Materials (syft)
2. **SLSA**: Create in-toto provenance attestation (SLSA v1)
3. **Cosign**: Sign images with keyless signing (OIDC)

**Output on Failure**: `BLOCKER_SUPPLY_CHAIN:<detail>`

**Evidence**: `U11_sbom.json`, `U11_provenance.jsonl`, `U11_cosign.txt`

---

### U12 - Promote or Rollback
**Duration**: 2-3 minutes  
**Purpose**: Promote to 100% traffic or rollback

**Logic**:
- If U9-U11 all PASS → Update traffic to 100% (latest revision)
- Else → Rollback to previous stable revision

**Evidence**: `U12_traffic.json`

---

### U13 - Observability & SLOs
**Duration**: 2-3 minutes  
**Purpose**: Create scheduled monitoring workflows

**Monitors Created**:
- **Headers**: Every 15 minutes (`*/15 * * * *`)
- **Quality**: Daily at 2 AM UTC (`0 2 * * *`)
- **Receipts**: Hourly (`0 * * * *`)
- **Supply Chain**: Weekly Monday 3 AM UTC (`0 3 * * 1`)

**Workflow**: `.github/workflows/atlas-scheduled-ultimate.yml`

**Evidence**: `U13_schedules.json`

---

### U14 - Cost & Scaling Guards
**Duration**: 1-2 minutes  
**Purpose**: Document scaling policies and budget alerts

**Actions**:
- Persist autoscaling config (min/max, concurrency)
- Define budget alerts (80%, 90%, 100%)
- Document emergency scaling levers

**Evidence**: `U14_scaling.json`, `U14_budgets.json`

---

### U15 - Federation & Interop Plan
**Duration**: 1-2 minutes  
**Purpose**: Plan for future federation (non-disruptive)

**Output**: `docs/ATLAS_FEDERATION_PLAN.md`
- Matrix bridge options
- MLS federation considerations
- Contact sync strategies

**Evidence**: `U15_plan.md`

---

### U16 - Clients Roadmap
**Duration**: 1-2 minutes  
**Purpose**: Plan PWA, mobile, and desktop clients

**Output**: `docs/ATLAS_CLIENTS_ROADMAP.md`
- PWA install criteria
- Expo (Android/iOS) roadmap
- Tauri (Desktop) plan

**Evidence**: `U16_roadmap.md`

---

### U17 - Docs & README Refresh
**Duration**: 2-3 minutes  
**Purpose**: Overhaul repository documentation

**Updates**:
- README.md: Mission, live URLs, security stance, quickstart
- EXECUTION_GUIDE.md: Operator manual

**Evidence**: `U17_docs_commit.txt`

---

### U18 - Operate & Lock
**Duration**: 2-3 minutes  
**Purpose**: Tag release and enable branch protection

**Actions**:
- Tag `v1.0.0`
- Enable branch protection on main:
  - Required checks: ultimate orchestrator, headers, quality, supply_chain
  - Require PR reviews
- Configure CODEOWNERS for critical paths

**Evidence**: `U18_operate.json`

---

### U19 - Vercel Decommission Plan
**Duration**: 1-2 minutes  
**Purpose**: Plan safe Vercel shutdown

**Output**: `docs/VERCEL_DECOMMISSION_PLAN.md`
- 7-day park period
- DNS rollback recipe
- Deletion checklist

**Evidence**: `U19_plan.md`

---

### U20 - Finalize
**Duration**: 2-3 minutes  
**Purpose**: Aggregate evidence and declare success

**Actions**:
- Retrieve all service URLs
- Write `FINAL.json` with complete summary
- Print success message: `ATLAS_ULTIMATE_DONE`

**FINAL.json Structure**:
```json
{
  "timestamp": "2025-10-19T...",
  "status": "ATLAS_ULTIMATE_LIVE",
  "services": {
    "admin_insights": "https://...",
    "dev_portal": "https://...",
    "proof_messenger": "https://..."
  },
  "traffic": "100%_stable",
  "headers": "PASS",
  "lhci": "PASS",
  "k6": "PASS",
  "playwright": "PASS",
  "sbom_slsa_cosign": "PASS",
  "schedules": ["headers:15m", "quality:daily", ...],
  "evidence": "docs/evidence/ultimate/<timestamp>/",
  "github_run": "12345",
  "git_sha": "abc123..."
}
```

**Evidence**: `FINAL.json`

---

## Execution Timeline

| Phase | Stages | Duration | Total |
|-------|--------|----------|-------|
| **Prerequisites** | U0 | 1-2 min | 2 min |
| **Understand & Clean** | U1-U2 | 5-8 min | 10 min |
| **Security & UX** | U3-U5 | 7-12 min | 22 min |
| **Build & Deploy** | U6-U8 | 25-40 min | 62 min |
| **Validate** | U9-U11 | 12-28 min | 90 min |
| **Promote & Operate** | U12-U13 | 4-6 min | 96 min |
| **Document & Lock** | U14-U19 | 8-12 min | 108 min |
| **Finalize** | U20 | 2-3 min | 110 min |

**Total Expected Duration**: 60-110 minutes (fully automated)

---

## Trigger Mechanisms

### 1. Automatic Trigger (Active)

Workflow triggers on push to files matching `.atlas/autorun/ultimate-*.txt`:

```bash
# Trigger file already exists:
.atlas/autorun/ultimate-20251019-065046.txt

# Next push to main will start the workflow
```

### 2. Manual Trigger

```bash
# Via GitHub UI:
# Go to: https://github.com/pussycat186/Atlas/actions/workflows/atlas-ultimate.yml
# Click "Run workflow" → Select "main" → Click "Run workflow"

# Via GitHub CLI:
gh workflow run atlas-ultimate.yml --ref main
```

---

## Monitoring Execution

### GitHub Actions Dashboard
https://github.com/pussycat186/Atlas/actions

### Watch for Key Outputs

✅ **U0 PASS** → All secrets validated  
❌ **U0 FAIL** → `READY_NO_SECRETS:[list]` (configure secrets)

✅ **U6 PASS** → 3 images built and pushed  
❌ **U6 FAIL** → Check Docker syntax or registry permissions

✅ **U8 PASS** → Domains mapped with SSL  
❌ **U8 FAIL** → `BLOCKER_INFRA_PERMS:lb_or_cert` (check IAM roles)

✅ **U10 PASS** → Quality gates passed  
❌ **U10 FAIL** → `BLOCKER_QUALITY:lhci:perf_below_threshold` (auto-retries ≤5)

✅ **U11 PASS** → Supply chain validated  
❌ **U11 FAIL** → `BLOCKER_SUPPLY_CHAIN:cosign_verify_failed`

✅ **U20 SUCCESS** → `ATLAS_ULTIMATE_DONE` printed

---

## Evidence Collection

All stages write evidence to:
```
docs/evidence/ultimate/<UTC-YYYYMMDD-HHMMSS>/
```

### Evidence Files (U0-U20)

- `U0_secrets.json` - Secret validation
- `U1_inventory.json` - Repository comprehension
- `U1_files.json` - File inventory
- `U1_packages.json` - Package.json map
- `U1_workflows.json` - GitHub Actions workflows
- `U1_routes.json` - Next.js route map
- `U2_cleanup_plan.json` - Cleanup analysis
- `U3_security_patch.json` - Security baseline
- `U4_ux_files.json` - UX enhancements
- `U5_mls_scaffold.json` - MLS E2EE scaffold
- `U6_images.json` - Docker image digests
- `U7_deploy.json` - Cloud Run deployment
- `U8_domains.json` - Domain mapping
- `U9_headers.json` - Security headers
- `U9_headers_report.txt` - Raw headers
- `U10_lhci.json` - Lighthouse CI results
- `U10_k6.json` - Load test results
- `U10_playwright.html` - E2E test report
- `U11_sbom.json` - Software Bill of Materials
- `U11_provenance.jsonl` - SLSA attestations
- `U11_cosign.txt` - Cosign signatures
- `U12_traffic.json` - Traffic promotion
- `U13_schedules.json` - Monitoring schedules
- `U14_scaling.json` - Scaling policies
- `U14_budgets.json` - Cost budgets
- `U15_plan.md` - Federation plan
- `U16_roadmap.md` - Clients roadmap
- `U17_docs_commit.txt` - Documentation refresh
- `U18_operate.json` - Branch protection + tag
- `U19_plan.md` - Vercel decommission
- **`FINAL.json`** - Complete summary + live URLs

---

## Success Criteria

Migration complete when:

1. ✅ All 20 stages execute successfully
2. ✅ Final output: `ATLAS_ULTIMATE_DONE`
3. ✅ `FINAL.json` contains 3 live service URLs
4. ✅ All services return HTTP 200
5. ✅ Security headers validated
6. ✅ Quality gates passed (LHCI, k6, Playwright)
7. ✅ Supply chain attestations verified
8. ✅ Scheduled monitoring active
9. ✅ Branch protection enabled
10. ✅ Tag `v1.0.0` created

---

## Troubleshooting

### Missing Secrets
**Problem**: `READY_NO_SECRETS:[GH_ADMIN_TOKEN,GCP_PROJECT_ID]`

**Solution**:
1. Navigate to: https://github.com/pussycat186/Atlas/settings/secrets/actions
2. Add missing secrets
3. Re-run workflow

---

### Infrastructure Permissions
**Problem**: `BLOCKER_INFRA_PERMS:lb_or_cert`

**Solution**:
```bash
# Grant required IAM roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/certificatemanager.admin"
```

---

### Quality Gates Failure
**Problem**: `BLOCKER_QUALITY:lhci:performance_score_0.85`

**Solution**:
1. Review Lighthouse report in workflow logs
2. Workflow auto-retries ≤5 times with optimizations
3. If persistent, investigate app performance issues

---

### Supply Chain Failure
**Problem**: `BLOCKER_SUPPLY_CHAIN:cosign_verify_failed`

**Solution**:
1. Check Cosign OIDC configuration
2. Verify Sigstore rekor.sigstore.dev accessibility
3. Retry workflow (ephemeral network issues common)

---

## Next Steps

Once workflow completes:

### 1. Verify Services (Immediate)

```bash
# Get URLs from FINAL.json
cat docs/evidence/ultimate/<timestamp>/FINAL.json | jq '.services'

# Test each service
curl -I https://<admin-insights-url>/
curl -I https://<dev-portal-url>/
curl -I https://<proof-messenger-url>/

# Verify Vietnamese text
curl -sL https://<proof-messenger-url>/ | grep "Nhắn tin"
```

### 2. Review Evidence (Day 1)

```bash
# Check complete evidence trail
ls -lah docs/evidence/ultimate/<timestamp>/

# Validate FINAL.json
cat docs/evidence/ultimate/<timestamp>/FINAL.json | jq .
```

### 3. Monitor Stability (Days 1-7)

- Watch Cloud Run logs: https://console.cloud.google.com/logs
- Monitor error rates: https://console.cloud.google.com/errors
- Check costs: https://console.cloud.google.com/billing
- Review scheduled monitor results: https://github.com/pussycat186/Atlas/actions

### 4. Decommission Vercel (Days 7-30)

Follow: `docs/VERCEL_DECOMMISSION_PLAN.md`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│          GitHub Actions (Ultimate)              │
│  ┌──────────────────────────────────────────┐  │
│  │  U0: Secrets Audit ✅                    │  │
│  │  U1: Repository Comprehension            │  │
│  │  U2: Guarded Cleanup (safe mode)         │  │
│  │  U3: Security Baseline (Next + Docker)   │  │
│  │  U4: UX Boost (Vietnamese routes)        │  │
│  │  U5: MLS E2EE Scaffold                   │  │
│  └──────────────────────────────────────────┘  │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │  U6: Build 3 Docker Images               │  │
│  │  U7: Deploy to Cloud Run                 │  │
│  │  U8: Domains + SSL + CDN                 │  │
│  └──────────────────────────────────────────┘  │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │  U9: Security Headers Validation         │  │
│  │  U10: Quality Gates (LHCI/k6/Playwright) │  │
│  │  U11: Supply Chain (SBOM/SLSA/Cosign)    │  │
│  └──────────────────────────────────────────┘  │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │  U12: Promote 100% or Rollback           │  │
│  │  U13: Scheduled Monitors                 │  │
│  └──────────────────────────────────────────┘  │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │  U14-U19: Docs, Plans, Roadmaps          │  │
│  │  U20: FINAL.json + ATLAS_ULTIMATE_DONE   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼
      ┌───────────────────────────────┐
      │      GCP Cloud Run            │
      │  ┌─────────────────────────┐  │
      │  │ 3 Services (min=1,max=50│  │
      │  │ - admin_insights        │  │
      │  │ - dev_portal            │  │
      │  │ - proof_messenger       │  │
      │  └─────────────────────────┘  │
      │           ▼                   │
      │  ┌─────────────────────────┐  │
      │  │ Global HTTPS LB + CDN   │  │
      │  │ Managed SSL Certs       │  │
      │  └─────────────────────────┘  │
      └───────────────────────────────┘
```

---

## Status

**Current**: ✅ Orchestrator deployed and ready  
**Commit**: `41aaf1d`  
**Trigger**: `.atlas/autorun/ultimate-20251019-065046.txt`  
**Next Action**: Configure 8 required GitHub secrets → Workflow will auto-execute  
**Expected Outcome**: `ATLAS_ULTIMATE_DONE` + 3 live Cloud Run services  
**Duration**: 60-110 minutes (fully automated)

---

## Contact & Support

- **Workflow File**: `.github/workflows/atlas-ultimate.yml`
- **GitHub Actions**: https://github.com/pussycat186/Atlas/actions
- **Cloud Run Console**: https://console.cloud.google.com/run?project=<PROJECT_ID>
- **Evidence Root**: `docs/evidence/ultimate/<timestamp>/`

---

*Generated: 2025-10-19T06:50:46Z*  
*Workflow: atlas-ultimate.yml*  
*Stages: U0-U20 (20 total)*
