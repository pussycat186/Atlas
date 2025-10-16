#!/usr/bin/env pwsh
# ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE - Simple Workflow Orchestrator
$ErrorActionPreference = "Stop"

$REPO = "pussycat186/Atlas"
$BRANCH = "main"
$EVIDENCE_TS = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmm')
$EVIDENCE_DIR = "docs/evidence/$EVIDENCE_TS"

Write-Host "ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE" -ForegroundColor Cyan
Write-Host "Repository: $REPO"
Write-Host "Branch: $BRANCH"
Write-Host "Evidence Directory: $EVIDENCE_DIR"
Write-Host ""

# Create evidence directory
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null

# Check for gh CLI
try {
    $ghVersion = gh --version 2>&1
    Write-Host "GitHub CLI found: $ghVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: GitHub CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Trigger workflows
Write-Host "Step 1: Deploying Frontends..." -ForegroundColor Cyan
try {
    gh workflow run deploy-frontends.yml --ref $BRANCH
    Write-Host "SUCCESS: deploy-frontends.yml triggered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to trigger deploy-frontends.yml" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Start-Sleep -Seconds 3

Write-Host "Step 2: Quality Gates..." -ForegroundColor Cyan
try {
    gh workflow run atlas-quality-gates.yml --ref $BRANCH
    Write-Host "SUCCESS: atlas-quality-gates.yml triggered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to trigger atlas-quality-gates.yml" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Start-Sleep -Seconds 3

Write-Host "Step 3: Policy Check..." -ForegroundColor Cyan
try {
    gh workflow run policy-check.yml --ref $BRANCH
    Write-Host "SUCCESS: policy-check.yml triggered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to trigger policy-check.yml" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Start-Sleep -Seconds 3

Write-Host "Step 4: Acceptance Tests..." -ForegroundColor Cyan
try {
    gh workflow run atlas-acceptance.yml --ref $BRANCH -f test_suite=full -f deployment_target=production -f generate_evidence=true
    Write-Host "SUCCESS: atlas-acceptance.yml triggered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to trigger atlas-acceptance.yml" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "All workflows triggered!" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor at: https://github.com/$REPO/actions" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Steps Required:" -ForegroundColor Yellow
Write-Host "1. Wait for deploy-frontends.yml to complete"
Write-Host "2. Capture deployment URLs from workflow logs"
Write-Host "3. Trigger atlas-perfect-live-validation.yml with URLs"
Write-Host "4. Download evidence-pack artifact"
Write-Host ""

# List recent workflow runs
Write-Host "Recent workflow runs:" -ForegroundColor Cyan
gh run list --limit 10 --branch $BRANCH

Write-Host ""
Write-Host "Evidence directory created at: $EVIDENCE_DIR" -ForegroundColor Green
