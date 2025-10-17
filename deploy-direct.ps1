# Direct Vercel Deployment Script
# Bypasses GitHub Actions workflow for immediate deployment

Write-Host "===== DIRECT VERCEL DEPLOYMENT =====" -ForegroundColor Cyan

# Check if vercel token exists
if (-not $env:VERCEL_TOKEN) {
    Write-Host "ERROR: VERCEL_TOKEN not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:VERCEL_TOKEN='your-token'" -ForegroundColor Yellow
    exit 1
}

Set-Location "apps/proof-messenger"

Write-Host "`n1. Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".vercel" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n2. Pulling Vercel environment..." -ForegroundColor Yellow
vercel pull --yes --environment=production --token=$env:VERCEL_TOKEN

Write-Host "`n3. Building for production (with unique build ID)..." -ForegroundColor Yellow
$env:NEXT_PRIVATE_BUILD_TAG = "direct-$(Get-Date -Format 'yyyyMMddHHmmss')"
Write-Host "Build tag: $env:NEXT_PRIVATE_BUILD_TAG"
vercel build --prod --token=$env:VERCEL_TOKEN

Write-Host "`n4. Deploying to production..." -ForegroundColor Yellow
$deployUrl = vercel deploy --prebuilt --prod --token=$env:VERCEL_TOKEN
Write-Host "Deployed to: $deployUrl" -ForegroundColor Green

Write-Host "`n5. Waiting 30 seconds for propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n6. Verifying deployment..." -ForegroundColor Yellow
$resp = Invoke-WebRequest -Uri $deployUrl -UseBasicParsing -Headers @{
    'Cache-Control' = 'no-cache, no-store, must-revalidate'
    'Pragma' = 'no-cache'
}

Write-Host "Content-Length: $($resp.Content.Length) bytes"

$markers = @{
    "Nhắn tin" = $resp.Content -match 'Nhắn tin'
    "Passkey" = $resp.Content -match 'Passkey'
    "Xác minh" = $resp.Content -match 'Xác minh'
}

$passed = 0
foreach ($marker in $markers.GetEnumerator()) {
    if ($marker.Value) {
        Write-Host "  ✅ $($marker.Key)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ $($marker.Key)" -ForegroundColor Red
    }
}

if ($passed -eq 3) {
    Write-Host "`n🎉 SUCCESS: Vietnamese UI deployed!" -ForegroundColor Green
    Write-Host "URL: $deployUrl" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ FAILED: Vietnamese markers not found" -ForegroundColor Red
    Write-Host "First 500 chars:" -ForegroundColor Yellow
    Write-Host $resp.Content.Substring(0, [Math]::Min(500, $resp.Content.Length))
}

Set-Location "../.."
