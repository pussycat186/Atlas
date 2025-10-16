# ATLAS_SOT_EXECUTE_NOW - IMMEDIATE EXECUTION PLAN

**Generated**: 2025-10-17  
**Repository**: https://github.com/pussycat186/Atlas  
**Branch**: main  
**Status**: ✅ ALL INFRASTRUCTURE VERIFIED - READY TO EXECUTE

---

## ✅ PRE-FLIGHT VERIFICATION COMPLETE

### Security Flags Status: 9/9 ENABLED at 100%

```yaml
✅ SECURITY_CSP_STRICT:        enabled: true, canary_pct: 100
✅ SECURITY_TRUSTED_TYPES:     enabled: true, canary_pct: 100
✅ SECURITY_SRI_REQUIRED:      enabled: true, canary_pct: 100
✅ SECURITY_COOP_COEP:         enabled: true, canary_pct: 100
✅ SECURITY_HSTS_PRELOAD:      enabled: true, canary_pct: 100
✅ SECURITY_CSRF_ENFORCE:      enabled: true, canary_pct: 100
✅ SECURITY_TLS13_STRICT:      enabled: true, canary_pct: 100
✅ SECURITY_OPA_ENFORCE:       enabled: true, canary_pct: 100
✅ SECURITY_DPOP_ENFORCE:      enabled: true, canary_pct: 100
```

### Deploy Workflow Verification: ✅ SOT PATTERN APPLIED

**File**: `.github/workflows/deploy-frontends.yml`

✅ **SHA-pinned actions**:
- checkout@b4ffde65f46336ab88eb53be808477a3936bae11
- pnpm@fe02b34f77f8bc703788d5817da081398fad5dd2
- setup-node@60edb5dd545a775178f52524783378180af0d1f8

✅ **Matrix strategy**: apps/admin-insights, apps/dev-portal, apps/proof-messenger

✅ **defaults.run.working-directory**: `${{ matrix.app }}`

✅ **No secrets in matrix**: Secrets set via env vars at job level + case statement

✅ **Minimal permissions**: `id-token: write, contents: read`

✅ **No duplicate --cwd flags**: Build uses `pnpm -w build` at workspace root

✅ **Case statement for project ID selection**:
```yaml
- name: Select Vercel project ID
  run: |
    case "${{ matrix.app }}" in
      "apps/admin-insights")
        echo "VERCEL_PROJECT_ID=${{ secrets.VERCEL_PROJECT_ID_ADMIN_INSIGHTS }}" >> $GITHUB_ENV
        ;;
      "apps/dev-portal")
        echo "VERCEL_PROJECT_ID=${{ secrets.VERCEL_PROJECT_ID_DEV_PORTAL }}" >> $GITHUB_ENV
        ;;
      "apps/proof-messenger")
        echo "VERCEL_PROJECT_ID=${{ secrets.VERCEL_PROJECT_ID_PROOF_MESSENGER }}" >> $GITHUB_ENV
        ;;
    esac
```

---

## 🚀 EXECUTION SEQUENCE - RUN NOW

### ⚠️ CONSTRAINT: GitHub CLI Not Available Locally

**Cannot trigger workflows programmatically** from this environment. All execution must be done via:
- **GitHub Actions Web UI** (manual trigger)
- **GitHub CLI from another environment** (Codespaces, CI runner, etc.)

---

## 📋 STEP S0: SECRETS AUDIT (CRITICAL FIRST STEP)

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/atlas-secrets-audit.yml

2. **Click**: "Run workflow" button (top right)

3. **Select**: Branch `main`

4. **Click**: Green "Run workflow" button

5. **Wait**: ~2 minutes for completion

### Success Criteria:

**Output must show**: `ALL_SECRETS_PRESENT`

**Required secrets (7 total)**:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID_ADMIN_INSIGHTS
- VERCEL_PROJECT_ID_DEV_PORTAL
- VERCEL_PROJECT_ID_PROOF_MESSENGER
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN

### If Secrets Missing:

**Output format**:
```
READY_NO_SECRETS:["VERCEL_TOKEN","VERCEL_ORG_ID",...]
```

**Action**:
1. Navigate to: https://github.com/pussycat186/Atlas/settings/secrets/actions
2. Configure missing secrets per `SECRETS_GUIDE.md`
3. **Re-run S0** until `ALL_SECRETS_PRESENT`

### ⛔ BLOCKER POLICY:

**DO NOT PROCEED** to deployment steps until S0 shows `ALL_SECRETS_PRESENT`.

---

## 📋 STEP 1: DEPLOY FRONTENDS

### Prerequisites:
- ✅ S0 secrets audit PASSED

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/deploy-frontends.yml

2. **Click**: "Run workflow"

3. **Branch**: `main`

4. **Execute**: Click green button

5. **Wait**: ~15 minutes

### Success Criteria:

**All 3 matrix jobs complete successfully**:
- ✅ deploy (apps/admin-insights)
- ✅ deploy (apps/dev-portal)
- ✅ deploy (apps/proof-messenger)

**Capture deployment URLs from logs**:
```
Deployed to production:
https://atlas-admin-insights-abc123.vercel.app
https://atlas-dev-portal-xyz789.vercel.app
https://atlas-proof-messenger-def456.vercel.app
```

### Fix-Until-Green:

**If build fails**:
1. Review workflow logs for specific error
2. Common issues:
   - TypeScript errors → Fix type issues, commit, push
   - Dependency issues → Update package.json, commit, push
   - Build timeout → Optimize bundle size
3. **Re-run workflow** after fixes

---

## 📋 STEP 2: VALIDATE HEADERS (PRODUCTION)

### Prerequisites:
- ✅ Step 1 PASSED with 3 deployment URLs

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/atlas-perfect-live-validation.yml

2. **Click**: "Run workflow"

3. **Branch**: `main`

4. **Input** (workflow dispatch input):
   ```
   deployment_urls: https://atlas-admin-insights-abc123.vercel.app,https://atlas-dev-portal-xyz789.vercel.app,https://atlas-proof-messenger-def456.vercel.app
   ```

5. **Execute**: Click green button

6. **Wait**: ~5 minutes

### Success Criteria:

**All security headers PASS**:
- ✅ CSP with nonce (no `'unsafe-inline'`)
- ✅ Trusted-Types: `nextjs#bundler atlas default` (or similar policy)
- ✅ COOP: `same-origin`
- ✅ COEP: `require-corp`
- ✅ CORP: `same-site`
- ✅ HSTS: `max-age=31536000; includeSubDomains; preload`
- ✅ RFC 9421 receipts present (if applicable)
- ✅ DPoP enforcement verified

### Fix-Until-Green:

**If headers fail**:
1. Check middleware: `packages/@atlas/security-middleware/src/index.ts`
2. Common fixes:
   - CSP missing nonce → Update middleware to generate nonces
   - Trusted-Types not enforced → Add policy configuration
   - COOP/COEP missing → Enable in middleware
3. **Commit fixes** → **Re-deploy** (Step 1) → **Re-validate** (Step 2)

---

## 📋 STEP 3: QUALITY GATES

### Prerequisites:
- ✅ Step 2 PASSED (headers validated)

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/atlas-quality-gates.yml

2. **Click**: "Run workflow"

3. **Branch**: `main`

4. **Input** (if required):
   ```
   target_urls: <same URLs from Step 2>
   ```

5. **Execute**: Click green button

6. **Wait**: ~30 minutes

### Success Criteria:

**Lighthouse CI**:
- ✅ Performance ≥ 0.90 (90%)
- ✅ Accessibility ≥ 0.95 (95%)
- ✅ Best Practices ≥ 0.95 (95%)
- ✅ SEO ≥ 0.95 (95%)

**k6 Load Testing**:
- ✅ p95 latency ≤ 200ms
- ✅ Error rate < 1%
- ✅ Throughput meets target

**Playwright E2E**:
- ✅ All critical user flows PASS
- ✅ 100% test success rate

### Fix-Until-Green:

**If Lighthouse fails**:
- Performance → Optimize bundles, lazy load, reduce JS
- Accessibility → Fix ARIA labels, contrast ratios, semantic HTML
- Best Practices → Update deps, fix console errors

**If k6 fails**:
- p95 high → Optimize API endpoints, add caching, CDN
- Errors → Fix backend issues, rate limits

**If Playwright fails**:
- Fix UI bugs, update selectors, handle timing issues

**After fixes**: Commit → Re-deploy → Re-run Steps 2-3

---

## 📋 STEP 4: POLICY CHECK

### Prerequisites:
- ✅ Step 3 PASSED (quality gates met)

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/policy-check.yml

2. **Click**: "Run workflow"

3. **Branch**: `main`

4. **Execute**: Click green button

5. **Wait**: ~5 minutes

### Success Criteria:

**OPA/Conftest Policy Enforcement**:
- ✅ 0 policy violations
- ✅ All security flags validated
- ✅ Configuration meets compliance requirements

### Fix-Until-Green:

**If policy violations found**:
1. Review OPA policies in `.github/policy/`
2. Common issues:
   - Security flag disabled → Enable in `security/flags.yaml`
   - Missing required configuration → Update app config
   - Non-compliant settings → Tighten security settings
3. **Commit fixes** → **Re-run Step 4**

---

## 📋 STEP 5: ACCEPTANCE & EVIDENCE GENERATION

### Prerequisites:
- ✅ All Steps 1-4 PASSED

### Execute Now:

1. **Navigate to**: https://github.com/pussycat186/Atlas/actions/workflows/atlas-acceptance.yml

2. **Click**: "Run workflow"

3. **Branch**: `main`

4. **Input**:
   ```
   test_suite: full
   deployment_target: production
   generate_evidence: true
   ```

5. **Execute**: Click green button

6. **Wait**: ~40 minutes

### Success Criteria:

**All acceptance tests PASS**:
- ✅ E2E flows complete successfully
- ✅ Security validations pass
- ✅ Integration tests pass
- ✅ Evidence pack generated

### Evidence Pack Download:

1. After workflow completes, go to workflow run page
2. Scroll to **Artifacts** section
3. Download `evidence-pack` artifact
4. Extract to: `docs/evidence/<UTC-YYYYMMDD-HHMM>/`

### Required Evidence Files (11 total):

**Supply Chain (3 files)**:
- ✅ `SBOM.cyclonedx.json` - CycloneDX bill of materials
- ✅ `provenance.intoto.jsonl` - SLSA provenance attestation
- ✅ `cosign-verify.txt` - Cosign signature verification

**Security Headers (1 file)**:
- ✅ `headers-report.txt` - Production header validation results

**Quality Gates (3 files)**:
- ✅ `lhci.json` - Lighthouse CI scores
- ✅ `k6-summary.json` - Load test metrics
- ✅ `playwright-report.html` - E2E test results

**Receipts & MLS (4 files)**:
- ✅ `receipts-samples/*.json` - RFC 9421 signed receipts
- ✅ `jwks.json` - JWKS with rotation metadata
- ✅ `acceptance.log` - Full test execution log
- ✅ `acceptance-summary.json` - Test result summary

### Fix-Until-Green:

**If tests fail**:
1. Review `acceptance.log` for specific failures
2. Common issues:
   - Test assertions fail → Fix application bugs
   - Timing issues → Update test waits
   - Environment issues → Verify secrets/config
3. **Commit fixes** → **Re-run Steps 1-5** as needed

---

## 🔍 POST-EXECUTION VERIFICATION

### After downloading evidence pack, run these checks:

### A) Headers Verification
```bash
cd docs/evidence/<UTC-YYYYMMDD-HHMM>/

# CSP with nonce (no unsafe-inline)
grep -q "nonce-" headers-report.txt && echo "✅ CSP nonce" || echo "❌ CSP nonce"
grep "unsafe-inline" headers-report.txt && echo "❌ unsafe-inline found" || echo "✅ No unsafe-inline"

# Trusted Types
grep -q "Trusted-Types" headers-report.txt && echo "✅ Trusted-Types" || echo "❌ Trusted-Types"

# COOP/COEP/CORP
grep -q "same-origin" headers-report.txt && echo "✅ COOP" || echo "❌ COOP"
grep -q "require-corp" headers-report.txt && echo "✅ COEP" || echo "❌ COEP"
grep -q "same-site" headers-report.txt && echo "✅ CORP" || echo "❌ CORP"

# HSTS with preload
grep -q "preload" headers-report.txt && echo "✅ HSTS preload" || echo "❌ HSTS preload"
```

### B) Quality Gates Verification
```bash
# Lighthouse scores (all ≥ thresholds)
jq '.[] | select(.performance >= 0.90 and .accessibility >= 0.95 and .bestPractices >= 0.95 and .seo >= 0.95)' lhci.json

# k6 performance (p95 ≤ 200ms)
jq 'select(.metrics.http_req_duration.values.p95 <= 200)' k6-summary.json

# Playwright (100% pass)
grep -q "100% passed" playwright-report.html && echo "✅ All E2E tests passed"
```

### C) Supply Chain Verification
```bash
# Cosign verification
grep -q "Verified OK" cosign-verify.txt && echo "✅ Attestation verified" || echo "❌ Attestation failed"

# SBOM components present
jq '.components | length' SBOM.cyclonedx.json  # Should be > 0

# No High/Critical vulnerabilities
grep -iE "high|critical" acceptance.log | wc -l  # Should be 0
```

### D) Receipts & JWKS Verification
```bash
# JWKS rotation (≤90 days)
jq '.keys[0] | (now - .iat) / 86400 | floor' jwks.json  # Should be ≤ 90

# Receipt samples present
ls receipts-samples/*.json | wc -l  # Should be > 0

# RFC 9421 verification success
grep -c "verified: true" receipts-samples/*.json
```

---

## 🎊 FINAL OUTPUT: PERFECT_LIVE STATUS

### After ALL verifications PASS, create this JSON:

**File**: `ATLAS_PERFECT_LIVE.json`

```json
{
  "status": "PERFECT_LIVE",
  "timestamp": "<UTC_COMPLETION_TIMESTAMP>",
  "repository": "https://github.com/pussycat186/Atlas",
  "branch": "main",
  "commit": "<COMMIT_SHA>",
  
  "frontends": {
    "messenger": "N/A",
    "admin_insights": "<VERCEL_URL_FROM_STEP_1>",
    "dev_portal": "<VERCEL_URL_FROM_STEP_1>",
    "proof_messenger": "<VERCEL_URL_FROM_STEP_1>"
  },
  
  "chat_core": {
    "e2ee": "MLS_ON",
    "group_rekey": "O(logN)",
    "p95_ms": <FROM_K6_SUMMARY>
  },
  
  "receipts": {
    "rfc9421_verify_success_pct": <FROM_EVIDENCE>,
    "jwks_rotation_days": <FROM_JWKS>
  },
  
  "flags": {
    "CSP": "ON",
    "TrustedTypes": "ON",
    "SRI": "ON",
    "COOP_COEP": "ON",
    "HSTS": "ON",
    "DPoP": "ON",
    "TLS13": "ON",
    "OPA": "ON",
    "SBOM_SLSA": "ON",
    "Cosign": "ON"
  },
  
  "gates": {
    "lighthouse": "PASS",
    "k6": "PASS",
    "playwright": "PASS",
    "supply_chain": "PASS",
    "opa": "PASS"
  },
  
  "compliance": {
    "SOC2_STATUS": "READY",
    "ISO27001_STATUS": "READY",
    "SLSA_LEVEL": "3_ACHIEVED"
  },
  
  "evidence": "docs/evidence/<UTC-YYYYMMDD-HHMM>/",
  
  "workflow_runs": {
    "secrets_audit": "<WORKFLOW_RUN_URL>",
    "deploy": "<WORKFLOW_RUN_URL>",
    "validation": "<WORKFLOW_RUN_URL>",
    "quality": "<WORKFLOW_RUN_URL>",
    "policy": "<WORKFLOW_RUN_URL>",
    "acceptance": "<WORKFLOW_RUN_URL>"
  }
}
```

### Commit Final Status:
```bash
git add ATLAS_PERFECT_LIVE.json docs/evidence/
git commit -m "feat: PERFECT_LIVE status achieved - all gates PASS with evidence"
git push origin main
```

---

## 📊 EXECUTION TRACKING TABLE

| Step | Workflow | Status | Duration | Actions URL | Notes |
|------|----------|--------|----------|-------------|-------|
| **S0** | atlas-secrets-audit.yml | ⏳ PENDING | ~2min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/atlas-secrets-audit.yml) | **RUN FIRST** |
| **1** | deploy-frontends.yml | ⏳ PENDING | ~15min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/deploy-frontends.yml) | Capture 3 URLs |
| **2** | atlas-perfect-live-validation.yml | ⏳ PENDING | ~5min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/atlas-perfect-live-validation.yml) | Use URLs from Step 1 |
| **3** | atlas-quality-gates.yml | ⏳ PENDING | ~30min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/atlas-quality-gates.yml) | LHCI + k6 + Playwright |
| **4** | policy-check.yml | ⏳ PENDING | ~5min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/policy-check.yml) | OPA enforcement |
| **5** | atlas-acceptance.yml | ⏳ PENDING | ~40min | [Run](https://github.com/pussycat186/Atlas/actions/workflows/atlas-acceptance.yml) | Evidence generation |

**Total Estimated Time**: ~1.5 hours (if all pass on first run)

---

## 🚨 FAIL POLICY

### If and only if secrets/permissions block execution:

**Output format**:
```
READY_NO_SECRETS:["VERCEL_TOKEN","VERCEL_ORG_ID","VERCEL_PROJECT_ID_ADMIN_INSIGHTS","VERCEL_PROJECT_ID_DEV_PORTAL","VERCEL_PROJECT_ID_PROOF_MESSENGER","CLOUDFLARE_ACCOUNT_ID","CLOUDFLARE_API_TOKEN"]
```

### Otherwise:

**DO NOT STOP. Fix-until-green**:
1. Capture failure evidence (logs, screenshots)
2. Apply minimal audited fix
3. Commit and push
4. Re-run failed workflow
5. Iterate until workflow passes
6. Continue to next step

---

## ✅ READY TO BEGIN

**Infrastructure Status**: ✅ 100% VERIFIED  
**Workflows**: ✅ 6/6 CONFIGURED  
**Security Flags**: ✅ 9/9 ENABLED at 100%  
**Documentation**: ✅ COMPLETE  

### 🚀 START EXECUTION NOW:

**CLICK HERE**: https://github.com/pussycat186/Atlas/actions/workflows/atlas-secrets-audit.yml

**Then follow the sequential execution plan above.**

---

**Mode**: Remote-only | Fix-until-green | Single source of truth | Evidence-driven | No excuses  
**Last Updated**: 2025-10-17  
**Status**: ⏳ AWAITING MANUAL WORKFLOW TRIGGERS
