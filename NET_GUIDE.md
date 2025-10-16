# Network Guide for Atlas Development

## Overview
Atlas is designed for **remote-only development** to bypass local network restrictions, firewalls, and environment dependencies.

## ✅ Recommended Approaches

### 1. GitHub Codespaces (Primary)
- **URL**: https://codespaces.new/pussycat186/Atlas
- **Benefits**: Pre-configured Node 20 + pnpm 9 + Playwright + k6 + Vercel CLI
- **Networking**: GitHub's cloud infrastructure with no firewall restrictions
- **Usage**: Click "Code" → "Codespaces" → "Create codespace on main"

### 2. GitHub Actions (CI/CD)
- **Workflow**: `.github/workflows/atlas-remote-only.yml`
- **Benefits**: Fully automated pipeline, no local dependencies
- **Networking**: GitHub-hosted runners with full internet access
- **Usage**: Automatic on push/PR, manual via Actions tab

### 3. Vercel Deployments
- **Integration**: OIDC-based deployment from GitHub Actions
- **Benefits**: Edge network, automatic HTTPS, performance optimization
- **Networking**: Global CDN with optimal routing
- **URLs**: `https://atlas-{app}.vercel.app`

## ❌ What NOT to Do

### Don't Disable Local Firewalls
- **Problem**: Security risk to your local network
- **Solution**: Use Codespaces or CI/CD instead

### Don't Install Local Dependencies
- **Problem**: Version mismatches, platform differences
- **Solution**: Use containerized Codespaces environment

### Don't Use localhost URLs in Tests
- **Problem**: Not accessible from CI/CD runners
- **Solution**: Use deployed Vercel URLs for testing

## 🔧 Network Diagnostics

### Run Connectivity Test
```bash
# In Codespaces or CI
./tools/net-diagnose/connectivity-test.sh
```

### Expected Results
- ✅ GitHub API: https://api.github.com
- ✅ npm registry: https://registry.npmjs.org  
- ✅ Vercel API: https://api.vercel.com
- ✅ Google Fonts: https://fonts.googleapis.com
- ✅ CDNs: https://cdnjs.cloudflare.com

## 🚨 Troubleshooting

### "Connection refused" or timeouts
- **Cause**: Local firewall blocking outbound connections
- **Fix**: Use GitHub Codespaces instead of local development

### "DNS resolution failed"
- **Cause**: Corporate DNS restrictions
- **Fix**: Use GitHub Actions for CI/CD, Codespaces for development

### "Certificate verification failed"  
- **Cause**: Corporate proxy or TLS inspection
- **Fix**: Use GitHub's infrastructure (Codespaces/Actions)

### Vercel deployment fails
- **Cause**: Missing `VERCEL_TOKEN` secret
- **Fix**: Add token in repository Settings → Secrets and variables → Actions

## 📋 Required Secrets

For full functionality, configure these in GitHub repository settings:

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here
```

**How to get these values:**
1. Go to https://vercel.com/account/tokens
2. Create a new token with deployment permissions
3. Find org/project IDs in Vercel dashboard settings

## 🎯 Success Criteria

When network setup is correct:
- ✅ Codespaces opens with all tools pre-installed
- ✅ `pnpm dev` starts all apps successfully
- ✅ GitHub Actions complete without network errors
- ✅ Vercel deployments succeed automatically
- ✅ Quality gates (Lighthouse, k6, Playwright) run successfully

## 🔗 Quick Links

- **Codespace**: https://codespaces.new/pussycat186/Atlas
- **Actions**: https://github.com/pussycat186/Atlas/actions
- **Deployments**: https://vercel.com/dashboard
- **Issues**: https://github.com/pussycat186/Atlas/issues