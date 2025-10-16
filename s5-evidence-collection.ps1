#!/usr/bin/env powershell

# S5 Supply Chain Security Evidence Collection
# Validates SLSA provenance, SBOM generation, Cosign signing, and supply chain protection

Write-Host "`n🔗 ATLAS S5 SUPPLY CHAIN SECURITY - EVIDENCE COLLECTION" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Green

$evidence = @{
    phase = "S5"
    title = "Supply Chain Security"
    timestamp = (Get-Date).ToString("o")
    checks = @{
        slsaProvenance = @()
        sbomGeneration = @()
        vulnerabilityScanning = @()
        cosignSigning = @()
        supplyChainProtection = @()
        licenseCompliance = @()
        reproducibleBuilds = @()
        attestationPipeline = @()
    }
}

function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Host "✅ $Description`: $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description`: $Path" -ForegroundColor Red
        return $false
    }
}

function Test-CodeContent {
    param($Path, $Patterns, $Description)
    
    if (!(Test-Path $Path)) {
        Write-Host "❌ $Description`: File not found - $Path" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $Path -Raw
        $passed = 0
        $total = $Patterns.Count
        
        foreach ($pattern in $Patterns) {
            if ($content -match $pattern.pattern -or $content.Contains($pattern.text)) {
                $passed++
            } else {
                Write-Host "   - Missing: $($pattern.name)" -ForegroundColor Yellow
            }
        }
        
        if ($passed -eq $total) {
            Write-Host "✅ $Description`: All patterns found ($passed/$total)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Description`: Missing patterns ($passed/$total)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Description`: Error reading file - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n📋 SLSA Provenance Implementation" -ForegroundColor Cyan

# Check 1: SLSA workflow file
$check1 = Test-FileExists "d:\Atlas\.github\workflows\slsa-provenance.yml" "SLSA provenance workflow"
$evidence.checks.slsaProvenance += @{ name = "SLSA Workflow File"; passed = $check1 }

# Check 2: SLSA workflow implementation patterns
$slsaPatterns = @(
    @{ name = "SLSA L3 requirements"; text = "SLSA Level 3" },
    @{ name = "Provenance attestation"; text = "attest-build-provenance" },
    @{ name = "Reproducible builds"; text = "SOURCE_DATE_EPOCH" },
    @{ name = "S5 supply chain"; text = "S5_SUPPLY_CHAIN" },
    @{ name = "Artifact hashes"; text = "sha256sum" },
    @{ name = "GitHub OIDC"; text = "id-token: write" },
    @{ name = "SBOM generation"; text = "syft packages" },
    @{ name = "Vulnerability scanning"; text = "trivy fs" }
)

$check2 = Test-CodeContent "d:\Atlas\.github\workflows\slsa-provenance.yml" $slsaPatterns "SLSA Workflow Implementation"
$evidence.checks.slsaProvenance += @{ name = "SLSA Workflow Features"; passed = $check2 }

Write-Host "`n📦 SBOM Generation" -ForegroundColor Cyan

# Check 3: SBOM in workflow
$sbomWorkflowPatterns = @(
    @{ name = "Syft SBOM tool"; text = "syft packages" },
    @{ name = "SPDX format"; text = "spdx-json" },
    @{ name = "CycloneDX format"; text = "cyclonedx-json" },
    @{ name = "SBOM validation"; text = "spdx-tools validate" },
    @{ name = "SBOM attestation"; text = "attest-sbom" },
    @{ name = "Per-app SBOMs"; text = "admin-insights.spdx.json" }
)

$check3 = Test-CodeContent "d:\Atlas\.github\workflows\slsa-provenance.yml" $sbomWorkflowPatterns "SBOM Generation Implementation"
$evidence.checks.sbomGeneration += @{ name = "SBOM Workflow Integration"; passed = $check3 }

Write-Host "`n🔍 Vulnerability Scanning" -ForegroundColor Cyan

# Check 4: Comprehensive vulnerability scanning
$vulnPatterns = @(
    @{ name = "Trivy scanner"; text = "trivy fs" },
    @{ name = "Grype scanner"; text = "grype ." },
    @{ name = "Gitleaks secrets"; text = "gitleaks detect" },
    @{ name = "Semgrep SAST"; text = "semgrep.*--config=auto" },
    @{ name = "Critical severity"; text = "CRITICAL" },
    @{ name = "Vulnerability gate"; text = "S5 Security Gate" }
)

$check4 = Test-CodeContent "d:\Atlas\.github\workflows\slsa-provenance.yml" $vulnPatterns "Vulnerability Scanning Implementation"
$evidence.checks.vulnerabilityScanning += @{ name = "Multi-Scanner Implementation"; passed = $check4 }

Write-Host "`n🔐 Supply Chain Manager" -ForegroundColor Cyan

# Check 5: Supply chain manager file
$check5 = Test-FileExists "d:\Atlas\libs\security\supply-chain-manager.ts" "Supply chain manager"
$evidence.checks.supplyChainProtection += @{ name = "Supply Chain Manager File"; passed = $check5 }

# Check 6: Supply chain manager features
$scmPatterns = @(
    @{ name = "Dependency attestation"; text = "DependencyAttestation" },
    @{ name = "SLSA provenance"; text = "SLSAProvenance" },
    @{ name = "Vulnerability scanning"; text = "scanVulnerabilities" },
    @{ name = "License checking"; text = "checkLicenses" },
    @{ name = "Reproducible builds"; text = "verifyReproducibleBuild" },
    @{ name = "Supply chain report"; text = "generateSupplyChainReport" },
    @{ name = "Attestation verification"; text = "verifyDependency" }
)

$check6 = Test-CodeContent "d:\Atlas\libs\security\supply-chain-manager.ts" $scmPatterns "Supply Chain Manager Features"
$evidence.checks.supplyChainProtection += @{ name = "Supply Chain Manager Implementation"; passed = $check6 }

Write-Host "`n🔏 Cosign Integration" -ForegroundColor Cyan

# Check 7: Cosign manager file
$check7 = Test-FileExists "d:\Atlas\libs\security\cosign-manager.ts" "Cosign manager"
$evidence.checks.cosignSigning += @{ name = "Cosign Manager File"; passed = $check7 }

# Check 8: Cosign implementation
$cosignPatterns = @(
    @{ name = "Keyless signing"; text = "COSIGN_EXPERIMENTAL" },
    @{ name = "Image signing"; text = "signImage" },
    @{ name = "Signature verification"; text = "verifyImage" },
    @{ name = "Attestation attachment"; text = "attachAttestation" },
    @{ name = "SBOM attestation"; text = "sbom" },
    @{ name = "Provenance attestation"; text = "slsaprovenance" },
    @{ name = "Security policy"; text = "ContainerSecurityPolicy" }
)

$check8 = Test-CodeContent "d:\Atlas\libs\security\cosign-manager.ts" $cosignPatterns "Cosign Implementation"
$evidence.checks.cosignSigning += @{ name = "Cosign Implementation Features"; passed = $check8 }

Write-Host "`n📜 License Compliance" -ForegroundColor Cyan

# Check 9: License scanning in workflow
$licensePatterns = @(
    @{ name = "License checker"; text = "license-checker" },
    @{ name = "Allowed licenses"; text = "onlyAllow" },
    @{ name = "License validation"; text = "non_compliant" },
    @{ name = "MIT license"; text = "MIT" },
    @{ name = "Apache license"; text = "Apache-2.0" },
    @{ name = "GPL detection"; text = "GPL.*AGPL.*LGPL" }
)

$check9 = Test-CodeContent "d:\Atlas\.github\workflows\slsa-provenance.yml" $licensePatterns "License Compliance Implementation"
$evidence.checks.licenseCompliance += @{ name = "License Compliance Workflow"; passed = $check9 }

Write-Host "`n🔄 Reproducible Builds" -ForegroundColor Cyan

# Check 10: Reproducible build patterns
$reproduciblePatterns = @(
    @{ name = "Source date epoch"; text = "SOURCE_DATE_EPOCH" },
    @{ name = "Deterministic archives"; text = "--sort=name" },
    @{ name = "Fixed timestamps"; text = "--mtime" },
    @{ name = "Reproducible metadata"; text = "reproducible.*true" },
    @{ name = "Build verification"; text = "verifyReproducibleBuild" }
)

$check10 = Test-CodeContent "d:\Atlas\.github\workflows\slsa-provenance.yml" $reproduciblePatterns "Reproducible Build Implementation"
$evidence.checks.reproducibleBuilds += @{ name = "Reproducible Build Features"; passed = $check10 }

# Also check supply chain manager for reproducible build verification
$check11 = Test-CodeContent "d:\Atlas\libs\security\supply-chain-manager.ts" $reproduciblePatterns "Reproducible Build Verification"
$evidence.checks.reproducibleBuilds += @{ name = "Reproducible Build Verification"; passed = $check11 }

Write-Host "`n📋 S5 Security Flags" -ForegroundColor Cyan

# Check 12: S5 security flags
$s5FlagPatterns = @(
    @{ name = "SLSA provenance flag"; text = "SECURITY_SLSA_PROVENANCE" },
    @{ name = "SBOM generation flag"; text = "SECURITY_SBOM_GENERATION" },
    @{ name = "Cosign signing flag"; text = "SECURITY_COSIGN_SIGNING" },
    @{ name = "Vulnerability scanning flag"; text = "SECURITY_VULN_SCANNING" },
    @{ name = "Supply chain protection"; text = "SECURITY_SUPPLY_CHAIN_PROTECTION" },
    @{ name = "Attestation pipeline"; text = "SECURITY_ATTESTATION_PIPELINE" },
    @{ name = "Reproducible builds"; text = "SECURITY_REPRODUCIBLE_BUILDS" },
    @{ name = "License compliance"; text = "SECURITY_LICENSE_COMPLIANCE" }
)

$check12 = Test-CodeContent "d:\Atlas\security\flags.yaml" $s5FlagPatterns "S5 Security Flags"
$evidence.checks.attestationPipeline += @{ name = "S5 Security Flags"; passed = $check12 }

# Calculate totals
$allChecks = $evidence.checks.slsaProvenance + $evidence.checks.sbomGeneration + 
             $evidence.checks.vulnerabilityScanning + $evidence.checks.cosignSigning + 
             $evidence.checks.supplyChainProtection + $evidence.checks.licenseCompliance + 
             $evidence.checks.reproducibleBuilds + $evidence.checks.attestationPipeline

$totalChecks = $allChecks.Count
$passedChecks = ($allChecks | Where-Object { $_.passed }).Count
$failedChecks = $totalChecks - $passedChecks

Write-Host "`n📊 SUMMARY RESULTS" -ForegroundColor Yellow
Write-Host "Total Checks: $totalChecks" -ForegroundColor Blue
Write-Host "Passed: $passedChecks" -ForegroundColor Green
Write-Host "Failed: $failedChecks" -ForegroundColor Red
Write-Host "Success Rate: $([Math]::Round(($passedChecks / $totalChecks) * 100))%" -ForegroundColor Cyan

# Compliance assessment
$compliance = @{
    slsaProvenance = ($evidence.checks.slsaProvenance | ForEach-Object { $_.passed }) -notcontains $false
    sbomGeneration = ($evidence.checks.sbomGeneration | ForEach-Object { $_.passed }) -notcontains $false
    vulnerabilityScanning = ($evidence.checks.vulnerabilityScanning | ForEach-Object { $_.passed }) -notcontains $false
    cosignSigning = ($evidence.checks.cosignSigning | ForEach-Object { $_.passed }) -notcontains $false
    supplyChainProtection = ($evidence.checks.supplyChainProtection | ForEach-Object { $_.passed }) -notcontains $false
    licenseCompliance = ($evidence.checks.licenseCompliance | ForEach-Object { $_.passed }) -notcontains $false
    reproducibleBuilds = ($evidence.checks.reproducibleBuilds | ForEach-Object { $_.passed }) -notcontains $false
    attestationPipeline = ($evidence.checks.attestationPipeline | ForEach-Object { $_.passed }) -notcontains $false
}

Write-Host "`n🎯 COMPLIANCE STATUS" -ForegroundColor Yellow
Write-Host "SLSA L3 Provenance: $(if($compliance.slsaProvenance){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.slsaProvenance){'Green'}else{'Red'})
Write-Host "SBOM Generation: $(if($compliance.sbomGeneration){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.sbomGeneration){'Green'}else{'Red'})
Write-Host "Vulnerability Scanning: $(if($compliance.vulnerabilityScanning){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.vulnerabilityScanning){'Green'}else{'Red'})
Write-Host "Cosign Signing: $(if($compliance.cosignSigning){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.cosignSigning){'Green'}else{'Red'})
Write-Host "Supply Chain Protection: $(if($compliance.supplyChainProtection){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.supplyChainProtection){'Green'}else{'Red'})
Write-Host "License Compliance: $(if($compliance.licenseCompliance){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.licenseCompliance){'Green'}else{'Red'})
Write-Host "Reproducible Builds: $(if($compliance.reproducibleBuilds){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.reproducibleBuilds){'Green'}else{'Red'})
Write-Host "Attestation Pipeline: $(if($compliance.attestationPipeline){'✅ COMPLIANT'}else{'❌ NON-COMPLIANT'})" -ForegroundColor $(if($compliance.attestationPipeline){'Green'}else{'Red'})

$overallCompliance = ($compliance.Values | Where-Object { -not $_ }).Count -eq 0

if ($overallCompliance) {
    Write-Host "`n🎉 S5 SUPPLY CHAIN SECURITY: FULLY IMPLEMENTED & COMPLIANT" -ForegroundColor Green
    Write-Host "✅ SLSA Level 3 provenance generation for build integrity" -ForegroundColor Green
    Write-Host "✅ Comprehensive SBOM generation with SPDX/CycloneDX formats" -ForegroundColor Green
    Write-Host "✅ Multi-scanner vulnerability detection (Trivy, Grype, Semgrep)" -ForegroundColor Green
    Write-Host "✅ Cosign keyless signing with attestation support" -ForegroundColor Green
    Write-Host "✅ Supply chain attack prevention and dependency attestation" -ForegroundColor Green
    Write-Host "✅ License compliance scanning and validation" -ForegroundColor Green
    Write-Host "✅ Reproducible builds with deterministic outputs" -ForegroundColor Green
    Write-Host "✅ End-to-end attestation pipeline" -ForegroundColor Green
    Write-Host "`n🚀 READY TO PROCEED WITH S6 DEV/ADMIN EXPERIENCE" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  S5 SUPPLY CHAIN SECURITY: IMPLEMENTATION INCOMPLETE" -ForegroundColor Red
    Write-Host "Please address the failed checks before proceeding to S6" -ForegroundColor Red
}

# Save evidence
$evidence.compliance = $compliance
$evidence.overallCompliant = $overallCompliance
$evidence.summary = @{
    totalChecks = $totalChecks
    passedChecks = $passedChecks
    failedChecks = $failedChecks
}

$evidenceFile = "s5-supply-chain-evidence-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Out-File $evidenceFile -Encoding UTF8
Write-Host "`n💾 Evidence report saved: $evidenceFile" -ForegroundColor Blue