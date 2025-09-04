#!/bin/bash

# Atlas Smoke Test Script
# Tests basic functionality of the Atlas Secure Fabric

set -e

# Configuration
GATEWAY_URL="http://localhost:3000"
WITNESS_URLS=(
  "http://localhost:3001"
  "http://localhost:3002"
  "http://localhost:3003"
  "http://localhost:3004"
  "http://localhost:3005"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test functions
test_gateway_health() {
    log_info "Testing Gateway health..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/gateway_health.json "$GATEWAY_URL/health")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Gateway health check passed"
        return 0
    else
        log_error "Gateway health check failed (HTTP $http_code)"
        return 1
    fi
}

test_witness_health() {
    log_info "Testing Witness nodes health..."
    
    local failed_witnesses=()
    
    for i in "${!WITNESS_URLS[@]}"; do
        local witness_url="${WITNESS_URLS[$i]}"
        local witness_id="w$((i+1))"
        
        log_info "Testing witness $witness_id at $witness_url"
        
        local response=$(curl -s -w "%{http_code}" -o /tmp/witness_${witness_id}_health.json "$witness_url/witness/health")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            log_success "Witness $witness_id health check passed"
        else
            log_error "Witness $witness_id health check failed (HTTP $http_code)"
            failed_witnesses+=("$witness_id")
        fi
    done
    
    if [ ${#failed_witnesses[@]} -eq 0 ]; then
        log_success "All witness nodes are healthy"
        return 0
    else
        log_warning "Failed witnesses: ${failed_witnesses[*]}"
        return 1
    fi
}

test_record_submission() {
    log_info "Testing record submission..."
    
    local record_id="smoke_test_$(date +%s)_$$"
    local payload="Smoke test message from $(date)"
    
    local request_body=$(cat <<EOF
{
  "app": "chat",
  "record_id": "$record_id",
  "payload": "$payload",
  "meta": {
    "room_id": "smoke_test_room",
    "user_id": "smoke_test_user",
    "message_type": "text"
  }
}
EOF
)
    
    local response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$request_body" \
        -o /tmp/record_submission.json \
        "$GATEWAY_URL/record")
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Record submission successful"
        
        # Check if we got attestations
        local attestation_count=$(jq '.attestations | length' /tmp/record_submission.json 2>/dev/null || echo "0")
        log_info "Received $attestation_count attestations"
        
        # Check quorum result
        local quorum_ok=$(jq '.quorum_result.ok' /tmp/record_submission.json 2>/dev/null || echo "false")
        local quorum_count=$(jq '.quorum_result.quorum_count' /tmp/record_submission.json 2>/dev/null || echo "0")
        
        if [ "$quorum_ok" = "true" ]; then
            log_success "Quorum verification passed (q=$quorum_count/4)"
        else
            log_warning "Quorum verification failed (q=$quorum_count/4)"
        fi
        
        echo "$record_id" > /tmp/last_record_id.txt
        return 0
    else
        log_error "Record submission failed (HTTP $http_code)"
        cat /tmp/record_submission.json 2>/dev/null || true
        return 1
    fi
}

test_record_verification() {
    log_info "Testing record verification..."
    
    if [ ! -f /tmp/last_record_id.txt ]; then
        log_error "No record ID available for verification test"
        return 1
    fi
    
    local record_id=$(cat /tmp/last_record_id.txt)
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/record_verification.json "$GATEWAY_URL/verify/$record_id")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Record verification successful"
        
        local verified=$(jq '.verified' /tmp/record_verification.json 2>/dev/null || echo "false")
        local quorum_count=$(jq '.quorum_result.quorum_count' /tmp/record_verification.json 2>/dev/null || echo "0")
        
        if [ "$verified" = "true" ]; then
            log_success "Record integrity verified (q=$quorum_count/4)"
        else
            log_warning "Record integrity verification failed (q=$quorum_count/4)"
        fi
        
        return 0
    else
        log_error "Record verification failed (HTTP $http_code)"
        cat /tmp/record_verification.json 2>/dev/null || true
        return 1
    fi
}

test_witness_ledger_access() {
    log_info "Testing witness ledger access..."
    
    local failed_ledgers=()
    
    for i in "${!WITNESS_URLS[@]}"; do
        local witness_url="${WITNESS_URLS[$i]}"
        local witness_id="w$((i+1))"
        
        log_info "Testing ledger access for witness $witness_id"
        
        local response=$(curl -s -w "%{http_code}" -o /tmp/witness_${witness_id}_ledger.json "$witness_url/witness/ledger?limit=5")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            local entry_count=$(jq '.entries | length' /tmp/witness_${witness_id}_ledger.json 2>/dev/null || echo "0")
            log_success "Witness $witness_id ledger accessible ($entry_count entries)"
        else
            log_error "Witness $witness_id ledger access failed (HTTP $http_code)"
            failed_ledgers+=("$witness_id")
        fi
    done
    
    if [ ${#failed_ledgers[@]} -eq 0 ]; then
        log_success "All witness ledgers are accessible"
        return 0
    else
        log_warning "Failed ledger access: ${failed_ledgers[*]}"
        return 1
    fi
}

test_ndjson_streaming() {
    log_info "Testing NDJSON ledger streaming..."
    
    local failed_streams=()
    
    for i in "${!WITNESS_URLS[@]}"; do
        local witness_url="${WITNESS_URLS[$i]}"
        local witness_id="w$((i+1))"
        
        log_info "Testing NDJSON streaming for witness $witness_id"
        
        local response=$(curl -s -w "%{http_code}" -o /tmp/witness_${witness_id}_ndjson.txt "$witness_url/ledger.ndjson?limit=3")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            local line_count=$(wc -l < /tmp/witness_${witness_id}_ndjson.txt 2>/dev/null || echo "0")
            log_success "Witness $witness_id NDJSON streaming working ($line_count lines)"
        else
            log_error "Witness $witness_id NDJSON streaming failed (HTTP $http_code)"
            failed_streams+=("$witness_id")
        fi
    done
    
    if [ ${#failed_streams[@]} -eq 0 ]; then
        log_success "All witness NDJSON streams are working"
        return 0
    else
        log_warning "Failed NDJSON streams: ${failed_streams[*]}"
        return 1
    fi
}

# Main smoke test function
run_smoke_test() {
    log_info "Starting Atlas Smoke Test..."
    log_info "Gateway URL: $GATEWAY_URL"
    log_info "Witness URLs: ${WITNESS_URLS[*]}"
    echo
    
    local test_results=()
    local test_names=(
        "Gateway Health"
        "Witness Health"
        "Record Submission"
        "Record Verification"
        "Witness Ledger Access"
        "NDJSON Streaming"
    )
    
    # Run tests
    test_gateway_health && test_results+=("PASS") || test_results+=("FAIL")
    test_witness_health && test_results+=("PASS") || test_results+=("FAIL")
    test_record_submission && test_results+=("PASS") || test_results+=("FAIL")
    test_record_verification && test_results+=("PASS") || test_results+=("FAIL")
    test_witness_ledger_access && test_results+=("PASS") || test_results+=("FAIL")
    test_ndjson_streaming && test_results+=("PASS") || test_results+=("FAIL")
    
    # Print results
    echo
    log_info "Smoke Test Results:"
    echo "===================="
    
    local passed=0
    local failed=0
    
    for i in "${!test_names[@]}"; do
        local test_name="${test_names[$i]}"
        local result="${test_results[$i]}"
        
        if [ "$result" = "PASS" ]; then
            echo -e "✅ $test_name: ${GREEN}PASS${NC}"
            ((passed++))
        else
            echo -e "❌ $test_name: ${RED}FAIL${NC}"
            ((failed++))
        fi
    done
    
    echo
    echo "Summary: $passed passed, $failed failed"
    
    if [ $failed -eq 0 ]; then
        log_success "All smoke tests passed! 🎉"
        return 0
    else
        log_error "Some smoke tests failed. Check the logs above."
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies and try again."
        exit 1
    fi
}

# Main execution
main() {
    check_dependencies
    run_smoke_test
}

# Run main function
main "$@"
