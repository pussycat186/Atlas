package atlas.security.headers

import future.keywords.if

# Security headers must be present when flags are enabled
violation[msg] {
    input.flags.SECURITY_CSP_STRICT == true
    not input.response_headers["Content-Security-Policy"]
    msg := "CSP header required when SECURITY_CSP_STRICT enabled"
}

violation[msg] {
    input.flags.SECURITY_HSTS_PRELOAD == true
    not input.response_headers["Strict-Transport-Security"]
    msg := "HSTS header required when SECURITY_HSTS_PRELOAD enabled"
}

violation[msg] {
    input.flags.SECURITY_COOP_COEP == true
    not input.response_headers["Cross-Origin-Opener-Policy"]
    msg := "COOP header required when SECURITY_COOP_COEP enabled"
}

violation[msg] {
    input.flags.SECURITY_COOP_COEP == true
    not input.response_headers["Cross-Origin-Embedder-Policy"]
    msg := "COEP header required when SECURITY_COOP_COEP enabled"
}

violation[msg] {
    input.flags.SECURITY_TRUSTED_TYPES == true
    csp := input.response_headers["Content-Security-Policy"]
    not contains(csp, "trusted-types")
    msg := "Trusted Types directive required in CSP when flag enabled"
}

# TLS version enforcement
violation[msg] {
    input.flags.SECURITY_TLS13_STRICT == true
    tls_version := input.connection.tls_version
    tls_version != "TLS1.3"
    msg := sprintf("TLS 1.3 required, found %s", [tls_version])
}