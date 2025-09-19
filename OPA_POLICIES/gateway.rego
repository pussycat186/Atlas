package atlas.gateway

# Atlas Gateway Authorization Policy
# Implements zero-trust principles with least-privilege access

import rego.v1

# Default deny all
default allow := false

# Allow health checks from any source
allow if {
    input.method == "GET"
    input.path == "/health"
}

# Allow metrics from monitoring systems
allow if {
    input.method == "GET"
    input.path == "/metrics"
    input.source.workload_id == "monitoring"
}

# Allow message submission with proper authentication
allow if {
    input.method == "POST"
    input.path == "/record"
    input.source.workload_id == "proof-messenger"
    input.auth.authenticated == true
    input.auth.user_id != ""
}

# Allow witness communication
allow if {
    input.method == "POST"
    input.path == "/witness/submit"
    input.source.workload_id == "witness-node"
    input.auth.workload_verified == true
}

# Allow drive service communication
allow if {
    input.method in ["GET", "POST"]
    input.path == "/drive/files"
    input.source.workload_id == "drive-service"
    input.auth.workload_verified == true
}

# Allow admin operations with admin role
allow if {
    input.method in ["GET", "POST", "PUT", "DELETE"]
    input.path == "/admin"
    input.auth.role == "admin"
    input.auth.authenticated == true
}

# Deny access to internal endpoints from external sources
deny if {
    input.path == "/internal"
    input.source.type == "external"
}

# Deny access without proper authentication
deny if {
    input.auth.authenticated != true
    input.path != "/health"
    input.path != "/metrics"
}

# Deny access with invalid workload identity
deny if {
    input.source.workload_id == ""
    input.path != "/health"
    input.path != "/metrics"
}

# Rate limiting based on source
rate_limit := {
    "proof-messenger": 1000,
    "witness-node": 500,
    "drive-service": 200,
    "admin": 100,
    "external": 10
}

# Get rate limit for source
get_rate_limit(source) := limit if {
    limit := rate_limit[source]
} else := 10

# Allow if within rate limit
allow if {
    input.rate_limit.current < get_rate_limit(input.source.workload_id)
}
