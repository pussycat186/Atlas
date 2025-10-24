/**
 * Security Headers Middleware
 * Implements web hardening: CSP, Trusted Types, COOP, COEP, HSTS, etc.
 */

export function securityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );

  // Trusted Types (if supported)
  headers.set(
    'Content-Security-Policy',
    headers.get('Content-Security-Policy') + "; require-trusted-types-for 'script'"
  );

  // Cross-Origin Policies
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Other security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server identification
  headers.delete('Server');
  headers.delete('X-Powered-By');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
