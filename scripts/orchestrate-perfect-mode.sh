#!/usr/bin/env bash
# ATLAS_PERFECT_MODE_FINAL_CUT Orchestrator
# Executes all workflows sequentially with evidence collection

set -euo pipefail

REPO="pussycat186/Atlas"
BRANCH="main"
EVIDENCE_DIR="docs/evidence/$(date -u +%Y%m%d-%H%M)"

echo "🚀 ATLAS_PERFECT_MODE_FINAL_CUT Orchestrator"
echo "================================================"
echo "Repository: $REPO"
echo "Branch: $BRANCH"
echo "Evidence Directory: $EVIDENCE_DIR"
echo ""

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

# Function to trigger workflow and wait for completion
trigger_workflow() {
    local workflow=$1
    local wait_time=${2:-300}
    
    echo "▶️  Triggering workflow: $workflow"
    
    # Note: This script is designed to run in GitHub Actions context
    # In local execution, workflows must be triggered via GitHub UI or gh CLI
    
    if command -v gh &> /dev/null; then
        gh workflow run "$workflow" --ref "$BRANCH"
        echo "✅ Workflow $workflow triggered"
        sleep 10
    else
        echo "⚠️  GitHub CLI (gh) not available - manual workflow trigger required"
        echo "   Run: gh workflow run $workflow --ref $BRANCH"
        return 1
    fi
}

# STEP 1: Deploy Frontends
echo "📦 STEP 1: Deploying frontends..."
trigger_workflow "deploy-frontends.yml" 600
echo ""

# STEP 2: Quality Gates
echo "🎯 STEP 2: Running quality gates..."
trigger_workflow "atlas-quality-gates.yml" 900
echo ""

# STEP 3: Policy Check
echo "🔒 STEP 3: Running policy checks..."
trigger_workflow "policy-check.yml" 300
echo ""

# STEP 4: Acceptance Tests
echo "✅ STEP 4: Running acceptance tests..."
trigger_workflow "atlas-acceptance.yml" 1200
echo ""

echo "🎉 ATLAS_PERFECT_MODE_FINAL_CUT orchestration initiated"
echo "Monitor workflows at: https://github.com/$REPO/actions"
echo ""
echo "Evidence will be collected to: $EVIDENCE_DIR"
