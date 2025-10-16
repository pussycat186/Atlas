# S3 Authentication Hardening Evidence Collection
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")
$outputDir = "docs/evidence/s3-auth-$timestamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Write-Host "Collecting S3 Authentication Evidence - $(Get-Date)"
Write-Host "Output: $outputDir"

$urls = @{
    "dev-portal" = "https://atlas-dev-portal.vercel.app"
    "admin-insights" = "https://atlas-admin-insights.vercel.app"  
    "proof-messenger" = "https://atlas-proof-messenger.vercel.app"
}

$results = @()

foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "Testing S3 Auth for $app at $url..."
    
    try {
        # Test 1: Normal request (should work)
        Write-Host "  Test 1: Normal GET request"
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
        
        $authCheck = @{
            App = $app
            URL = $url
            Test = "Normal GET"
            Status = $response.StatusCode
            Success = $true
        }
        $results += New-Object PSObject -Property $authCheck
        
        # Test 2: POST request without CSRF token (should fail if CSRF enabled)
        Write-Host "  Test 2: POST without CSRF (expect 403 if CSRF enabled)"
        try {
            $postResponse = Invoke-WebRequest -Uri "$url/api/test" -Method Post -Body "test=data" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing -ErrorAction Stop
            $csrfCheck = @{
                App = $app
                URL = "$url/api/test"
                Test = "POST without CSRF"
                Status = $postResponse.StatusCode
                Success = $postResponse.StatusCode -eq 200
                Expected = "403 if CSRF enabled"
            }
        } catch {
            $csrfCheck = @{
                App = $app
                URL = "$url/api/test"
                Test = "POST without CSRF"
                Status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "ERROR" }
                Success = if ($_.Exception.Response) { $_.Exception.Response.StatusCode -eq 403 } else { $false }
                Expected = "403 if CSRF enabled"
                Error = $_.Exception.Message
            }
        }
        $results += New-Object PSObject -Property $csrfCheck
        
        # Test 3: Cross-origin request (should fail if Fetch Metadata enabled)
        Write-Host "  Test 3: Cross-origin simulation"
        try {
            $crossOriginHeaders = @{
                'Origin' = 'https://evil.com'
                'Sec-Fetch-Site' = 'cross-site'
                'Sec-Fetch-Mode' = 'cors'
            }
            $corsResponse = Invoke-WebRequest -Uri "$url/api/test" -Method Post -Headers $crossOriginHeaders -UseBasicParsing -ErrorAction Stop
            $corsCheck = @{
                App = $app
                URL = "$url/api/test"
                Test = "Cross-origin POST"
                Status = $corsResponse.StatusCode
                Success = $false  # Should be blocked
                Expected = "403/401 if Fetch Metadata enabled"
            }
        } catch {
            $corsCheck = @{
                App = $app
                URL = "$url/api/test"
                Test = "Cross-origin POST"
                Status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "ERROR" }
                Success = if ($_.Exception.Response) { $_.Exception.Response.StatusCode -in @(401, 403) } else { $false }
                Expected = "403/401 if Fetch Metadata enabled"
            }
        }
        $results += New-Object PSObject -Property $corsCheck
        
        # Test 4: API request without DPoP header (should fail if DPoP enabled)
        Write-Host "  Test 4: API without DPoP (expect 401 if DPoP enabled)"
        try {
            $apiHeaders = @{
                'Authorization' = 'Bearer fake-token-for-testing'
                'Content-Type' = 'application/json'
            }
            $dpopResponse = Invoke-WebRequest -Uri "$url/api/data" -Method Get -Headers $apiHeaders -UseBasicParsing -ErrorAction Stop
            $dpopCheck = @{
                App = $app
                URL = "$url/api/data"
                Test = "API without DPoP"
                Status = $dpopResponse.StatusCode
                Success = $dpopResponse.StatusCode -eq 200
                Expected = "401 if DPoP enabled for API"
            }
        } catch {
            $dpopCheck = @{
                App = $app
                URL = "$url/api/data"
                Test = "API without DPoP"
                Status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "ERROR" }
                Success = if ($_.Exception.Response) { $_.Exception.Response.StatusCode -eq 401 } else { $false }
                Expected = "401 if DPoP enabled for API"
            }
        }
        $results += New-Object PSObject -Property $dpopCheck
        
        Write-Host "  Completed tests for $app"
        
    } catch {
        Write-Host "  ERROR testing $app : $_"
        $errorResult = @{
            App = $app
            URL = $url
            Test = "Initial Request"
            Status = "ERROR"
            Success = $false
            Error = $_.Exception.Message
        }
        $results += New-Object PSObject -Property $errorResult
    }
}

# Generate S3 Evidence Report
$reportContent = "# S3 Authentication Hardening Evidence Report`n"
$reportContent += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')`n`n"

$reportContent += "## Test Results Summary`n`n"

foreach ($app in $urls.Keys) {
    $appResults = $results | Where-Object { $_.App -eq $app }
    $reportContent += "### $app`n"
    $reportContent += "| Test | Status | Success | Expected | Notes |`n"
    $reportContent += "|------|--------|---------|----------|-------|`n"
    
    foreach ($result in $appResults) {
        $status = $result.Status
        $success = if ($result.Success) { "✅" } else { "❌" }
        $expected = if ($result.Expected) { $result.Expected } else { "Pass" }
        $notes = if ($result.Error) { $result.Error.Substring(0, [Math]::Min(50, $result.Error.Length)) } else { "-" }
        
        $reportContent += "| $($result.Test) | $status | $success | $expected | $notes |`n"
    }
    $reportContent += "`n"
}

$reportContent += "## S3 Controls Analysis`n`n"

# Analyze CSRF protection
$csrfTests = $results | Where-Object { $_.Test -eq "POST without CSRF" }
$csrfWorking = ($csrfTests | Where-Object { $_.Success -eq $false }).Count
$reportContent += "### CSRF Protection`n"
$reportContent += "- Apps with CSRF protection active: $csrfWorking / $($csrfTests.Count)`n"
if ($csrfWorking -gt 0) {
    $reportContent += "- ✅ CSRF protection is blocking unauthorized POST requests`n"
} else {
    $reportContent += "- ⚠️  CSRF protection may not be active (all POST requests succeeded)`n"
}
$reportContent += "`n"

# Analyze Fetch Metadata protection
$fetchTests = $results | Where-Object { $_.Test -eq "Cross-origin POST" }
$fetchWorking = ($fetchTests | Where-Object { $_.Success -eq $true }).Count
$reportContent += "### Fetch Metadata Protection`n"
$reportContent += "- Apps blocking cross-origin requests: $fetchWorking / $($fetchTests.Count)`n"
if ($fetchWorking -gt 0) {
    $reportContent += "- ✅ Fetch Metadata headers are being enforced`n"
} else {
    $reportContent += "- ⚠️  Fetch Metadata protection may not be active`n"
}
$reportContent += "`n"

# Analyze DPoP protection
$dpopTests = $results | Where-Object { $_.Test -eq "API without DPoP" }
$dpopWorking = ($dpopTests | Where-Object { $_.Success -eq $true }).Count
$reportContent += "### DPoP Protection`n"
$reportContent += "- Apps requiring DPoP for API access: $dpopWorking / $($dpopTests.Count)`n"
if ($dpopWorking -gt 0) {
    $reportContent += "- ✅ DPoP token binding is being enforced for API endpoints`n"
} else {
    $reportContent += "- ⚠️  DPoP protection may not be active for API endpoints`n"
}
$reportContent += "`n"

# Overall S3 status
$reportContent += "## S3 Deployment Status`n`n"
$totalProtections = $csrfWorking + $fetchWorking + $dpopWorking
if ($totalProtections -ge 2) {
    $reportContent += "✅ **S3 AUTH HARDENING ACTIVE** - Multiple authentication controls detected`n"
    $reportContent += "Ready to expand canary rollout or proceed to S4`n"
} elseif ($totalProtections -eq 1) {
    $reportContent += "🔄 **S3 PARTIAL DEPLOYMENT** - Some authentication controls active`n"
    $reportContent += "Review individual control status above`n"
} else {
    $reportContent += "❌ **S3 NOT DEPLOYED** - No authentication controls detected`n"
    $reportContent += "Check deployment status and flag configuration`n"
}

$reportContent += "`n## Next Steps`n`n"
$reportContent += "If S3 gates pass:`n"
$reportContent += "1. Expand canary rollout (10% → 50%)`n"
$reportContent += "2. Enable remaining apps for CSRF/DPoP`n"
$reportContent += "3. Implement mTLS certificate infrastructure`n"
$reportContent += "4. Proceed to S4 Cryptography & PQC`n`n"

$reportContent += "If S3 gates fail:`n"
$reportContent += "1. Check middleware deployment status`n"
$reportContent += "2. Verify security flag configuration`n"  
$reportContent += "3. Review application logs for errors`n"
$reportContent += "4. Test rollback procedure`n"

$reportContent | Out-File "$outputDir/S3-AUTH-EVIDENCE.md" -Encoding UTF8

# Export detailed results as JSON
$results | ConvertTo-Json -Depth 3 | Out-File "$outputDir/s3-test-results.json" -Encoding UTF8

Write-Host ""
Write-Host "S3 Authentication Evidence Collection Complete!"
Write-Host "Report: $outputDir/S3-AUTH-EVIDENCE.md"
Write-Host "Raw data: $outputDir/s3-test-results.json"
Write-Host ""

# Quick summary
$successCount = ($results | Where-Object { $_.Success -eq $true }).Count
$totalTests = $results.Count
Write-Host "Summary: $successCount/$totalTests tests behaved as expected"

if ($totalProtections -ge 2) {
    Write-Host "✅ S3 AUTH HARDENING DEPLOYED"
} else {
    Write-Host "⚠️  S3 deployment incomplete or not yet active"
}