# OPA Policies Validation Script
# Tests all policies with conftest

Write-Host "🔍 Testing OPA Policies with Conftest..." -ForegroundColor Cyan

# Check if conftest is installed
$conftest = Get-Command conftest -ErrorAction SilentlyContinue
if (-not $conftest) {
    Write-Host "❌ conftest not found. Installing..." -ForegroundColor Yellow
    Write-Host "Install with: go install github.com/open-policy-agent/conftest@latest" -ForegroundColor Yellow
    Write-Host "Or download from: https://github.com/open-policy-agent/conftest/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ conftest found: $($conftest.Source)" -ForegroundColor Green

# Test headers policy
Write-Host "`n📋 Testing Headers Policy..." -ForegroundColor Cyan
conftest test --policy policies/ --namespace atlas.security.headers policies/test-headers.yaml

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Headers policy validation PASSED" -ForegroundColor Green
} else {
    Write-Host "❌ Headers policy validation FAILED" -ForegroundColor Red
}

# Verify all policies parse correctly
Write-Host "`n📋 Verifying Policy Syntax..." -ForegroundColor Cyan
conftest verify --policy policies/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All policies have valid syntax" -ForegroundColor Green
} else {
    Write-Host "❌ Policy syntax errors found" -ForegroundColor Red
}

Write-Host "`n📦 Policy Summary:" -ForegroundColor Cyan
Write-Host "  - headers.rego: Security headers validation" -ForegroundColor White
Write-Host "  - secrets.rego: Secrets detection" -ForegroundColor White
Write-Host "  - sbom.rego: SBOM validation (CycloneDX, vulnerabilities)" -ForegroundColor White
Write-Host "  - provenance.rego: SLSA L3 provenance validation" -ForegroundColor White

Write-Host "`n🎯 Usage Examples:" -ForegroundColor Cyan
Write-Host "  conftest test --policy policies/ --namespace atlas.security.headers evidence/headers/scan.json" -ForegroundColor Gray
Write-Host "  conftest test --policy policies/ --namespace atlas.security.sbom evidence/sbom/atlas-ecosystem-sbom.json" -ForegroundColor Gray
Write-Host "  conftest test --policy policies/ --namespace atlas.security.provenance evidence/slsa/provenance.json" -ForegroundColor Gray
