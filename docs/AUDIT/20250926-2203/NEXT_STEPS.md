# REMEDIATION PLAN - NEXT STEPS

**Generated:** 2025-09-26T22:03:57+07:00  
**Priority:** CRITICAL - Build failures blocking deployment

## DEPLOYMENT STRATEGY DECISION

**CHOSEN APPROACH:** Option A (Cloud Build)
- Use `vercel deploy --prod` (no prebuilt)
- Leverage existing `deploy-frontends.yml` workflow
- Minimal changes to proven deployment path

**Justification:**
1. **Proven Track Record:** Current `deploy-frontends.yml` has audit functionality and success JSON output
2. **Simplicity:** Cloud build eliminates local build complexity and dependency issues
3. **Reliability:** Vercel's cloud build environment is consistent and well-tested
4. **Audit Integration:** Built-in audit step with auto-generated script
5. **Matrix Strategy:** Parallel deployment reduces total deployment time

**Rejected Option B (Prebuilt):**
- More complex build process
- Requires local build success before deployment
- Higher chance of environment-specific build failures
- No significant performance benefit for this use case

## EXECUTION PLAN

### PHASE 3A: CRITICAL BUILD FIXES (IMMEDIATE)

**Priority 1: Fix Client-Side Config Imports**
- **Issue:** `getGatewayUrl()` imports cause build failures in client components
- **Solution:** Replace with hardcoded gateway URL for immediate fix
- **Risk:** Low - maintains functionality with static fallback
- **Files to modify:**
  1. `apps/proof-messenger/app/page.tsx:4`
  2. `apps/admin-insights/app/page.tsx:4`
  3. `apps/dev-portal/app/page.tsx:4`
  4. `apps/admin-insights/app/metrics/page.tsx:6`
  5. `apps/dev-portal/app/(legacy-src)/page-src.tsx:7`

**Replacement Pattern:**
```typescript
// REMOVE:
import { getGatewayUrl } from "@atlas/config";
const gateway = useMemo(() => {
  if (typeof window === 'undefined') return 'https://atlas-gateway.sonthenguyen186.workers.dev';
  return getGatewayUrl();
}, []);

// REPLACE WITH:
const gateway = 'https://atlas-gateway.sonthenguyen186.workers.dev';
```

### PHASE 3B: WORKFLOW CONSOLIDATION

**Priority 2: Enhance Primary Deploy Workflow**
- **Target:** `.github/workflows/deploy-frontends.yml`
- **Changes:**
  1. Add concurrency control to prevent race conditions
  2. Improve error handling and logging
  3. Ensure DEV/DEVPORTAL fallback logic is robust

**Enhanced Workflow Features:**
```yaml
concurrency:
  group: deploy-frontends-${{ github.ref }}
  cancel-in-progress: true
```

**Priority 3: Disable Conflicting Workflows**
- Rename or disable alternative deploy workflows to prevent conflicts
- Keep as backup but prevent automatic triggering

### PHASE 3C: VALIDATION FIXES (IF NEEDED)

**Asset Validation:** ✅ COMPLETE
- All apps have proper favicon.svg and manifest.json
- All prism pages have exact marker string

**Prism Marker Validation:** ✅ COMPLETE  
- All apps contain: "ATLAS • Prism UI — Peak Preview"

## DEPLOYMENT SEQUENCE

### Step 1: Apply Critical Fixes
```bash
# Fix client-side imports (5 files)
# Commit: "fix(build): replace getGatewayUrl with static gateway URL"
```

### Step 2: Enhance Workflow
```bash
# Update deploy-frontends.yml with concurrency control
# Commit: "ci: add concurrency control to deploy-frontends"
```

### Step 3: Test Build Locally
```bash
pnpm --filter "./apps/*" build
# Verify no build errors before deployment
```

### Step 4: Deploy via Workflow
```bash
# Trigger deploy-frontends.yml workflow
# Monitor logs for any remaining issues
```

### Step 5: Production Audit
```bash
# Automatic audit via workflow
# Manual verification of success criteria
```

## SUCCESS CRITERIA VALIDATION

**Required Endpoints:**
1. `https://atlas-proof-messenger.vercel.app/prism` → 2xx/3xx + marker
2. `https://atlas-admin-insights.vercel.app/prism` → 2xx/3xx + marker  
3. `https://atlas-dev-portal.vercel.app/prism` → 2xx/3xx + marker

**Audit Requirements:**
- All routes ["/", "/prism", "/favicon.svg", "/manifest.json"] return 2xx
- `/prism` pages contain exact string: "ATLAS • Prism UI — Peak Preview"
- Generate `docs/REPLAN/NAV_AUDIT.json` with results

**Success Output:**
```json
{
  "status":"PRISM_LIVE",
  "routes":{
    "proof_messenger":"https://atlas-proof-messenger.vercel.app/prism",
    "admin_insights":"https://atlas-admin-insights.vercel.app/prism", 
    "dev_portal":"https://atlas-dev-portal.vercel.app/prism"
  },
  "audit":"docs/REPLAN/NAV_AUDIT.json",
  "commit":"<sha>"
}
```

## RISK MITIGATION

**Build Failure Risk:** MITIGATED
- Static gateway URL eliminates config import issues
- Local build test before deployment
- Cloud build provides consistent environment

**Deployment Conflict Risk:** MITIGATED  
- Concurrency control prevents race conditions
- Single workflow approach reduces complexity

**Audit Failure Risk:** LOW
- All required assets already in place
- Prism markers already present
- Auto-generated audit script handles edge cases

## ROLLBACK PLAN

**If Deployment Fails:**
1. Revert client-side config changes
2. Use alternative workflow (deploy-frontends-simple.yml)
3. Manual deployment via Vercel CLI

**If Audit Fails:**
1. Check specific failing endpoints
2. Fix asset issues (unlikely - already validated)
3. Re-run deployment

## ESTIMATED TIMELINE

- **Phase 3A (Critical Fixes):** 10 minutes
- **Phase 3B (Workflow Enhancement):** 5 minutes  
- **Phase 4 (Deployment):** 15 minutes
- **Phase 5 (Audit & Validation):** 10 minutes

**Total Estimated Time:** 40 minutes

## NEXT ACTION

**IMMEDIATE:** Begin Phase 3A - Fix client-side config imports to resolve build failures.
