# ATLAS_SOT_PERFECT_MODE - Single Source of Truth Execution

**Mode**: Remote-only | Fix-until-green | Canary-first | Evidence-driven  
**Repository**: https://github.com/pussycat186/Atlas  
**Branch**: main  
**Commit**: 1bd18e5  
**Timestamp**: 2025-10-17T00:00:00Z

---

## ✅ SETUP COMPLETE (S0-S2)

### S0: Secrets Audit ✅
- Workflow exists: `.github/workflows/atlas-secrets-audit.yml`
- Required secrets (7 total):
  - VERCEL_TOKEN
  - VERCEL_ORG_ID  
  - VERCEL_PROJECT_ID_ADMIN_INSIGHTS
  - VERCEL_PROJECT_ID_DEV_PORTAL
  - VERCEL_PROJECT_ID_PROOF_MESSENGER
  - CLOUDFLARE_ACCOUNT_ID
  - CLOUDFLARE_API_TOKEN

**Action**: Run secrets audit workflow first to verify all secrets present.

### S1: Workflow Patched ✅
- `deploy-frontends.yml` updated with SOT pattern:
  - ✅ SHA-pinned actions (checkout@b4ffde6, pnpm@fe02b34, node@60edb5d)
  - ✅ Minimal permissions: `id-token: write, contents: read`
  - ✅ Matrix strategy with `apps/*` paths
  - ✅ `defaults.run.working-directory: ${{ matrix.app }}`
  - ✅ No secrets in matrix (env vars only)
  - ✅ No duplicate `--cwd` flags
  - ✅ `fail-fast: false` for independent app deployment

### S2: Security Flags ✅
All 9 required flags enabled at 100% in `security/flags.yaml`:
- ✅ SECURITY_CSP_STRICT
- ✅ SECURITY_TRUSTED_TYPES
- ✅ SECURITY_SRI_REQUIRED
- ✅ SECURITY_COOP_COEP
- ✅ SECURITY_HSTS_PRELOAD
- ✅ SECURITY_CSRF_ENFORCE
- ✅ SECURITY_TLS13_STRICT
- ✅ SECURITY_OPA_ENFORCE
- ✅ SECURITY_DPOP_ENFORCE

**Middleware**: `packages/@atlas/security-middleware/src/index.ts` correctly emits production headers:
- Content-Security-Policy with nonce, no 'unsafe-inline'
- Trusted-Types: nextjs#bundler atlas default
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Resource-Policy: same-site
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

---

## 🔄 EXECUTION SEQUENCE (RUN ORDER)

Execute workflows in order, fix-until-green approach:

### Step 1: Secrets Audit
```bash
gh workflow run atlas-secrets-audit.yml --repo pussycat186/Atlas
```
**Success criteria**: Output shows `ALL_SECRETS_PRESENT`  
**If fails**: Update `SECRETS_GUIDE.md`, create secrets, re-run until PASS

### Step 2: Deploy Frontends
```bash
gh workflow run deploy-frontends.yml --repo pussycat186/Atlas --ref main
```
**Success criteria**: All 3 apps deployed to Vercel, deployment URLs captured  
**Expected URLs**:
- admin-insights: `https://[project].vercel.app`
- dev-portal: `https://[project].vercel.app`
- proof-messenger: `https://[project].vercel.app`

**Capture URLs from workflow logs** - needed for next step!

### Step 3: Validate Production Headers
```bash
gh workflow run atlas-perfect-live-validation.yml \
  --repo pussycat186/Atlas \
  --ref main \
  -f deployment_urls="URL1,URL2,URL3"
```
**Success criteria**: All header validations PASS
- CSP nonce present, no 'unsafe-inline'
- Trusted-Types header present
- COOP same-origin
- COEP require-corp
- CORP same-site  
- HSTS present with preload

### Step 4: Quality Gates
```bash
gh workflow run atlas-quality-gates.yml --repo pussycat186/Atlas --ref main
```
**Success criteria**:
- Lighthouse: perf≥0.90, a11y≥0.95, bp≥0.95, seo≥0.95
- k6: p95≤200ms, error<1%
- Playwright: 100% PASS

### Step 5: Policy Check (OPA)
```bash
gh workflow run policy-check.yml --repo pussycat186/Atlas --ref main
```
**Success criteria**: 0 policy violations

### Step 6: Acceptance & Evidence
```bash
gh workflow run atlas-acceptance.yml \
  --repo pussycat186/Atlas \
  --ref main \
  -f test_suite=full \
  -f deployment_target=production \
  -f generate_evidence=true
```
**Success criteria**: All tests PASS, evidence-pack artifact generated

**Download artifact**:
```bash
# Get latest run ID
RUN_ID=$(gh run list --workflow=atlas-acceptance.yml --repo pussycat186/Atlas --limit 1 --json databaseId --jq '.[0].databaseId')

# Download evidence-pack
gh run download $RUN_ID --repo pussycat186/Atlas --name evidence-pack --dir docs/evidence/$(date -u +%Y%m%d-%H%M)
```

---

## 📦 EVIDENCE VERIFICATION

Evidence pack must contain all required files:

### Supply Chain
- [ ] `SBOM.cyclonedx.json` - CycloneDX format, non-empty components
- [ ] `provenance.intoto.jsonl` - SLSA provenance with builder identity
- [ ] `cosign-verify.txt` - Attestation verification output showing PASS

### Security Headers
- [ ] `headers-report.txt` - All headers validated on production URLs

### Quality Gates
- [ ] `lhci.json` - Lighthouse CI scores meeting thresholds
- [ ] `k6-summary.json` - Load test results with p95<200ms
- [ ] `playwright-report.html` - E2E test results 100% PASS

### Receipts & MLS
- [ ] `receipts-samples/*.json` - RFC 9421 signed receipts
- [ ] `jwks.json` - JWKS with rotation interval ≤90 days
- [ ] `acceptance.log` - Full acceptance test execution log
- [ ] `acceptance-summary.json` - Test result summary

---

## 🧪 AUTO-VERIFICATION CHECKLIST

Run these verifications on evidence pack:

### A) Headers Verification
```bash
grep -q "nonce-" headers-report.txt && echo "✅ CSP nonce present" || echo "❌ CSP nonce missing"
grep -q "Trusted-Types" headers-report.txt && echo "✅ Trusted-Types present" || echo "❌ Trusted-Types missing"
grep -q "same-origin" headers-report.txt && echo "✅ COOP present" || echo "❌ COOP missing"
grep -q "require-corp" headers-report.txt && echo "✅ COEP present" || echo "❌ COEP missing"
grep -q "preload" headers-report.txt && echo "✅ HSTS preload present" || echo "❌ HSTS missing"
```

### B) DPoP Verification
```bash
# Test protected endpoint without DPoP - should return 401
curl -s -o /dev/null -w "%{http_code}" https://[url]/api/protected
# Expected: 401

# Test with valid DPoP - should return 200
# (requires DPoP JWT generation - see @atlas/receipt package)
```

### C) Receipts Verification
```bash
# Verify all receipt samples against JWKS
for receipt in receipts-samples/*.json; do
  node -e "require('@atlas/receipt').verify('$receipt', 'jwks.json')" && echo "✅ $receipt verified" || echo "❌ $receipt invalid"
done

# Check JWKS rotation interval
node -e "const jwks = require('./jwks.json'); const latest = jwks.keys[0]; const rotationDays = Math.floor((Date.now() - latest.iat*1000) / 86400000); console.log(rotationDays <= 90 ? '✅ JWKS rotation ≤90 days' : '❌ JWKS rotation >90 days')"
```

### D) MLS Verification
```bash
# Check MLS core tests passed
grep -q "group rekey.*O(log N)" acceptance.log && echo "✅ MLS rekey O(log N)" || echo "❌ MLS rekey failed"
grep -q "epoch transition.*PASS" acceptance.log && echo "✅ MLS epoch transitions" || echo "❌ MLS epoch failed"
grep -q "transcript continuity.*PASS" acceptance.log && echo "✅ MLS transcript" || echo "❌ MLS transcript failed"
```

### E) Quality Gates
```bash
# Lighthouse
jq -r '.[] | select(.performance >= 0.90 and .accessibility >= 0.95 and .bestPractices >= 0.95 and .seo >= 0.95) | "✅ Lighthouse PASS"' lhci.json

# k6
jq -r 'select(.metrics.http_req_duration.values.p95 <= 200 and .metrics.http_req_failed.values.rate < 0.01) | "✅ k6 PASS"' k6-summary.json

# Playwright
grep -q "100% passed" playwright-report.html && echo "✅ Playwright PASS" || echo "❌ Playwright failures"
```

### F) Supply Chain
```bash
# Cosign verification
grep -q "Verified OK" cosign-verify.txt && echo "✅ Cosign verified" || echo "❌ Cosign failed"

# SBOM non-empty
jq -r 'select(.components | length > 0) | "✅ SBOM has components"' SBOM.cyclonedx.json

# CodeQL/Semgrep/Gitleaks/Trivy - 0 High/Critical
grep -i "high\|critical" acceptance.log | wc -l | grep -q "^0$" && echo "✅ No High/Critical issues" || echo "❌ Security issues found"
```

### G) Policy-as-Code Negative Test
```bash
# Create test branch with invalid header config
git checkout -b test/policy-violation
# Temporarily disable CSP flag
sed -i 's/SECURITY_CSP_STRICT:.*enabled: true/SECURITY_CSP_STRICT: enabled: false/' security/flags.yaml
git add security/flags.yaml
git commit -m "test: violate CSP policy"
git push origin test/policy-violation

# Create PR
gh pr create --title "Test: Policy Violation" --body "Testing OPA enforcement"

# Trigger policy-check - MUST FAIL
gh workflow run policy-check.yml --ref test/policy-violation

# Verify failure
sleep 30
RESULT=$(gh run list --workflow=policy-check.yml --branch test/policy-violation --limit 1 --json conclusion --jq '.[0].conclusion')
[[ "$RESULT" == "failure" ]] && echo "✅ Policy check correctly failed" || echo "❌ Policy check should have failed"

# Cleanup
gh pr close test/policy-violation --delete-branch
```

---

## 🎯 FINAL OUTPUT

Once all workflows PASS and evidence verified, create **PERFECT_LIVE** status:

```json
{
  "status": "PERFECT_LIVE",
  "timestamp": "<UTC_TIMESTAMP>",
  "commit": "1bd18e5",
  "frontends": {
    "admin_insights": "<DEPLOYMENT_URL>",
    "dev_portal": "<DEPLOYMENT_URL>",
    "proof_messenger": "<DEPLOYMENT_URL>",
    "messenger": "N/A"
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
  "evidence": "docs/evidence/<UTC-YYYYMMDD-HHMM>/"
}
```

---

## 🚨 FAIL POLICY

### If Secrets Missing
Output this line and stop:
```
READY_NO_SECRETS:["<missing_secret_1>","<missing_secret_2>",...]
```

Update `SECRETS_GUIDE.md` with exact creation steps, create GitHub issue for secrets request.

### Otherwise
- **DO NOT STOP** on failures
- Apply minimal audited fixes
- Re-run failed workflow
- Loop until all gates PASS
- Document each iteration in evidence log

---

## 📋 EXECUTION STATUS

| Step | Workflow | Status | Evidence |
|------|----------|--------|----------|
| S0 | atlas-secrets-audit.yml | PENDING | - |
| 1 | deploy-frontends.yml | PENDING | Deployment URLs |
| 2 | atlas-perfect-live-validation.yml | PENDING | headers-report.txt |
| 3 | atlas-quality-gates.yml | PENDING | lhci.json, k6-summary.json, playwright-report.html |
| 4 | policy-check.yml | PENDING | Policy evaluation result |
| 5 | atlas-acceptance.yml | PENDING | evidence-pack artifact |

---

## 🚀 BEGIN EXECUTION

**Prerequisites**:
- GitHub CLI installed: `gh --version`
- Authenticated: `gh auth status`
- Repository access: `gh repo view pussycat186/Atlas`

**Start**:
```bash
# Clone and execute
git clone https://github.com/pussycat186/Atlas.git
cd Atlas

# Run S0 first
gh workflow run atlas-secrets-audit.yml
gh run watch $(gh run list --workflow=atlas-secrets-audit.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# If ALL_SECRETS_PRESENT, proceed with full execution
./scripts/atlas-sot-execute.sh
```

---

**Remote-only | No localhost | Fix-until-green | Evidence-driven | No excuses**
