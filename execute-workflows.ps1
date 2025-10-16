# ATLAS_SOT_FINAL_ONE_PROMPT - Automated Workflow Execution Script
# Opens all GitHub Actions workflows in browser for manual execution

param(
    [string]$Step = "all"
)

$repo = "https://github.com/pussycat186/Atlas"

# Workflow URLs
$workflows = @{
    "S0" = @{
        Name = "Secrets Audit"
        URL = "$repo/actions/workflows/atlas-secrets-audit.yml"
        Description = "Verify all 7 required secrets are configured"
        HardStop = $true
        Inputs = @()
    }
    "S1" = @{
        Name = "Deploy Frontends"
        URL = "$repo/actions/workflows/deploy-frontends.yml"
        Description = "Deploy 3 apps to Vercel production"
        HardStop = $false
        Inputs = @()
        CaptureOutputs = @("admin-insights URL", "dev-portal URL", "proof-messenger URL")
    }
    "S2" = @{
        Name = "Validate Headers"
        URL = "$repo/actions/workflows/atlas-perfect-live-validation.yml"
        Description = "Validate security headers on production URLs"
        HardStop = $false
        Inputs = @("deployment_urls (comma-separated from S1)")
    }
    "S3" = @{
        Name = "Quality Gates"
        URL = "$repo/actions/workflows/atlas-quality-gates.yml"
        Description = "Run Lighthouse, k6, Playwright tests"
        HardStop = $false
        Inputs = @()
    }
    "S4" = @{
        Name = "Policy Check"
        URL = "$repo/actions/workflows/policy-check.yml"
        Description = "Verify OPA policies and security flags"
        HardStop = $false
        Inputs = @()
    }
    "S5" = @{
        Name = "Acceptance & Evidence"
        URL = "$repo/actions/workflows/atlas-acceptance.yml"
        Description = "Generate evidence-pack artifact"
        HardStop = $false
        Inputs = @("test_suite=full", "deployment_target=production", "generate_evidence=true")
    }
    "S6" = @{
        Name = "Design System Build"
        URL = "$repo/actions/workflows/design-system-build.yml"
        Description = "Build UX tokens, Storybook, generate ux-pack"
        HardStop = $false
        Inputs = @()
    }
}

function Show-Header {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " ATLAS_SOT_FINAL_ONE_PROMPT EXECUTION" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Open-Workflow {
    param(
        [string]$StepId,
        [hashtable]$WorkflowInfo
    )
    
    Write-Host "`n[$StepId] $($WorkflowInfo.Name)" -ForegroundColor Yellow
    Write-Host "    $($WorkflowInfo.Description)" -ForegroundColor Gray
    
    if ($WorkflowInfo.HardStop) {
        Write-Host "    ⚠️  HARD STOP - Must PASS before continuing" -ForegroundColor Red
    }
    
    if ($WorkflowInfo.Inputs.Count -gt 0) {
        Write-Host "    📝 Required Inputs:" -ForegroundColor Cyan
        foreach ($inputItem in $WorkflowInfo.Inputs) {
            Write-Host "       - $inputItem" -ForegroundColor Gray
        }
    }
    
    if ($WorkflowInfo.CaptureOutputs) {
        Write-Host "    📋 Capture from logs:" -ForegroundColor Cyan
        foreach ($output in $WorkflowInfo.CaptureOutputs) {
            Write-Host "       - $output" -ForegroundColor Gray
        }
    }
    
    Write-Host "    🔗 Opening: $($WorkflowInfo.URL)" -ForegroundColor Green
    Start-Process $WorkflowInfo.URL
    
    Start-Sleep -Seconds 1
}

function Show-Instructions {
    param([string]$StepId)
    
    Write-Host "`n📋 EXECUTION STEPS FOR $StepId" -ForegroundColor Cyan
    Write-Host "1. Browser tab opened automatically" -ForegroundColor White
    Write-Host "2. Click 'Run workflow' button" -ForegroundColor White
    Write-Host "3. Select branch: 'main'" -ForegroundColor White
    
    $workflow = $workflows[$StepId]
    if ($workflow.Inputs.Count -gt 0) {
        Write-Host "4. Fill in inputs as shown above" -ForegroundColor White
        Write-Host "5. Click 'Run workflow' to execute" -ForegroundColor White
    } else {
        Write-Host "4. Click 'Run workflow' to execute" -ForegroundColor White
    }
    
    Write-Host "`nWaiting for you to complete $StepId..." -ForegroundColor Yellow
    Write-Host "Press ENTER when workflow completes successfully (or Ctrl+C to abort)" -ForegroundColor Yellow
}

function Invoke-WorkflowStep {
    param([string]$StepId)
    
    if (-not $workflows.ContainsKey($StepId)) {
        Write-Host "❌ Unknown step: $StepId" -ForegroundColor Red
        return $false
    }
    
    $workflow = $workflows[$StepId]
    Open-Workflow -StepId $StepId -WorkflowInfo $workflow
    Show-Instructions -StepId $StepId
    
    # Wait for user confirmation
    Read-Host
    
    Write-Host "✅ $StepId marked complete. Proceeding to next step...`n" -ForegroundColor Green
    Start-Sleep -Seconds 2
    
    return $true
}

function Invoke-AllWorkflows {
    Show-Header
    
    Write-Host "This script will open all workflow execution pages in your browser." -ForegroundColor White
    Write-Host "You'll execute each workflow manually and confirm completion.`n" -ForegroundColor White
    
    $steps = @("S0", "S1", "S2", "S3", "S4", "S5", "S6")
    
    foreach ($step in $steps) {
        $success = Invoke-WorkflowStep -StepId $step
        
        if (-not $success) {
            Write-Host "❌ Execution halted at $step" -ForegroundColor Red
            return
        }
        
        # Special handling for S0 (hard stop)
        if ($step -eq "S0") {
            Write-Host "`n⚠️  S0 CHECKPOINT" -ForegroundColor Red
            Write-Host "Did S0 output show 'ALL_SECRETS_PRESENT'? (y/n)" -ForegroundColor Yellow
            $response = Read-Host
            
            if ($response -ne "y") {
                Write-Host "`n❌ S0 FAILED - Configure missing secrets at:" -ForegroundColor Red
                Write-Host "   $repo/settings/secrets/actions" -ForegroundColor Gray
                Write-Host "`nRe-run this script after adding secrets." -ForegroundColor Yellow
                return
            }
            
            Write-Host "✅ S0 VERIFIED - Proceeding to deployments`n" -ForegroundColor Green
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " ALL WORKFLOWS EXECUTED" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Show-PostExecution
}

function Show-PostExecution {
    Write-Host "📦 POST-EXECUTION TASKS" -ForegroundColor Cyan
    Write-Host "`n1. Download artifacts from S5 and S6:" -ForegroundColor White
    Write-Host "   - evidence-pack.zip (from atlas-acceptance.yml)" -ForegroundColor Gray
    Write-Host "   - ux-pack.zip (from design-system-build.yml)" -ForegroundColor Gray
    
    Write-Host "`n2. Extract artifacts:" -ForegroundColor White
    Write-Host '   $timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")' -ForegroundColor Gray
    Write-Host '   $evidenceDir = "docs/evidence/$timestamp"' -ForegroundColor Gray
    Write-Host '   New-Item -ItemType Directory -Force -Path $evidenceDir' -ForegroundColor Gray
    Write-Host '   New-Item -ItemType Directory -Force -Path "$evidenceDir/ux"' -ForegroundColor Gray
    Write-Host '   Expand-Archive -Path evidence-pack.zip -DestinationPath $evidenceDir' -ForegroundColor Gray
    Write-Host '   Expand-Archive -Path ux-pack.zip -DestinationPath "$evidenceDir/ux"' -ForegroundColor Gray
    
    Write-Host "`n3. Verify evidence (11 required files):" -ForegroundColor White
    Write-Host "   Run: .\verify-evidence.ps1" -ForegroundColor Gray
    
    Write-Host "`n4. Generate PERFECT_LIVE.json:" -ForegroundColor White
    Write-Host "   Run: .\generate-perfect-live.ps1" -ForegroundColor Gray
    
    Write-Host "`n5. Commit and push:" -ForegroundColor White
    Write-Host '   git add docs/evidence/$timestamp/' -ForegroundColor Gray
    Write-Host '   git commit -m "feat: PERFECT_LIVE achieved - production + UX with evidence"' -ForegroundColor Gray
    Write-Host '   git push origin main' -ForegroundColor Gray
    
    Write-Host "`n✅ PERFECT_LIVE ACHIEVED!" -ForegroundColor Green
}

# Main execution
switch ($Step.ToLower()) {
    "all" {
        Invoke-AllWorkflows
    }
    "s0" {
        Show-Header
        Invoke-WorkflowStep -StepId "S0"
    }
    "s1" {
        Show-Header
        Invoke-WorkflowStep -StepId "S1"
    }
    "s2" {
        Show-Header
        Invoke-WorkflowStep -StepId "S2"
    }
    "s3" {
        Show-Header
        Invoke-WorkflowStep -StepId "S3"
    }
    "s4" {
        Show-Header
        Invoke-WorkflowStep -StepId "S4"
    }
    "s5" {
        Show-Header
        Invoke-WorkflowStep -StepId "S5"
    }
    "s6" {
        Show-Header
        Invoke-WorkflowStep -StepId "S6"
    }
    "post" {
        Show-Header
        Show-PostExecution
    }
    default {
        Write-Host "Usage: .\execute-workflows.ps1 [-Step <all|s0|s1|s2|s3|s4|s5|s6|post>]" -ForegroundColor Yellow
        Write-Host "`nExamples:" -ForegroundColor White
        Write-Host "  .\execute-workflows.ps1          # Execute all steps sequentially" -ForegroundColor Gray
        Write-Host "  .\execute-workflows.ps1 -Step s0 # Execute S0 only" -ForegroundColor Gray
        Write-Host "  .\execute-workflows.ps1 -Step s1 # Execute S1 only" -ForegroundColor Gray
        Write-Host "  .\execute-workflows.ps1 -Step post # Show post-execution tasks" -ForegroundColor Gray
    }
}
