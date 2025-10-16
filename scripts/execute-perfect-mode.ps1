#!/usr/bin/env pwsh
# ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE
# Autonomous end-to-end execution with evidence collection

$ErrorActionPreference = "Stop"
$EVIDENCE_TS = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmm')
$EVIDENCE_DIR = "docs/evidence/$EVIDENCE_TS"
$REPO = "pussycat186/Atlas"
$BRANCH = "main"

Write-Host "🚀 ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Repository: $REPO" -ForegroundColor White
Write-Host "Branch: $BRANCH" -ForegroundColor White
Write-Host "Evidence Directory: $EVIDENCE_DIR" -ForegroundColor White
Write-Host "Timestamp: $EVIDENCE_TS" -ForegroundColor White
Write-Host ""

# Create evidence directory
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null

# Execution log
$LOG_FILE = "$EVIDENCE_DIR/execution.log"
function Log {
    param([string]$Message)
    $timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $LOG_FILE -Value $logEntry
}

Log "=== ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE STARTED ==="

# Check for gh CLI
$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghAvailable) {
    Log "ERROR: GitHub CLI (gh) not found"
    Write-Host ""
    Write-Host "❌ GitHub CLI is required for workflow execution" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  MANUAL EXECUTION REQUIRED" -ForegroundColor Yellow
    Write-Host "Follow steps in ATLAS_PERFECT_MODE_FINAL_CUT_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    
    # Create manual execution guide
    @"
# MANUAL EXECUTION GUIDE

GitHub CLI not available. Execute workflows manually:

## Step 1: Deploy Frontends
URL: https://github.com/$REPO/actions/workflows/deploy-frontends.yml
- Click "Run workflow"
- Branch: main
- Wait for completion
- Capture deployment URLs from logs

## Step 2: Validate Headers  
URL: https://github.com/$REPO/actions/workflows/atlas-perfect-live-validation.yml
- Click "Run workflow"
- Input: deployment URLs (comma-separated)
- Wait for completion

## Step 3: Quality Gates
URL: https://github.com/$REPO/actions/workflows/atlas-quality-gates.yml
- Click "Run workflow"
- Wait for completion

## Step 4: Policy Check
URL: https://github.com/$REPO/actions/workflows/policy-check.yml
- Click "Run workflow"
- Wait for completion

## Step 5: Acceptance Tests
URL: https://github.com/$REPO/actions/workflows/atlas-acceptance.yml
- Click "Run workflow"
- Test suite: full
- Deployment: production
- Generate evidence: true
- Wait for completion
- Download evidence-pack artifact

Evidence Directory: $EVIDENCE_DIR
"@ | Out-File "$EVIDENCE_DIR/MANUAL_EXECUTION_GUIDE.txt" -Encoding UTF8
    
    Log "Created manual execution guide at: $EVIDENCE_DIR/MANUAL_EXECUTION_GUIDE.txt"
    exit 1
}

Log "GitHub CLI found: $(gh --version)"

# Function to trigger workflow and get run ID
function Trigger-Workflow {
    param(
        [string]$WorkflowFile,
        [string]$Description,
        [hashtable]$Inputs = @{}
    )
    
    Log "▶️  Triggering: $Description"
    Log "   Workflow: $WorkflowFile"
    
    try {
        $inputArgs = @()
        foreach ($key in $Inputs.Keys) {
            $inputArgs += "-f"
            $inputArgs += "$key=$($Inputs[$key])"
        }
        
        if ($inputArgs.Count -gt 0) {
            gh workflow run $WorkflowFile --ref $BRANCH @inputArgs
        } else {
            gh workflow run $WorkflowFile --ref $BRANCH
        }
        
        Log "   ✅ Workflow triggered successfully"
        Start-Sleep -Seconds 5
        
        # Get the latest run ID for this workflow
        $runs = gh run list --workflow=$WorkflowFile --branch=$BRANCH --limit=1 --json databaseId,status,conclusion,url | ConvertFrom-Json
        if ($runs -and $runs.Count -gt 0) {
            $runId = $runs[0].databaseId
            $runUrl = $runs[0].url
            Log "   Run ID: $runId"
            Log "   Run URL: $runUrl"
            return @{
                Id = $runId
                Url = $runUrl
                Workflow = $WorkflowFile
            }
        }
        
        return $null
    } catch {
        Log "   ❌ Failed to trigger workflow: $_"
        return $null
    }
}

# Function to wait for workflow completion
function Wait-ForWorkflow {
    param(
        [hashtable]$RunInfo,
        [int]$TimeoutMinutes = 30
    )
    
    if (-not $RunInfo) {
        Log "   ⚠️  No run info provided, skipping wait"
        return $false
    }
    
    $runId = $RunInfo.Id
    $workflow = $RunInfo.Workflow
    $startTime = Get-Date
    $timeout = $startTime.AddMinutes($TimeoutMinutes)
    
    Log "⏳ Waiting for workflow to complete: $workflow (Run ID: $runId)"
    Log "   Timeout: $TimeoutMinutes minutes"
    
    while ((Get-Date) -lt $timeout) {
        try {
            $run = gh run view $runId --json status,conclusion,url | ConvertFrom-Json
            $status = $run.status
            $conclusion = $run.conclusion
            
            if ($status -eq "completed") {
                if ($conclusion -eq "success") {
                    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
                    Log "   ✅ Workflow completed successfully (${elapsed}m)"
                    return $true
                } else {
                    Log "   ❌ Workflow failed with conclusion: $conclusion"
                    Log "   URL: $($run.url)"
                    return $false
                }
            }
            
            Log "   Status: $status (checking again in 30s...)"
            Start-Sleep -Seconds 30
        } catch {
            Log "   ⚠️  Error checking workflow status: $_"
            Start-Sleep -Seconds 30
        }
    }
    
    Log "   ⏰ Workflow timed out after $TimeoutMinutes minutes"
    return $false
}

# Execution Results
$results = @{
    Deploy = $null
    Validation = $null
    QualityGates = $null
    PolicyCheck = $null
    Acceptance = $null
}

# STEP 1: Deploy Frontends
Log ""
Log "═══════════════════════════════════════"
Log "STEP 1: Deploy Frontends"
Log "═══════════════════════════════════════"
$results.Deploy = Trigger-Workflow -WorkflowFile "deploy-frontends.yml" -Description "Deploy Frontends"

if ($results.Deploy) {
    $deploySuccess = Wait-ForWorkflow -RunInfo $results.Deploy -TimeoutMinutes 20
    
    if (-not $deploySuccess) {
        Log "❌ Deployment failed - cannot proceed"
        Log ""
        Log "RESULT: DEPLOYMENT_FAILED"
        Log "Check workflow logs at: $($results.Deploy.Url)"
        exit 1
    }
    
    # TODO: Extract deployment URLs from workflow logs
    Log "📦 Deployment completed - capture URLs manually from: $($results.Deploy.Url)"
} else {
    Log "❌ Failed to trigger deployment workflow"
    exit 1
}

# STEP 2: Validate Production Headers
Log ""
Log "═══════════════════════════════════════"
Log "STEP 2: Validate Production Headers"
Log "═══════════════════════════════════════"
Log "⚠️  Requires deployment URLs from Step 1"
Log "   Manual trigger required for atlas-perfect-live-validation.yml"
Log "   URL: https://github.com/$REPO/actions/workflows/atlas-perfect-live-validation.yml"

# STEP 3: Quality Gates
Log ""
Log "═══════════════════════════════════════"
Log "STEP 3: Quality Gates"
Log "═══════════════════════════════════════"
$results.QualityGates = Trigger-Workflow -WorkflowFile "atlas-quality-gates.yml" -Description "Quality Gates"

if ($results.QualityGates) {
    Wait-ForWorkflow -RunInfo $results.QualityGates -TimeoutMinutes 30 | Out-Null
}

# STEP 4: Policy Check
Log ""
Log "═══════════════════════════════════════"
Log "STEP 4: Policy Check (OPA)"
Log "═══════════════════════════════════════"
$results.PolicyCheck = Trigger-Workflow -WorkflowFile "policy-check.yml" -Description "Policy Check"

if ($results.PolicyCheck) {
    Wait-ForWorkflow -RunInfo $results.PolicyCheck -TimeoutMinutes 10 | Out-Null
}

# STEP 5: Acceptance Tests
Log ""
Log "═══════════════════════════════════════"
Log "STEP 5: Acceptance Tests and Evidence"
Log "═══════════════════════════════════════"
$results.Acceptance = Trigger-Workflow -WorkflowFile "atlas-acceptance.yml" -Description "Acceptance Tests" -Inputs @{
    test_suite = "full"
    deployment_target = "production"
    generate_evidence = "true"
}

if ($results.Acceptance) {
    Wait-ForWorkflow -RunInfo $results.Acceptance -TimeoutMinutes 40 | Out-Null
}

# Summary
Log ""
Log "═══════════════════════════════════════"
Log "EXECUTION SUMMARY"
Log "═══════════════════════════════════════"
Log "Deploy: $(if($results.Deploy){'TRIGGERED'}else{'FAILED'})"
Log "Validation: MANUAL_REQUIRED"
Log "Quality Gates: $(if($results.QualityGates){'TRIGGERED'}else{'FAILED'})"
Log "Policy Check: $(if($results.PolicyCheck){'TRIGGERED'}else{'FAILED'})"
Log "Acceptance: $(if($results.Acceptance){'TRIGGERED'}else{'FAILED'})"
Log ""
Log "Evidence Directory: $EVIDENCE_DIR"
Log "Execution Log: $LOG_FILE"
Log ""
Log "🔍 Monitor workflows at: https://github.com/$REPO/actions"
Log ""
Log "=== ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE COMPLETED ==="

# Create summary JSON
$summary = @{
    timestamp = $EVIDENCE_TS
    evidence_dir = $EVIDENCE_DIR
    workflows_triggered = @{
        deploy = if($results.Deploy){$results.Deploy.Url}else{"FAILED"}
        quality_gates = if($results.QualityGates){$results.QualityGates.Url}else{"FAILED"}
        policy_check = if($results.PolicyCheck){$results.PolicyCheck.Url}else{"FAILED"}
        acceptance = if($results.Acceptance){$results.Acceptance.Url}else{"FAILED"}
    }
    manual_steps_required = @(
        "atlas-perfect-live-validation.yml - requires deployment URLs"
    )
    next_actions = @(
        "Monitor workflow execution at https://github.com/$REPO/actions"
        "Capture deployment URLs from deploy-frontends.yml logs"
        "Trigger atlas-perfect-live-validation.yml with URLs"
        "Download evidence-pack artifact from atlas-acceptance.yml"
        "Generate final PERFECT_LIVE report"
    )
}

$summary | ConvertTo-Json -Depth 10 | Out-File "$EVIDENCE_DIR/execution-summary.json" -Encoding UTF8
Log "Execution summary saved to: $EVIDENCE_DIR/execution-summary.json"
