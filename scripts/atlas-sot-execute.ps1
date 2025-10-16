#!/usr/bin/env pwsh
# ATLAS_SOT_PERFECT_MODE Automated Execution (PowerShell)
# Remote-only | Fix-until-green | Evidence-driven

$ErrorActionPreference = "Stop"

$REPO = "pussycat186/Atlas"
$BRANCH = "main"
$EVIDENCE_DIR = "docs/evidence/$(Get-Date -Format 'yyyyMMdd-HHmm' -AsUTC)"

Write-Host "ATLAS_SOT_PERFECT_MODE - Automated Execution" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Repository: $REPO" -ForegroundColor White
Write-Host "Branch: $BRANCH" -ForegroundColor White
Write-Host "Evidence: $EVIDENCE_DIR" -ForegroundColor White
Write-Host ""

# Check gh CLI
try {
    $null = gh --version
    Write-Host "GitHub CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/"
    exit 1
}

Write-Host ""

# Function to run workflow and wait
function Invoke-WorkflowAndWait {
    param(
        [string]$Workflow,
        [string]$Description,
        [hashtable]$Inputs = @{}
    )
    
    Write-Host "" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Description" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Build input arguments
    $inputArgs = @()
    foreach ($key in $Inputs.Keys) {
        $inputArgs += "-f"
        $inputArgs += "$key=$($Inputs[$key])"
    }
    
    # Trigger workflow
    if ($inputArgs.Count -gt 0) {
        gh workflow run $Workflow --repo $REPO --ref $BRANCH @inputArgs
    } else {
        gh workflow run $Workflow --repo $REPO --ref $BRANCH
    }
    
    Write-Host "Waiting for workflow to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Get run ID
    $runInfo = gh run list --workflow=$Workflow --repo=$REPO --branch=$BRANCH --limit=1 --json databaseId,url | ConvertFrom-Json
    $runId = $runInfo[0].databaseId
    $runUrl = $runInfo[0].url
    
    Write-Host "Run ID: $runId" -ForegroundColor White
    Write-Host "URL: $runUrl" -ForegroundColor White
    Write-Host ""
    
    # Watch run
    Write-Host "Watching workflow execution..." -ForegroundColor Yellow
    try {
        gh run watch $runId --repo $REPO --exit-status
    } catch {
        Write-Host "Workflow failed" -ForegroundColor Red
        gh run view $runId --repo $REPO --log
        return $false
    }
    
    # Check conclusion
    $runResult = gh run view $runId --repo $REPO --json conclusion | ConvertFrom-Json
    $conclusion = $runResult.conclusion
    
    if ($conclusion -eq "success") {
        Write-Host "✅ ${Description}: PASS" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ ${Description}: FAILED (conclusion: $conclusion)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Logs:" -ForegroundColor Yellow
        gh run view $runId --repo $REPO --log
        return $false
    }
}

# S0: Secrets Audit
Write-Host "========================================"
Write-Host "S0: SECRETS AUDIT"
Write-Host "========================================"
if (-not (Invoke-WorkflowAndWait -Workflow "atlas-secrets-audit.yml" -Description "Secrets Audit")) {
    Write-Host "READY_NO_SECRETS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Missing secrets detected. Please configure:" -ForegroundColor Yellow
    Write-Host "  - VERCEL_TOKEN"
    Write-Host "  - VERCEL_ORG_ID"
    Write-Host "  - VERCEL_PROJECT_ID_ADMIN_INSIGHTS"
    Write-Host "  - VERCEL_PROJECT_ID_DEV_PORTAL"
    Write-Host "  - VERCEL_PROJECT_ID_PROOF_MESSENGER"
    Write-Host "  - CLOUDFLARE_ACCOUNT_ID"
    Write-Host "  - CLOUDFLARE_API_TOKEN"
    Write-Host ""
    Write-Host "See SECRETS_GUIDE.md for setup instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host "All required secrets present" -ForegroundColor Green

# Step 1: Deploy Frontends
Write-Host "========================================"
Write-Host "STEP 1: DEPLOY FRONTENDS"
Write-Host "========================================"
if (-not (Invoke-WorkflowAndWait -Workflow "deploy-frontends.yml" -Description "Deploy Frontends")) {
    Write-Host "Deployment failed" -ForegroundColor Red
    Write-Host "Fix-until-green: Review logs, apply fixes, re-run" -ForegroundColor Yellow
    exit 1
}

# Extract deployment URLs
Write-Host "Capture deployment URLs from workflow logs" -ForegroundColor Yellow
$deployRunId = (gh run list --workflow="deploy-frontends.yml" --repo=$REPO --branch=$BRANCH --limit=1 --json databaseId | ConvertFrom-Json)[0].databaseId
gh run view $deployRunId --repo $REPO --log | Select-String -Pattern "Deployed to:|deployment_url"
Write-Host ""
Write-Host "Manual step: Extract deployment URLs and enter them when prompted" -ForegroundColor Yellow
Write-Host ""

# Step 2: Validate Headers
Write-Host "========================================"
Write-Host "STEP 2: VALIDATE PRODUCTION HEADERS"
Write-Host "========================================"
Write-Host "Enter deployment URLs (comma-separated):" -ForegroundColor Yellow
$deploymentUrls = Read-Host

if ($deploymentUrls) {
    if (-not (Invoke-WorkflowAndWait -Workflow "atlas-perfect-live-validation.yml" -Description "Validate Headers" -Inputs @{ deployment_urls = $deploymentUrls })) {
        Write-Host "Header validation failed" -ForegroundColor Red
        Write-Host "Fix-until-green: Check middleware configuration, apply fixes, re-run" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Skipping header validation - no URLs provided" -ForegroundColor Yellow
}

# Step 3: Quality Gates
Write-Host "========================================"
Write-Host "STEP 3: QUALITY GATES"
Write-Host "========================================"
if (-not (Invoke-WorkflowAndWait -Workflow "atlas-quality-gates.yml" -Description "Quality Gates")) {
    Write-Host "Quality gates failed" -ForegroundColor Red
    Write-Host "Fix-until-green: Review Lighthouse/k6/Playwright results, optimize, re-run" -ForegroundColor Yellow
    exit 1
}

# Step 4: Policy Check
Write-Host "========================================"
Write-Host "STEP 4: POLICY CHECK (OPA)"
Write-Host "========================================"
if (-not (Invoke-WorkflowAndWait -Workflow "policy-check.yml" -Description "Policy Check")) {
    Write-Host "Policy check failed" -ForegroundColor Red
    Write-Host "Fix-until-green: Review policy violations, fix configuration, re-run" -ForegroundColor Yellow
    exit 1
}

# Step 5: Acceptance and Evidence
Write-Host "========================================"
Write-Host "STEP 5: ACCEPTANCE TESTS AND EVIDENCE"
Write-Host "========================================"
if (-not (Invoke-WorkflowAndWait -Workflow "atlas-acceptance.yml" -Description "Acceptance Tests" -Inputs @{ test_suite = "full"; deployment_target = "production"; generate_evidence = "true" })) {
    Write-Host "Acceptance tests failed" -ForegroundColor Red
    Write-Host "Fix-until-green: Review test failures, fix issues, re-run" -ForegroundColor Yellow
    exit 1
}

# Download evidence pack
Write-Host ""
Write-Host "Downloading evidence pack..." -ForegroundColor Yellow
$acceptanceRunId = (gh run list --workflow="atlas-acceptance.yml" --repo=$REPO --branch=$BRANCH --limit=1 --json databaseId | ConvertFrom-Json)[0].databaseId
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null
gh run download $acceptanceRunId --repo $REPO --name evidence-pack --dir $EVIDENCE_DIR

Write-Host ""
Write-Host "========================================"
Write-Host "PERFECT_LIVE ACHIEVED" -ForegroundColor Green
Write-Host "========================================"
Write-Host "All gates: PASS" -ForegroundColor Green
Write-Host "Evidence location: $EVIDENCE_DIR" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify evidence pack contains all required files"
Write-Host "2. Run auto-verification checks (see ATLAS_SOT_PERFECT_MODE.md)"
Write-Host "3. Generate final PERFECT_LIVE JSON"
Write-Host ""
Write-Host "Execution complete!" -ForegroundColor Green
