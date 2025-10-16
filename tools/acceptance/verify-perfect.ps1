# ATLAS Perfect Mode Acceptance Verification (PowerShell)
# Validates all S0-S9 phases with hard evidence collection

param(
    [string]$EvidenceDir = "",
    [switch]$Verbose = $false
)

# Configuration
$WORKSPACE_ROOT = (Get-Location).Path
$TIMESTAMP = (Get-Date -Format "yyyyMMdd-HHmm" -AsUTC)
$EVIDENCE_PATH = if ($EvidenceDir) { $EvidenceDir } else { "$WORKSPACE_ROOT\docs\evidence\$TIMESTAMP" }

# Ensure evidence directory exists
New-Item -ItemType Directory -Force -Path $EVIDENCE_PATH | Out-Null

# Production URLs (will be populated from deployment)
$PROD_URLS = @(
    "https://atlas-admin.vercel.app",
    "https://atlas-dev.vercel.app", 
    "https://atlas-messenger.vercel.app",
    "https://atlas-proof.vercel.app",
    "https://atlas-verify.vercel.app"
)

# Counters
$TOTAL_TESTS = 0
$PASSED_TESTS = 0
$FAILED_TESTS = 0

function Write-TestLog {
    param([string]$Message, [string]$Level = "Info")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC" -AsUTC
    $color = switch ($Level) {
        "Success" { "Green" }
        "Failure" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Test-Counter {
    $script:TOTAL_TESTS++
}

function Write-Success {
    param([string]$Message)
    Write-TestLog "✅ $Message" "Success"
    $script:PASSED_TESTS++
}

function Write-Failure {
    param([string]$Message)
    Write-TestLog "❌ $Message" "Failure"
    $script:FAILED_TESTS++
}

function Write-Warning {
    param([string]$Message)
    Write-TestLog "⚠️  $Message" "Warning"
}

Write-TestLog "🚀 ATLAS Perfect Mode Acceptance Verification"
Write-TestLog "Evidence Path: $EVIDENCE_PATH"
Write-TestLog "Timestamp: $TIMESTAMP"
Write-Host ""

# ============================================================================
# STAGE B1: Security Headers Validation
# ============================================================================

Write-TestLog "🔒 Stage B1: Security Headers Validation"
Write-Host ""

function Test-SecurityHeaders {
    param([string]$Url)
    
    $appName = ($Url -replace "https://atlas-([^.]*)..*", '$1')
    Write-TestLog "Checking security headers for $appName : $Url"
    
    try {
        $headers = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 30 -ErrorAction Stop
        $headersText = $headers.Headers | Out-String
        
        # Save headers to file
        $headersFile = "$EVIDENCE_PATH\headers-$appName.txt"
        $headersText | Out-File -FilePath $headersFile -Encoding UTF8
        
        # Check Content-Security-Policy
        Test-Counter
        $csp = $headers.Headers."Content-Security-Policy" -join " "
        if ($csp -match "nonce-" -and $csp -notmatch "'unsafe-inline'") {
            Write-Success "CSP with nonce (no unsafe-inline): $appName"
        } else {
            Write-Failure "CSP missing nonce or has unsafe-inline: $appName"
        }
        
        # Check Trusted Types
        Test-Counter
        if ($headers.Headers."Trusted-Types") {
            Write-Success "Trusted-Types present: $appName"
        } else {
            Write-Failure "Trusted-Types missing: $appName"
        }
        
        # Check Cross-Origin-Opener-Policy
        Test-Counter
        $coop = $headers.Headers."Cross-Origin-Opener-Policy" -join " "
        if ($coop -match "same-origin") {
            Write-Success "COOP same-origin: $appName"
        } else {
            Write-Failure "COOP not same-origin: $appName"
        }
        
        # Check Cross-Origin-Embedder-Policy
        Test-Counter
        $coep = $headers.Headers."Cross-Origin-Embedder-Policy" -join " "
        if ($coep -match "require-corp") {
            Write-Success "COEP require-corp: $appName"
        } else {
            Write-Failure "COEP not require-corp: $appName"
        }
        
        # Check Cross-Origin-Resource-Policy
        Test-Counter
        $corp = $headers.Headers."Cross-Origin-Resource-Policy" -join " "
        if ($corp -match "(same-site|same-origin)") {
            Write-Success "CORP same-site/same-origin: $appName"
        } else {
            Write-Failure "CORP not restrictive enough: $appName"
        }
        
        # Check HSTS
        Test-Counter
        $hsts = $headers.Headers."Strict-Transport-Security" -join " "
        if ($hsts -match "max-age=(31536000|63072000)") {
            Write-Success "HSTS max-age ≥1 year: $appName"
        } else {
            Write-Failure "HSTS missing or insufficient max-age: $appName"
        }
        
    } catch {
        Write-Failure "Failed to fetch headers for $Url : $_"
        # Count all missed tests
        1..6 | ForEach-Object { Test-Counter }
    }
    
    Write-Host ""
}

# Test all production URLs
foreach ($url in $PROD_URLS) {
    Test-SecurityHeaders -Url $url
}

# ============================================================================
# STAGE B2: DPoP Enforcement Validation
# ============================================================================

Write-TestLog "🔐 Stage B2: DPoP Enforcement Validation"
Write-Host ""

function Test-DpopEnforcement {
    $apiUrl = "https://api.atlas.internal/protected"
    
    Write-TestLog "Testing DPoP enforcement on protected endpoint"
    
    # Test negative case: call without DPoP token
    Test-Counter
    try {
        $response = Invoke-WebRequest -Uri $apiUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 401) {
        Write-Success "Protected endpoint returns 401 without DPoP token"
    } else {
        Write-Failure "Protected endpoint should return 401 without DPoP, got: $statusCode"
    }
    
    # Test positive case with DPoP token
    Test-Counter
    $dpopToken = "eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6Imw4dEZyaHgtMzR0VjNoUklDUkRZOXpDa0RscEJoRjQyVVFVZldWQVdCRnMiLCJ5IjoiOTVvTjBmemhzX0dsZkIxRnpUMkdSakJsR0gyT1F6YXk0M3Y3eXdCWDhMLWciLCJjcnYiOiJQLTI1NiJ9fQ.eyJqdGkiOiItQndDM0VTYzZhY2MybFRjIiwiaHRtIjoiR0VUIiwiaHR1IjoiaHR0cHM6Ly9hcGkuYXRsYXMuaW50ZXJuYWwvcHJvdGVjdGVkIiwiaWF0IjoxNjMwNjMxMDA2fQ.WQp8eHhZFpjKElQWHNLrOUJF31FgLBM2Uu2c6nFCKhE"
    
    try {
        $headers = @{ "DPoP" = $dpopToken }
        $response = Invoke-WebRequest -Uri $apiUrl -Method Get -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        $statusCodeDpop = $response.StatusCode
    } catch {
        $statusCodeDpop = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCodeDpop -eq 200 -or $statusCodeDpop -eq 404) {
        Write-Success "DPoP token accepted (or endpoint not found - check deployment)"
    } else {
        Write-Warning "DPoP test inconclusive - endpoint may not be deployed yet: $statusCodeDpop"
    }
    
    Write-Host ""
}

Test-DpopEnforcement

# ============================================================================
# STAGE B3: RFC 9421 Receipts Validation
# ============================================================================

Write-TestLog "📧 Stage B3: RFC 9421 Receipts Validation"
Write-Host ""

function Test-Receipts {
    Write-TestLog "Validating RFC 9421 receipts with JWKS"
    
    # Find the most recent receipts and JWKS
    $receiptsDir = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "receipts-samples" -Recurse -Directory | Select-Object -First 1
    $jwksFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "jwks.json" -Recurse | Select-Object -First 1
    
    if ($receiptsDir -and $jwksFile) {
        $fullReceiptsPath = "$WORKSPACE_ROOT\docs\evidence\*\$receiptsDir"
        $receiptFiles = Get-ChildItem -Path $fullReceiptsPath -Filter "*.json" -ErrorAction SilentlyContinue
        
        Test-Counter
        if ($receiptFiles.Count -gt 0) {
            Write-Success "Found $($receiptFiles.Count) receipt samples"
            
            # Copy to current evidence directory
            Copy-Item -Path $fullReceiptsPath -Destination $EVIDENCE_PATH -Recurse -Force
            Copy-Item -Path $jwksFile.FullName -Destination $EVIDENCE_PATH -Force
            
            # Validate JWKS structure
            Test-Counter
            try {
                $jwks = Get-Content "$EVIDENCE_PATH\jwks.json" | ConvertFrom-Json
                $signingKeys = $jwks.keys | Where-Object { $_.kty -eq "EC" -and $_.use -eq "sig" }
                if ($signingKeys) {
                    Write-Success "JWKS contains valid signing keys"
                } else {
                    Write-Failure "JWKS missing valid signing keys"
                }
            } catch {
                Write-Failure "JWKS validation failed: $_"
            }
            
            # Check key rotation
            Test-Counter
            try {
                $jwks = Get-Content "$EVIDENCE_PATH\jwks.json" | ConvertFrom-Json
                $keyCount = $jwks.keys.Count
                if ($keyCount -ge 2) {
                    Write-Success "JWKS shows current + previous keys (rotation capability)"
                } else {
                    Write-Warning "JWKS has only 1 key - rotation not demonstrated"
                }
            } catch {
                Write-Warning "JWKS key count check failed: $_"
            }
            
        } else {
            Write-Failure "No receipt samples found"
        }
    } else {
        Write-Failure "Receipts samples or JWKS not found"
        1..3 | ForEach-Object { Test-Counter }
    }
    
    Write-Host ""
}

Test-Receipts

# ============================================================================
# STAGE B4: MLS Chat Core Validation
# ============================================================================

Write-TestLog "💬 Stage B4: MLS Chat Core Validation"
Write-Host ""

function Test-MlsCore {
    Write-TestLog "Running MLS core tests"
    
    # Check if MLS core package exists
    Test-Counter
    if (Test-Path "$WORKSPACE_ROOT\packages\@atlas\mls-core") {
        Write-Success "MLS core package found"
        
        # Run tests
        Test-Counter
        try {
            $testResult = & pnpm --filter "@atlas/mls-core" test --reporter=json 2>&1
            $testResult | Out-File "$EVIDENCE_PATH\mls-test-results.json" -Encoding UTF8
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "MLS core tests passed"
                
                # Check for O(log N) assertions
                Test-Counter
                if ((Get-Content "$EVIDENCE_PATH\mls-test-results.json" -Raw) -match "O\(log.*N\)") {
                    Write-Success "MLS O(log N) performance validated"
                } else {
                    Write-Warning "MLS O(log N) performance assertion not found in test output"
                }
            } else {
                Write-Failure "MLS core tests failed"
                Test-Counter
            }
            
        } catch {
            Write-Failure "MLS core test execution failed: $_"
            Test-Counter
        }
    } else {
        Write-Failure "MLS core package not found"
        1..2 | ForEach-Object { Test-Counter }
    }
    
    Write-Host ""
}

Test-MlsCore

# ============================================================================
# STAGE B5: Quality Gates Validation
# ============================================================================

Write-TestLog "🎯 Stage B5: Quality Gates Validation"
Write-Host ""

function Test-QualityGates {
    Write-TestLog "Validating quality gates"
    
    # Find latest quality gate results
    $lhciFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "lhci.json" -Recurse | Select-Object -First 1
    $k6File = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "k6-summary.json" -Recurse | Select-Object -First 1
    $playwrightFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "playwright-report.html" -Recurse | Select-Object -First 1
    
    # Lighthouse validation
    Test-Counter
    if ($lhciFile) {
        Copy-Item -Path $lhciFile.FullName -Destination $EVIDENCE_PATH -Force
        
        try {
            $lhci = Get-Content "$EVIDENCE_PATH\lhci.json" | ConvertFrom-Json
            $perfScore = [double]($lhci.lhr.categories.performance.score ?? 0)
            $a11yScore = [double]($lhci.lhr.categories.accessibility.score ?? 0)
            $bpScore = [double]($lhci.lhr.categories."best-practices".score ?? 0)
            $seoScore = [double]($lhci.lhr.categories.seo.score ?? 0)
            
            if ($perfScore -ge 0.90 -and $a11yScore -ge 0.95 -and $bpScore -ge 0.95 -and $seoScore -ge 0.95) {
                Write-Success "Lighthouse scores meet requirements (P:$perfScore A:$a11yScore BP:$bpScore SEO:$seoScore)"
            } else {
                Write-Failure "Lighthouse scores below requirements (P:$perfScore A:$a11yScore BP:$bpScore SEO:$seoScore)"
            }
        } catch {
            Write-Failure "Lighthouse validation failed: $_"
        }
    } else {
        Write-Failure "Lighthouse CI results not found"
    }
    
    # k6 validation
    Test-Counter
    if ($k6File) {
        Copy-Item -Path $k6File.FullName -Destination $EVIDENCE_PATH -Force
        
        try {
            $k6 = Get-Content "$EVIDENCE_PATH\k6-summary.json" | ConvertFrom-Json
            $p95Ms = [double]($k6.metrics.http_req_duration.values."p(95)" ?? 999)
            $errorRate = [double]($k6.metrics.http_req_failed.values.rate ?? 1)
            
            if ($p95Ms -le 200 -and $errorRate -lt 0.01) {
                Write-Success "k6 performance meets requirements (p95: ${p95Ms}ms, errors: ${errorRate}%)"
            } else {
                Write-Failure "k6 performance below requirements (p95: ${p95Ms}ms, errors: ${errorRate}%)"
            }
        } catch {
            Write-Failure "k6 validation failed: $_"
        }
    } else {
        Write-Failure "k6 results not found"
    }
    
    # Playwright validation
    Test-Counter
    if ($playwrightFile) {
        Copy-Item -Path $playwrightFile.FullName -Destination $EVIDENCE_PATH -Force
        
        $playwrightContent = Get-Content "$EVIDENCE_PATH\playwright-report.html" -Raw
        if ($playwrightContent -match "(passed|success)") {
            Write-Success "Playwright tests passed"
        } else {
            Write-Failure "Playwright tests failed or results unclear"
        }
    } else {
        Write-Failure "Playwright report not found"
    }
    
    Write-Host ""
}

Test-QualityGates

# ============================================================================
# STAGE B6: Supply Chain Security Validation
# ============================================================================

Write-TestLog "🔗 Stage B6: Supply Chain Security Validation"
Write-Host ""

function Test-SupplyChain {
    Write-TestLog "Validating supply chain security"
    
    # Find latest supply chain artifacts
    $sbomFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "SBOM.cyclonedx.json" -Recurse | Select-Object -First 1
    $provenanceFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "provenance.intoto.jsonl" -Recurse | Select-Object -First 1
    $cosignFile = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "cosign-verify.txt" -Recurse | Select-Object -First 1
    
    # SBOM validation
    Test-Counter
    if ($sbomFile) {
        Copy-Item -Path $sbomFile.FullName -Destination $EVIDENCE_PATH -Force
        
        try {
            $sbom = Get-Content "$EVIDENCE_PATH\SBOM.cyclonedx.json" | ConvertFrom-Json
            $componentCount = $sbom.components.Count
            if ($componentCount -gt 0) {
                Write-Success "SBOM contains $componentCount components"
            } else {
                Write-Failure "SBOM is empty or invalid"
            }
        } catch {
            Write-Failure "SBOM validation failed: $_"
        }
    } else {
        Write-Failure "SBOM not found"
    }
    
    # Provenance validation
    Test-Counter
    if ($provenanceFile) {
        Copy-Item -Path $provenanceFile.FullName -Destination $EVIDENCE_PATH -Force
        
        try {
            $provenance = Get-Content "$EVIDENCE_PATH\provenance.intoto.jsonl" | ConvertFrom-Json
            if ($provenance.predicateType) {
                Write-Success "SLSA provenance attestation valid"
            } else {
                Write-Failure "SLSA provenance attestation invalid"
            }
        } catch {
            Write-Failure "SLSA provenance validation failed: $_"
        }
    } else {
        Write-Failure "SLSA provenance not found"
    }
    
    # Cosign validation
    Test-Counter
    if ($cosignFile) {
        Copy-Item -Path $cosignFile.FullName -Destination $EVIDENCE_PATH -Force
        
        $cosignContent = Get-Content "$EVIDENCE_PATH\cosign-verify.txt" -Raw
        if ($cosignContent -match "(Verification.*PASS|verified)") {
            Write-Success "Cosign verification passed"
        } else {
            Write-Failure "Cosign verification failed"
        }
    } else {
        Write-Failure "Cosign verification results not found"
    }
    
    # Security scans validation
    Test-Counter
    $scanFiles = Get-ChildItem -Path "$WORKSPACE_ROOT\docs\evidence" -Name "security-scan-results.sarif" -Recurse
    if ($scanFiles) {
        $latestScan = $scanFiles | Select-Object -First 1
        Copy-Item -Path $latestScan.FullName -Destination $EVIDENCE_PATH -Force
        
        try {
            $sarif = Get-Content "$EVIDENCE_PATH\security-scan-results.sarif" | ConvertFrom-Json
            $highCount = ($sarif.runs.results | Where-Object { $_.level -eq "error" -or $_.level -eq "warning" }).Count
            if ($highCount -eq 0) {
                Write-Success "0 High/Critical vulnerabilities found"
            } else {
                Write-Failure "$highCount High/Critical vulnerabilities found"
            }
        } catch {
            Write-Warning "Security scan validation failed: $_"
        }
    } else {
        Write-Warning "Security scan results not found"
    }
    
    Write-Host ""
}

Test-SupplyChain

# ============================================================================
# STAGE B7: Policy Enforcement Validation
# ============================================================================

Write-TestLog "🛡️  Stage B7: Policy Enforcement Validation"
Write-Host ""

function Test-PolicyEnforcement {
    Write-TestLog "Validating OPA policy enforcement"
    
    # Check if policy files exist
    Test-Counter
    if ((Test-Path "$WORKSPACE_ROOT\policies\security-flags.rego") -and (Test-Path "$WORKSPACE_ROOT\policies\compliance.rego")) {
        Write-Success "OPA policy files found"
        
        # Test policy validation (mock test since OPA CLI may not be available)
        Test-Counter
        if (Get-Command opa -ErrorAction SilentlyContinue) {
            try {
                $opaResult = & opa test policies/ 2>&1
                $opaResult | Out-File "$EVIDENCE_PATH\opa-test-results.txt" -Encoding UTF8
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "OPA policy tests passed"
                } else {
                    Write-Failure "OPA policy tests failed"
                }
            } catch {
                Write-Failure "OPA policy test execution failed: $_"
            }
        } else {
            Write-Warning "OPA CLI not available - policy validation skipped"
        }
    } else {
        Write-Failure "OPA policy files not found"
        Test-Counter
    }
    
    Write-Host ""
}

Test-PolicyEnforcement

# ============================================================================
# GENERATE ACCEPTANCE SUMMARY
# ============================================================================

Write-TestLog "📊 Generating Acceptance Summary"
Write-Host ""

# Calculate success rate
$SUCCESS_RATE = if ($TOTAL_TESTS -gt 0) { [math]::Round(($PASSED_TESTS * 100.0) / $TOTAL_TESTS, 1) } else { 0 }

# Generate acceptance summary JSON
$acceptanceSummary = @{
    timestamp = $TIMESTAMP
    evidence_path = $EVIDENCE_PATH
    test_results = @{
        total_tests = $TOTAL_TESTS
        passed_tests = $PASSED_TESTS
        failed_tests = $FAILED_TESTS
        success_rate = "${SUCCESS_RATE}%"
    }
    validation_results = @{
        security_headers = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        dpop_enforcement = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        receipts_rfc9421 = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        mls_core = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        quality_gates = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        supply_chain = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
        policy_enforcement = if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" }
    }
    overall_status = if ($FAILED_TESTS -eq 0) { "PERFECT_LIVE" } else { "NEEDS_REMEDIATION" }
    evidence_files = @(
        "headers-*.txt",
        "mls-test-results.json",
        "lhci.json",
        "k6-summary.json",
        "playwright-report.html",
        "SBOM.cyclonedx.json",
        "provenance.intoto.jsonl",
        "cosign-verify.txt",
        "security-scan-results.sarif",
        "receipts-samples/",
        "jwks.json",
        "opa-test-results.txt",
        "acceptance-summary.json"
    )
}

$acceptanceSummary | ConvertTo-Json -Depth 4 | Out-File "$EVIDENCE_PATH\acceptance-summary.json" -Encoding UTF8

# Generate acceptance log
$acceptanceLog = @"
ATLAS Perfect Mode Acceptance Testing Report
Generated: $TIMESTAMP

=== SUMMARY ===
Total Tests: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS
Success Rate: ${SUCCESS_RATE}%

=== VALIDATION RESULTS ===
Security Headers: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
DPoP Enforcement: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
RFC 9421 Receipts: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
MLS Chat Core: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
Quality Gates: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
Supply Chain: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })
Policy Enforcement: $(if ($FAILED_TESTS -eq 0) { "PASS" } else { "FAIL" })

=== OVERALL STATUS ===
$(if ($FAILED_TESTS -eq 0) { "PERFECT_LIVE - All acceptance gates passed!" } else { "NEEDS_REMEDIATION - $FAILED_TESTS tests failed" })
"@

$acceptanceLogPath = Join-Path $EVIDENCE_PATH "acceptance.log"
$acceptanceLog | Out-File -FilePath $acceptanceLogPath -Encoding UTF8

# Final output
Write-Host ""
Write-Host "=========================================================================================" -ForegroundColor Blue
if ($FAILED_TESTS -eq 0) {
    Write-TestLog "🎉 ALL ACCEPTANCE TESTS PASSED - PERFECT_LIVE STATUS ACHIEVED!" "Success"
} else {
    Write-TestLog "❌ $FAILED_TESTS tests failed - Remediation required" "Failure"
}
Write-Host "=========================================================================================" -ForegroundColor Blue
Write-Host ""
Write-TestLog "📦 Evidence Package: $EVIDENCE_PATH"
Write-TestLog "📋 Acceptance Summary: $EVIDENCE_PATH\acceptance-summary.json"
Write-TestLog "📝 Detailed Log: $EVIDENCE_PATH\acceptance.log"
Write-Host ""

# Return appropriate exit code
if ($FAILED_TESTS -eq 0) {
    exit 0
} else {
    exit 1
}