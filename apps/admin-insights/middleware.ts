/**
 * Atlas Security Middleware - Admin Insights
 * Next.js middleware for security header injection based on flags
 * Supports CSP nonces, Trusted Types, and canary rollout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSecurityMiddleware } from '../../middleware/security-headers';

// Admin Insights specific security configuration for S4
const adminInsightsSecurityConfig = {
  // Admin dashboard needs strictest policies
  coopPolicy: 'same-origin' as const,
  coepPolicy: 'require-corp' as const,
  trustedTypes: true,
  hstsMaxAge: 63072000, // 2 years for admin
  hstsPreload: true,
  permissionsPolicy: {
    'geolocation': ['none'],
    'camera': ['none'], 
    'microphone': ['none'],
    'usb': ['none'],
    'bluetooth': ['none'],
    'payment': ['none'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'magnetometer': ['none'],
    'ambient-light-sensor': ['none'],
    'autoplay': ['none'],
    'encrypted-media': ['none'],
    'fullscreen': ['self'],
    'picture-in-picture': ['none']
  }
};

// Create S4 security middleware for admin-insights
const s4SecurityMiddleware = createSecurityMiddleware('admin-insights', adminInsightsSecurityConfig);

/**
 * S4 Security middleware for admin-insights
 * Implements transport security hardening with CSP nonces, COOP/COEP, HSTS, etc.
 */
export function middleware(request: NextRequest) {
  // Apply S4 security headers via the security middleware
  const response = s4SecurityMiddleware(request);
  
  // Admin-specific security enhancements
  response.headers.set('X-Admin-Dashboard', 'true');
  response.headers.set('X-Require-Auth', 'admin');
  response.headers.set('X-Security-Level', 'S4-ADMIN');
  
  // Prevent caching of admin pages (sensitive data)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache'); 
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  
  // Additional admin security headers
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
  
  // Log S4 security status in development
  if (process.env.NODE_ENV === 'development') {
    const nonce = response.headers.get('X-Request-Nonce');
    console.log(`🛡️  S4 Admin Security Applied:`, {
      app: 'admin-insights',
      nonce: nonce ? `${nonce.substring(0, 8)}...` : 'none',
      coop: response.headers.get('Cross-Origin-Opener-Policy'),
      coep: response.headers.get('Cross-Origin-Embedder-Policy'),
      hsts: response.headers.get('Strict-Transport-Security') ? 'enabled' : 'disabled'
    });
  }
  
  return response;
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
  });
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};