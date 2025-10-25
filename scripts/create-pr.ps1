#!/usr/bin/env pwsh
# Create GitHub PR using REST API

$ErrorActionPreference = "Stop"

$owner = "pussycat186"
$repo = "Atlas"
$base = "reboot/atlas-security-core"
$head = "chore/cloudflare-cutover"
$title = "Complete Cloudflare Migration - Backend Readiness Validated"

# Read PR body
$body = Get-Content -Path "PR_CLOUDFLARE_CUTOVER.md" -Raw

# Check if GH_ADMIN_TOKEN is available
if (-not $env:GH_ADMIN_TOKEN) {
    Write-Host "❌ GH_ADMIN_TOKEN not set in environment"
    Write-Host ""
    Write-Host "To create PR manually, visit:"
    Write-Host "https://github.com/$owner/$repo/compare/${base}...${head}?expand=1"
    Write-Host ""
    Write-Host "Or use GitHub CLI:"
    Write-Host "gh pr create --base $base --head $head --title `"$title`" --body-file PR_CLOUDFLARE_CUTOVER.md"
    exit 1
}

$token = $env:GH_ADMIN_TOKEN

# Create PR payload
$payload = @{
    title = $title
    head = $head
    base = $base
    body = $body
} | ConvertTo-Json -Depth 10

# Create PR via GitHub API
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$url = "https://api.github.com/repos/$owner/$repo/pulls"

try {
    Write-Host "Creating PR: $title"
    Write-Host "Base: $base ← Head: $head"
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $payload -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ PR created successfully!"
    Write-Host "URL: $($response.html_url)"
    Write-Host "Number: #$($response.number)"
    
    # Save PR URL for evidence
    Set-Content -Path "evidence/PR_LINK.txt" -Value $response.html_url
    
} catch {
    Write-Host "❌ Failed to create PR: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Response: $($_.ErrorDetails.Message)"
    Write-Host ""
    Write-Host "Create PR manually at:"
    Write-Host "https://github.com/$owner/$repo/compare/${base}...${head}?expand=1"
    exit 1
}
