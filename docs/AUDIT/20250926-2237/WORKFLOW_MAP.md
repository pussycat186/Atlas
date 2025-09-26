# WORKFLOW MAPPING ANALYSIS

**Generated:** 2025-09-26T22:37:42+07:00

## DEPLOY WORKFLOW CONFLICTS

### Current Workflows
1. **`deploy-frontends.yml`** - Primary with concurrency control, cloud build
2. **`deploy-frontends-simple.yml`** - Sequential prebuilt approach  
3. **`deploy-frontends-direct.yml`** - Direct deployment variant
4. **`deploy-frontends-fixed.yml`** - Fixed deployment approach

### Conflict Analysis
- Multiple workflows trigger on push to main
- Different build strategies (cloud vs prebuilt)
- No coordination between workflows
- CI cache conflicts

### Recommended Consolidation
**Keep:** `deploy-frontends.yml` with enhancements
**Remove:** All other deploy-frontends-* variants

### Required Workflow Structure
```yaml
name: Deploy Frontends
on:
  push: { branches: [ main ] }
  workflow_dispatch:
concurrency:
  group: deploy-frontends-${{ github.ref }}
  cancel-in-progress: true
jobs:
  deploy:
    strategy:
      matrix:
        app: [PROOF, INSIGHTS, DEV]
    steps:
      - Build workspace (ensures @atlas/config dist)
      - Deploy with cloud build
```
