package atlas.runtime.security

import future.keywords.if

# Runtime security enforcement when flags enabled
violation[msg] {
    input.flags.SECURITY_RUNTIME_SANDBOX == true
    not input.runtime.sandboxed
    msg := "Runtime sandboxing required when SECURITY_RUNTIME_SANDBOX enabled"
}

violation[msg] {
    input.flags.SECURITY_EGRESS_ALLOWLIST == true
    egress_host := input.network.egress_hosts[_]
    not egress_host in input.config.allowed_hosts
    msg := sprintf("Egress to %s blocked by allowlist", [egress_host])
}

violation[msg] {
    input.flags.SECURITY_SSRF_GUARD == true
    request_url := input.request.url
    contains(request_url, "localhost")
    msg := "SSRF protection: localhost requests blocked"
}

violation[msg] {
    input.flags.SECURITY_SSRF_GUARD == true
    request_url := input.request.url
    contains(request_url, "127.0.0.1")
    msg := "SSRF protection: loopback IP requests blocked"
}

# Privacy controls
violation[msg] {
    input.flags.OTEL_REDACTION_ENFORCE == true
    telemetry_data := input.telemetry.data
    contains(telemetry_data, input.patterns.pii_pattern)
    msg := "PII detected in telemetry data - redaction required"
}

violation[msg] {
    input.flags.SECURITY_PII_REDACTION_STRICT == true
    log_entry := input.logs.entries[_]
    contains(log_entry, "@")  # Email pattern
    msg := "Potential email address in logs requires redaction"
}

# Device attestation for sensitive operations
violation[msg] {
    input.flags.SECURITY_DEVICE_ATTESTATION == true
    input.request.sensitive_operation == true
    not input.request.device_attested
    msg := "Device attestation required for sensitive operations"
}