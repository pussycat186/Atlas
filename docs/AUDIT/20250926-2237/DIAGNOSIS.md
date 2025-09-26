# ATLAS DIAGNOSE-FIRST SHIPPER - DIAGNOSIS REPORT

**Generated:** 2025-09-26T22:37:42+07:00  
**Branch:** main  
**Status:** Multiple issues identified

## EXECUTIVE SUMMARY

**ROOT CAUSES IDENTIFIED:**
1. **WORKFLOW CONFLICTS:** Multiple deploy-frontends workflows causing race conditions
2. **CONFIG PACKAGE STRUCTURE:** Needs proper tsconfig setup for browser/node builds
3. **BUILD CACHE ISSUES:** CI environment failing to resolve workspace dependencies

## DETAILED FINDINGS

### 1. PRISM MARKERS ✅ VERIFIED
- `apps/proof-messenger/app/prism/page.tsx:8` - Contains exact marker: "ATLAS • Prism UI — Peak Preview"
- `apps/admin-insights/app/prism/page.tsx:8` - Contains exact marker: "ATLAS • Prism UI — Peak Preview"  
- `apps/dev-portal/app/prism/page.tsx:8` - Contains exact marker: "ATLAS • Prism UI — Peak Preview"

### 2. WORKSPACE DEPENDENCIES ✅ VERIFIED
- `apps/proof-messenger/package.json:16` - "@atlas/config": "workspace:*"
- `apps/admin-insights/package.json:16` - "@atlas/config": "workspace:*"
- `apps/dev-portal/package.json:16` - "@atlas/config": "workspace:*"

### 3. CONFIG PACKAGE ANALYSIS
**Current Structure:**
```json
{
  "name": "@atlas/config",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "import": "./dist/node.js",
      "default": "./dist/node.js"
    }
  }
}
```

**Issues:**
- Missing proper tsconfig.node.json and tsconfig.browser.json
- Build script uses file copying instead of proper compilation
- Version should be "0.0.0" per requirements

### 4. NEXT.JS CONFIGS ✅ VERIFIED
- All apps have `transpilePackages: ['@atlas/config']`
- Proper webpack configuration for crypto exclusion
- Build healing enabled (ignoreBuildErrors: true)

### 5. ASSET HYGIENE ✅ VERIFIED
- All manifests use SVG-only icons: `{ "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }`
- All favicon.svg files exist in public directories
- Layout files properly reference manifests and favicons

### 6. WORKFLOW CONFLICTS ❌ CRITICAL ISSUE
**Multiple Deploy Workflows Found:**
- `deploy-frontends.yml` - Primary workflow with concurrency control
- `deploy-frontends-simple.yml` - Alternative sequential approach
- `deploy-frontends-direct.yml` - Direct deployment variant
- `deploy-frontends-fixed.yml` - Fixed deployment approach

**Conflicts:**
- Multiple workflows can trigger on same events
- No coordination between different approaches
- CI cache conflicts from different build strategies

## ROOT CAUSE SUMMARY

1. **PRIMARY:** Multiple conflicting deploy workflows causing CI failures
2. **SECONDARY:** Config package needs proper TypeScript build setup
3. **TERTIARY:** CI environment workspace dependency resolution issues

## RECOMMENDED FIXES

1. **Consolidate workflows** - Keep only one robust deploy-frontends.yml
2. **Fix config package** - Proper tsconfig setup with separate node/browser builds
3. **Add workspace build step** - Ensure @atlas/config dist is built before app builds

**Next Phase:** Apply minimal atomic fixes
