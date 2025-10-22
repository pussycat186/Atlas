# Script to update all GitHub Actions workflows to use pnpm 8.15.0
# Usage: .\scripts\update-pnpm-version.ps1

$ErrorActionPreference = 'Stop'

Write-Host "🔧 Updating all workflows to use pnpm 8.15.0..." -ForegroundColor Cyan

$workflowPath = ".github/workflows"
$files = Get-ChildItem -Path $workflowPath -Filter "*.yml" -Recurse

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Update PNPM_VERSION env vars
    $content = $content -replace "PNPM_VERSION:\s*['\"]?9(\.\d+\.\d+)?['\"]?", "PNPM_VERSION: '8.15.0'"
    
    # Update pnpm/action-setup version specifications
    $content = $content -replace "version:\s*['\"]?9(\.\d+\.\d+)?['\"]?", "version: '8.15.0'"
    $content = $content -replace "version:\s*8(?![.]15\.0)", "version: '8.15.0'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ Updated: $($file.Name)" -ForegroundColor Green
        $updatedCount++
    }
}

Write-Host "`n✨ Updated $updatedCount workflow file(s)" -ForegroundColor Green
Write-Host "📝 All workflows now use pnpm 8.15.0" -ForegroundColor Cyan
