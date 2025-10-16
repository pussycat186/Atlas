/**
 * Atlas Security Middleware - Proof Messenger  
 * ATLAS_PERFECT_MODE_CLOSEOUT with all security headers enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import securityMiddleware from '@atlas/security-middleware';

// Proof Messenger specific security configuration for ATLAS_PERFECT_MODE_CLOSEOUT
const proofMessengerSecurityConfig = {
  app: 'proof_messenger' as const,
  cspNonce: true,
  trustedTypes: true,
  coopPolicy: 'same-origin' as const,
  coepPolicy: 'require-corp' as const,
  hstsEnabled: true,
  dpopEnabled: true,
  frameProtection: true,
  strictReferrer: true,
  permissionsPolicy: true,
  mtlsInternal: true
};

// Create security middleware for proof-messenger with all flags enabled
const proofMessengerSecurityMiddleware = securityMiddleware(proofMessengerSecurityConfig);

/**
 * ATLAS_PERFECT_MODE_CLOSEOUT Security middleware for proof-messenger
 * Implements all security headers with 100% rollout
 */
export function middleware(request: NextRequest) {
  // Apply all security headers via the security middleware
  const response = proofMessengerSecurityMiddleware(request);
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
    console.log(`🛡️  Proof Messenger security headers applied:`, {
      headerCount: securityHeaders.length,
      cspNonce: cspNonce ? `${cspNonce.substring(0, 8)}...` : 'none',
      flagsEnabled: getEnabledSecurityFlags()
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