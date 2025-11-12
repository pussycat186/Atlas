# OPA Policy: Security Headers Validation
# Kiểm tra security headers phải có và đúng format

package atlas.security.headers

# Deny nếu thiếu required headers
deny[msg] {
  input.headers
  not input.headers["content-security-policy"]
  msg := "Content-Security-Policy header is missing"
}

deny[msg] {
  input.headers
  not input.headers["strict-transport-security"]
  msg := "Strict-Transport-Security header is missing"
}

deny[msg] {
  input.headers
  not input.headers["cross-origin-opener-policy"]
  msg := "Cross-Origin-Opener-Policy header is missing"
}

deny[msg] {
  input.headers
  not input.headers["cross-origin-embedder-policy"]
  msg := "Cross-Origin-Embedder-Policy header is missing"
}

deny[msg] {
  input.headers
  not input.headers["x-content-type-options"]
  msg := "X-Content-Type-Options header is missing"
}

deny[msg] {
  input.headers
  not input.headers["x-frame-options"]
  msg := "X-Frame-Options header is missing"
}

# Deny nếu CSP không có 'self' hoặc strict-dynamic
deny[msg] {
  csp := input.headers["content-security-policy"]
  not contains(csp.value, "'self'")
  not contains(csp.value, "strict-dynamic")
  msg := "Content-Security-Policy must contain 'self' or 'strict-dynamic'"
}

# Deny nếu HSTS max-age < 2 years (63072000 seconds)
deny[msg] {
  hsts := input.headers["strict-transport-security"]
  not contains(hsts.value, "max-age=63072000")
  msg := "Strict-Transport-Security must have max-age=63072000 (2 years)"
}

# Deny nếu COOP không phải same-origin
deny[msg] {
  coop := input.headers["cross-origin-opener-policy"]
  not contains(coop.value, "same-origin")
  msg := "Cross-Origin-Opener-Policy must be 'same-origin'"
}

# Deny nếu COEP không phải require-corp
deny[msg] {
  coep := input.headers["cross-origin-embedder-policy"]
  not contains(coep.value, "require-corp")
  msg := "Cross-Origin-Embedder-Policy must be 'require-corp'"
}

# Warn nếu không có Referrer-Policy
warn[msg] {
  input.headers
  not input.headers["referrer-policy"]
  msg := "Referrer-Policy header is recommended"
}

# Helper function
contains(str, substr) {
  indexof(str, substr) >= 0
}
