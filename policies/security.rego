# OPA Security Policy - Atlas Security Headers & Flags
# Enforces security headers and configuration flags

package atlas.security

# Default deny
default allow = false

# Allow if all security checks pass
allow {
  csp_valid
  coop_valid
  coep_valid
  hsts_valid
  trusted_types_valid
  frame_protection_valid
}

# CSP must be nonce-based, no unsafe-inline
csp_valid {
  input.headers["content-security-policy"]
  contains(input.headers["content-security-policy"], "nonce-")
  not contains(input.headers["content-security-policy"], "unsafe-inline")
  contains(input.headers["content-security-policy"], "strict-dynamic")
}

# COOP must be same-origin
coop_valid {
  input.headers["cross-origin-opener-policy"] == "same-origin"
}

# COEP must be require-corp
coep_valid {
  input.headers["cross-origin-embedder-policy"] == "require-corp"
}

# HSTS must be enabled with preload
hsts_valid {
  hsts := input.headers["strict-transport-security"]
  contains(hsts, "max-age=")
  contains(hsts, "includeSubDomains")
  contains(hsts, "preload")
}

# Trusted Types must be configured
trusted_types_valid {
  tt := input.headers["trusted-types"]
  contains(tt, "nextjs#bundler")
}

# Frame protection (X-Frame-Options or frame-ancestors)
frame_protection_valid {
  input.headers["x-frame-options"] == "DENY"
} {
  contains(input.headers["content-security-policy"], "frame-ancestors 'none'")
}

# Security flags validation
flags_valid {
  input.flags.SECURITY_CSP_STRICT.enabled == true
  input.flags.SECURITY_CSP_STRICT.canary_pct == 100
  input.flags.SECURITY_TRUSTED_TYPES.enabled == true
  input.flags.SECURITY_COOP_COEP.enabled == true
  input.flags.SECURITY_HSTS_PRELOAD.enabled == true
}

# DPoP binding check
dpop_valid {
  input.flags.SECURITY_DPOP_ENFORCE.enabled == true
  input.flags.SECURITY_DPOP_ENFORCE.canary_pct >= 10
}

# Violation messages
violation[msg] {
  not csp_valid
  msg := "CSP violation: Must use nonce-based CSP without unsafe-inline"
}

violation[msg] {
  not coop_valid
  msg := "COOP violation: Must be same-origin"
}

violation[msg] {
  not coep_valid
  msg := "COEP violation: Must be require-corp"
}

violation[msg] {
  not hsts_valid
  msg := "HSTS violation: Must include max-age, includeSubDomains, and preload"
}

violation[msg] {
  not trusted_types_valid
  msg := "Trusted-Types violation: Must be configured for nextjs#bundler"
}

violation[msg] {
  not frame_protection_valid
  msg := "Frame protection violation: Must deny all framing"
}
