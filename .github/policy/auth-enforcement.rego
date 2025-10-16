package atlas.auth.enforcement

import future.keywords.if

# DPoP token validation when enforcement enabled
violation[msg] {
    input.flags.SECURITY_DPOP_ENFORCE == true
    input.request.protected_endpoint == true
    not input.request.headers["DPoP"]
    msg := "DPoP header required for protected endpoints when enforcement enabled"
}

violation[msg] {
    input.flags.SECURITY_CSRF_ENFORCE == true
    input.request.method in ["POST", "PUT", "DELETE", "PATCH"]
    not input.request.headers["X-CSRF-Token"]
    not input.request.headers["X-Requested-With"]
    msg := "CSRF protection required for state-changing operations"
}

# mTLS enforcement for internal services
violation[msg] {
    input.flags.SECURITY_MTLS_INTERNAL == true
    input.request.internal_service == true
    not input.connection.client_cert_verified
    msg := "mTLS client certificate required for internal services"
}

# PII field encryption validation
violation[msg] {
    input.flags.SECURITY_FIELD_ENCRYPTION == true
    input.data.contains_pii == true
    not input.data.encrypted
    msg := "PII data must be encrypted when SECURITY_FIELD_ENCRYPTION enabled"
}