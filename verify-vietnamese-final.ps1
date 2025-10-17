#!/usr/bin/env pwsh
# ATLAS_FORCE_LIVE_UI Final Verification Script

Write-Host "`n===== FINAL PRODUCTION VERIFICATION =====" -ForegroundColor Cyan

# Pull latest workflow updates
Write-Host "`n📥 Pulling workflow updates..." -ForegroundColor Yellow
git pull origin main --quiet

# Check LIVE_URLS timestamp
$liveUrls = Get-Content "LIVE_URLS.json" | ConvertFrom-Json
Write-Host "Last deployment: $($liveUrls.timestamp)" -ForegroundColor Gray

# Fetch production HTML
Write-Host "`n🌐 Fetching production HTML..." -ForegroundColor Yellow
$resp = Invoke-WebRequest -Uri "https://atlas-proof-messenger.vercel.app/" -UseBasicParsing -Headers @{
    'Cache-Control' = 'no-cache, no-store, must-revalidate'
    'Pragma' = 'no-cache'
    'Expires' = '0'
}

Write-Host "Content-Length: $($resp.Content.Length) bytes" -ForegroundColor Gray

# Check Vietnamese markers
Write-Host "`n🔍 Checking Vietnamese markers..." -ForegroundColor Yellow

$markers = @{
    "Nhắn tin" = $resp.Content -match 'Nhắn tin'
    "An toàn" = $resp.Content -match 'An toàn'
    "Passkey" = $resp.Content -match 'Passkey'
    "Xác minh" = $resp.Content -match 'Xác minh'
    "Atlas Messenger" = $resp.Content -match 'Atlas Messenger'
}

$foundCount = 0
foreach ($marker in $markers.GetEnumerator()) {
    $status = if ($marker.Value) { "✅ FOUND"; $foundCount++ } else { "❌ MISSING" }
    $color = if ($marker.Value) { "Green" } else { "Red" }
    Write-Host "  $($marker.Key): $status" -ForegroundColor $color
}

# Check evidence folder
Write-Host "`n📁 Checking evidence folder..." -ForegroundColor Yellow
$latestEvidence = Get-ChildItem "docs\evidence" | Where-Object { $_.Name -like "20251017-09*" } | Sort-Object Name -Descending | Select-Object -First 1
if ($latestEvidence) {
    Write-Host "✅ Found: $($latestEvidence.Name)" -ForegroundColor Green
    $uiLiveJson = Join-Path $latestEvidence.FullName "force-live-ui\UI_LIVE.json"
    if (Test-Path $uiLiveJson) {
        Write-Host "✅ UI_LIVE.json exists" -ForegroundColor Green
        Get-Content $uiLiveJson | ConvertFrom-Json | Format-List
    } else {
        Write-Host "❌ UI_LIVE.json not found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No evidence folder created for 09xx UTC" -ForegroundColor Red
}

# Final verdict
Write-Host "`n===== VERDICT =====" -ForegroundColor Cyan
if ($foundCount -ge 4) {
    Write-Host "🎉 SUCCESS: Vietnamese UI is LIVE!" -ForegroundColor Green
    Write-Host "   $foundCount/5 markers found on production" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FAILED: Vietnamese UI not deployed" -ForegroundColor Red
    Write-Host "   Only $foundCount/5 markers found" -ForegroundColor Red
    Write-Host "`n📝 First 1000 chars of production HTML:" -ForegroundColor Yellow
    Write-Host $resp.Content.Substring(0, [Math]::Min(1000, $resp.Content.Length)) -ForegroundColor Gray
    exit 1
}
