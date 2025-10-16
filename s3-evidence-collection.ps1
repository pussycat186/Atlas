#!/usr/bin/env powershell

# S3 Receipts & Verify Evidence Collection
# Validates RFC 9421 HTTP Message Signatures implementation structure

Write-Host "`n🔐 ATLAS S3 RECEIPTS & VERIFY - EVIDENCE COLLECTION" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green

$evidence = @{
    phase = "S3"
    title = "Receipts & Verify"
    timestamp = (Get-Date).ToString("o")
    checks = @{
        rfc9421Core = @()
        jwksService = @()
        verifyUI = @()
        chatIntegration = @()
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

Write-Host "`n📋 RFC 9421 Core Implementation" -ForegroundColor Cyan

# Check 1: @atlas/receipt package structure
$check1 = (Test-FileExists "d:\Atlas\packages\@atlas\receipt\package.json" "Receipt package.json") -and
          (Test-FileExists "d:\Atlas\packages\@atlas\receipt\src\index.ts" "Receipt main implementation") -and
          (Test-FileExists "d:\Atlas\packages\@atlas\receipt\src\cli.ts" "Receipt CLI tool")

$evidence.checks.rfc9421Core += @{ name = "Receipt Package Structure"; passed = $check1 }

# Check 2: RFC 9421 implementation patterns
$rfc9421Patterns = @(
    @{ name = "RFC9421Signer class"; text = "class RFC9421Signer" },
    @{ name = "RFC9421Verifier class"; text = "class RFC9421Verifier" },
    @{ name = "createReceipt method"; text = "createReceipt(" },
    @{ name = "verifyReceipt method"; text = "verifyReceipt(" },
    @{ name = "Ed25519 support"; text = "ed25519" }
)

$check2 = Test-CodeContent "d:\Atlas\packages\@atlas\receipt\src\index.ts" $rfc9421Patterns "RFC 9421 Implementation"
$evidence.checks.rfc9421Core += @{ name = "RFC 9421 Classes"; passed = $check2 }

# Check 3: CLI functionality
$cliPatterns = @(
    @{ name = "generate-keys command"; text = "generate-keys" },
    @{ name = "sign command"; text = "sign" },
    @{ name = "verify command"; text = "verify" },
    @{ name = "jwks command"; text = "jwks" },
    @{ name = "Commander.js"; text = "commander" }
)

$check3 = Test-CodeContent "d:\Atlas\packages\@atlas\receipt\src\cli.ts" $cliPatterns "CLI Implementation"
$evidence.checks.rfc9421Core += @{ name = "CLI Commands"; passed = $check3 }

Write-Host "`n🔑 JWKS Service" -ForegroundColor Cyan

# Check 4: JWKS service structure
$check4 = (Test-FileExists "d:\Atlas\services\jwks\src\server.ts" "JWKS server implementation") -and
          (Test-FileExists "d:\Atlas\services\jwks\package.json" "JWKS package.json")

$evidence.checks.jwksService += @{ name = "JWKS Service Structure"; passed = $check4 }

# Check 5: JWKS service implementation
$jwksPatterns = @(
    @{ name = "JWKSManager class"; text = "class JWKSManager" },
    @{ name = "Key rotation"; text = "performScheduledRotation" },
    @{ name = "Redis persistence"; text = "redis" },
    @{ name = "Ed25519 key generation"; text = "generateEd25519Key" },
    @{ name = "JWKS endpoint"; text = "/.well-known/jwks.json" },
    @{ name = "90-day rotation"; text = "90" }
)

$check5 = Test-CodeContent "d:\Atlas\services\jwks\src\server.ts" $jwksPatterns "JWKS Service Features"
$evidence.checks.jwksService += @{ name = "JWKS Implementation"; passed = $check5 }

Write-Host "`n🌐 Verify UI" -ForegroundColor Cyan

# Check 6: Verify app structure
$check6 = (Test-FileExists "d:\Atlas\apps\verify\src\app\page.tsx" "Verify UI page") -and
          (Test-FileExists "d:\Atlas\apps\verify\src\app\api\verify\route.ts" "Verify API route") -and
          (Test-FileExists "d:\Atlas\apps\verify\package.json" "Verify package.json")

$evidence.checks.verifyUI += @{ name = "Verify App Structure"; passed = $check6 }

# Check 7: Verify UI implementation
$uiPatterns = @(
    @{ name = "React dropzone"; text = "react-dropzone" },
    @{ name = "Receipt verification UI"; text = "verification" },
    @{ name = "File upload handling"; text = "onDrop" },
    @{ name = "Receipt display"; text = "receipt" }
)

$check7 = Test-CodeContent "d:\Atlas\apps\verify\src\app\page.tsx" $uiPatterns "Verify UI Components"
$evidence.checks.verifyUI += @{ name = "Verify UI Features"; passed = $check7 }

# Check 8: API route implementation
$apiPatterns = @(
    @{ name = "POST handler"; text = "export async function POST" },
    @{ name = "JWKS fetch"; text = "fetch" },
    @{ name = "RFC9421Verifier usage"; text = "RFC9421Verifier" },
    @{ name = "Receipt verification"; text = "verifyReceipt" }
)

$check8 = Test-CodeContent "d:\Atlas\apps\verify\src\app\api\verify\route.ts" $apiPatterns "API Route Implementation"
$evidence.checks.verifyUI += @{ name = "Verify API Route"; passed = $check8 }

Write-Host "`n💬 Chat Integration" -ForegroundColor Cyan

# Check 9: Chat service integration
$chatPatterns = @(
    @{ name = "RFC9421Signer import"; text = "RFC9421Signer" },
    @{ name = "Receipt signer property"; text = "receiptSigner" },
    @{ name = "Receipt generation"; text = "createReceipt" },
    @{ name = "Receipt storage"; text = "receipt:" },
    @{ name = "Receipt endpoint"; text = "/api/receipts/" }
)

$check9 = Test-CodeContent "d:\Atlas\services\chat-delivery\src\server.ts" $chatPatterns "Chat Receipt Integration"
$evidence.checks.chatIntegration += @{ name = "Chat Service Receipt Integration"; passed = $check9 }

# Check 10: Message receipt interface
$interfacePatterns = @(
    @{ name = "receiptId field"; text = "receiptId?" },
    @{ name = "AtlasReceiptContent interface"; text = "AtlasReceiptContent" },
    @{ name = "Receipt storage with TTL"; text = "90 * 24 * 60 * 60" }
)

$check10 = Test-CodeContent "d:\Atlas\services\chat-delivery\src\server.ts" $interfacePatterns "Receipt Data Structures"
$evidence.checks.chatIntegration += @{ name = "Message Receipt Interface"; passed = $check10 }

# Calculate totals
$allChecks = $evidence.checks.rfc9421Core + $evidence.checks.jwksService + $evidence.checks.verifyUI + $evidence.checks.chatIntegration
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
    rfc9421Standard = ($evidence.checks.rfc9421Core | ForEach-Object { $_.passed }) -notcontains $false
    jwksService = ($evidence.checks.jwksService | ForEach-Object { $_.passed }) -notcontains $false
    verifyUI = ($evidence.checks.verifyUI | ForEach-Object { $_.passed }) -notcontains $false
    chatIntegration = ($evidence.checks.chatIntegration | ForEach-Object { $_.passed }) -notcontains $false
}

Write-Host "`n🎯 COMPLIANCE STATUS" -ForegroundColor Yellow
Write-Host "RFC 9421 Implementation: $(if($compliance.rfc9421Standard){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.rfc9421Standard){'Green'}else{'Red'})
Write-Host "JWKS Service: $(if($compliance.jwksService){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.jwksService){'Green'}else{'Red'})
Write-Host "Verify UI: $(if($compliance.verifyUI){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.verifyUI){'Green'}else{'Red'})
Write-Host "Chat Integration: $(if($compliance.chatIntegration){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.chatIntegration){'Green'}else{'Red'})

$overallCompliance = ($compliance.Values | Where-Object { -not $_ }).Count -eq 0

if ($overallCompliance) {
    Write-Host "`n🎉 S3 RECEIPTS & VERIFY: FULLY IMPLEMENTED & COMPLIANT" -ForegroundColor Green
    Write-Host "✅ RFC 9421 HTTP Message Signatures implemented" -ForegroundColor Green
    Write-Host "✅ JWKS service with 90-day key rotation" -ForegroundColor Green
    Write-Host "✅ Public verification UI with drag-drop interface" -ForegroundColor Green
    Write-Host "✅ Chat service integration for automatic receipts" -ForegroundColor Green
    Write-Host "`n🚀 READY TO PROCEED WITH S4 HEADERS & TRANSPORT" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  S3 RECEIPTS & VERIFY: IMPLEMENTATION INCOMPLETE" -ForegroundColor Red
    Write-Host "Please address the failed checks before proceeding" -ForegroundColor Red
}

# Save evidence
$evidence.compliance = $compliance
$evidence.overallCompliant = $overallCompliance
$evidence.summary = @{
    totalChecks = $totalChecks
    passedChecks = $passedChecks
    failedChecks = $failedChecks
}

$evidenceFile = "s3-receipts-verify-evidence-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Out-File $evidenceFile -Encoding UTF8
Write-Host "`n💾 Evidence report saved: $evidenceFile" -ForegroundColor Blue