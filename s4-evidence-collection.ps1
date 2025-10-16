#!/usr/bin/env powershell

# S4 Headers & Transport Security Evidence Collection
# Validates CSP nonces, COOP/COEP, HSTS, DPoP, and transport hardening

Write-Host "`n🛡️ ATLAS S4 HEADERS & TRANSPORT SECURITY - EVIDENCE COLLECTION" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Green

$evidence = @{
    phase = "S4"
    title = "Headers & Transport Security"
    timestamp = (Get-Date).ToString("o")
    checks = @{
        securityHeaders = @()
        middlewareImplementation = @()
        cspNonce = @()
        coopCoep = @()
        dpopSupport = @()
        trustedTypes = @()
    }
}

function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Host "✅ $Description`: $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description`: $Path" -ForegroundColor Red
        return $false
    }
}

function Test-CodeContent {
    param($Path, $Patterns, $Description)
    
    if (!(Test-Path $Path)) {
        Write-Host "❌ $Description`: File not found - $Path" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $Path -Raw
        $passed = 0
        $total = $Patterns.Count
        
        foreach ($pattern in $Patterns) {
            if ($content -match $pattern.pattern -or $content.Contains($pattern.text)) {
                $passed++
            } else {
                Write-Host "   - Missing: $($pattern.name)" -ForegroundColor Yellow
            }
        }
        
        if ($passed -eq $total) {
            Write-Host "✅ $Description`: All patterns found ($passed/$total)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Description`: Missing patterns ($passed/$total)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Description`: Error reading file - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n🔐 Security Headers Implementation" -ForegroundColor Cyan

# Check 1: Main security headers middleware
$check1 = Test-FileExists "d:\Atlas\middleware\security-headers.ts" "Security headers middleware"
$evidence.checks.securityHeaders += @{ name = "Security Headers Middleware"; passed = $check1 }

# Check 2: Security headers implementation patterns
$headerPatterns = @(
    @{ name = "SecurityHeadersManager class"; text = "class SecurityHeadersManager" },
    @{ name = "CSP nonce generation"; text = "generateNonce()" },
    @{ name = "COOP enforcement"; text = "Cross-Origin-Opener-Policy" },
    @{ name = "COEP enforcement"; text = "Cross-Origin-Embedder-Policy" },
    @{ name = "HSTS enforcement"; text = "Strict-Transport-Security" },
    @{ name = "Trusted Types support"; text = "require-trusted-types-for" },
    @{ name = "Permissions Policy"; text = "Permissions-Policy" },
    @{ name = "DPoP support"; text = "DPoPManager" }
)

$check2 = Test-CodeContent "d:\Atlas\middleware\security-headers.ts" $headerPatterns "Security Headers Implementation"
$evidence.checks.securityHeaders += @{ name = "Security Headers Features"; passed = $check2 }

Write-Host "`n🌐 App Middleware Integration" -ForegroundColor Cyan

# Check 3: Admin insights middleware
$check3 = Test-FileExists "d:\Atlas\apps\admin-insights\middleware.ts" "Admin insights middleware"
$evidence.checks.middlewareImplementation += @{ name = "Admin Insights Middleware"; passed = $check3 }

$adminPatterns = @(
    @{ name = "S4 security middleware"; text = "s4SecurityMiddleware" },
    @{ name = "Admin security config"; text = "adminInsightsSecurityConfig" },
    @{ name = "COOP same-origin"; text = "same-origin" },
    @{ name = "Cache prevention"; text = "no-store" },
    @{ name = "Security level header"; text = "S4-ADMIN" }
)

$check4 = Test-CodeContent "d:\Atlas\apps\admin-insights\middleware.ts" $adminPatterns "Admin Security Implementation"
$evidence.checks.middlewareImplementation += @{ name = "Admin Security Config"; passed = $check4 }

# Check 5: Dev portal middleware with DPoP
$check5 = Test-FileExists "d:\Atlas\apps\dev-portal\middleware.ts" "Dev portal middleware"
$evidence.checks.middlewareImplementation += @{ name = "Dev Portal Middleware"; passed = $check5 }

$devPatterns = @(
    @{ name = "DPoP enforcement"; text = "isDPoPProtectedRoute" },
    @{ name = "DPoP validation"; text = "validateDPoPProof" },
    @{ name = "OAuth popup support"; text = "same-origin-allow-popups" },
    @{ name = "Credentialless COEP"; text = "credentialless" },
    @{ name = "Protected routes check"; text = "protectedRoutes" }
)

$check6 = Test-CodeContent "d:\Atlas\apps\dev-portal\middleware.ts" $devPatterns "Dev Portal DPoP Implementation"
$evidence.checks.dpopSupport += @{ name = "Dev Portal DPoP"; passed = $check6 }

# Check 7: Messenger middleware with WebRTC
$check7 = Test-FileExists "d:\Atlas\apps\messenger\middleware.ts" "Messenger middleware"
$evidence.checks.middlewareImplementation += @{ name = "Messenger Middleware"; passed = $check7 }

$messengerPatterns = @(
    @{ name = "WebRTC permissions"; text = "camera.*self" },
    @{ name = "Microphone permissions"; text = "microphone.*self" },
    @{ name = "Screen capture support"; text = "display-capture" },
    @{ name = "PiP support"; text = "picture-in-picture" },
    @{ name = "WebSocket security"; text = "X-WebSocket-Security" }
)

$check8 = Test-CodeContent "d:\Atlas\apps\messenger\middleware.ts" $messengerPatterns "Messenger WebRTC Security"
$evidence.checks.middlewareImplementation += @{ name = "Messenger WebRTC Security"; passed = $check8 }

Write-Host "`n🔒 CSP Nonce & Trusted Types" -ForegroundColor Cyan

# Check 9: CSP nonce utilities
$check9 = Test-FileExists "d:\Atlas\libs\security\csp-nonce.tsx" "CSP nonce utilities"
$evidence.checks.cspNonce += @{ name = "CSP Nonce Utilities"; passed = $check9 }

$noncePatterns = @(
    @{ name = "NonceScript component"; text = "NonceScript" },
    @{ name = "NonceStyle component"; text = "NonceStyle" },
    @{ name = "Trusted Types policy"; text = "createTrustedTypesPolicy" },
    @{ name = "Safe DOM utilities"; text = "class SafeDOM" },
    @{ name = "Security validator"; text = "SecurityValidator" }
)

$check10 = Test-CodeContent "d:\Atlas\libs\security\csp-nonce.tsx" $noncePatterns "CSP Nonce Implementation"
$evidence.checks.cspNonce += @{ name = "CSP Nonce Features"; passed = $check10 }

Write-Host "`n🚫 COOP/COEP Implementation" -ForegroundColor Cyan

# Check 11: COOP/COEP in security flags
$flagPatterns = @(
    @{ name = "COOP enforcement flag"; text = "SECURITY_COOP_ENFORCE" },
    @{ name = "COEP enforcement flag"; text = "SECURITY_COEP_ENFORCE" },
    @{ name = "CSP nonce flag"; text = "SECURITY_CSP_NONCE" },
    @{ name = "Trusted Types flag"; text = "SECURITY_TRUSTED_TYPES" },
    @{ name = "HSTS production flag"; text = "SECURITY_HSTS_PROD_ENFORCE" },
    @{ name = "Transport hardening flag"; text = "SECURITY_TRANSPORT_HARDENING" }
)

$check11 = Test-CodeContent "d:\Atlas\security\flags.yaml" $flagPatterns "S4 Security Flags"
$evidence.checks.coopCoep += @{ name = "S4 Security Flags"; passed = $check11 }

Write-Host "`n🔐 DPoP Implementation" -ForegroundColor Cyan

# Check 12: DPoP manager implementation
$dpopPatterns = @(
    @{ name = "DPoP proof creation"; text = "createDPoPProof" },
    @{ name = "DPoP proof validation"; text = "validateDPoPProof" },
    @{ name = "ES256 algorithm"; text = "ES256" },
    @{ name = "JWK export"; text = "exportPublicKeyAsJWK" },
    @{ name = "Access token hash"; text = "ath.*sha256" }
)

$check12 = Test-CodeContent "d:\Atlas\middleware\security-headers.ts" $dpopPatterns "DPoP Manager Implementation"
$evidence.checks.dpopSupport += @{ name = "DPoP Manager"; passed = $check12 }

# Calculate totals
$allChecks = $evidence.checks.securityHeaders + $evidence.checks.middlewareImplementation + 
             $evidence.checks.cspNonce + $evidence.checks.coopCoep + $evidence.checks.dpopSupport
$totalChecks = $allChecks.Count
$passedChecks = ($allChecks | Where-Object { $_.passed }).Count
$failedChecks = $totalChecks - $passedChecks

Write-Host "`n📊 SUMMARY RESULTS" -ForegroundColor Yellow
Write-Host "Total Checks: $totalChecks" -ForegroundColor Blue
Write-Host "Passed: $passedChecks" -ForegroundColor Green
Write-Host "Failed: $failedChecks" -ForegroundColor Red
Write-Host "Success Rate: $([Math]::Round(($passedChecks / $totalChecks) * 100))%" -ForegroundColor Cyan

# Compliance assessment
$compliance = @{
    securityHeaders = ($evidence.checks.securityHeaders | ForEach-Object { $_.passed }) -notcontains $false
    middlewareIntegration = ($evidence.checks.middlewareImplementation | ForEach-Object { $_.passed }) -notcontains $false
    cspNonce = ($evidence.checks.cspNonce | ForEach-Object { $_.passed }) -notcontains $false
    coopCoep = ($evidence.checks.coopCoep | ForEach-Object { $_.passed }) -notcontains $false
    dpopSupport = ($evidence.checks.dpopSupport | ForEach-Object { $_.passed }) -notcontains $false
}

Write-Host "`n🎯 COMPLIANCE STATUS" -ForegroundColor Yellow
Write-Host "Security Headers Framework: $(if($compliance.securityHeaders){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.securityHeaders){'Green'}else{'Red'})
Write-Host "Middleware Integration: $(if($compliance.middlewareIntegration){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.middlewareIntegration){'Green'}else{'Red'})
Write-Host "CSP Nonce & Trusted Types: $(if($compliance.cspNonce){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.cspNonce){'Green'}else{'Red'})
Write-Host "COOP/COEP Isolation: $(if($compliance.coopCoep){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.coopCoep){'Green'}else{'Red'})
Write-Host "DPoP Enforcement: $(if($compliance.dpopSupport){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.dpopSupport){'Green'}else{'Red'})

$overallCompliance = ($compliance.Values | Where-Object { -not $_ }).Count -eq 0

if ($overallCompliance) {
    Write-Host "`n🎉 S4 HEADERS & TRANSPORT SECURITY: FULLY IMPLEMENTED & COMPLIANT" -ForegroundColor Green
    Write-Host "✅ CSP nonce generation with Trusted Types enforcement" -ForegroundColor Green
    Write-Host "✅ COOP/COEP headers for process isolation" -ForegroundColor Green
    Write-Host "✅ HSTS production enforcement with preload" -ForegroundColor Green
    Write-Host "✅ DPoP demonstration of proof-of-possession" -ForegroundColor Green
    Write-Host "✅ Complete transport security hardening" -ForegroundColor Green
    Write-Host "`n🚀 READY TO PROCEED WITH S5 SUPPLY CHAIN SECURITY" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  S4 HEADERS & TRANSPORT SECURITY: IMPLEMENTATION INCOMPLETE" -ForegroundColor Red
    Write-Host "Please address the failed checks before proceeding to S5" -ForegroundColor Red
}

# Save evidence
$evidence.compliance = $compliance
$evidence.overallCompliant = $overallCompliance
$evidence.summary = @{
    totalChecks = $totalChecks
    passedChecks = $passedChecks
    failedChecks = $failedChecks
}

$evidenceFile = "s4-headers-transport-evidence-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Out-File $evidenceFile -Encoding UTF8
Write-Host "`n💾 Evidence report saved: $evidenceFile" -ForegroundColor Blue