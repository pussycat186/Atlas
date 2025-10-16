# Verify Evidence Pack Contents
# Checks that all 11 required evidence files are present

param(
    [Parameter(Mandatory=$false)]
    [string]$EvidencePath = ""
)

function Test-EvidenceFiles {
    param([string]$BasePath)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " EVIDENCE PACK VERIFICATION" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Checking: $BasePath`n" -ForegroundColor Gray
    
    # Required files (11 total)
    $requiredFiles = @(
        "SBOM.cyclonedx.json",
        "provenance.intoto.jsonl",
        "cosign-verify.txt",
        "headers-report.txt",
        "lhci.json",
        "k6-summary.json",
        "playwright-report.html",
        "jwks.json",
        "acceptance.log",
        "acceptance-summary.json"
    )
    
    $receiptsDir = "receipts-samples"
    
    $passed = 0
    $failed = 0
    
    Write-Host "Required Files (10):" -ForegroundColor Yellow
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $BasePath $file
        if (Test-Path $fullPath) {
            $size = (Get-Item $fullPath).Length
            Write-Host "  ✅ $file ($size bytes)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ $file MISSING" -ForegroundColor Red
            $failed++
        }
    }
    
    # Check receipts directory
    Write-Host "`nReceipts Directory:" -ForegroundColor Yellow
    $receiptsPath = Join-Path $BasePath $receiptsDir
    if (Test-Path $receiptsPath) {
        $receiptFiles = Get-ChildItem "$receiptsPath\*.json" -ErrorAction SilentlyContinue
        $count = $receiptFiles.Count
        if ($count -gt 0) {
            Write-Host "  ✅ $receiptsDir/ ($count JSON files)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ⚠️  $receiptsDir/ exists but contains no JSON files" -ForegroundColor Yellow
            $failed++
        }
    } else {
        Write-Host "  ❌ $receiptsDir/ MISSING" -ForegroundColor Red
        $failed++
    }
    
    # Summary
    Write-Host "`n========================================" -ForegroundColor Cyan
    $total = $passed + $failed
    Write-Host "Total: $passed/$total files present" -ForegroundColor White
    
    if ($failed -eq 0) {
        Write-Host "✅ ALL EVIDENCE FILES VERIFIED" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "❌ $failed files missing" -ForegroundColor Red
        Write-Host "========================================`n" -ForegroundColor Cyan
        return $false
    }
}

function Test-UXPack {
    param([string]$BasePath)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " UX PACK VERIFICATION" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $uxPath = Join-Path $BasePath "ux"
    
    if (-not (Test-Path $uxPath)) {
        Write-Host "❌ UX directory not found at: $uxPath" -ForegroundColor Red
        Write-Host "   Extract ux-pack.zip to this location`n" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Checking: $uxPath`n" -ForegroundColor Gray
    
    $uxFiles = @(
        "tokens.css",
        "tokens.ts",
        "tailwind.tokens.cjs",
        "a11y-report.json"
    )
    
    $uxDirs = @(
        "storybook-static"
    )
    
    $passed = 0
    $failed = 0
    
    Write-Host "Required Files:" -ForegroundColor Yellow
    foreach ($file in $uxFiles) {
        $fullPath = Join-Path $uxPath $file
        if (Test-Path $fullPath) {
            $size = (Get-Item $fullPath).Length
            Write-Host "  ✅ $file ($size bytes)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ⚠️  $file missing (may be optional)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nRequired Directories:" -ForegroundColor Yellow
    foreach ($dir in $uxDirs) {
        $fullPath = Join-Path $uxPath $dir
        if (Test-Path $fullPath) {
            $fileCount = (Get-ChildItem $fullPath -Recurse -File).Count
            Write-Host "  ✅ $dir/ ($fileCount files)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ $dir/ MISSING" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    if ($failed -eq 0) {
        Write-Host "✅ UX PACK VERIFIED" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some UX files missing (check workflow logs)" -ForegroundColor Yellow
    }
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    return $true
}

# Main execution
if ([string]::IsNullOrWhiteSpace($EvidencePath)) {
    # Auto-detect latest evidence directory
    $evidenceBase = "docs\evidence"
    
    if (-not (Test-Path $evidenceBase)) {
        Write-Host "❌ Evidence directory not found: $evidenceBase" -ForegroundColor Red
        Write-Host "`nUsage: .\verify-evidence.ps1 [-EvidencePath <path>]" -ForegroundColor Yellow
        Write-Host "Example: .\verify-evidence.ps1 -EvidencePath docs\evidence\20251017-1400" -ForegroundColor Gray
        exit 1
    }
    
    # Find most recent directory
    $dirs = Get-ChildItem $evidenceBase -Directory | Sort-Object Name -Descending
    
    if ($dirs.Count -eq 0) {
        Write-Host "❌ No evidence directories found in: $evidenceBase" -ForegroundColor Red
        Write-Host "`nExtract evidence-pack.zip first:" -ForegroundColor Yellow
        Write-Host '  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")' -ForegroundColor Gray
        Write-Host '  $evidenceDir = "docs\evidence\$timestamp"' -ForegroundColor Gray
        Write-Host '  New-Item -ItemType Directory -Force -Path $evidenceDir' -ForegroundColor Gray
        Write-Host '  Expand-Archive -Path evidence-pack.zip -DestinationPath $evidenceDir' -ForegroundColor Gray
        exit 1
    }
    
    $EvidencePath = $dirs[0].FullName
    Write-Host "Auto-detected latest evidence directory:" -ForegroundColor Cyan
    Write-Host "  $EvidencePath`n" -ForegroundColor White
}

# Verify evidence pack
$evidenceOk = Test-EvidenceFiles -BasePath $EvidencePath

# Verify UX pack
$uxOk = Test-UXPack -BasePath $EvidencePath

# Final result
if ($evidenceOk -and $uxOk) {
    Write-Host "✅ ALL VERIFICATIONS PASSED" -ForegroundColor Green
    Write-Host "`nNext step: Generate PERFECT_LIVE.json" -ForegroundColor Cyan
    Write-Host "  .\generate-perfect-live.ps1 -EvidencePath `"$EvidencePath`"`n" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "`nCheck workflow artifacts and re-extract if needed`n" -ForegroundColor Yellow
    exit 1
}
