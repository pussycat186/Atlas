# SUCCESS VERIFICATION AND EVIDENCE GENERATION
# Run after deployment with SSG fix completes

Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  FINAL VERIFICATION - Attempt #8 (SSG FIX)  ║" -ForegroundColor Green  
Write-Host "╚══════════════════════════════════════════════╝`n" -ForegroundColor Green

# Pull latest updates
Write-Host "1. Pulling latest workflow results..." -ForegroundColor Cyan
git pull origin main --quiet

# Check LIVE_URLS
$liveUrls = Get-Content "LIVE_URLS.json" | ConvertFrom-Json
Write-Host "Last deployment: $($liveUrls.timestamp)" -ForegroundColor Gray

# Fetch production with aggressive cache-busting
Write-Host "`n2. Fetching production (cache-busted)..." -ForegroundColor Cyan
$url = "https://atlas-proof-messenger.vercel.app/"
$headers = @{
    'Cache-Control' = 'no-cache, no-store, must-revalidate'
    'Pragma' = 'no-cache'
    'Expires' = '0'
}
$resp = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers $headers

Write-Host "Content-Length: $($resp.Content.Length) bytes" -ForegroundColor White
Write-Host "(Previous attempts: 9,786 bytes)" -ForegroundColor Gray

# Check all markers
Write-Host "`n3. Checking Vietnamese markers..." -ForegroundColor Cyan
$markers = [ordered]@{
    "Nhắn tin" = $false
    "An toàn" = $false  
    "Passkey" = $false
    "Xác minh" = $false
    "Atlas Messenger" = $false
}

$found = 0
foreach ($key in $markers.Keys) {
    if ($resp.Content -match [regex]::Escape($key)) {
        Write-Host "  ✅ $key" -ForegroundColor Green
        $markers[$key] = $true
        $found++
    } else {
        Write-Host "  ❌ $key" -ForegroundColor Red
    }
}

Write-Host "`n4. Result: $found/5 markers found" -ForegroundColor White

# Check for evidence folder
$evidenceFolder = Get-ChildItem "docs\evidence" | Where-Object { $_.Name -like "20251017-094*" } | Sort-Object Name -Descending | Select-Object -First 1

if ($found -ge 4) {
    Write-Host "`n🎉🎉🎉 SUCCESS! Vietnamese UI is LIVE! 🎉🎉🎉" -ForegroundColor Green
    Write-Host "`nRoot cause was: output: 'export' in next.config.js" -ForegroundColor Yellow
    Write-Host "This forced static site generation, baking old content into build" -ForegroundColor Yellow
    Write-Host "Fix: Disabled SSG to allow dynamic rendering" -ForegroundColor Green
    
    # Generate UI_LIVE.json
    Write-Host "`n5. Generating UI_LIVE.json evidence..." -ForegroundColor Cyan
    $evidence = @{
        status = "UI_LIVE"
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
        url = $url
        content_length = $resp.Content.Length
        markers_found = $markers
        markers_count = "$found/5"
        attempts = 8
        root_cause = "next.config.js had 'output: export' forcing static site generation"
        resolution = "Disabled static export to enable dynamic rendering"
        fix_commit = "c7c9430"
        deployment_commit = (git rev-parse HEAD)
    }
    
    $evidenceJson = $evidence | ConvertTo-Json -Depth 5
    $evidenceJson | Out-File -FilePath "UI_LIVE.json" -Encoding UTF8
    Write-Host "✅ UI_LIVE.json created" -ForegroundColor Green
    
    if ($evidenceFolder) {
        Write-Host "✅ Evidence folder: $($evidenceFolder.Name)" -ForegroundColor Green
    }
    
    exit 0
} else {
    Write-Host "`n❌ FAILED: Vietnamese markers still not found" -ForegroundColor Red
    Write-Host "`nFirst 1000 chars of production HTML:" -ForegroundColor Yellow
    Write-Host $resp.Content.Substring(0, [Math]::Min(1000, $resp.Content.Length)) -ForegroundColor Gray
    
    Write-Host "`n⚠️  If this is still old UI, possible issues:" -ForegroundColor Yellow
    Write-Host "  - Vercel cached the old static build" -ForegroundColor White
    Write-Host "  - Need to manually clear Vercel data cache" -ForegroundColor White
    Write-Host "  - Production branch not set to 'main'" -ForegroundColor White
    
    exit 1
}
