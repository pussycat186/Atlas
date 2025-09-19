package atlas.drive

# Atlas Drive Service Authorization Policy
# Implements zero-trust principles for file storage

import rego.v1

# Default deny all
default allow := false

# Allow health checks
allow if {
    input.method == "GET"
    input.path == "/health"
}

# Allow metrics collection
allow if {
    input.method == "GET"
    input.path == "/metrics"
    input.source.workload_id == "monitoring"
}

# Allow file upload from proof-messenger
allow if {
    input.method == "POST"
    input.path == "/files"
    input.source.workload_id == "proof-messenger"
    input.auth.authenticated == true
    input.auth.user_id != ""
}

# Allow file retrieval from proof-messenger
allow if {
    input.method == "GET"
    input.path == "/files"
    input.source.workload_id == "proof-messenger"
    input.auth.authenticated == true
    input.auth.user_id != ""
}

# Allow admin file operations
allow if {
    input.method in ["GET", "POST", "PUT", "DELETE"]
    input.path == "/admin/files"
    input.source.workload_id == "admin-insights"
    input.auth.role == "admin"
    input.auth.authenticated == true
}

# Allow file operations from gateway
allow if {
    input.method in ["GET", "POST"]
    input.path == "/files"
    input.source.workload_id == "gateway"
    input.auth.workload_verified == true
}

# Deny access to internal file operations from external sources
deny if {
    input.path == "/internal/files"
    input.source.type == "external"
}

# Deny access without proper authentication
deny if {
    input.auth.authenticated != true
    input.path != "/health"
    input.path != "/metrics"
}

# File size limits based on source
file_size_limits := {
    "proof-messenger": 10485760,  # 10MB
    "admin-insights": 104857600,  # 100MB
    "gateway": 1048576,           # 1MB
    "external": 102400            # 100KB
}

# Get file size limit for source
get_file_size_limit(source) := limit if {
    limit := file_size_limits[source]
} else := 102400

# Allow if within file size limit
allow if {
    input.file_size <= get_file_size_limit(input.source.workload_id)
}

# Drive-specific rate limiting
drive_rate_limit := {
    "proof-messenger": 100,
    "admin-insights": 50,
    "gateway": 200,
    "monitoring": 10
}

# Get rate limit for drive operations
get_drive_rate_limit(source) := limit if {
    limit := drive_rate_limit[source]
} else := 10

# Allow if within drive rate limit
allow if {
    input.rate_limit.current < get_drive_rate_limit(input.source.workload_id)
}
