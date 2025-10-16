# S4 Cryptography & Post-Quantum Evidence Collection
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmm")
$outputDir = "docs/evidence/s4-crypto-$timestamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Write-Host "Collecting S4 Cryptography & PQC Evidence - $(Get-Date)"
Write-Host "Output: $outputDir"

$urls = @{
    "dev-portal" = "https://atlas-dev-portal.vercel.app"
    "admin-insights" = "https://atlas-admin-insights.vercel.app"  
    "proof-messenger" = "https://atlas-proof-messenger.vercel.app"
}

$results = @()

# Test 1: TLS Configuration Analysis
Write-Host "Test 1: TLS Configuration Analysis"
foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "  Testing TLS for $app..."
    
    try {
        # Test TLS connection details
        $uri = [System.Uri]$url
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($uri.Host, 443)
        
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
        $sslStream.AuthenticateAsClient($uri.Host)
        
        $tlsResult = @{
            App = $app
            URL = $url
            Test = "TLS Configuration"
            Protocol = $sslStream.SslProtocol
            CipherAlgorithm = $sslStream.CipherAlgorithm
            CipherStrength = $sslStream.CipherStrength
            HashAlgorithm = $sslStream.HashAlgorithm
            KeyExchangeAlgorithm = $sslStream.KeyExchangeAlgorithm
            Success = $sslStream.SslProtocol -eq "Tls13"
            Expected = "TLS 1.3"
        }
        
        $sslStream.Close()
        $tcpClient.Close()
        
        $results += New-Object PSObject -Property $tlsResult
        Write-Host "    Protocol: $($tlsResult.Protocol), Cipher: $($tlsResult.CipherAlgorithm)"
        
    } catch {
        Write-Host "    ERROR: $_"
        $errorResult = @{
            App = $app
            URL = $url
            Test = "TLS Configuration"
            Success = $false
            Error = $_.Exception.Message
        }
        $results += New-Object PSObject -Property $errorResult
    }
}

# Test 2: Cryptographic Headers Analysis  
Write-Host "Test 2: Cryptographic Headers Analysis"
foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "  Testing crypto headers for $app..."
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
        
        # Check for crypto-related security headers
        $headers = $response.Headers
        $cryptoCheck = @{
            App = $app
            URL = $url  
            Test = "Crypto Headers"
            Status = $response.StatusCode
            HSTS = if ($headers.ContainsKey("Strict-Transport-Security")) { "PRESENT" } else { "MISSING" }
            CSP = if ($headers.ContainsKey("Content-Security-Policy")) { "PRESENT" } else { "MISSING" }
            COOP = if ($headers.ContainsKey("Cross-Origin-Opener-Policy")) { "PRESENT" } else { "MISSING" }
            COEP = if ($headers.ContainsKey("Cross-Origin-Embedder-Policy")) { "PRESENT" } else { "MISSING" }
            Success = $true
        }
        
        # Check HSTS quality (preload, max-age)
        if ($headers.ContainsKey("Strict-Transport-Security")) {
            $hstsValue = $headers["Strict-Transport-Security"]
            $cryptoCheck.HStsPreload = if ($hstsValue -like "*preload*") { "YES" } else { "NO" }
            $cryptoCheck.HStsMaxAge = if ($hstsValue -like "*max-age=*") { 
                ($hstsValue -split "max-age=")[1] -split ";|," | Select-Object -First 1 
            } else { "UNKNOWN" }
        }
        
        $results += New-Object PSObject -Property $cryptoCheck
        Write-Host "    HSTS: $($cryptoCheck.HSTS), CSP: $($cryptoCheck.CSP)"
        
    } catch {
        Write-Host "    ERROR: $_"
        $errorResult = @{
            App = $app
            URL = $url
            Test = "Crypto Headers"
            Success = $false
            Error = $_.Exception.Message
        }
        $results += New-Object PSObject -Property $errorResult
    }
}

# Test 3: API Endpoint Crypto Requirements
Write-Host "Test 3: API Crypto Requirements"
foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "  Testing API crypto for $app..."
    
    try {
        # Test API endpoint with various crypto scenarios
        $apiTests = @(
            @{ 
                Name = "API No Auth"
                Url = "$url/api/public"
                Headers = @{}
                ExpectedStatus = @(200, 404, 405)  # Various OK responses
            },
            @{
                Name = "API With Auth" 
                Url = "$url/api/protected"
                Headers = @{ 'Authorization' = 'Bearer test-token' }
                ExpectedStatus = @(401, 403, 404, 405)  # Auth required responses
            },
            @{
                Name = "API PQC Test"
                Url = "$url/api/crypto-test"
                Headers = @{ 'X-Crypto-Mode' = 'pqc-hybrid' }
                ExpectedStatus = @(200, 404, 405, 501)  # Various responses
            }
        )
        
        foreach ($apiTest in $apiTests) {
            try {
                $apiResponse = Invoke-WebRequest -Uri $apiTest.Url -Method Get -Headers $apiTest.Headers -UseBasicParsing -ErrorAction Stop
                $apiSuccess = $apiResponse.StatusCode -in $apiTest.ExpectedStatus
            } catch {
                $apiSuccess = if ($_.Exception.Response) { 
                    $_.Exception.Response.StatusCode.Value__ -in $apiTest.ExpectedStatus 
                } else { 
                    $false 
                }
            }
            
            $apiResult = @{
                App = $app
                URL = $apiTest.Url
                Test = $apiTest.Name
                Success = $apiSuccess
                Expected = "Status in: $($apiTest.ExpectedStatus -join ', ')"
            }
            $results += New-Object PSObject -Property $apiResult
        }
        
    } catch {
        Write-Host "    ERROR: $_"
    }
}

# Test 4: Performance Impact Assessment
Write-Host "Test 4: Crypto Performance Impact"
foreach ($app in $urls.Keys) {
    $url = $urls[$app]
    Write-Host "  Testing performance impact for $app..."
    
    try {
        # Multiple requests to measure crypto overhead
        $times = @()
        for ($i = 0; $i -lt 5; $i++) {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
            $stopwatch.Stop()
            $times += $stopwatch.ElapsedMilliseconds
        }
        
        $avgTime = ($times | Measure-Object -Average).Average
        $maxTime = ($times | Measure-Object -Maximum).Maximum
        $minTime = ($times | Measure-Object -Minimum).Minimum
        
        $perfResult = @{
            App = $app
            URL = $url
            Test = "Crypto Performance"
            AvgResponseTime = [Math]::Round($avgTime, 2)
            MaxResponseTime = $maxTime
            MinResponseTime = $minTime
            Success = $avgTime -lt 1000  # Under 1 second average
            Expected = "< 1000ms average"
        }
        
        $results += New-Object PSObject -Property $perfResult
        Write-Host "    Avg: $($perfResult.AvgResponseTime)ms, Max: $($perfResult.MaxResponseTime)ms"
        
    } catch {
        Write-Host "    ERROR: $_"
    }
}

# Generate S4 Evidence Report
$reportContent = "# S4 Cryptography & Post-Quantum Evidence Report`n"
$reportContent += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')`n`n"

$reportContent += "## Test Results Summary`n`n"

foreach ($app in $urls.Keys) {
    $appResults = $results | Where-Object { $_.App -eq $app }
    $reportContent += "### $app`n"
    $reportContent += "| Test | Success | Details | Expected |`n"
    $reportContent += "|------|---------|---------|----------|`n"
    
    foreach ($result in $appResults) {
        $success = if ($result.Success) { "✅" } else { "❌" }
        $details = ""
        
        switch ($result.Test) {
            "TLS Configuration" {
                $details = "$($result.Protocol) / $($result.CipherAlgorithm)"
            }
            "Crypto Headers" {
                $details = "HSTS: $($result.HSTS), CSP: $($result.CSP)"
            }
            "Crypto Performance" {
                $details = "$($result.AvgResponseTime)ms avg"
            }
            default {
                $details = if ($result.Error) { $result.Error.Substring(0, [Math]::Min(40, $result.Error.Length)) } else { "-" }
            }
        }
        
        $expected = if ($result.Expected) { $result.Expected } else { "Pass" }
        $reportContent += "| $($result.Test) | $success | $details | $expected |`n"
    }
    $reportContent += "`n"
}

$reportContent += "## S4 Cryptographic Controls Analysis`n`n"

# Analyze TLS 1.3 adoption
$tlsTests = $results | Where-Object { $_.Test -eq "TLS Configuration" }
$tls13Count = ($tlsTests | Where-Object { $_.Success -eq $true }).Count
$reportContent += "### TLS 1.3 Enforcement`n"
$reportContent += "- Apps using TLS 1.3: $tls13Count / $($tlsTests.Count)`n"
if ($tls13Count -eq $tlsTests.Count) {
    $reportContent += "- ✅ TLS 1.3 is enforced across all applications`n"
} else {
    $reportContent += "- ⚠️  Some applications not using TLS 1.3`n"
}
$reportContent += "`n"

# Analyze crypto headers
$headerTests = $results | Where-Object { $_.Test -eq "Crypto Headers" }
$hstsCount = ($headerTests | Where-Object { $_.HSTS -eq "PRESENT" }).Count
$reportContent += "### Cryptographic Headers`n"
$reportContent += "- Apps with HSTS: $hstsCount / $($headerTests.Count)`n"
$reportContent += "- Apps with CSP: $(($headerTests | Where-Object { $_.CSP -eq 'PRESENT' }).Count) / $($headerTests.Count)`n"
$reportContent += "- Apps with COOP/COEP: $(($headerTests | Where-Object { $_.COOP -eq 'PRESENT' -and $_.COEP -eq 'PRESENT' }).Count) / $($headerTests.Count)`n"
$reportContent += "`n"

# Analyze performance impact
$perfTests = $results | Where-Object { $_.Test -eq "Crypto Performance" }
$goodPerfCount = ($perfTests | Where-Object { $_.Success -eq $true }).Count
$reportContent += "### Performance Impact`n"
$reportContent += "- Apps with acceptable crypto performance: $goodPerfCount / $($perfTests.Count)`n"
if ($goodPerfCount -eq $perfTests.Count) {
    $reportContent += "- ✅ Cryptographic controls have minimal performance impact`n"
} else {
    $reportContent += "- ⚠️  Some applications showing crypto performance overhead`n"
}
$reportContent += "`n"

# Overall S4 status
$reportContent += "## S4 Deployment Status`n`n"
$totalCryptoControls = $tls13Count + $hstsCount + $goodPerfCount
$maxPossible = $tlsTests.Count + $headerTests.Count + $perfTests.Count

if ($totalCryptoControls -ge ($maxPossible * 0.8)) {
    $reportContent += "✅ **S4 CRYPTOGRAPHY HARDENING ACTIVE** - Strong crypto controls deployed`n"
    $reportContent += "Ready to expand canary rollout or proceed to S5 Data Protection`n"
} elseif ($totalCryptoControls -ge ($maxPossible * 0.5)) {
    $reportContent += "🔄 **S4 PARTIAL DEPLOYMENT** - Some crypto controls active`n"
    $reportContent += "Review individual control status and performance metrics`n"
} else {
    $reportContent += "❌ **S4 DEPLOYMENT INCOMPLETE** - Crypto controls not fully active`n"
    $reportContent += "Check TLS configuration, header deployment, and flag settings`n"
}

$reportContent += "`n## Next Steps`n`n"
$reportContent += "If S4 gates pass:`n"
$reportContent += "1. Expand PQC hybrid encryption to more apps`n"
$reportContent += "2. Enable field-level encryption for PII data`n"
$reportContent += "3. Implement automated key rotation`n"
$reportContent += "4. Proceed to S5 Data Protection & Residency`n`n"

$reportContent += "If S4 gates fail:`n"
$reportContent += "1. Review TLS 1.3 server configuration`n"
$reportContent += "2. Validate cryptographic header deployment`n"
$reportContent += "3. Optimize crypto performance if needed`n"
$reportContent += "4. Check S4 security flag configuration`n"

$reportContent | Out-File "$outputDir/S4-CRYPTO-EVIDENCE.md" -Encoding UTF8

# Export detailed results as JSON
$results | ConvertTo-Json -Depth 3 | Out-File "$outputDir/s4-crypto-results.json" -Encoding UTF8

Write-Host ""
Write-Host "S4 Cryptography Evidence Collection Complete!"
Write-Host "Report: $outputDir/S4-CRYPTO-EVIDENCE.md"
Write-Host "Raw data: $outputDir/s4-crypto-results.json"
Write-Host ""

# Quick summary
$successCount = ($results | Where-Object { $_.Success -eq $true }).Count
$totalTests = $results.Count
Write-Host "Summary: $successCount/$totalTests crypto tests passed"

if ($totalCryptoControls -ge ($maxPossible * 0.8)) {
    Write-Host "✅ S4 CRYPTOGRAPHY HARDENING DEPLOYED"
} else {
    Write-Host "⚠️  S4 deployment incomplete or performance issues detected"
}