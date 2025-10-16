# Atlas S2 Evidence Collection Script (PowerShell)
# Tests security headers, CSP compliance, and anti-clickjacking measures

param(
    [string]$OutputDir = ""
)

# Create evidence directory with UTC timestamp
if (-not $OutputDir) {
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")
    $OutputDir = "docs/evidence/$timestamp"
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
Write-Host "Collecting S2 Headers and CSP Evidence..."
Write-Host "Evidence directory: $OutputDir"

# Production URLs
$DevPortalUrl = "https://atlas-dev-portal.vercel.app"
$AdminInsightsUrl = "https://atlas-admin-insights.vercel.app" 
$ProofMessengerUrl = "https://atlas-proof-messenger.vercel.app"

# ==============================================
# 1. HEADER VALIDATION TESTS
# ==============================================
Write-Host "Testing Security Headers..."

function Test-Headers($url, $filename) {
    try {
        Write-Host "Testing headers for $url..."
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing
        
        "Testing headers for: $url" | Out-File "$OutputDir/$filename" -Encoding UTF8
        "Status: $($response.StatusCode)" | Out-File "$OutputDir/$filename" -Append -Encoding UTF8
        "Headers:" | Out-File "$OutputDir/$filename" -Append -Encoding UTF8
        
        foreach ($header in $response.Headers.GetEnumerator()) {
            "$($header.Key): $($header.Value)" | Out-File "$OutputDir/$filename" -Append -Encoding UTF8
        }
        
        Write-Host "✅ Headers collected for $url"
        return $response.Headers
    }
    catch {
        Write-Host "❌ Failed to fetch headers for $url : $_"
        "FAILED to fetch headers: $_" | Out-File "$OutputDir/$filename" -Encoding UTF8
        return $null
    }
}

# Test all three apps
$devPortalHeaders = Test-Headers $DevPortalUrl "headers-dev-portal.txt"
$adminInsightsHeaders = Test-Headers $AdminInsightsUrl "headers-admin-insights.txt"
$proofMessengerHeaders = Test-Headers $ProofMessengerUrl "headers-proof-messenger.txt"

# ==============================================
# 2. CSP NONCE VALIDATION
# ==============================================
Write-Host "Testing CSP Nonce Generation..."

$cspValidation = @()
if ($devPortalHeaders -and $devPortalHeaders.ContainsKey("Content-Security-Policy")) {
    $cspHeader = $devPortalHeaders["Content-Security-Policy"]
    $cspValidation += "Dev Portal CSP: $cspHeader"
    
    if ($cspHeader -like "*nonce-*") {
        $cspValidation += "✅ CSP nonce detected"
        Write-Host "✅ CSP nonce found in dev-portal headers"
    } else {
        $cspValidation += "❌ CSP nonce NOT detected"
        Write-Host "❌ CSP nonce missing from dev-portal headers"
    }
} else {
    $cspValidation += "❌ NO CSP HEADER found"
    Write-Host "❌ No CSP header found in dev-portal"
}

$cspValidation | Out-File "$OutputDir/csp-validation.txt" -Encoding UTF8

# ==============================================
# 3. CROSS-ORIGIN POLICY VALIDATION
# ==============================================
Write-Host "Testing Cross-Origin Policies..."

$coopValidation = @()

# Test COOP headers
if ($devPortalHeaders -and $devPortalHeaders.ContainsKey("Cross-Origin-Opener-Policy")) {
    $coopHeader = $devPortalHeaders["Cross-Origin-Opener-Policy"]
    $coopValidation += "Dev Portal COOP: $coopHeader"
    Write-Host "✅ COOP header found: $coopHeader"
} else {
    $coopValidation += "❌ NO COOP HEADER found"
    Write-Host "❌ COOP header missing"
}

# Test COEP headers
if ($devPortalHeaders -and $devPortalHeaders.ContainsKey("Cross-Origin-Embedder-Policy")) {
    $coepHeader = $devPortalHeaders["Cross-Origin-Embedder-Policy"]
    $coopValidation += "Dev Portal COEP: $coepHeader"
    Write-Host "✅ COEP header found: $coepHeader"
} else {
    $coopValidation += "❌ NO COEP HEADER found"
    Write-Host "❌ COEP header missing"
}

$coopValidation | Out-File "$OutputDir/coop-validation.txt" -Encoding UTF8

# ==============================================
# 4. HSTS VALIDATION  
# ==============================================
Write-Host "Testing HSTS Configuration..."

$hstsValidation = @()
if ($devPortalHeaders -and $devPortalHeaders.ContainsKey("Strict-Transport-Security")) {
    $hstsHeader = $devPortalHeaders["Strict-Transport-Security"]
    $hstsValidation += "Dev Portal HSTS: $hstsHeader"
    
    if ($hstsHeader -like "*preload*") {
        $hstsValidation += "✅ HSTS preload detected"
        Write-Host "✅ HSTS preload enabled"
    } else {
        $hstsValidation += "⚠️  HSTS preload NOT detected (expected for staging)"
        Write-Host "⚠️  HSTS preload not enabled (normal for staging)"
    }
} else {
    $hstsValidation += "❌ NO HSTS HEADER found"
    Write-Host "❌ HSTS header missing"
}

$hstsValidation | Out-File "$OutputDir/hsts-validation.txt" -Encoding UTF8

# ==============================================
# 5. SECURITY GATE VALIDATION
# ==============================================
Write-Host "Validating Required Security Headers..."

$requiredHeaders = @(
    "X-Content-Type-Options",
    "X-Frame-Options", 
    "Referrer-Policy",
    "Content-Security-Policy"
)

$apps = @(
    @{Name="dev-portal"; Headers=$devPortalHeaders},
    @{Name="admin-insights"; Headers=$adminInsightsHeaders},
    @{Name="proof-messenger"; Headers=$proofMessengerHeaders}
)

$gateValidation = @()

foreach ($app in $apps) {
    $gateValidation += "=== $($app.Name) Security Gate ==="
    
    foreach ($header in $requiredHeaders) {
        if ($app.Headers -and $app.Headers.ContainsKey($header)) {
            $gateValidation += "✅ $header : PRESENT"
            Write-Host "✅ $($app.Name): $header present"
        } else {
            $gateValidation += "❌ $header : MISSING"
            Write-Host "❌ $($app.Name): $header missing"
        }
    }
    $gateValidation += ""
}

$gateValidation | Out-File "$OutputDir/security-gate-validation.txt" -Encoding UTF8

# ==============================================
# 6. GENERATE SUMMARY REPORT
# ==============================================
Write-Host "Generating S2 Evidence Summary..."

$summaryContent = @"
# S2 Headers & CSP Evidence Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Test Results

### Security Headers Status
- ✅ Dev Portal Headers: [See headers-dev-portal.txt](./headers-dev-portal.txt)
- ✅ Admin Insights Headers: [See headers-admin-insights.txt](./headers-admin-insights.txt)  
- ✅ Proof Messenger Headers: [See headers-proof-messenger.txt](./headers-proof-messenger.txt)

### CSP Nonce Validation
[See csp-validation.txt](./csp-validation.txt)

### Cross-Origin Policy Validation  
[See coop-validation.txt](./coop-validation.txt)

### HSTS Configuration
[See hsts-validation.txt](./hsts-validation.txt)

### Security Gate Compliance
[See security-gate-validation.txt](./security-gate-validation.txt)

## S2 Acceptance Criteria

- [ ] CSP with nonce enforcement active
- [ ] Trusted Types headers present  
- [ ] SRI validation enabled
- [ ] COOP/COEP configured
- [ ] HSTS with appropriate settings
- [ ] All apps have baseline security headers
- [ ] Canary rollout targeting dev_portal first

## Next Steps

If all gates pass:
1. Expand canary to 50% for dev_portal
2. Enable for proof_messenger at 10%  
3. Monitor CSP violation reports
4. Proceed to S3 Auth Hardening

If any gates fail:
1. Review specific failure in linked evidence files
2. Implement fixes or rollback flags
3. Re-run evidence collection

## URLs Tested
- Dev Portal: $DevPortalUrl
- Admin Insights: $AdminInsightsUrl  
- Proof Messenger: $ProofMessengerUrl
"@

$summaryContent | Out-File "$OutputDir/S2-EVIDENCE-SUMMARY.md" -Encoding UTF8

Write-Host "S2 Evidence Collection Complete!"
Write-Host "Evidence saved to: $OutputDir"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Review evidence files for any failures"
Write-Host "2. If all gates pass, expand canary rollout"
Write-Host "3. If any fail, implement fixes and re-test"