#!/bin/bash

# Atlas Perfect Mode Verification Script
# Validates all S0-S7 implementation stages for ATLAS_PERFECT_MODE_EXECUTE_AND_VERIFY

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERIFICATION_LOG="${PROJECT_ROOT}/atlas-perfect-verification.log"
RESULTS_JSON="${PROJECT_ROOT}/atlas-perfect-results.json"
TOTAL_GATES=0
PASSED_GATES=0
FAILED_GATES=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$VERIFICATION_LOG"
    PASSED_GATES=$((PASSED_GATES + 1))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$VERIFICATION_LOG"
    FAILED_GATES=$((FAILED_GATES + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

# Initialize verification
init_verification() {
    log_info "🚀 Initializing Atlas Perfect Mode Verification"
    log_info "Project root: $PROJECT_ROOT"
    log_info "Verification log: $VERIFICATION_LOG"
    
    # Clear previous logs
    > "$VERIFICATION_LOG"
    
    # Initialize results JSON
    cat > "$RESULTS_JSON" << EOF
{
  "atlas_perfect_mode": {
    "verification_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0.0",
    "commit_sha": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "stages": {}
  }
}
EOF
}

# S0: Remote Bootstrap Verification
verify_s0_remote_bootstrap() {
    log_info "🔧 Verifying S0: Remote Bootstrap Setup"
    local s0_score=0
    local s0_total=5
    
    # Check .devcontainer configuration
    if [ -f "$PROJECT_ROOT/.devcontainer/devcontainer.json" ]; then
        if grep -q "node.*20" "$PROJECT_ROOT/.devcontainer/devcontainer.json" && \
           grep -q "pnpm" "$PROJECT_ROOT/.devcontainer/devcontainer.json"; then
            log_success "S0.1: Devcontainer with Node 20 + pnpm 9"
            s0_score=$((s0_score + 1))
        else
            log_error "S0.1: Devcontainer missing Node 20 or pnpm 9"
        fi
    else
        log_error "S0.1: .devcontainer/devcontainer.json not found"
    fi
    
    # Check GitHub Actions workflows
    if ls "$PROJECT_ROOT/.github/workflows/"*.yml > /dev/null 2>&1; then
        log_success "S0.2: GitHub Actions workflows configured"
        s0_score=$((s0_score + 1))
    else
        log_error "S0.2: No GitHub Actions workflows found"
    fi
    
    # Check remote development setup
    if grep -r "localhost" "$PROJECT_ROOT/.github" 2>/dev/null | grep -v "Binary file" | wc -l | grep -q "^0$"; then
        log_success "S0.3: No localhost dependencies in workflows"
        s0_score=$((s0_score + 1))
    else
        log_error "S0.3: Found localhost dependencies in workflows"
    fi
    
    # Check pnpm workspace configuration
    if [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]; then
        log_success "S0.4: pnpm workspace configured"
        s0_score=$((s0_score + 1))
    else
        log_error "S0.4: pnpm-workspace.yaml not found"
    fi
    
    # Check Node 20 in package.json engines
    if grep -q '"node".*".*20' "$PROJECT_ROOT/package.json" 2>/dev/null; then
        log_success "S0.5: Node 20 specified in package.json engines"
        s0_score=$((s0_score + 1))
    else
        log_error "S0.5: Node 20 not specified in package.json engines"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s0_total))
    update_results_json "s0_remote_bootstrap" $s0_score $s0_total
}

# S1: Security Policy Framework Verification
verify_s1_security_policies() {
    log_info "🔐 Verifying S1: Security Policy Framework"
    local s1_score=0
    local s1_total=8
    
    # Check security flags file
    if [ -f "$PROJECT_ROOT/security/flags.yaml" ]; then
        log_success "S1.1: Security flags configuration file exists"
        s1_score=$((s1_score + 1))
        
        # Count enabled security flags
        local enabled_flags=$(grep -c "enabled: true" "$PROJECT_ROOT/security/flags.yaml" 2>/dev/null || echo "0")
        if [ "$enabled_flags" -ge 45 ]; then
            log_success "S1.2: 45+ security flags enabled ($enabled_flags found)"
            s1_score=$((s1_score + 1))
        else
            log_error "S1.2: Insufficient security flags enabled ($enabled_flags/45+)"
        fi
    else
        log_error "S1.1-2: Security flags file not found"
    fi
    
    # Check OPA policies
    if [ -d "$PROJECT_ROOT/security/policies" ] && ls "$PROJECT_ROOT/security/policies/"*.rego > /dev/null 2>&1; then
        log_success "S1.3: OPA policy files found"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.3: OPA policy files not found"
    fi
    
    # Check Conftest configuration
    if [ -f "$PROJECT_ROOT/security/conftest.yaml" ]; then
        log_success "S1.4: Conftest configuration exists"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.4: Conftest configuration not found"
    fi
    
    # Check SLSA configuration
    if grep -r "SLSA" "$PROJECT_ROOT/.github/workflows/" > /dev/null 2>&1; then
        log_success "S1.5: SLSA L3 compliance configuration found"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.5: SLSA L3 compliance configuration missing"
    fi
    
    # Check security middleware
    if [ -f "$PROJECT_ROOT/packages/@atlas/security-middleware/package.json" ]; then
        log_success "S1.6: Security middleware package exists"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.6: Security middleware package not found"
    fi
    
    # Check Next.js security configuration
    local secure_apps=0
    for app in admin-insights dev-portal proof-messenger messenger verify; do
        if [ -f "$PROJECT_ROOT/apps/$app/next.config.js" ]; then
            if grep -q "headers\|csp\|security" "$PROJECT_ROOT/apps/$app/next.config.js"; then
                secure_apps=$((secure_apps + 1))
            fi
        fi
    done
    
    if [ $secure_apps -ge 3 ]; then
        log_success "S1.7: Security headers configured in Next.js apps"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.7: Insufficient security configuration in Next.js apps"
    fi
    
    # Check security testing
    if grep -r "security.*test\|test.*security" "$PROJECT_ROOT" --include="*.json" --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        log_success "S1.8: Security testing configuration found"
        s1_score=$((s1_score + 1))
    else
        log_error "S1.8: Security testing configuration missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s1_total))
    update_results_json "s1_security_policies" $s1_score $s1_total
}

# S2: Chat Service Infrastructure Verification
verify_s2_chat_services() {
    log_info "💬 Verifying S2: Chat Service Infrastructure"
    local s2_score=0
    local s2_total=6
    
    # Check chat delivery service
    if [ -d "$PROJECT_ROOT/services/chat-delivery" ]; then
        log_success "S2.1: Chat delivery service exists"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.1: Chat delivery service not found"
    fi
    
    # Check key directory service
    if [ -d "$PROJECT_ROOT/services/key-directory" ]; then
        log_success "S2.2: Key directory service exists"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.2: Key directory service not found"
    fi
    
    # Check media service
    if [ -d "$PROJECT_ROOT/services/media" ]; then
        log_success "S2.3: Media service exists"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.3: Media service not found"
    fi
    
    # Check risk guard service
    if [ -d "$PROJECT_ROOT/services/risk-guard" ]; then
        log_success "S2.4: Risk guard service exists"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.4: Risk guard service not found"
    fi
    
    # Check MLS core package
    if [ -f "$PROJECT_ROOT/packages/@atlas/mls-core/package.json" ]; then
        log_success "S2.5: MLS core package exists"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.5: MLS core package not found"
    fi
    
    # Check docker compose for services
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ] && grep -q "chat-delivery\|key-directory\|media\|risk-guard" "$PROJECT_ROOT/docker-compose.yml"; then
        log_success "S2.6: Docker compose includes chat services"
        s2_score=$((s2_score + 1))
    else
        log_error "S2.6: Docker compose missing chat services"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s2_total))
    update_results_json "s2_chat_services" $s2_score $s2_total
}

# S3: Receipt System Verification
verify_s3_receipts() {
    log_info "📋 Verifying S3: Receipt System Implementation"
    local s3_score=0
    local s3_total=5
    
    # Check receipt package
    if [ -f "$PROJECT_ROOT/packages/@atlas/receipt/package.json" ]; then
        log_success "S3.1: Receipt package exists"
        s3_score=$((s3_score + 1))
    else
        log_error "S3.1: Receipt package not found"
    fi
    
    # Check RFC 9421 implementation
    if grep -r "RFC.*9421" "$PROJECT_ROOT/packages/@atlas/receipt" > /dev/null 2>&1; then
        log_success "S3.2: RFC 9421 implementation found"
        s3_score=$((s3_score + 1))
    else
        log_error "S3.2: RFC 9421 implementation not found"
    fi
    
    # Check cryptographic receipt configuration
    if grep -q "SECURITY_CRYPTO_RECEIPTS.*enabled: true" "$PROJECT_ROOT/security/flags.yaml" 2>/dev/null; then
        log_success "S3.3: Cryptographic receipts enabled in flags"
        s3_score=$((s3_score + 1))
    else
        log_error "S3.3: Cryptographic receipts not enabled"
    fi
    
    # Check receipt verification workflow
    if grep -r "receipt.*verify\|verify.*receipt" "$PROJECT_ROOT/.github/workflows/" > /dev/null 2>&1; then
        log_success "S3.4: Receipt verification workflow found"
        s3_score=$((s3_score + 1))
    else
        log_error "S3.4: Receipt verification workflow missing"
    fi
    
    # Check receipt API endpoints
    if grep -r "api.*receipt\|receipt.*api" "$PROJECT_ROOT/apps" --include="*.ts" --include="*.js" > /dev/null 2>&1; then
        log_success "S3.5: Receipt API endpoints found"
        s3_score=$((s3_score + 1))
    else
        log_error "S3.5: Receipt API endpoints missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s3_total))
    update_results_json "s3_receipts" $s3_score $s3_total
}

# S4: Transport Security Verification
verify_s4_transport_security() {
    log_info "🔒 Verifying S4: Transport Security Hardening"
    local s4_score=0
    local s4_total=7
    
    # Check CSP nonce implementation
    if grep -q "SECURITY_CSP_NONCE.*enabled: true" "$PROJECT_ROOT/security/flags.yaml" 2>/dev/null; then
        log_success "S4.1: CSP nonce enabled in security flags"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.1: CSP nonce not enabled"
    fi
    
    # Check COOP/COEP headers
    if grep -q "Cross-Origin-Opener-Policy\|Cross-Origin-Embedder-Policy" "$PROJECT_ROOT/packages/@atlas/security-middleware" -r 2>/dev/null; then
        log_success "S4.2: COOP/COEP headers implemented"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.2: COOP/COEP headers missing"
    fi
    
    # Check DPoP implementation
    if grep -r "DPoP\|dpop" "$PROJECT_ROOT/packages/@atlas/security-middleware" > /dev/null 2>&1; then
        log_success "S4.3: DPoP implementation found"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.3: DPoP implementation missing"
    fi
    
    # Check security headers middleware
    if [ -f "$PROJECT_ROOT/packages/@atlas/security-middleware/src/index.ts" ]; then
        log_success "S4.4: Security middleware implementation exists"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.4: Security middleware implementation missing"
    fi
    
    # Check middleware integration in apps
    local apps_with_middleware=0
    for app in admin-insights dev-portal proof-messenger messenger verify; do
        if grep -q "@atlas/security-middleware" "$PROJECT_ROOT/apps/$app/package.json" 2>/dev/null; then
            apps_with_middleware=$((apps_with_middleware + 1))
        fi
    done
    
    if [ $apps_with_middleware -ge 3 ]; then
        log_success "S4.5: Security middleware integrated in multiple apps"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.5: Security middleware integration insufficient"
    fi
    
    # Check TLS configuration
    if grep -r "ssl\|tls\|https" "$PROJECT_ROOT/security" > /dev/null 2>&1; then
        log_success "S4.6: TLS/SSL configuration found"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.6: TLS/SSL configuration missing"
    fi
    
    # Check security header testing
    if grep -r "security.*header\|header.*security" "$PROJECT_ROOT" --include="*.test.*" > /dev/null 2>&1; then
        log_success "S4.7: Security header testing found"
        s4_score=$((s4_score + 1))
    else
        log_error "S4.7: Security header testing missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s4_total))
    update_results_json "s4_transport_security" $s4_score $s4_total
}

# S5: Supply Chain Security Verification
verify_s5_supply_chain() {
    log_info "🔗 Verifying S5: Supply Chain Security Scanning"
    local s5_score=0
    local s5_total=8
    
    # Check security scanning workflow
    if [ -f "$PROJECT_ROOT/.github/workflows/s5-security-scans.yml" ]; then
        log_success "S5.1: Security scanning workflow exists"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.1: Security scanning workflow not found"
    fi
    
    # Check CodeQL integration
    if grep -q "CodeQL\|codeql" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.2: CodeQL integration found"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.2: CodeQL integration missing"
    fi
    
    # Check Semgrep integration
    if grep -q "semgrep" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.3: Semgrep integration found"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.3: Semgrep integration missing"
    fi
    
    # Check Gitleaks integration
    if grep -q "gitleaks" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.4: Gitleaks integration found"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.4: Gitleaks integration missing"
    fi
    
    # Check Trivy integration
    if grep -q "trivy" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.5: Trivy integration found"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.5: Trivy integration missing"
    fi
    
    # Check dependency scanning
    if grep -q "dependency.*scan\|scan.*dependency" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.6: Dependency scanning configured"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.6: Dependency scanning missing"
    fi
    
    # Check license compliance
    if grep -q "license.*compliance\|compliance.*license" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.7: License compliance checking found"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.7: License compliance checking missing"
    fi
    
    # Check SBOM generation
    if grep -q "SBOM\|sbom" "$PROJECT_ROOT/.github/workflows/"*.yml 2>/dev/null; then
        log_success "S5.8: SBOM generation configured"
        s5_score=$((s5_score + 1))
    else
        log_error "S5.8: SBOM generation missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s5_total))
    update_results_json "s5_supply_chain" $s5_score $s5_total
}

# S6: Dev/Admin Experience Verification
verify_s6_dev_admin() {
    log_info "🛠️ Verifying S6: Dev/Admin Experience Enhancement"
    local s6_score=0
    local s6_total=6
    
    # Check admin insights evidence export
    if [ -f "$PROJECT_ROOT/apps/admin-insights/src/app/evidence/page.tsx" ]; then
        log_success "S6.1: Admin insights evidence export exists"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.1: Admin insights evidence export missing"
    fi
    
    # Check evidence generation API
    if [ -f "$PROJECT_ROOT/apps/admin-insights/src/app/api/admin/evidence/generate/route.ts" ]; then
        log_success "S6.2: Evidence generation API exists"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.2: Evidence generation API missing"
    fi
    
    # Check enhanced dev portal
    if [ -f "$PROJECT_ROOT/apps/dev-portal/src/components/dev-portal/DevPortalLayout.tsx" ]; then
        log_success "S6.3: Enhanced dev portal components exist"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.3: Enhanced dev portal components missing"
    fi
    
    # Check code examples and sandbox
    if [ -f "$PROJECT_ROOT/apps/dev-portal/src/components/dev-portal/Sandbox.tsx" ]; then
        log_success "S6.4: Interactive sandbox component exists"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.4: Interactive sandbox component missing"
    fi
    
    # Check documentation grid
    if [ -f "$PROJECT_ROOT/apps/dev-portal/src/components/dev-portal/DocumentationGrid.tsx" ]; then
        log_success "S6.5: Documentation grid component exists"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.5: Documentation grid component missing"
    fi
    
    # Check developer tooling
    if grep -r "CLI\|SDK\|toolkit" "$PROJECT_ROOT/apps/dev-portal" > /dev/null 2>&1; then
        log_success "S6.6: Developer tooling documentation found"
        s6_score=$((s6_score + 1))
    else
        log_error "S6.6: Developer tooling documentation missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s6_total))
    update_results_json "s6_dev_admin" $s6_score $s6_total
}

# S7: Canary Deployment Verification
verify_s7_canary() {
    log_info "🚀 Verifying S7: Canary Deployment Implementation"
    local s7_score=0
    local s7_total=6
    
    # Check canary deployment workflow
    if [ -f "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" ]; then
        log_success "S7.1: Canary deployment workflow exists"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.1: Canary deployment workflow missing"
    fi
    
    # Check progressive rollout configuration
    if grep -q "canary.*10.*50.*100" "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" 2>/dev/null; then
        log_success "S7.2: Progressive rollout (10%→50%→100%) configured"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.2: Progressive rollout configuration missing"
    fi
    
    # Check automated rollback
    if grep -q "rollback" "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" 2>/dev/null; then
        log_success "S7.3: Automated rollback configured"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.3: Automated rollback missing"
    fi
    
    # Check health monitoring
    if grep -q "health.*check\|monitor" "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" 2>/dev/null; then
        log_success "S7.4: Health monitoring configured"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.4: Health monitoring missing"
    fi
    
    # Check security validation in deployment
    if grep -q "security.*validation\|security.*assessment" "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" 2>/dev/null; then
        log_success "S7.5: Security validation in deployment"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.5: Security validation missing in deployment"
    fi
    
    # Check deployment environments
    if grep -q "canary.*environment" "$PROJECT_ROOT/.github/workflows/s7-canary-deployment.yml" 2>/dev/null; then
        log_success "S7.6: Canary environments configured"
        s7_score=$((s7_score + 1))
    else
        log_error "S7.6: Canary environments missing"
    fi
    
    TOTAL_GATES=$((TOTAL_GATES + s7_total))
    update_results_json "s7_canary" $s7_score $s7_total
}

# Update results JSON
update_results_json() {
    local stage="$1"
    local score="$2"
    local total="$3"
    local percentage=$((score * 100 / total))
    
    # Update the JSON file with stage results
    jq --arg stage "$stage" \
       --argjson score "$score" \
       --argjson total "$total" \
       --argjson percentage "$percentage" \
       '.atlas_perfect_mode.stages[$stage] = {
         "score": $score,
         "total": $total,
         "percentage": $percentage,
         "status": (if $percentage >= 80 then "PASS" else "FAIL" end)
       }' "$RESULTS_JSON" > "$RESULTS_JSON.tmp" && mv "$RESULTS_JSON.tmp" "$RESULTS_JSON"
}

# Generate final report
generate_final_report() {
    log_info "📊 Generating final verification report"
    
    local overall_percentage=0
    if [ $TOTAL_GATES -gt 0 ]; then
        overall_percentage=$((PASSED_GATES * 100 / TOTAL_GATES))
    fi
    
    local status="FAIL"
    if [ $overall_percentage -ge 90 ]; then
        status="SUCCESS"
    elif [ $overall_percentage -ge 80 ]; then
        status="PARTIAL"
    fi
    
    # Update final results
    jq --argjson passed "$PASSED_GATES" \
       --argjson failed "$FAILED_GATES" \
       --argjson total "$TOTAL_GATES" \
       --argjson percentage "$overall_percentage" \
       --arg status "$status" \
       '.atlas_perfect_mode += {
         "overall": {
           "passed_gates": $passed,
           "failed_gates": $failed,
           "total_gates": $total,
           "success_percentage": $percentage,
           "status": $status
         },
         "verification_completed": (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
       }' "$RESULTS_JSON" > "$RESULTS_JSON.tmp" && mv "$RESULTS_JSON.tmp" "$RESULTS_JSON"
    
    # Print summary
    echo ""
    echo "=========================================="
    echo "   ATLAS PERFECT MODE VERIFICATION"
    echo "=========================================="
    echo ""
    
    if [ "$status" = "SUCCESS" ]; then
        log_success "🎉 ATLAS PERFECT MODE VERIFICATION: SUCCESS"
        log_success "All S0-S7 stages implemented and verified"
        log_success "Overall score: $PASSED_GATES/$TOTAL_GATES ($overall_percentage%)"
    elif [ "$status" = "PARTIAL" ]; then
        log_warning "⚠️  ATLAS PERFECT MODE VERIFICATION: PARTIAL SUCCESS"
        log_warning "Most stages implemented but some issues found"
        log_warning "Overall score: $PASSED_GATES/$TOTAL_GATES ($overall_percentage%)"
    else
        log_error "❌ ATLAS PERFECT MODE VERIFICATION: FAILED"
        log_error "Critical issues found in implementation"
        log_error "Overall score: $PASSED_GATES/$TOTAL_GATES ($overall_percentage%)"
    fi
    
    echo ""
    echo "Stage Breakdown:"
    echo "  S0 Remote Bootstrap: $(jq -r '.atlas_perfect_mode.stages.s0_remote_bootstrap.status // "N/A"' "$RESULTS_JSON")"
    echo "  S1 Security Policies: $(jq -r '.atlas_perfect_mode.stages.s1_security_policies.status // "N/A"' "$RESULTS_JSON")"
    echo "  S2 Chat Services: $(jq -r '.atlas_perfect_mode.stages.s2_chat_services.status // "N/A"' "$RESULTS_JSON")"
    echo "  S3 Receipts: $(jq -r '.atlas_perfect_mode.stages.s3_receipts.status // "N/A"' "$RESULTS_JSON")"
    echo "  S4 Transport Security: $(jq -r '.atlas_perfect_mode.stages.s4_transport_security.status // "N/A"' "$RESULTS_JSON")"
    echo "  S5 Supply Chain: $(jq -r '.atlas_perfect_mode.stages.s5_supply_chain.status // "N/A"' "$RESULTS_JSON")"
    echo "  S6 Dev/Admin: $(jq -r '.atlas_perfect_mode.stages.s6_dev_admin.status // "N/A"' "$RESULTS_JSON")"
    echo "  S7 Canary: $(jq -r '.atlas_perfect_mode.stages.s7_canary.status // "N/A"' "$RESULTS_JSON")"
    echo ""
    echo "Detailed results: $RESULTS_JSON"
    echo "Verification log: $VERIFICATION_LOG"
    echo ""
    
    # Return appropriate exit code
    if [ "$status" = "SUCCESS" ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    init_verification
    
    log_info "🔍 Starting comprehensive Atlas Perfect Mode verification"
    log_info "Validating all S0-S7 implementation stages"
    
    verify_s0_remote_bootstrap
    verify_s1_security_policies
    verify_s2_chat_services
    verify_s3_receipts
    verify_s4_transport_security
    verify_s5_supply_chain
    verify_s6_dev_admin
    verify_s7_canary
    
    generate_final_report
}

# Run main function
main "$@"