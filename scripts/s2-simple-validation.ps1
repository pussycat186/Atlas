# Simple S2 Header Validation
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")
$outputDir = "docs/evidence/s2-validation-$timestamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Write-Host "Testing S2 Security Headers - $(Get-Date)"
Write-Host "Output: $outputDir"

$urls = @{
    "dev-portal" = "https://atlas-dev-portal.vercel.app"
    "admin-insights" = "https://atlas-admin-insights.vercel.app"  
    "proof-messenger" = "https://atlas-proof-messenger.vercel.app"
}

$results = @()

foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "Testing $app at $url..."
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
        
        # Check for key security headers
        $headers = $response.Headers
        $securityCheck = @{
            App = $app
            URL = $url
            Status = $response.StatusCode
            CSP = if ($headers.ContainsKey("Content-Security-Policy")) { "PRESENT" } else { "MISSING" }
            HSTS = if ($headers.ContainsKey("Strict-Transport-Security")) { "PRESENT" } else { "MISSING" }
            XFrameOptions = if ($headers.ContainsKey("X-Frame-Options")) { "PRESENT" } else { "MISSING" }
            XContentTypeOptions = if ($headers.ContainsKey("X-Content-Type-Options")) { "PRESENT" } else { "MISSING" }
            ReferrerPolicy = if ($headers.ContainsKey("Referrer-Policy")) { "PRESENT" } else { "MISSING" }
        }
        
        # Check for CSP nonce
        if ($headers.ContainsKey("Content-Security-Policy")) {
            $cspValue = $headers["Content-Security-Policy"]
            $securityCheck.CSPNonce = if ($cspValue -like "*nonce-*") { "PRESENT" } else { "MISSING" }
            $securityCheck.CSPValue = $cspValue.Substring(0, [Math]::Min(100, $cspValue.Length)) + "..."
        } else {
            $securityCheck.CSPNonce = "N/A"
            $securityCheck.CSPValue = "N/A"
        }
        
        $results += New-Object PSObject -Property $securityCheck
        Write-Host "  Status: $($response.StatusCode)"
        Write-Host "  CSP: $($securityCheck.CSP)"
        Write-Host "  CSP Nonce: $($securityCheck.CSPNonce)"
        Write-Host "  HSTS: $($securityCheck.HSTS)"
        Write-Host ""
        
    } catch {
        Write-Host "  ERROR: $_"
        $results += New-Object PSObject -Property @{
            App = $app
            URL = $url
            Status = "ERROR"
            Error = $_.Exception.Message
        }
    }
}

# Generate report
$reportContent = "# S2 Headers Validation Report`n"
$reportContent += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')`n`n"

$reportContent += "## Summary`n"
foreach ($result in $results) {
    $reportContent += "### $($result.App)`n"
    $reportContent += "- URL: $($result.URL)`n"
    $reportContent += "- Status: $($result.Status)`n"
    if ($result.Status -ne "ERROR") {
        $reportContent += "- CSP: $($result.CSP)`n"
        $reportContent += "- CSP Nonce: $($result.CSPNonce)`n"
        $reportContent += "- HSTS: $($result.HSTS)`n"
        $reportContent += "- X-Frame-Options: $($result.XFrameOptions)`n"
        $reportContent += "- X-Content-Type-Options: $($result.XContentTypeOptions)`n"
        $reportContent += "- Referrer-Policy: $($result.ReferrerPolicy)`n"
        if ($result.CSPValue -ne "N/A") {
            $reportContent += "- CSP Value: $($result.CSPValue)`n"
        }
    } else {
        $reportContent += "- Error: $($result.Error)`n"
    }
    $reportContent += "`n"
}

$reportContent += "## S2 Gate Status`n"
$allGatesPass = $true
foreach ($result in $results) {
    if ($result.Status -eq "ERROR" -or $result.CSP -eq "MISSING" -or $result.HSTS -eq "MISSING") {
        $allGatesPass = $false
        break
    }
}

if ($allGatesPass) {
    $reportContent += "✅ **S2 GATES PASS** - All applications have required security headers`n"
    $reportContent += "Ready to proceed with S3 Auth Hardening`n"
} else {
    $reportContent += "❌ **S2 GATES FAIL** - Some security headers missing`n"
    $reportContent += "Review individual app results above`n"
}

$reportContent | Out-File "$outputDir/S2-VALIDATION-REPORT.md" -Encoding UTF8

Write-Host "Report saved to: $outputDir/S2-VALIDATION-REPORT.md"
Write-Host ""
if ($allGatesPass) {
    Write-Host "✅ S2 VALIDATION PASSED - Ready for S3"
} else {
    Write-Host "❌ S2 VALIDATION FAILED - Review report"
}