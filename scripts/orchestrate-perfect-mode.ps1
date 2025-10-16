# ATLAS_PERFECT_MODE_FINAL_CUT Orchestrator
# Executes all workflows sequentially with evidence collection

$ErrorActionPreference = "Stop"

$REPO = "pussycat186/Atlas"
$BRANCH = "main"
$EVIDENCE_DIR = "docs/evidence/$((Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmm'))"

Write-Host "🚀 ATLAS_PERFECT_MODE_FINAL_CUT Orchestrator" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Repository: $REPO"
Write-Host "Branch: $BRANCH"
Write-Host "Evidence Directory: $EVIDENCE_DIR"
Write-Host ""

# Create evidence directory
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null

# Check if gh CLI is available
$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghAvailable) {
    Write-Host "❌ GitHub CLI (gh) not found" -ForegroundColor Red
    Write-Host "Please install: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual workflow execution required:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/$REPO/actions" -ForegroundColor Yellow
    Write-Host "2. Trigger workflows in order:" -ForegroundColor Yellow
    Write-Host "   - deploy-frontends.yml" -ForegroundColor Yellow
    Write-Host "   - atlas-quality-gates.yml" -ForegroundColor Yellow
    Write-Host "   - policy-check.yml" -ForegroundColor Yellow
    Write-Host "   - atlas-acceptance.yml" -ForegroundColor Yellow
    exit 1
}

# Function to trigger workflow
function Trigger-Workflow {
    param(
        [string]$WorkflowName,
        [int]$WaitSeconds = 10
    )
    
    Write-Host "▶️  Triggering workflow: $WorkflowName" -ForegroundColor Green
    
    try {
        gh workflow run $WorkflowName --ref $BRANCH
        Write-Host "✅ Workflow $WorkflowName triggered successfully" -ForegroundColor Green
        Start-Sleep -Seconds $WaitSeconds
    } catch {
        Write-Host "❌ Failed to trigger $WorkflowName : $_" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# STEP 1: Deploy Frontends
Write-Host ""
Write-Host "📦 STEP 1: Deploying frontends..." -ForegroundColor Cyan
if (-not (Trigger-Workflow "deploy-frontends.yml" 30)) {
    Write-Host "⚠️  Deployment trigger failed - check GitHub Actions" -ForegroundColor Yellow
}

# STEP 2: Quality Gates
Write-Host ""
Write-Host "🎯 STEP 2: Running quality gates..." -ForegroundColor Cyan
if (-not (Trigger-Workflow "atlas-quality-gates.yml" 30)) {
    Write-Host "⚠️  Quality gates trigger failed - check GitHub Actions" -ForegroundColor Yellow
}

# STEP 3: Policy Check
Write-Host ""
Write-Host "🔒 STEP 3: Running policy checks..." -ForegroundColor Cyan
if (-not (Trigger-Workflow "policy-check.yml" 10)) {
    Write-Host "⚠️  Policy check trigger failed - check GitHub Actions" -ForegroundColor Yellow
}

# STEP 4: Acceptance Tests
Write-Host ""
Write-Host "✅ STEP 4: Running acceptance tests..." -ForegroundColor Cyan
if (-not (Trigger-Workflow "atlas-acceptance.yml" 30)) {
    Write-Host "⚠️  Acceptance tests trigger failed - check GitHub Actions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ATLAS_PERFECT_MODE_FINAL_CUT orchestration initiated" -ForegroundColor Green
Write-Host "Monitor workflows at: https://github.com/$REPO/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Evidence will be collected to: $EVIDENCE_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once workflows complete, check:" -ForegroundColor Yellow
Write-Host "  - Deployment URLs from deploy-frontends.yml" -ForegroundColor Yellow
Write-Host "  - Quality gate results from atlas-quality-gates.yml" -ForegroundColor Yellow
Write-Host "  - Policy validation from policy-check.yml" -ForegroundColor Yellow
Write-Host "  - Evidence pack from atlas-acceptance.yml" -ForegroundColor Yellow
