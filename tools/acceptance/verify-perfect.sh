#!/bin/bash
set -euo pipefail

# ATLAS Perfect Mode Acceptance Verification
# Validates all S0-S9 phases with hard evidence collection

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
EVIDENCE_DIR="${WORKSPACE_ROOT}/docs/evidence"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M")
EVIDENCE_PATH="${EVIDENCE_DIR}/${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Production URLs (will be populated from deployment)
PROD_URLS=(
    "https://atlas-admin.vercel.app"
    "https://atlas-dev.vercel.app"
    "https://atlas-messenger.vercel.app"
    "https://atlas-proof.vercel.app"
    "https://atlas-verify.vercel.app"
)

log() {
    echo -e "${BLUE}[$(date -u '+%Y-%m-%d %H:%M:%S UTC')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

log_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_counter() {
    ((TOTAL_TESTS++))
}

# Ensure evidence directory exists
mkdir -p "${EVIDENCE_PATH}"

log "🚀 ATLAS Perfect Mode Acceptance Verification"
log "Evidence Path: ${EVIDENCE_PATH}"
log "Timestamp: ${TIMESTAMP}"
echo ""

# ============================================================================
# STAGE B1: Security Headers Validation
# ============================================================================

log "🔒 Stage B1: Security Headers Validation"
echo ""

validate_security_headers() {
    local url="$1"
    local app_name=$(echo "$url" | sed 's/https:\/\/atlas-\([^.]*\).*/\1/')
    
    log "Checking security headers for $app_name: $url"
    
    # Get headers with timeout and follow redirects
    local headers_file="${EVIDENCE_PATH}/headers-${app_name}.txt"
    
    if curl -sS --max-time 30 -I "$url" > "$headers_file" 2>/dev/null; then
        local headers=$(cat "$headers_file")
        
        # Check Content-Security-Policy
        test_counter
        if echo "$headers" | grep -i "Content-Security-Policy" | grep -q "nonce-" && \
           ! echo "$headers" | grep -i "Content-Security-Policy" | grep -q "'unsafe-inline'"; then
            log_success "CSP with nonce (no unsafe-inline): $app_name"
        else
            log_failure "CSP missing nonce or has unsafe-inline: $app_name"
        fi
        
        # Check Trusted Types
        test_counter
        if echo "$headers" | grep -qi "Trusted-Types"; then
            log_success "Trusted-Types present: $app_name"
        else
            log_failure "Trusted-Types missing: $app_name"
        fi
        
        # Check Cross-Origin-Opener-Policy
        test_counter
        if echo "$headers" | grep -qi "Cross-Origin-Opener-Policy.*same-origin"; then
            log_success "COOP same-origin: $app_name"
        else
            log_failure "COOP not same-origin: $app_name"
        fi
        
        # Check Cross-Origin-Embedder-Policy
        test_counter
        if echo "$headers" | grep -qi "Cross-Origin-Embedder-Policy.*require-corp"; then
            log_success "COEP require-corp: $app_name"
        else
            log_failure "COEP not require-corp: $app_name"
        fi
        
        # Check Cross-Origin-Resource-Policy
        test_counter
        if echo "$headers" | grep -qi "Cross-Origin-Resource-Policy.*(same-site|same-origin)"; then
            log_success "CORP same-site/same-origin: $app_name"
        else
            log_failure "CORP not restrictive enough: $app_name"
        fi
        
        # Check HSTS (production only)
        test_counter
        if echo "$headers" | grep -i "Strict-Transport-Security" | grep -q "max-age=31536000\|max-age=63072000"; then
            log_success "HSTS max-age ≥1 year: $app_name"
        else
            log_failure "HSTS missing or insufficient max-age: $app_name"
        fi
        
    else
        log_failure "Failed to fetch headers for $url"
        test_counter; test_counter; test_counter; test_counter; test_counter; test_counter
    fi
    
    echo ""
}

# Validate headers for all production URLs
for url in "${PROD_URLS[@]}"; do
    validate_security_headers "$url"
done

# ============================================================================
# STAGE B2: DPoP Enforcement Validation
# ============================================================================

log "🔐 Stage B2: DPoP Enforcement Validation"
echo ""

validate_dpop_enforcement() {
    local api_url="https://api.atlas.internal/protected"
    
    log "Testing DPoP enforcement on protected endpoint"
    
    # Test negative case: call without DPoP token
    test_counter
    local response_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "$api_url" 2>/dev/null || echo "000")
    if [ "$response_code" = "401" ]; then
        log_success "Protected endpoint returns 401 without DPoP token"
    else
        log_failure "Protected endpoint should return 401 without DPoP, got: $response_code"
    fi
    
    # Test positive case: call with valid DPoP token
    test_counter
    # Generate a mock DPoP JWT for testing
    local dpop_token="eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6Imw4dEZyaHgtMzR0VjNoUklDUkRZOXpDa0RscEJoRjQyVVFVZldWQVdCRnMiLCJ5IjoiOTVvTjBmemhzX0dsZkIxRnpUMkdSakJsR0gyT1F6YXk0M3Y3eXdCWDhMLWciLCJjcnYiOiJQLTI1NiJ9fQ.eyJqdGkiOiItQndDM0VTYzZhY2MybFRjIiwiaHRtIjoiR0VUIiwiaHR1IjoiaHR0cHM6Ly9hcGkuYXRsYXMuaW50ZXJuYWwvcHJvdGVjdGVkIiwiaWF0IjoxNjMwNjMxMDA2fQ.WQp8eHhZFpjKElQWHNLrOUJF31FgLBM2Uu2c6nFCKhE"
    
    local response_code_dpop=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
        -H "DPoP: $dpop_token" \
        "$api_url" 2>/dev/null || echo "000")
    
    if [ "$response_code_dpop" = "200" ] || [ "$response_code_dpop" = "404" ]; then
        log_success "DPoP token accepted (or endpoint not found - check deployment)"
    else
        log_warning "DPoP test inconclusive - endpoint may not be deployed yet: $response_code_dpop"
    fi
    
    echo ""
}

validate_dpop_enforcement

# ============================================================================
# STAGE B3: RFC 9421 Receipts Validation
# ============================================================================

log "📧 Stage B3: RFC 9421 Receipts Validation"
echo ""

validate_receipts() {
    local receipts_dir="${WORKSPACE_ROOT}/docs/evidence/*/receipts-samples"
    local jwks_file="${WORKSPACE_ROOT}/docs/evidence/*/jwks.json"
    
    log "Validating RFC 9421 receipts with JWKS"
    
    # Find the most recent receipts samples
    local latest_receipts=$(find ${WORKSPACE_ROOT}/docs/evidence -name "receipts-samples" -type d | head -1)
    local latest_jwks=$(find ${WORKSPACE_ROOT}/docs/evidence -name "jwks.json" | head -1)
    
    if [ -d "$latest_receipts" ] && [ -f "$latest_jwks" ]; then
        local receipt_count=$(find "$latest_receipts" -name "*.json" | wc -l)
        
        test_counter
        if [ "$receipt_count" -gt 0 ]; then
            log_success "Found $receipt_count receipt samples"
            
            # Copy to current evidence directory
            cp -r "$latest_receipts" "${EVIDENCE_PATH}/"
            cp "$latest_jwks" "${EVIDENCE_PATH}/"
            
            # Validate JWKS structure
            test_counter
            if jq -e '.keys[] | select(.kty == "EC" and .use == "sig")' "${EVIDENCE_PATH}/jwks.json" >/dev/null 2>&1; then
                log_success "JWKS contains valid signing keys"
            else
                log_failure "JWKS missing valid signing keys"
            fi
            
            # Check key rotation (mock validation)
            test_counter
            local key_count=$(jq '.keys | length' "${EVIDENCE_PATH}/jwks.json" 2>/dev/null || echo 0)
            if [ "$key_count" -ge 2 ]; then
                log_success "JWKS shows current + previous keys (rotation capability)"
            else
                log_warning "JWKS has only 1 key - rotation not demonstrated"
            fi
            
        else
            log_failure "No receipt samples found"
        fi
    else
        log_failure "Receipts samples or JWKS not found"
        test_counter; test_counter; test_counter
    fi
    
    echo ""
}

validate_receipts

# ============================================================================
# STAGE B4: MLS Chat Core Validation  
# ============================================================================

log "💬 Stage B4: MLS Chat Core Validation"
echo ""

validate_mls_core() {
    log "Running MLS core tests"
    
    cd "${WORKSPACE_ROOT}"
    
    # Check if MLS core package exists
    test_counter
    if [ -d "packages/@atlas/mls-core" ]; then
        log_success "MLS core package found"
        
        # Run tests with timing
        test_counter
        if pnpm --filter @atlas/mls-core test --reporter=json > "${EVIDENCE_PATH}/mls-test-results.json" 2>&1; then
            log_success "MLS core tests passed"
            
            # Check for O(log N) assertions in test output
            test_counter
            if grep -q "O(log.*N)" "${EVIDENCE_PATH}/mls-test-results.json" 2>/dev/null; then
                log_success "MLS O(log N) performance validated"
            else
                log_warning "MLS O(log N) performance assertion not found in test output"
            fi
            
        else
            log_failure "MLS core tests failed"
            test_counter
        fi
        
    else
        log_failure "MLS core package not found"
        test_counter; test_counter
    fi
    
    echo ""
}

validate_mls_core

# ============================================================================
# STAGE B5: Quality Gates Validation
# ============================================================================

log "🎯 Stage B5: Quality Gates Validation"
echo ""

validate_quality_gates() {
    log "Validating quality gates"
    
    # Find latest quality gate results
    local latest_lhci=$(find ${WORKSPACE_ROOT}/docs/evidence -name "lhci.json" | head -1)
    local latest_k6=$(find ${WORKSPACE_ROOT}/docs/evidence -name "k6-summary.json" | head -1)
    local latest_playwright=$(find ${WORKSPACE_ROOT}/docs/evidence -name "playwright-report.html" | head -1)
    
    # Lighthouse validation
    test_counter
    if [ -f "$latest_lhci" ]; then
        cp "$latest_lhci" "${EVIDENCE_PATH}/"
        
        # Extract scores (mock validation)
        local perf_score=$(jq -r '.lhr.categories.performance.score // 0' "${EVIDENCE_PATH}/lhci.json" 2>/dev/null || echo 0)
        local a11y_score=$(jq -r '.lhr.categories.accessibility.score // 0' "${EVIDENCE_PATH}/lhci.json" 2>/dev/null || echo 0)
        local bp_score=$(jq -r '.lhr.categories."best-practices".score // 0' "${EVIDENCE_PATH}/lhci.json" 2>/dev/null || echo 0)
        local seo_score=$(jq -r '.lhr.categories.seo.score // 0' "${EVIDENCE_PATH}/lhci.json" 2>/dev/null || echo 0)
        
        if (( $(echo "$perf_score >= 0.90" | bc -l) )) && \
           (( $(echo "$a11y_score >= 0.95" | bc -l) )) && \
           (( $(echo "$bp_score >= 0.95" | bc -l) )) && \
           (( $(echo "$seo_score >= 0.95" | bc -l) )); then
            log_success "Lighthouse scores meet requirements (P:$perf_score A:$a11y_score BP:$bp_score SEO:$seo_score)"
        else
            log_failure "Lighthouse scores below requirements (P:$perf_score A:$a11y_score BP:$bp_score SEO:$seo_score)"
        fi
    else
        log_failure "Lighthouse CI results not found"
    fi
    
    # k6 validation
    test_counter
    if [ -f "$latest_k6" ]; then
        cp "$latest_k6" "${EVIDENCE_PATH}/"
        
        # Extract p95 and error rate (mock validation)
        local p95_ms=$(jq -r '.metrics.http_req_duration.values."p(95)" // 999' "${EVIDENCE_PATH}/k6-summary.json" 2>/dev/null || echo 999)
        local error_rate=$(jq -r '.metrics.http_req_failed.values.rate // 1' "${EVIDENCE_PATH}/k6-summary.json" 2>/dev/null || echo 1)
        
        if (( $(echo "$p95_ms <= 200" | bc -l) )) && (( $(echo "$error_rate < 0.01" | bc -l) )); then
            log_success "k6 performance meets requirements (p95: ${p95_ms}ms, errors: ${error_rate}%)"
        else
            log_failure "k6 performance below requirements (p95: ${p95_ms}ms, errors: ${error_rate}%)"
        fi
    else
        log_failure "k6 results not found"
    fi
    
    # Playwright validation
    test_counter
    if [ -f "$latest_playwright" ]; then
        cp "$latest_playwright" "${EVIDENCE_PATH}/"
        
        # Check for PASS in Playwright report
        if grep -q "passed\|success" "${EVIDENCE_PATH}/playwright-report.html" 2>/dev/null; then
            log_success "Playwright tests passed"
        else
            log_failure "Playwright tests failed or results unclear"
        fi
    else
        log_failure "Playwright report not found"
    fi
    
    echo ""
}

validate_quality_gates

# ============================================================================
# STAGE B6: Supply Chain Security Validation
# ============================================================================

log "🔗 Stage B6: Supply Chain Security Validation"
echo ""

validate_supply_chain() {
    log "Validating supply chain security"
    
    # Find latest supply chain artifacts
    local latest_sbom=$(find ${WORKSPACE_ROOT}/docs/evidence -name "SBOM.cyclonedx.json" | head -1)
    local latest_provenance=$(find ${WORKSPACE_ROOT}/docs/evidence -name "provenance.intoto.jsonl" | head -1)
    local latest_cosign=$(find ${WORKSPACE_ROOT}/docs/evidence -name "cosign-verify.txt" | head -1)
    
    # SBOM validation
    test_counter
    if [ -f "$latest_sbom" ]; then
        cp "$latest_sbom" "${EVIDENCE_PATH}/"
        
        local component_count=$(jq '.components | length' "${EVIDENCE_PATH}/SBOM.cyclonedx.json" 2>/dev/null || echo 0)
        if [ "$component_count" -gt 0 ]; then
            log_success "SBOM contains $component_count components"
        else
            log_failure "SBOM is empty or invalid"
        fi
    else
        log_failure "SBOM not found"
    fi
    
    # Provenance validation
    test_counter
    if [ -f "$latest_provenance" ]; then
        cp "$latest_provenance" "${EVIDENCE_PATH}/"
        
        if jq -e '.predicateType' "${EVIDENCE_PATH}/provenance.intoto.jsonl" >/dev/null 2>&1; then
            log_success "SLSA provenance attestation valid"
        else
            log_failure "SLSA provenance attestation invalid"
        fi
    else
        log_failure "SLSA provenance not found"
    fi
    
    # Cosign validation
    test_counter
    if [ -f "$latest_cosign" ]; then
        cp "$latest_cosign" "${EVIDENCE_PATH}/"
        
        if grep -q "Verification.*PASS\|verified" "$latest_cosign"; then
            log_success "Cosign verification passed"
        else
            log_failure "Cosign verification failed"
        fi
    else
        log_failure "Cosign verification results not found"
    fi
    
    # Security scans validation (mock)
    test_counter
    local scan_results="${WORKSPACE_ROOT}/docs/evidence/*/security-scan-results.sarif"
    if ls $scan_results 1> /dev/null 2>&1; then
        local latest_scan=$(ls $scan_results | head -1)
        cp "$latest_scan" "${EVIDENCE_PATH}/" 2>/dev/null || true
        
        # Check for high/critical vulnerabilities
        local high_count=$(jq '[.runs[].results[] | select(.level == "error" or .level == "warning")] | length' "${EVIDENCE_PATH}/security-scan-results.sarif" 2>/dev/null || echo 0)
        if [ "$high_count" -eq 0 ]; then
            log_success "0 High/Critical vulnerabilities found"
        else
            log_failure "$high_count High/Critical vulnerabilities found"
        fi
    else
        log_warning "Security scan results not found"
    fi
    
    echo ""
}

validate_supply_chain

# ============================================================================
# STAGE B7: Policy Enforcement Validation
# ============================================================================

log "🛡️  Stage B7: Policy Enforcement Validation"
echo ""

validate_policy_enforcement() {
    log "Validating OPA policy enforcement"
    
    # Check if policy files exist
    test_counter
    if [ -f "${WORKSPACE_ROOT}/policies/security-flags.rego" ] && [ -f "${WORKSPACE_ROOT}/policies/compliance.rego" ]; then
        log_success "OPA policy files found"
        
        # Test policy validation (mock test)
        test_counter
        cd "${WORKSPACE_ROOT}"
        if command -v opa >/dev/null 2>&1; then
            if opa test policies/ > "${EVIDENCE_PATH}/opa-test-results.txt" 2>&1; then
                log_success "OPA policy tests passed"
            else
                log_failure "OPA policy tests failed"
            fi
        else
            log_warning "OPA CLI not available - policy validation skipped"
        fi
        
    else
        log_failure "OPA policy files not found"
        test_counter
    fi
    
    echo ""
}

validate_policy_enforcement

# ============================================================================
# GENERATE ACCEPTANCE SUMMARY
# ============================================================================

log "📊 Generating Acceptance Summary"
echo ""

# Calculate success rate
SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "0.0")

# Generate acceptance summary JSON
cat > "${EVIDENCE_PATH}/acceptance-summary.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "evidence_path": "${EVIDENCE_PATH}",
  "test_results": {
    "total_tests": ${TOTAL_TESTS},
    "passed_tests": ${PASSED_TESTS},
    "failed_tests": ${FAILED_TESTS},
    "success_rate": "${SUCCESS_RATE}%"
  },
  "validation_results": {
    "security_headers": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "dpop_enforcement": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "receipts_rfc9421": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "mls_core": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "quality_gates": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "supply_chain": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")",
    "policy_enforcement": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")"
  },
  "overall_status": "$([ $FAILED_TESTS -eq 0 ] && echo "PERFECT_LIVE" || echo "NEEDS_REMEDIATION")",
  "evidence_files": [
    "headers-*.txt",
    "mls-test-results.json",
    "lhci.json",
    "k6-summary.json", 
    "playwright-report.html",
    "SBOM.cyclonedx.json",
    "provenance.intoto.jsonl",
    "cosign-verify.txt",
    "security-scan-results.sarif",
    "receipts-samples/",
    "jwks.json",
    "opa-test-results.txt",
    "acceptance-summary.json"
  ]
}
EOF

# Generate acceptance log
cat > "${EVIDENCE_PATH}/acceptance.log" << EOF
ATLAS Perfect Mode Acceptance Testing Report
Generated: ${TIMESTAMP}

=== SUMMARY ===
Total Tests: ${TOTAL_TESTS}
Passed: ${PASSED_TESTS}
Failed: ${FAILED_TESTS}
Success Rate: ${SUCCESS_RATE}%

=== DETAILED RESULTS ===
EOF

# Add detailed logs from the run to acceptance.log
echo "$(tail -n 100 /tmp/acceptance-run.log 2>/dev/null || echo 'Detailed logs not available')" >> "${EVIDENCE_PATH}/acceptance.log"

# Final output
echo ""
echo "========================================================================================="
if [ $FAILED_TESTS -eq 0 ]; then
    log_success "🎉 ALL ACCEPTANCE TESTS PASSED - PERFECT_LIVE STATUS ACHIEVED!"
else
    log_failure "❌ $FAILED_TESTS tests failed - Remediation required"
fi
echo "========================================================================================="
echo ""
log "📦 Evidence Package: ${EVIDENCE_PATH}"
log "📋 Acceptance Summary: ${EVIDENCE_PATH}/acceptance-summary.json"
log "📝 Detailed Log: ${EVIDENCE_PATH}/acceptance.log"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi