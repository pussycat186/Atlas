/**
 * Atlas Security Middleware - Dev Portal
 * ATLAS_PERFECT_MODE_CLOSEOUT with all security headers enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import securityMiddleware from '@atlas/security-middleware';

// Dev Portal specific security configuration for ATLAS_PERFECT_MODE_CLOSEOUT
const devPortalSecurityConfig = {
  app: 'dev_portal' as const,
  cspNonce: true,
  trustedTypes: true,
  coopPolicy: 'same-origin-allow-popups' as const, // Allow OAuth popups
  coepPolicy: 'credentialless' as const, // Less strict for dev resources
  hstsEnabled: true,
  dpopEnabled: true,
  frameProtection: true,
  strictReferrer: true,
  permissionsPolicy: true,
  mtlsInternal: true
};

// Create security middleware for dev-portal with all flags enabled
const devPortalSecurityMiddleware = securityMiddleware(devPortalSecurityConfig);
    'fullscreen': ['self'],
    'picture-in-picture': ['self']
  }
};

// Create S4 security middleware for dev-portal
const s4SecurityMiddleware = createSecurityMiddleware('dev-portal', devPortalSecurityConfig);

/**
 * S4 Security middleware for dev-portal
 * Handles DPoP enforcement and transport security hardening
 */
export async function middleware(request: NextRequest) {
  // 1. Check DPoP enforcement for protected routes
  if (isDPoPProtectedRoute(request.nextUrl.pathname)) {
    const dpopHeader = request.headers.get('DPoP');
    const authHeader = request.headers.get('Authorization');
    
    if (!dpopHeader) {
      return new NextResponse('DPoP proof required', { 
        status: 400,
        headers: {
          'WWW-Authenticate': 'DPoP',
          'X-Error': 'missing-dpop-proof'
        }
      });
    }

    // Validate DPoP proof
    const accessToken = authHeader?.replace('DPoP ', '');
    const isValidDPoP = DPoPManager.validateDPoPProof(
      dpopHeader,
      request.method,
      request.nextUrl.href,
      accessToken
    );

    if (!isValidDPoP) {
      return new NextResponse('Invalid DPoP proof', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'DPoP error="invalid_dpop_proof"',
          'X-Error': 'invalid-dpop-proof'
        }
      });
    }
  }

  // 2. Apply S4 security headers
  const response = s4SecurityMiddleware(request);
  
  // Dev portal specific headers
  response.headers.set('X-Developer-Portal', 'true');
  response.headers.set('X-API-Version', 'v1');
  response.headers.set('X-Security-Level', 'S4-DEVPORTAL');
  
  // Set app context for security config
  process.env.ATLAS_APP_NAME = appName;
  
  // Generate security headers
  const securityHeaders = getSecurityHeaders();
  
  // Apply headers to response
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });
  
  // Add CSP nonce to request for use in components
  const cspNonce = extractCSPNonce(securityHeaders);
  if (cspNonce) {
    response.headers.set('X-CSP-Nonce', cspNonce);
  }
  
  // Log security status in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🛡️  Security headers applied for ${appName}:`, {
      headerCount: securityHeaders.length,
      cspNonce: cspNonce ? `${cspNonce.substring(0, 8)}...` : 'none',
      flagsEnabled: getEnabledSecurityFlags()
    });
  }
  
  return response;
}

/**
 * Detect application name from request
 */
function detectAppName(request: NextRequest): string {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;
  
  // Detect from Vercel deployment URLs
  if (hostname.includes('admin-insights')) return 'admin_insights';
  if (hostname.includes('dev-portal')) return 'dev_portal';
  if (hostname.includes('proof-messenger')) return 'proof_messenger';
  
  // Detect from local development paths
  if (pathname.includes('/admin-insights')) return 'admin_insights';
  if (pathname.includes('/dev-portal')) return 'dev_portal';
  if (pathname.includes('/proof-messenger')) return 'proof_messenger';
  
  // Default based on common patterns
  if (hostname.includes('admin')) return 'admin_insights';
  if (hostname.includes('dev')) return 'dev_portal';
  if (hostname.includes('proof')) return 'proof_messenger';
  
  return 'dev_portal'; // Safe default for development
}

/**
 * Get security headers with fallback for when security config is not available
 */
function getSecurityHeaders() {
  // Try to use Atlas security config
  if (atlasSecurityConfig && atlasSecurityConfig.getSecurityHeaders) {
    try {
      return atlasSecurityConfig.getSecurityHeaders();
    } catch (error) {
      console.error('Failed to load security headers from config:', error);
    }
  }
  
  // Fallback to safe default headers
  return getDefaultSecurityHeaders();
}

/**
 * Default security headers when flags system is not available
 */
function getDefaultSecurityHeaders() {
  return [
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY'
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains'
    },
    // Basic CSP without nonce (safe default)
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.vercel.app; frame-ancestors 'none'"
    }
  ];
}

/**
 * Extract CSP nonce from security headers
 */
function extractCSPNonce(headers: Array<{key: string, value: string}>): string | null {
  const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
  if (!cspHeader) return null;
  
  const nonceMatch = cspHeader.value.match(/nonce-([A-Za-z0-9+/=]+)/);
  return nonceMatch ? nonceMatch[1] : null;
}

/**
 * Get list of enabled security flags for logging
 */
function getEnabledSecurityFlags(): string[] {
  if (!atlasSecurityConfig || !atlasSecurityConfig.isSecurityFeatureEnabled) {
    return ['fallback-mode'];
  }
  
  const flagsToCheck = [
    'SECURITY_CSP_STRICT',
    'SECURITY_TRUSTED_TYPES',
    'SECURITY_SRI_REQUIRED',
    'SECURITY_COOP_COEP',
    'SECURITY_HSTS_PRELOAD'
  ];
  
  return flagsToCheck.filter(flag => {
    try {
      return atlasSecurityConfig.isSecurityFeatureEnabled(flag);
    } catch {
      return false;
    }
  // Log S4 security status in development
  if (process.env.NODE_ENV === 'development') {
    const nonce = response.headers.get('X-Request-Nonce');
    console.log(`🛡️  S4 Dev Portal Security Applied:`, {
      app: 'dev-portal',
      dpopRequired: isDPoPProtectedRoute(request.nextUrl.pathname),
      nonce: nonce ? `${nonce.substring(0, 8)}...` : 'none',
      coop: response.headers.get('Cross-Origin-Opener-Policy'),
      coep: response.headers.get('Cross-Origin-Embedder-Policy'),
      trustedTypes: response.headers.get('Content-Security-Policy')?.includes('require-trusted-types')
    });
  }

  return response;
}

/**
 * Check if route requires DPoP protection
 */
function isDPoPProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/api/auth/',
    '/api/admin/',
    '/api/keys/',
    '/api/secrets/',
    '/dashboard/admin',
    '/settings/security'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};