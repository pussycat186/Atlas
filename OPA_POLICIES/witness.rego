package atlas.witness

# Atlas Witness Node Authorization Policy
# Implements zero-trust principles for witness consensus

import rego.v1

# Default deny all
default allow := false

# Allow health checks
allow if {
    input.method == "GET"
    input.path == "/witness/health"
}

# Allow metrics collection
allow if {
    input.method == "GET"
    input.path == "/metrics"
    input.source.workload_id == "monitoring"
}

# Allow ledger operations from gateway
allow if {
    input.method == "POST"
    input.path == "/witness/ledger"
    input.source.workload_id == "gateway"
    input.auth.workload_verified == true
}

# Allow witness-to-witness communication for consensus
allow if {
    input.method == "POST"
    input.path == "/witness/consensus"
    input.source.workload_id == "witness-node"
    input.auth.workload_verified == true
    input.auth.witness_id != ""
}

# Allow ledger queries from authorized sources
allow if {
    input.method == "GET"
    input.path == "/witness/ledger"
    input.source.workload_id in ["gateway", "admin-insights"]
    input.auth.workload_verified == true
}

# Deny access from external sources
deny if {
    input.source.type == "external"
    input.path != "/witness/health"
    input.path != "/metrics"
}

# Deny access without workload verification
deny if {
    input.auth.workload_verified != true
    input.path != "/witness/health"
    input.path != "/metrics"
}

# Witness-specific rate limiting
witness_rate_limit := {
    "gateway": 1000,
    "witness-node": 500,
    "admin-insights": 100,
    "monitoring": 50
}

# Get rate limit for witness operations
get_witness_rate_limit(source) := limit if {
    limit := witness_rate_limit[source]
} else := 10

# Allow if within witness rate limit
allow if {
    input.rate_limit.current < get_witness_rate_limit(input.source.workload_id)
}
