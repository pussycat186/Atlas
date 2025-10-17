# ATLAS Orchestrator Auto-Monitor
# Polls for PERFECT_LIVE.json every 2 minutes

$startTime = Get-Date
$maxWaitMinutes = 90
$checkIntervalSeconds = 120

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "ATLAS Orchestrator Auto-Monitor" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Green
Write-Host "Max wait: $maxWaitMinutes minutes" -ForegroundColor Yellow
Write-Host "Check interval: $($checkIntervalSeconds/60) minutes" -ForegroundColor Yellow
Write-Host ""

while ((Get-Date) -lt $startTime.AddMinutes($maxWaitMinutes)) {
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
    
    Write-Host "[$elapsed min] Checking for PERFECT_LIVE.json..." -ForegroundColor Cyan
    
    # Fetch latest from remote
    git fetch origin main 2>&1 | Out-Null
    
    # Check for PERFECT_LIVE commit
    $perfectLiveCommit = git log origin/main --oneline --grep="PERFECT_LIVE" -1 2>&1
    
    if ($perfectLiveCommit -and $perfectLiveCommit -notlike "*fatal*") {
        Write-Host "✅ FOUND! PERFECT_LIVE commit detected!" -ForegroundColor Green
        Write-Host $perfectLiveCommit -ForegroundColor White
        
        # Pull the commit
        git pull origin main
        
        # Find PERFECT_LIVE.json
        $perfectLiveFiles = Get-ChildItem -Path "docs/evidence" -Recurse -Filter "PERFECT_LIVE.json" -ErrorAction SilentlyContinue
        
        if ($perfectLiveFiles) {
            Write-Host ""
            Write-Host "====================================" -ForegroundColor Green
            Write-Host "🎯 PERFECT_LIVE ACHIEVED!" -ForegroundColor Green
            Write-Host "====================================" -ForegroundColor Green
            foreach ($file in $perfectLiveFiles) {
                Write-Host "Location: $($file.FullName)" -ForegroundColor White
                Write-Host ""
                Write-Host "Content:" -ForegroundColor Yellow
                Get-Content $file.FullName | ConvertFrom-Json | ConvertTo-Json -Depth 10
            }
            exit 0
        }
    }
    
    # Check for new evidence folders
    $todayFolders = Get-ChildItem -Path "docs/evidence" -Directory | 
                    Where-Object { $_.Name -match "^202510(17|18)" } |
                    Sort-Object Name -Descending
    
    if ($todayFolders) {
        Write-Host "  📁 New evidence folders found:" -ForegroundColor Yellow
        $todayFolders | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor White }
    } else {
        Write-Host "  ⏳ No new evidence folders yet..." -ForegroundColor Gray
    }
    
    # Show latest commit
    $latestCommit = git log origin/main --oneline -1
    Write-Host "  Latest commit: $latestCommit" -ForegroundColor Gray
    
    Write-Host ""
    Start-Sleep -Seconds $checkIntervalSeconds
}

Write-Host "❌ Timeout reached after $maxWaitMinutes minutes" -ForegroundColor Red
Write-Host "Check workflow manually at: https://github.com/pussycat186/Atlas/actions/workflows/atlas-orchestrator.yml" -ForegroundColor Yellow
exit 1
