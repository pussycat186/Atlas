# BLOCKER: Missing GitHub Secrets

**Status**: ⚠️ **REQUIRES MAINTAINER ACTION**  
**Date**: 2025-10-22  
**PR**: https://github.com/pussycat186/Atlas/pull/497

---

## Issue

GitHub Actions workflows require secrets that are not currently configured in the repository.

**Configuration URL**: https://github.com/pussycat186/Atlas/settings/secrets/actions

---

## Required Secrets

The following secrets must be configured for successful CI/CD execution:

### Vercel Deployment Secrets

| Secret Name | Purpose | Used In |
|-------------|---------|---------|
| `VERCEL_TOKEN` | Vercel API authentication | Multiple deploy workflows |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel deployments |
| `VERCEL_PROJECT_ID_DEV_PORTAL` | Project ID for dev-portal | atlas-orchestrator.yml |
| `VERCEL_PROJECT_ID_ADMIN_INSIGHTS` | Project ID for admin-insights | atlas-orchestrator.yml |
| `VERCEL_PROJECT_ID_PROOF_MESSENGER` | Project ID for proof-messenger | atlas-orchestrator.yml |

### Optional Secrets

| Secret Name | Purpose | Impact if Missing |
|-------------|---------|-------------------|
| `FIGMA_TOKEN` | Figma API access for design tokens | Non-critical, skippable |
| `FIGMA_FILE_KEY` | Figma file identifier | Non-critical, skippable |
| `EXTRA_ENV_JSON` | Additional environment variables | Non-critical |
| `KMS_KEY_RESOURCE` | GCP KMS key for encryption | GCP deployment only |

---

## How to Obtain Secret Values

### VERCEL_TOKEN
1. Log in to Vercel: https://vercel.com
2. Navigate to Settings → Tokens
3. Create a new token with deployment permissions
4. Copy the token value

### VERCEL_ORG_ID
1. In Vercel dashboard, go to Settings → General
2. Copy the "Team ID" or "Organization ID"

### VERCEL_PROJECT_ID_*
1. For each project (dev-portal, admin-insights, proof-messenger):
2. Open project Settings → General
3. Copy the "Project ID"

---

## How to Configure Secrets

1. Navigate to: https://github.com/pussycat186/Atlas/settings/secrets/actions
2. Click "New repository secret"
3. Enter the secret name exactly as shown above
4. Paste the secret value
5. Click "Add secret"

---

## Verification After Configuration

After adding secrets, manually re-run failed workflow jobs:
1. Go to: https://github.com/pussycat186/Atlas/actions
2. Select the failed workflow run
3. Click "Re-run failed jobs"

---

## Alternative: Skip Vercel Workflows

If Vercel secrets cannot be provided immediately, you can:
1. Merge the PR without Vercel deployment workflows
2. Vercel deployments will occur via Vercel GitHub App integration (if installed)
3. Note: Automated validation scripts won't run without secrets

---

**This blocker does NOT prevent**:
- ✅ Local development
- ✅ CI build/test/lint jobs (if they don't deploy)
- ✅ Security scans
- ✅ SBOM generation

**This blocker DOES prevent**:
- ❌ Automated Vercel deployments via workflows
- ❌ Automated header/JWKS/health verification
- ❌ Full end-to-end CI/CD pipeline

---

**Resolution Required By**: Repository maintainer with admin access  
**Impact**: Medium (CI partially blocked, manual deployment possible)  
**Workaround**: Use Vercel CLI manually or rely on Vercel GitHub App
