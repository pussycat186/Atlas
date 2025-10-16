/**
 * S3 Authentication Hardening Middleware
 * Integrates DPoP, CSRF, and mTLS validation for Atlas applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDPoPValidator } from '../libs/dpop-server';
import { atlasCSRF } from '../libs/csrf-protection';

// Import security configuration
let atlasSecurityConfig: any = null;
try {
  atlasSecurityConfig = require('../libs/atlas-security.js');
} catch (error) {
  console.warn('Atlas security config not available for S3 middleware');
}

/**
 * S3 Authentication middleware for enhanced security
 */
export async function s3AuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Skip middleware if security config not available
  if (!atlasSecurityConfig) {
    return null; // Continue to next middleware
  }

  const appName = detectAppName(request);
  process.env.ATLAS_APP_NAME = appName;

  // Check which S3 features are enabled
  const dpopEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_DPOP_ENFORCE');
  const csrfEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_CSRF_ENFORCE');
  const mtlsEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_MTLS_INTERNAL');

  console.log(`🔐 S3 Auth Middleware - ${appName}:`, {
    dpop: dpopEnabled,
    csrf: csrfEnabled,
    mtls: mtlsEnabled
  });

  // Skip if no S3 features enabled
  if (!dpopEnabled && !csrfEnabled && !mtlsEnabled) {
    return null; // Continue to next middleware
  }

  try {
    // 1. DPoP Validation
    if (dpopEnabled && isAPIRequest(request)) {
      const dpopResult = await validateDPoP(request);
      if (!dpopResult.valid) {
        console.warn('❌ DPoP validation failed:', dpopResult.error);
        return new NextResponse(
          JSON.stringify({ error: 'DPoP validation failed', code: 'DPOP_INVALID' }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 2. CSRF Protection
    if (csrfEnabled) {
      const csrfResult = await validateCSRF(request);
      if (!csrfResult.valid) {
        console.warn('❌ CSRF validation failed:', csrfResult.error);
        return new NextResponse(
          JSON.stringify({ error: 'CSRF validation failed', code: 'CSRF_INVALID' }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 3. mTLS Validation (for admin routes)
    if (mtlsEnabled && isAdminRequest(request)) {
      const mtlsResult = validateMTLS(request);
      if (!mtlsResult.valid) {
        console.warn('❌ mTLS validation failed:', mtlsResult.error);
        return new NextResponse(
          JSON.stringify({ error: 'Client certificate required', code: 'MTLS_REQUIRED' }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log('✅ S3 authentication checks passed');
    return null; // Continue to next middleware

  } catch (error) {
    console.error('❌ S3 middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Authentication error', code: 'AUTH_ERROR' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Validate DPoP proof
 */
async function validateDPoP(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Check if request has Bearer token (DPoP only applies to authenticated requests)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: true }; // Skip DPoP for non-authenticated requests
  }

  const dpopValidator = getDPoPValidator();
  return await dpopValidator.validateDPoPProof(request);
}

/**
 * Validate CSRF protection
 */
async function validateCSRF(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Extract session ID (in real implementation, get from JWT or session store)
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return { valid: false, error: 'No session found' };
  }

  // Validate Fetch Metadata first (fastest check)
  const fetchMetadataResult = atlasCSRF.validateFetchMetadata(request);
  if (!fetchMetadataResult.valid) {
    return fetchMetadataResult;
  }

  // Validate Origin/Referer headers
  const originResult = atlasCSRF.validateOrigin(request);
  if (!originResult.valid) {
    return originResult;
  }

  // Validate CSRF token
  return await atlasCSRF.validateToken(request, sessionId);
}

/**
 * Validate mTLS client certificate
 */
function validateMTLS(request: NextRequest): { valid: boolean; error?: string } {
  // Check for client certificate headers (set by reverse proxy)
  const clientCert = request.headers.get('X-Client-Cert');
  const clientCertVerified = request.headers.get('X-Client-Cert-Verified');
  
  if (!clientCert) {
    return { valid: false, error: 'No client certificate provided' };
  }
  
  if (clientCertVerified !== 'SUCCESS') {
    return { valid: false, error: 'Client certificate verification failed' };
  }

  // Additional certificate validation could be added here
  // (e.g., check certificate subject, issuer, etc.)
  
  return { valid: true };
}

/**
 * Detect application name from request
 */
function detectAppName(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const url = request.url;
  
  if (host.includes('admin-insights') || url.includes('admin-insights')) {
    return 'admin_insights';
  }
  if (host.includes('dev-portal') || url.includes('dev-portal')) {
    return 'dev_portal';
  }
  if (host.includes('proof-messenger') || url.includes('proof-messenger')) {
    return 'proof_messenger';
  }
  
  return 'unknown';
}

/**
 * Check if request is to API endpoint
 */
function isAPIRequest(request: NextRequest): boolean {
  const pathname = new URL(request.url).pathname;
  return pathname.startsWith('/api/') || 
         pathname.startsWith('/api') ||
         request.headers.get('content-type')?.includes('application/json');
}

/**
 * Check if request is to admin route requiring mTLS
 */
function isAdminRequest(request: NextRequest): boolean {
  const pathname = new URL(request.url).pathname;
  return pathname.startsWith('/admin/') || 
         pathname.startsWith('/api/admin/') ||
         pathname.includes('/admin');
}

/**
 * Extract session ID from request (simplified implementation)
 */
function getSessionId(request: NextRequest): string | null {
  // Try to get from cookie
  const sessionCookie = request.cookies.get('atlas_session');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  // Try to get from Authorization header (extract from JWT)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In real implementation, decode JWT to get session ID
    // For now, use a hash of the token as session ID
    const token = authHeader.substring(7);
    return btoa(token).substring(0, 16);
  }

  // Generate temporary session for testing
  return `temp_${Date.now().toString(36)}`;
}