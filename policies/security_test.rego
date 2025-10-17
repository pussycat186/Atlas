# OPA Security Policy Tests
package atlas.security

# Test CSP validation
test_csp_valid {
  allow with input as {
    "headers": {
      "content-security-policy": "default-src 'self'; script-src 'self' 'nonce-abc123' 'strict-dynamic'; frame-ancestors 'none'",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "trusted-types": "nextjs#bundler atlas default",
      "x-frame-options": "DENY"
    },
    "flags": {
      "SECURITY_CSP_STRICT": {"enabled": true, "canary_pct": 100},
      "SECURITY_TRUSTED_TYPES": {"enabled": true, "canary_pct": 100},
      "SECURITY_COOP_COEP": {"enabled": true, "canary_pct": 100},
      "SECURITY_HSTS_PRELOAD": {"enabled": true, "canary_pct": 100},
      "SECURITY_DPOP_ENFORCE": {"enabled": true, "canary_pct": 100}
    }
  }
}

test_csp_unsafe_inline_denied {
  not allow with input as {
    "headers": {
      "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "trusted-types": "nextjs#bundler",
      "x-frame-options": "DENY"
    }
  }
}

test_missing_hsts_denied {
  not allow with input as {
    "headers": {
      "content-security-policy": "default-src 'self'; script-src 'self' 'nonce-abc' 'strict-dynamic'",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
      "trusted-types": "nextjs#bundler",
      "x-frame-options": "DENY"
    }
  }
}
