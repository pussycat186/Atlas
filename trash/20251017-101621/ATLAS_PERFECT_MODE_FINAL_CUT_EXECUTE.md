# ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE - Manual Execution Guide

**Status:** GitHub CLI not available - manual execution required  
**Repository:** https://github.com/pussycat186/Atlas  
**Branch:** main  
**Timestamp:** 2025-01-16T17:27Z

---

## EXECUTION SEQUENCE

### Step 1: Deploy Frontends (CRITICAL - DO THIS FIRST)

**URL:** https://github.com/pussycat186/Atlas/actions/workflows/deploy-frontends.yml

1. Click **"Run workflow"** button (top right)
2. Select branch: **main**
3. Click **"Run workflow"** (green button)
4. **WAIT FOR COMPLETION** - This takes ~10-15 minutes
5. **CAPTURE DEPLOYMENT URLS** from workflow logs:
   - Open the completed workflow run
   - Click on "Deploy to Vercel" job for each app
   - Look for "Preview URL" or "Production URL" in logs
   - Example format: `https://admin-insights-xyz.vercel.app`
   
**Expected Deployments:**
- admin-insights
- dev-portal  
- proof-messenger

**Critical:** Write down all 3 URLs - you need them for Step 2

---

### Step 2: Validate Production Headers (REQUIRES URLs from Step 1)

**URL:** https://github.com/pussycat186/Atlas/actions/workflows/atlas-perfect-live-validation.yml

1. Click **"Run workflow"** button
2. Select branch: **main**
3. **Input field "deployment_urls":** Paste the 3 URLs from Step 1, comma-separated
   - Example: `https://admin-insights-xyz.vercel.app,https://dev-portal-abc.vercel.app,https://proof-messenger-def.vercel.app`
4. Click **"Run workflow"** (green button)
5. **WAIT FOR COMPLETION** - This takes ~5 minutes
6. **CHECK RESULTS:** All header validations should PASS
   - CSP with nonces
   - Trusted-Types header
   - COOP/COEP/CORP headers
   - HSTS with preload
   - RFC 9421 receipts

**Success Criteria:** All validations PASS, no failures

---

### Step 3: Quality Gates

**URL:** https://github.com/pussycat186/Atlas/actions/workflows/atlas-quality-gates.yml

1. Click **"Run workflow"** button
2. Select branch: **main**
3. Click **"Run workflow"** (green button)
4. **WAIT FOR COMPLETION** - This takes ~20-30 minutes
5. **CHECK RESULTS:**
   - Lighthouse scores ≥90 (Performance, Accessibility, Best Practices, SEO)
   - k6 load test: p95 < 500ms, error rate < 1%
   - Playwright E2E tests: 100% pass rate

**Success Criteria:** All quality gates PASS

---

### Step 4: Policy Check (OPA)

**URL:** https://github.com/pussycat186/Atlas/actions/workflows/policy-check.yml

1. Click **"Run workflow"** button
2. Select branch: **main**
3. Click **"Run workflow"** (green button)
4. **WAIT FOR COMPLETION** - This takes ~5 minutes
5. **CHECK RESULTS:** All OPA policies PASS

**Success Criteria:** No policy violations

---

### Step 5: Acceptance Tests & Evidence Collection

**URL:** https://github.com/pussycat186/Atlas/actions/workflows/atlas-acceptance.yml

1. Click **"Run workflow"** button
2. Select branch: **main**
3. **Input fields:**
   - `test_suite`: **full**
   - `deployment_target`: **production**
   - `generate_evidence`: **true**
4. Click **"Run workflow"** (green button)
5. **WAIT FOR COMPLETION** - This takes ~30-40 minutes
6. **DOWNLOAD EVIDENCE PACK:**
   - Scroll to bottom of completed workflow run
   - Find "Artifacts" section
   - Download `evidence-pack` artifact (ZIP file)
   - Extract to `docs/evidence/20251016-1727/`

**Evidence Pack Contents (VERIFY ALL PRESENT):**
- `sbom.json` - CycloneDX SBOM
- `provenance.json` - SLSA provenance
- `cosign-verify.txt` - Cosign attestation verification
- `headers-report.json` - Security headers validation
- `lhci.json` - Lighthouse CI results
- `k6-summary.json` - k6 load test results
- `playwright-report.html` - E2E test results
- `receipts/` - RFC 9421 signed receipts
- `jwks.json` - JWKS with rotation timestamp
- `acceptance.log` - Full acceptance test log
- `acceptance-summary.json` - Test summary

**Success Criteria:** All files present, all tests PASS

---

## VERIFICATION CHECKLIST

After completing all 5 steps, verify:

- [ ] All 3 frontends deployed to Vercel successfully
- [ ] All security headers validated on production URLs (Step 2 PASS)
- [ ] Lighthouse scores ≥90 for all apps (Step 3 PASS)
- [ ] k6 load test p95 < 500ms, error rate < 1% (Step 3 PASS)
- [ ] Playwright E2E tests 100% pass rate (Step 3 PASS)
- [ ] OPA policy checks all PASS (Step 4 PASS)
- [ ] Acceptance tests all PASS (Step 5 PASS)
- [ ] Evidence pack downloaded and contains all required files
- [ ] SBOM has valid components and dependencies
- [ ] Provenance has valid signatures
- [ ] Cosign verification successful
- [ ] JWKS rotation ≤90 days
- [ ] RFC 9421 receipts present and valid

---

## FIX-UNTIL-GREEN APPROACH

If any step fails:

1. **Capture error details:**
   - Screenshot of failure
   - Copy error message
   - Note which step failed

2. **Analyze root cause:**
   - Check workflow logs for specific error
   - Review configuration files if needed
   - Check Vercel deployment logs if deployment failed

3. **Fix the issue:**
   - Update code/configuration as needed
   - Commit and push fix to main branch
   - Re-run the failed workflow

4. **Verify fix:**
   - Ensure step now passes
   - Continue to next step
   - Re-run dependent steps if needed (e.g., if Step 1 was re-run, re-run Step 2 with new URLs)

5. **Iterate until GREEN:**
   - Repeat fix-verify cycle
   - Do not proceed until step passes
   - Document any blockers

---

## FINAL OUTPUT: PERFECT_LIVE STATUS

Once all steps complete successfully, create final report:

### `ATLAS_PERFECT_LIVE.json`

```json
{
  "status": "PERFECT_LIVE",
  "timestamp": "2025-01-16T17:27:00Z",
  "repository": "pussycat186/Atlas",
  "branch": "main",
  "commit": "<CAPTURE_FROM_WORKFLOWS>",
  "gates": {
    "deployment": {
      "status": "PASS",
      "apps": ["admin-insights", "dev-portal", "proof-messenger"],
      "urls": ["<URL1>", "<URL2>", "<URL3>"],
      "workflow_run": "<WORKFLOW_URL>"
    },
    "security_headers": {
      "status": "PASS",
      "validations": {
        "csp_strict": "PASS",
        "trusted_types": "PASS",
        "coop_coep": "PASS",
        "hsts_preload": "PASS",
        "rfc9421_receipts": "PASS"
      },
      "workflow_run": "<WORKFLOW_URL>"
    },
    "quality": {
      "status": "PASS",
      "lighthouse": {
        "performance": "≥90",
        "accessibility": "≥90",
        "best_practices": "≥90",
        "seo": "≥90"
      },
      "k6": {
        "p95_latency_ms": "<500",
        "error_rate_pct": "<1"
      },
      "playwright": {
        "pass_rate_pct": "100"
      },
      "workflow_run": "<WORKFLOW_URL>"
    },
    "policy": {
      "status": "PASS",
      "violations": 0,
      "workflow_run": "<WORKFLOW_URL>"
    },
    "acceptance": {
      "status": "PASS",
      "test_suite": "full",
      "deployment_target": "production",
      "workflow_run": "<WORKFLOW_URL>"
    }
  },
  "evidence": {
    "location": "docs/evidence/20251016-1727/evidence-pack.zip",
    "files": [
      "sbom.json",
      "provenance.json",
      "cosign-verify.txt",
      "headers-report.json",
      "lhci.json",
      "k6-summary.json",
      "playwright-report.html",
      "receipts/*.json",
      "jwks.json",
      "acceptance.log",
      "acceptance-summary.json"
    ],
    "verification": {
      "sbom": "VALID",
      "provenance": "SIGNED",
      "cosign": "VERIFIED",
      "jwks_rotation_days": "<90",
      "receipts": "VALID"
    }
  },
  "security_flags": {
    "CSP_STRICT": "100%",
    "TRUSTED_TYPES": "100%",
    "SRI_REQUIRED": "100%",
    "COOP_COEP": "100%",
    "HSTS_PRELOAD": "100%",
    "CSRF_ENFORCE": "100%",
    "TLS13_STRICT": "100%",
    "OPA_ENFORCE": "100%"
  },
  "compliance": {
    "slsa_level": "3",
    "supply_chain": "ATTESTED",
    "security_posture": "PRODUCTION_READY"
  }
}
```

---

## HARD EVIDENCE REQUIRED

Screenshot or copy the following:

1. **Deployment Success:** deploy-frontends.yml workflow run showing all 3 apps deployed
2. **Header Validation:** atlas-perfect-live-validation.yml showing all headers PASS
3. **Quality Gates:** atlas-quality-gates.yml showing Lighthouse/k6/Playwright all PASS
4. **Policy Check:** policy-check.yml showing no violations
5. **Acceptance:** atlas-acceptance.yml showing full test suite PASS
6. **Evidence Pack:** Screenshot of extracted evidence-pack contents showing all files
7. **SBOM Snippet:** First 20 lines of sbom.json showing valid CycloneDX format
8. **Provenance Snippet:** Signature section of provenance.json
9. **Cosign Verification:** Output showing "Verified OK"
10. **JWKS Rotation:** Timestamp showing ≤90 days

---

## EXECUTION NOTES

- **No localhost:** All testing against production Vercel URLs
- **No questions:** Execute all steps in sequence
- **Fix-until-green:** Do not accept failures, iterate until all PASS
- **Hard evidence:** Capture screenshots/logs at each step
- **No excuses:** Complete execution end-to-end

---

**START NOW:** https://github.com/pussycat186/Atlas/actions/workflows/deploy-frontends.yml
