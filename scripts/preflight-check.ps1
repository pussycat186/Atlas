# ATLAS_PERFECT_MODE_FINAL_CUT - Local Pre-Flight & Evidence Collection
# Validates configuration before triggering remote workflows

$ErrorActionPreference = "Stop"

$EVIDENCE_DIR = "docs/evidence/$((Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmm'))"
Write-Host "🚀 ATLAS_PERFECT_MODE_FINAL_CUT - Pre-Flight Validation" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Evidence Directory: $EVIDENCE_DIR" -ForegroundColor White
Write-Host ""

# Create evidence directory
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null

$testResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Tests = @()
}

function Test-Item {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$FixHint = ""
    )
    
    $testResults.Total++
    Write-Host "Testing: $Name... " -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✅ PASS" -ForegroundColor Green
            $testResults.Passed++
            $testResults.Tests += @{ Name = $Name; Status = "PASS"; Hint = "" }
            return $true
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            if ($FixHint) {
                Write-Host "   Fix: $FixHint" -ForegroundColor Yellow
            }
            $testResults.Failed++
            $testResults.Tests += @{ Name = $Name; Status = "FAIL"; Hint = $FixHint }
            return $false
        }
    } catch {
        Write-Host "❌ ERROR: $_" -ForegroundColor Red
        $testResults.Failed++
        $testResults.Tests += @{ Name = $Name; Status = "ERROR"; Hint = $_.Exception.Message }
        return $false
    }
}

Write-Host "📋 Phase 1: Repository Structure" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan

Test-Item "Root package.json exists" {
    Test-Path "package.json"
}

Test-Item "Security flags configuration exists" {
    Test-Path "security/flags.yaml"
}

Test-Item "Security middleware package exists" {
    Test-Path "packages/@atlas/security-middleware/src/index.ts"
}

Test-Item "Admin insights middleware exists" {
    Test-Path "apps/admin-insights/middleware.ts"
}

Test-Item "Dev portal middleware exists" {
    Test-Path "apps/dev-portal/middleware.ts"
}

Test-Item "Proof messenger middleware exists" {
    Test-Path "apps/proof-messenger/middleware.ts"
}

Write-Host ""
Write-Host "📋 Phase 2: Workflow Configuration" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

Test-Item "deploy-frontends.yml exists" {
    Test-Path ".github/workflows/deploy-frontends.yml"
}

Test-Item "atlas-quality-gates.yml exists" {
    Test-Path ".github/workflows/atlas-quality-gates.yml"
}

Test-Item "policy-check.yml exists" {
    Test-Path ".github/workflows/policy-check.yml"
}

Test-Item "atlas-acceptance.yml exists" {
    Test-Path ".github/workflows/atlas-acceptance.yml"
}

Write-Host ""
Write-Host "📋 Phase 3: Evidence Files" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan

Test-Item "Receipt samples directory exists" {
    Test-Path "docs/evidence/20251016-2337/receipts-samples"
}

Test-Item "JWKS file exists" {
    Test-Path "docs/evidence/20251016-2337/jwks.json"
}

Test-Item "MLS core package exists" {
    Test-Path "packages/@atlas/mls-core"
}

Test-Item "Security policies exist" {
    Test-Path ".github/policy"
}

Write-Host ""
Write-Host "📋 Phase 4: Security Flags Validation" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

if (Test-Path "security/flags.yaml") {
    $flagsContent = Get-Content "security/flags.yaml" -Raw
    
    Test-Item "SECURITY_CSP_STRICT enabled" {
        $flagsContent -match "SECURITY_CSP_STRICT:\s*\n\s*enabled:\s*true"
    } "Enable in security/flags.yaml"
    
    Test-Item "SECURITY_TRUSTED_TYPES enabled" {
        $flagsContent -match "SECURITY_TRUSTED_TYPES:\s*\n\s*enabled:\s*true"
    } "Enable in security/flags.yaml"
    
    Test-Item "SECURITY_COOP_COEP enabled" {
        $flagsContent -match "SECURITY_COOP_COEP:\s*\n\s*enabled:\s*true"
    } "Enable in security/flags.yaml"
    
    Test-Item "SECURITY_HSTS_PRELOAD enabled" {
        $flagsContent -match "SECURITY_HSTS_PRELOAD:\s*\n\s*enabled:\s*true"
    } "Enable in security/flags.yaml"
    
    Test-Item "SECURITY_OPA_ENFORCE enabled" {
        $flagsContent -match "SECURITY_OPA_ENFORCE:\s*\n\s*enabled:\s*true"
    } "Enable in security/flags.yaml"
}

Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Total Tests: $($testResults.Total)"
Write-Host "Passed: $($testResults.Passed) ✅" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed) ❌" -ForegroundColor Red
$successRate = [math]::Round(($testResults.Passed / $testResults.Total) * 100, 1)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } else { "Yellow" })

# Save summary to evidence directory
$summary = @{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    total_tests = $testResults.Total
    passed = $testResults.Passed
    failed = $testResults.Failed
    success_rate = $successRate
    tests = $testResults.Tests
    status = if ($successRate -eq 100) { "READY" } elseif ($successRate -ge 90) { "MOSTLY_READY" } else { "NOT_READY" }
}

$summary | ConvertTo-Json -Depth 10 | Out-File "$EVIDENCE_DIR/preflight-summary.json" -Encoding UTF8
Write-Host ""
Write-Host "📁 Pre-flight summary saved to: $EVIDENCE_DIR/preflight-summary.json" -ForegroundColor Cyan

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review any failed tests above" -ForegroundColor White
Write-Host "2. Fix configuration issues if needed" -ForegroundColor White
Write-Host "3. Commit and push changes to main branch" -ForegroundColor White
Write-Host "4. Trigger workflows manually at: https://github.com/pussycat186/Atlas/actions" -ForegroundColor White
Write-Host "   Order: deploy-frontends → atlas-quality-gates → policy-check → atlas-acceptance" -ForegroundColor White
Write-Host ""

if ($successRate -eq 100) {
    Write-Host "✅ All pre-flight checks PASSED - Ready for PERFECT_LIVE execution!" -ForegroundColor Green
} elseif ($successRate -ge 90) {
    Write-Host "⚠️  Most checks passed - Review failures before proceeding" -ForegroundColor Yellow
} else {
    Write-Host "❌ Multiple failures detected - Fix issues before deployment" -ForegroundColor Red
}
