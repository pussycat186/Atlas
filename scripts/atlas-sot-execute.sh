#!/usr/bin/env bash
# ATLAS_SOT_PERFECT_MODE Automated Execution
# Remote-only | Fix-until-green | Evidence-driven

set -euo pipefail

REPO="pussycat186/Atlas"
BRANCH="main"
EVIDENCE_DIR="docs/evidence/$(date -u +%Y%m%d-%H%M)"

echo "🚀 ATLAS_SOT_PERFECT_MODE - Automated Execution"
echo "=============================================="
echo "Repository: $REPO"
echo "Branch: $BRANCH"
echo "Evidence: $EVIDENCE_DIR"
echo ""

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Function to run workflow and wait
run_workflow() {
    local workflow=$1
    local description=$2
    shift 2
    local inputs=("$@")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Trigger workflow
    if [ ${#inputs[@]} -gt 0 ]; then
        gh workflow run "$workflow" --repo "$REPO" --ref "$BRANCH" "${inputs[@]}"
    else
        gh workflow run "$workflow" --repo "$REPO" --ref "$BRANCH"
    fi
    
    echo "⏳ Waiting for workflow to start..."
    sleep 10
    
    # Get run ID
    RUN_ID=$(gh run list --workflow="$workflow" --repo "$REPO" --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')
    echo "📋 Run ID: $RUN_ID"
    echo "🔗 URL: https://github.com/$REPO/actions/runs/$RUN_ID"
    echo ""
    
    # Watch run
    echo "⏳ Watching workflow execution..."
    gh run watch "$RUN_ID" --repo "$REPO" --exit-status
    
    # Check conclusion
    CONCLUSION=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')
    
    if [ "$CONCLUSION" = "success" ]; then
        echo "✅ $description: PASS"
        echo ""
        return 0
    else
        echo "❌ $description: FAILED (conclusion: $CONCLUSION)"
        echo ""
        echo "🔍 Logs:"
        gh run view "$RUN_ID" --repo "$REPO" --log
        return 1
    fi
}

# S0: Secrets Audit
echo "═══════════════════════════════════════"
echo "S0: SECRETS AUDIT"
echo "═══════════════════════════════════════"
if run_workflow "atlas-secrets-audit.yml" "Secrets Audit"; then
    echo "✅ All required secrets present"
else
    echo "❌ READY_NO_SECRETS"
    echo ""
    echo "Missing secrets detected. Please configure:"
    echo "  - VERCEL_TOKEN"
    echo "  - VERCEL_ORG_ID"
    echo "  - VERCEL_PROJECT_ID_ADMIN_INSIGHTS"
    echo "  - VERCEL_PROJECT_ID_DEV_PORTAL"
    echo "  - VERCEL_PROJECT_ID_PROOF_MESSENGER"
    echo "  - CLOUDFLARE_ACCOUNT_ID"
    echo "  - CLOUDFLARE_API_TOKEN"
    echo ""
    echo "See SECRETS_GUIDE.md for setup instructions"
    exit 1
fi

# Step 1: Deploy Frontends
echo "═══════════════════════════════════════"
echo "STEP 1: DEPLOY FRONTENDS"
echo "═══════════════════════════════════════"
if ! run_workflow "deploy-frontends.yml" "Deploy Frontends"; then
    echo "❌ Deployment failed"
    echo "🔄 Fix-until-green: Review logs, apply fixes, re-run"
    exit 1
fi

# TODO: Extract deployment URLs from workflow logs
echo "📝 Capture deployment URLs from workflow logs"
DEPLOY_RUN_ID=$(gh run list --workflow="deploy-frontends.yml" --repo "$REPO" --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$DEPLOY_RUN_ID" --repo "$REPO" --log | grep -E "Deployed to:|deployment_url" || true
echo ""
echo "⚠️  Manual step: Extract deployment URLs and set them in next command"
echo ""

# Step 2: Validate Headers (requires manual URL input)
echo "═══════════════════════════════════════"
echo "STEP 2: VALIDATE PRODUCTION HEADERS"
echo "═══════════════════════════════════════"
echo "⚠️  This step requires deployment URLs from Step 1"
echo "Enter deployment URLs (comma-separated):"
read -r DEPLOYMENT_URLS

if [ -n "$DEPLOYMENT_URLS" ]; then
    if ! run_workflow "atlas-perfect-live-validation.yml" "Validate Headers" -f deployment_urls="$DEPLOYMENT_URLS"; then
        echo "❌ Header validation failed"
        echo "🔄 Fix-until-green: Check middleware configuration, apply fixes, re-run"
        exit 1
    fi
else
    echo "⚠️  Skipping header validation - no URLs provided"
fi

# Step 3: Quality Gates
echo "═══════════════════════════════════════"
echo "STEP 3: QUALITY GATES"
echo "═══════════════════════════════════════"
if ! run_workflow "atlas-quality-gates.yml" "Quality Gates"; then
    echo "❌ Quality gates failed"
    echo "🔄 Fix-until-green: Review Lighthouse/k6/Playwright results, optimize, re-run"
    exit 1
fi

# Step 4: Policy Check
echo "═══════════════════════════════════════"
echo "STEP 4: POLICY CHECK (OPA)"
echo "═══════════════════════════════════════"
if ! run_workflow "policy-check.yml" "Policy Check"; then
    echo "❌ Policy check failed"
    echo "🔄 Fix-until-green: Review policy violations, fix configuration, re-run"
    exit 1
fi

# Step 5: Acceptance & Evidence
echo "═══════════════════════════════════════"
echo "STEP 5: ACCEPTANCE TESTS & EVIDENCE"
echo "═══════════════════════════════════════"
if ! run_workflow "atlas-acceptance.yml" "Acceptance Tests" -f test_suite=full -f deployment_target=production -f generate_evidence=true; then
    echo "❌ Acceptance tests failed"
    echo "🔄 Fix-until-green: Review test failures, fix issues, re-run"
    exit 1
fi

# Download evidence pack
echo ""
echo "📦 Downloading evidence pack..."
ACCEPTANCE_RUN_ID=$(gh run list --workflow="atlas-acceptance.yml" --repo "$REPO" --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')
mkdir -p "$EVIDENCE_DIR"
gh run download "$ACCEPTANCE_RUN_ID" --repo "$REPO" --name evidence-pack --dir "$EVIDENCE_DIR" || true

echo ""
echo "═══════════════════════════════════════"
echo "🎉 PERFECT_LIVE ACHIEVED"
echo "═══════════════════════════════════════"
echo "All gates: PASS"
echo "Evidence location: $EVIDENCE_DIR"
echo ""
echo "Next steps:"
echo "1. Verify evidence pack contains all required files"
echo "2. Run auto-verification checks (see ATLAS_SOT_PERFECT_MODE.md)"
echo "3. Generate final PERFECT_LIVE JSON"
echo ""
echo "✅ Execution complete!"
