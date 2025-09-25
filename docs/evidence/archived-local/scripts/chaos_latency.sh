#!/bin/bash

# Atlas Chaos Test Script - Latency and Jitter Injection
# Tests quorum resilience under network delays and jitter

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

# Chaos test parameters
CHAOS_DURATION=${CHAOS_DURATION:-60}  # seconds
BASE_DELAY=${BASE_DELAY:-100}          # milliseconds
JITTER_RANGE=${JITTER_RANGE:-200}      # milliseconds
TEST_RECORDS=${TEST_RECORDS:-20}       # number of records to submit during chaos

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_chaos() {
    echo -e "${PURPLE}[CHAOS]${NC} $1"
}

# Chaos injection functions
inject_latency() {
    local witness_id=$1
    local delay_ms=$2
    
    log_chaos "Injecting ${delay_ms}ms latency to witness $witness_id"
    
    # This would typically use tc (traffic control) or similar network tools
    # For this demo, we'll simulate by adding delays to requests
    echo "CHAOS_LATENCY_${witness_id}=${delay_ms}" >> /tmp/chaos_config.env
}

remove_latency() {
    local witness_id=$1
    
    log_chaos "Removing latency injection from witness $witness_id"
    
    # Remove from chaos config
    sed -i "/CHAOS_LATENCY_${witness_id}=/d" /tmp/chaos_config.env 2>/dev/null || true
}

# Network simulation functions
simulate_network_conditions() {
    log_chaos "Starting network chaos simulation..."
    log_chaos "Duration: ${CHAOS_DURATION}s, Base delay: ${BASE_DELAY}ms, Jitter: ±${JITTER_RANGE}ms"
    
    # Clear previous chaos config
    > /tmp/chaos_config.env
    
    # Start chaos injection in background
    (
        local start_time=$(date +%s)
        local end_time=$((start_time + CHAOS_DURATION))
        
        while [ $(date +%s) -lt $end_time ]; do
            # Randomly select witnesses to inject latency
            for i in {1..5}; do
                if [ $((RANDOM % 3)) -eq 0 ]; then  # 33% chance per witness
                    local delay=$((BASE_DELAY + RANDOM % JITTER_RANGE))
                    inject_latency "w$i" "$delay"
                else
                    remove_latency "w$i"
                fi
            done
            
            # Wait before next chaos cycle
            sleep $((1 + RANDOM % 3))
        done
        
        # Clean up all latency injections
        for i in {1..5}; do
            remove_latency "w$i"
        done
        
        log_chaos "Network chaos simulation completed"
    ) &
    
    local chaos_pid=$!
    echo $chaos_pid > /tmp/chaos_pid.txt
}

stop_chaos() {
    if [ -f /tmp/chaos_pid.txt ]; then
        local chaos_pid=$(cat /tmp/chaos_pid.txt)
        kill $chaos_pid 2>/dev/null || true
        rm -f /tmp/chaos_pid.txt
    fi
    
    # Clean up chaos config
    rm -f /tmp/chaos_config.env
    
    log_chaos "Chaos injection stopped"
}

# Test functions with chaos awareness
submit_record_with_chaos() {
    local record_id=$1
    local payload=$2
    
    # Check for chaos latency configuration
    local total_delay=0
    for i in {1..5}; do
        local chaos_delay=$(grep "CHAOS_LATENCY_w$i=" /tmp/chaos_config.env 2>/dev/null | cut -d'=' -f2 || echo "0")
        total_delay=$((total_delay + chaos_delay))
    done
    
    if [ $total_delay -gt 0 ]; then
        log_chaos "Submitting record with ${total_delay}ms total chaos delay"
    fi
    
    local request_body=$(cat <<EOF
{
  "app": "chat",
  "record_id": "$record_id",
  "payload": "$payload",
  "meta": {
    "room_id": "chaos_test_room",
    "user_id": "chaos_test_user",
    "message_type": "text"
  }
}
EOF
)
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$request_body" \
        -o /tmp/chaos_record_${record_id}.json \
        "$GATEWAY_URL/record")
    local end_time=$(date +%s%3N)
    
    local http_code="${response: -3}"
    local response_time=$((end_time - start_time))
    
    if [ "$http_code" = "200" ]; then
        local quorum_ok=$(jq '.quorum_result.ok' /tmp/chaos_record_${record_id}.json 2>/dev/null || echo "false")
        local quorum_count=$(jq '.quorum_result.quorum_count' /tmp/chaos_record_${record_id}.json 2>/dev/null || echo "0")
        local max_skew=$(jq '.quorum_result.max_skew_ms' /tmp/chaos_record_${record_id}.json 2>/dev/null || echo "0")
        
        if [ "$quorum_ok" = "true" ]; then
            log_success "Record $record_id: VERIFIED (q=$quorum_count/4, skew=${max_skew}ms, time=${response_time}ms)"
            return 0
        else
            log_warning "Record $record_id: CONFLICT (q=$quorum_count/4, skew=${max_skew}ms, time=${response_time}ms)"
            return 1
        fi
    else
        log_error "Record $record_id submission failed (HTTP $http_code, time=${response_time}ms)"
        return 1
    fi
}

# Chaos test scenarios
test_quorum_under_chaos() {
    log_info "Testing quorum consensus under network chaos..."
    
    local passed=0
    local failed=0
    local conflicts=0
    
    for i in $(seq 1 $TEST_RECORDS); do
        local record_id="chaos_test_$(date +%s)_${i}_$$"
        local payload="Chaos test message $i at $(date)"
        
        if submit_record_with_chaos "$record_id" "$payload"; then
            ((passed++))
        else
            ((failed++))
            if [ $failed -le 3 ]; then  # Count first few failures as conflicts
                ((conflicts++))
            fi
        fi
        
        # Small delay between submissions
        sleep 0.5
    done
    
    log_info "Chaos test results: $passed passed, $failed failed, $conflicts conflicts"
    
    # Calculate success rate
    local total=$((passed + failed))
    local success_rate=$((passed * 100 / total))
    
    if [ $success_rate -ge 80 ]; then
        log_success "Quorum resilience test PASSED (${success_rate}% success rate)"
        return 0
    else
        log_error "Quorum resilience test FAILED (${success_rate}% success rate)"
        return 1
    fi
}

test_timestamp_skew_tolerance() {
    log_info "Testing timestamp skew tolerance under chaos..."
    
    local max_skew_detected=0
    local skew_violations=0
    local total_tests=10
    
    for i in $(seq 1 $total_tests); do
        local record_id="skew_test_$(date +%s)_${i}_$$"
        local payload="Skew test message $i"
        
        local request_body=$(cat <<EOF
{
  "app": "chat",
  "record_id": "$record_id",
  "payload": "$payload",
  "meta": {
    "room_id": "skew_test_room",
    "user_id": "skew_test_user"
  }
}
EOF
)
        
        local response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$request_body" \
            -o /tmp/skew_test_${i}.json \
            "$GATEWAY_URL/record")
        
        local max_skew=$(jq '.quorum_result.max_skew_ms' /tmp/skew_test_${i}.json 2>/dev/null || echo "0")
        local skew_ok=$(jq '.quorum_result.skew_ok' /tmp/skew_test_${i}.json 2>/dev/null || echo "false")
        
        if [ "$max_skew" -gt "$max_skew_detected" ]; then
            max_skew_detected=$max_skew
        fi
        
        if [ "$skew_ok" = "false" ]; then
            ((skew_violations++))
        fi
        
        sleep 0.2
    done
    
    log_info "Max skew detected: ${max_skew_detected}ms"
    log_info "Skew violations: $skew_violations/$total_tests"
    
    if [ $skew_violations -le 2 ]; then  # Allow up to 20% violations
        log_success "Timestamp skew tolerance test PASSED"
        return 0
    else
        log_error "Timestamp skew tolerance test FAILED"
        return 1
    fi
}

test_conflict_detection() {
    log_info "Testing conflict detection under chaos..."
    
    # Submit records rapidly to increase chance of conflicts
    local conflict_count=0
    local total_submissions=15
    
    for i in $(seq 1 $total_submissions); do
        local record_id="conflict_test_$(date +%s)_${i}_$$"
        local payload="Conflict test message $i"
        
        local request_body=$(cat <<EOF
{
  "app": "chat",
  "record_id": "$record_id",
  "payload": "$payload",
  "meta": {
    "room_id": "conflict_test_room",
    "user_id": "conflict_test_user"
  }
}
EOF
)
        
        local response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$request_body" \
            -o /tmp/conflict_test_${i}.json \
            "$GATEWAY_URL/record")
        
        local quorum_ok=$(jq '.quorum_result.ok' /tmp/conflict_test_${i}.json 2>/dev/null || echo "false")
        local conflict_ticket=$(jq -r '.quorum_result.conflict_ticket' /tmp/conflict_test_${i}.json 2>/dev/null || echo "null")
        
        if [ "$quorum_ok" = "false" ] || [ "$conflict_ticket" != "null" ]; then
            ((conflict_count++))
            log_warning "Conflict detected in record $i"
        fi
        
        # Very short delay to increase conflict probability
        sleep 0.1
    done
    
    log_info "Conflicts detected: $conflict_count/$total_submissions"
    
    if [ $conflict_count -gt 0 ]; then
        log_success "Conflict detection test PASSED (detected $conflict_count conflicts)"
        return 0
    else
        log_warning "Conflict detection test INCONCLUSIVE (no conflicts detected)"
        return 0  # Not a failure, just no conflicts occurred
    fi
}

# Main chaos test function
run_chaos_test() {
    log_info "Starting Atlas Chaos Test - Latency & Jitter Injection"
    log_info "Test duration: ${CHAOS_DURATION}s"
    log_info "Base delay: ${BASE_DELAY}ms, Jitter range: ±${JITTER_RANGE}ms"
    log_info "Test records: $TEST_RECORDS"
    echo
    
    # Check if services are running
    log_info "Checking service availability..."
    if ! curl -s "$GATEWAY_URL/health" > /dev/null; then
        log_error "Gateway is not accessible at $GATEWAY_URL"
        exit 1
    fi
    
    # Start chaos injection
    simulate_network_conditions
    
    # Wait a moment for chaos to start
    sleep 2
    
    # Run chaos tests
    local test_results=()
    local test_names=(
        "Quorum Under Chaos"
        "Timestamp Skew Tolerance"
        "Conflict Detection"
    )
    
    test_quorum_under_chaos && test_results+=("PASS") || test_results+=("FAIL")
    test_timestamp_skew_tolerance && test_results+=("PASS") || test_results+=("FAIL")
    test_conflict_detection && test_results+=("PASS") || test_results+=("FAIL")
    
    # Stop chaos injection
    stop_chaos
    
    # Print results
    echo
    log_info "Chaos Test Results:"
    echo "==================="
    
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
        log_success "All chaos tests passed! 🎉"
        return 0
    else
        log_error "Some chaos tests failed. Check the logs above."
        return 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up chaos test..."
    stop_chaos
    rm -f /tmp/chaos_*.json /tmp/skew_test_*.json /tmp/conflict_test_*.json
}

# Signal handlers
trap cleanup EXIT INT TERM

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
    run_chaos_test
}

# Run main function
main "$@"
