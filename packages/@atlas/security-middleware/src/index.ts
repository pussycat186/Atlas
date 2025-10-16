import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export interface SecurityConfig {
  app: 'admin_insights' | 'dev_portal' | 'proof_messenger' | 'messenger' | 'verify';
  cspNonce?: boolean;
  trustedTypes?: boolean;
  coopPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  coepPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none';
  hstsEnabled?: boolean;
  dpopEnabled?: boolean;
  frameProtection?: boolean;
  strictReferrer?: boolean;
  permissionsPolicy?: boolean;
  mtlsInternal?: boolean;
}

// Load security flags (would be replaced with actual flag loading)
function loadSecurityFlags(): Record<string, { enabled: boolean; canary_pct: number; apps: string[] }> {
  // ATLAS_PERFECT_MODE_CLOSEOUT - Production flags enabled at 100%
  return {
    SECURITY_CSP_STRICT: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_TRUSTED_TYPES: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_SRI_REQUIRED: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_COOP_COEP: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_HSTS_PRELOAD: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_CSRF_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_TLS13_STRICT: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_OPA_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    // Legacy flags for backward compatibility
    SECURITY_CSP_NONCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_COOP_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_COEP_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_HSTS_PROD_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_DPOP_ENFORCE: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_FRAME_PROTECTION: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_REFERRER_STRICT: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_PERMISSIONS_POLICY: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] },
    SECURITY_TRANSPORT_HARDENING: { enabled: true, canary_pct: 100, apps: ['admin_insights', 'dev_portal', 'proof_messenger', 'messenger'] }
  };
}

function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

function isFeatureEnabled(flagName: string, app: string): boolean {
  const flags = loadSecurityFlags();
  const flag = flags[flagName];
  
  if (!flag || !flag.enabled) {
    return false;
  }
  
  return flag.apps.includes(app);
}

export function createSecurityHeaders(config: SecurityConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  const { app } = config;
  
  // CSP with nonces and Trusted Types
  if (isFeatureEnabled('SECURITY_CSP_NONCE', app) || isFeatureEnabled('SECURITY_CSP_STRICT', app)) {
    const nonce = generateNonce();
    const cspPolicies = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "connect-src 'self' https://api.github.com wss: ws:",
      "media-src 'self' data:",
      "worker-src 'self' blob:"
    ];
    
    // Add Trusted Types if enabled
    if (isFeatureEnabled('SECURITY_TRUSTED_TYPES', app)) {
      cspPolicies.push("trusted-types nextjs#bundler atlas default 'allow-duplicates'");
      cspPolicies.push("require-trusted-types-for 'script'");
      headers['Trusted-Types'] = 'nextjs#bundler atlas default';
    }
    
    headers['Content-Security-Policy'] = cspPolicies.join('; ');
    headers['X-CSP-Nonce'] = nonce; // Custom header to pass nonce to components
  }
  
  // COOP (Cross-Origin Opener Policy)
  if (isFeatureEnabled('SECURITY_COOP_ENFORCE', app)) {
    headers['Cross-Origin-Opener-Policy'] = config.coopPolicy || 'same-origin';
  }
  
  // COEP (Cross-Origin Embedder Policy)
  if (isFeatureEnabled('SECURITY_COEP_ENFORCE', app)) {
    headers['Cross-Origin-Embedder-Policy'] = config.coepPolicy || 'require-corp';
  }
  
  // CORP (Cross-Origin Resource Policy)
  if (isFeatureEnabled('SECURITY_COEP_ENFORCE', app)) {
    headers['Cross-Origin-Resource-Policy'] = 'same-site';
  }
  
  // HSTS (HTTP Strict Transport Security)
  if (isFeatureEnabled('SECURITY_HSTS_PROD_ENFORCE', app)) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }
  }
  
  // Frame protection
  if (isFeatureEnabled('SECURITY_FRAME_PROTECTION', app)) {
    headers['X-Frame-Options'] = 'DENY';
  }
  
  // Referrer policy
  if (isFeatureEnabled('SECURITY_REFERRER_STRICT', app)) {
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  }
  
  // Permissions Policy
  if (isFeatureEnabled('SECURITY_PERMISSIONS_POLICY', app)) {
    const permissions = [
      'geolocation=()',
      'camera=(self)',
      'microphone=(self)', 
      'usb=()',
      'bluetooth=()',
      'payment=(self)',
      'gyroscope=()',
      'accelerometer=()',
      'magnetometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)'
    ];
    headers['Permissions-Policy'] = permissions.join(', ');
  }
  
  // Additional security headers
  if (isFeatureEnabled('SECURITY_TRANSPORT_HARDENING', app)) {
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
  }
  
  return headers;
}

export function createDPoPHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // DPoP token validation (simplified)
  const dpopHeader = request.headers.get('DPoP');
  const authHeader = request.headers.get('Authorization');
  
  if (!dpopHeader && authHeader?.startsWith('DPoP ')) {
    headers['WWW-Authenticate'] = 'DPoP realm="Atlas API", error="invalid_dpop_proof"';
    return headers;
  }
  
  if (dpopHeader) {
    // Would implement full DPoP validation here
    headers['DPoP-Nonce'] = generateNonce();
  }
  
  return headers;
}

export function securityMiddleware(config: SecurityConfig) {
  return function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    // Apply security headers
    const securityHeaders = createSecurityHeaders(config);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Apply DPoP if enabled
    if (isFeatureEnabled('SECURITY_DPOP_ENFORCE', config.app)) {
      const dpopHeaders = createDPoPHeaders(request);
      Object.entries(dpopHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

// CSRF protection with Fetch Metadata
export function validateFetchMetadata(request: NextRequest): boolean {
  const site = request.headers.get('Sec-Fetch-Site');
  const mode = request.headers.get('Sec-Fetch-Mode');
  const dest = request.headers.get('Sec-Fetch-Dest');
  
  // Allow same-origin requests
  if (site === 'same-origin') return true;
  
  // Allow simple navigation requests
  if (site === 'none' && mode === 'navigate') return true;
  
  // Allow same-site requests for navigation and images
  if (site === 'same-site' && (mode === 'navigate' || dest === 'image')) return true;
  
  // Block cross-site requests by default
  if (site === 'cross-site') return false;
  
  return true;
}

// mTLS internal service communication
export function validateInternalRequest(request: NextRequest): boolean {
  const clientCert = request.headers.get('X-Client-Cert-Fingerprint');
  const internalAuth = request.headers.get('X-Atlas-Internal-Auth');
  
  // In production, would validate actual client certificates
  if (process.env.NODE_ENV === 'production') {
    return clientCert !== null || internalAuth === process.env.ATLAS_INTERNAL_KEY;
  }
  
  return true; // Allow in development
}

export * from './types';

// Export default middleware factory
export default securityMiddleware;