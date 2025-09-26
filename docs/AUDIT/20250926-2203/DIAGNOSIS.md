# ATLAS DIAGNOSE-FIRST SHIPPER - DIAGNOSIS REPORT

**Generated:** 2025-09-26T22:03:57+07:00  
**Branch:** main  
**Status:** Clean working tree  

## EXECUTIVE SUMMARY

**ROOT CAUSES IDENTIFIED:**
1. **CRITICAL BUILD FAILURE:** Client components using `getGatewayUrl()` from `@atlas/config` which reads `LIVE_URLS.json` at build time
2. **WORKFLOW COMPLEXITY:** Multiple conflicting deploy workflows causing potential race conditions
3. **CLIENT-SIDE CONFIG READS:** Build-time imports of server-side configuration in browser contexts

## DETAILED FINDINGS

### 1. INVENTORY RESULTS

**Apps Enumerated:**
- ✅ `apps/proof-messenger` - Next.js 14.0.4, port 3006
- ✅ `apps/admin-insights` - Next.js 14.0.4, port 3007  
- ✅ `apps/dev-portal` - Next.js 14.0.4, port 3008

**Workspace Configuration:**
- ✅ `pnpm-workspace.yaml` exists with proper package paths
- ❌ No `turbo.json` found (not blocking)

### 2. PRISM PRESENCE ANALYSIS

**Prism Pages Status:**
- ✅ `apps/proof-messenger/app/prism/page.tsx` - Contains EXACT marker: "ATLAS • Prism UI — Peak Preview"
- ✅ `apps/admin-insights/app/prism/page.tsx` - Contains EXACT marker: "ATLAS • Prism UI — Peak Preview"  
- ✅ `apps/dev-portal/app/prism/page.tsx` - Contains EXACT marker: "ATLAS • Prism UI — Peak Preview"

**Marker Implementation:**
All apps use `<span className="sr-only">ATLAS • Prism UI — Peak Preview</span>` correctly.

### 3. ASSET HYGIENE ASSESSMENT

**Manifest Files:**
- ✅ `apps/proof-messenger/public/manifest.json` - SVG-only icons
- ✅ `apps/admin-insights/public/manifest.json` - SVG-only icons
- ✅ `apps/dev-portal/public/manifest.json` - SVG-only icons

**Favicon Status:**
- ✅ All apps have `public/favicon.svg` files
- ✅ All `app/layout.tsx` files properly reference `/favicon.svg`
- ✅ All layouts include `manifest: '/manifest.json'`

### 4. BUILD-SAFETY CRITICAL ISSUES

**🚨 CRITICAL: Client-Side Config Reads**

Files with `'use client'` directive importing `getGatewayUrl()`:

1. **`apps/proof-messenger/app/page.tsx:4`**
   ```typescript
   import { getGatewayUrl } from "@atlas/config";
   ```

2. **`apps/admin-insights/app/page.tsx:4`**
   ```typescript
   import { getGatewayUrl } from "@atlas/config";
   ```

3. **`apps/dev-portal/app/page.tsx:4`**
   ```typescript
   import { getGatewayUrl } from "@atlas/config";
   ```

4. **`apps/admin-insights/app/metrics/page.tsx:6`**
   ```typescript
   import { getGatewayUrl } from '@atlas/config';
   ```

5. **`apps/dev-portal/app/(legacy-src)/page-src.tsx:7`**
   ```typescript
   import { getGatewayUrl } from '@atlas/config';
   ```

**Root Cause Analysis:**
The `@atlas/config` package (`packages/config/src/index.ts:1`) imports `LIVE_URLS.json` at the top level:
```typescript
import LIVE from '../../../LIVE_URLS.json';
```

This causes build failures because:
- Client components with `'use client'` cannot import files that read from filesystem at build time
- `getGatewayUrl()` function tries to read JSON file during bundling
- Next.js build process fails when client code attempts server-side file operations

### 5. LIVE_URLS VALIDATION

**✅ LIVE_URLS.json Status:**
```json
{
  "frontends": {
    "proof_messenger": "https://atlas-proof-messenger.vercel.app",
    "admin_insights": "https://atlas-admin-insights.vercel.app", 
    "dev_portal": "https://atlas-dev-portal.vercel.app"
  }
}
```
Schema and HTTPS values are correct.

### 6. WORKFLOW ANALYSIS

**Deploy Workflows Found:**
- `deploy-frontends.yml` - Matrix strategy, cloud build approach
- `deploy-frontends-simple.yml` - Sequential, prebuilt approach  
- `deploy-frontends-direct.yml` - Alternative approach
- `deploy-frontends-fixed.yml` - Another variant

**Current Active Workflow (`deploy-frontends.yml`):**
- ✅ Proper matrix strategy for parallel deployment
- ✅ Secret validation with DEV/DEVPORTAL fallback
- ✅ Cloud build approach (no prebuilt)
- ✅ Includes audit step with auto-generated script
- ⚠️ Multiple workflows may cause conflicts

**Secret Requirements:**
- VERCEL_TOKEN ✓
- VERCEL_ORG_ID ✓  
- VERCEL_PROJECT_ID_PROOF ✓
- VERCEL_PROJECT_ID_INSIGHTS ✓
- VERCEL_PROJECT_ID_DEV (fallback: VERCEL_PROJECT_ID_DEVPORTAL) ✓

## ROOT CAUSE SUMMARY

1. **PRIMARY BLOCKER:** Client components importing `getGatewayUrl()` will cause build failures due to filesystem reads in browser context
2. **SECONDARY:** Multiple deploy workflows create potential race conditions and confusion
3. **TERTIARY:** Need to ensure consistent deployment strategy across all workflows

## RECOMMENDED REMEDIATION STRATEGY

1. **Fix client-side config reads** - Replace build-time imports with runtime-safe alternatives
2. **Consolidate deploy workflows** - Use single robust workflow to avoid conflicts  
3. **Deploy and audit** - Execute deployment and verify production endpoints

**Next Phase:** Generate remediation plan in NEXT_STEPS.md
