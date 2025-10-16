# ATLAS Perfect Mode Basic Acceptance Verification
Write-Host "ATLAS Perfect Mode Acceptance Verification" -ForegroundColor Green

# Configuration
$WORKSPACE_ROOT = (Get-Location).Path
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmm"
$EVIDENCE_PATH = "$WORKSPACE_ROOT\docs\evidence\$TIMESTAMP"

# Create evidence directory
New-Item -ItemType Directory -Force -Path $EVIDENCE_PATH | Out-Null
Write-Host "Evidence Path: $EVIDENCE_PATH" -ForegroundColor Cyan

# Test counters
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Requirement {
    param([string]$Name, [bool]$Condition)
    $script:totalTests++
    if ($Condition) {
        Write-Host "✅ $Name" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host "❌ $Name" -ForegroundColor Red
        $script:failedTests++
    }
}

Write-Host ""
Write-Host "Running Acceptance Tests..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Basic file structure
Test-Requirement "Root package.json exists" (Test-Path "$WORKSPACE_ROOT\package.json")
Test-Requirement "MLS core package exists" (Test-Path "$WORKSPACE_ROOT\packages\@atlas\mls-core")
Test-Requirement "Security policies exist" (Test-Path "$WORKSPACE_ROOT\policies\security-flags.rego")
Test-Requirement "Orchestration workflow exists" (Test-Path "$WORKSPACE_ROOT\.github\workflows\atlas-perfect-complete.yml")

# Test 2: Evidence files
$evidenceExists = Test-Path "$WORKSPACE_ROOT\docs\evidence"
Test-Requirement "Evidence directory exists" $evidenceExists

if ($evidenceExists) {
    $evidenceItems = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Recurse -ErrorAction SilentlyContinue
    Test-Requirement "SBOM files present" ($evidenceItems | Where-Object { $_.Name -like "*SBOM*" }).Count -gt 0
    Test-Requirement "Receipt samples present" ($evidenceItems | Where-Object { $_.Name -eq "receipts-samples" }).Count -gt 0
    Test-Requirement "JWKS files present" ($evidenceItems | Where-Object { $_.Name -eq "jwks.json" }).Count -gt 0
}

# Test 3: Production URL accessibility
$prodUrls = @(
    "https://atlas-admin.vercel.app",
    "https://atlas-dev.vercel.app"
)

foreach ($url in $prodUrls) {
    $appName = ($url -split "\." | Select-Object -First 1) -replace "https://atlas-", ""
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        Test-Requirement "$appName app accessible" $true
        
        # Basic security header check
        $hasCSP = $response.Headers.ContainsKey("Content-Security-Policy")
        Test-Requirement "$appName has CSP header" $hasCSP
        
    } catch {
        Test-Requirement "$appName app accessible" $false
        Test-Requirement "$appName has CSP header" $false
    }
}

# Generate summary
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Yellow
Write-Host "Total Tests: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green  
Write-Host "Failed: $failedTests" -ForegroundColor Red

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests * 100.0) / $totalTests, 1) } else { 0 }
Write-Host "Success Rate: $successRate%"

# Create summary JSON
$summary = @{
    timestamp = $TIMESTAMP
    evidence_path = $EVIDENCE_PATH
    total_tests = $totalTests
    passed_tests = $passedTests
    failed_tests = $failedTests
    success_rate = "$successRate%"
    status = if ($failedTests -eq 0) { "PERFECT_LIVE" } else { "NEEDS_REMEDIATION" }
}

$summaryFile = Join-Path $EVIDENCE_PATH "basic-summary.json"
$summary | ConvertTo-Json -Depth 2 | Out-File -FilePath $summaryFile -Encoding UTF8

Write-Host ""
if ($failedTests -eq 0) {
    Write-Host "🎉 ALL BASIC TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed - see details above" -ForegroundColor Yellow
}

Write-Host "Summary saved to: $summaryFile" -ForegroundColor Cyan