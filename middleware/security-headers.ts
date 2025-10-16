import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// Security headers configuration for S4 transport security
export interface SecurityHeadersConfig {
  cspNonce?: boolean;
  trustedTypes?: boolean;
  coopPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  coepPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none';
  hstsMaxAge?: number;
  hstsPreload?: boolean;
  frameProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  transportHardening?: boolean;
}

// Default S4 security configuration
const DEFAULT_S4_CONFIG: SecurityHeadersConfig = {
  cspNonce: true,
  trustedTypes: true,
  coopPolicy: 'same-origin',
  coepPolicy: 'require-corp',
  hstsMaxAge: 31536000, // 1 year
  hstsPreload: true,
  frameProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    'geolocation': ['none'],
    'camera': ['self'],
    'microphone': ['self'],
    'usb': ['none'],
    'bluetooth': ['none'],
    'payment': ['self'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'magnetometer': ['none'],
    'ambient-light-sensor': ['none'],
    'autoplay': ['self'],
    'encrypted-media': ['self'],
    'fullscreen': ['self'],
    'picture-in-picture': ['self']
  },
  transportHardening: true
};

// Security flags integration
interface SecurityFlags {
  SECURITY_CSP_NONCE: { enabled: boolean; canary_pct: number };
  SECURITY_TRUSTED_TYPES: { enabled: boolean; canary_pct: number };
  SECURITY_COOP_ENFORCE: { enabled: boolean; canary_pct: number };
  SECURITY_COEP_ENFORCE: { enabled: boolean; canary_pct: number };
  SECURITY_HSTS_PROD_ENFORCE: { enabled: boolean; canary_pct: number };
  SECURITY_FRAME_PROTECTION: { enabled: boolean; canary_pct: number };
  SECURITY_REFERRER_STRICT: { enabled: boolean; canary_pct: number };
  SECURITY_PERMISSIONS_POLICY: { enabled: boolean; canary_pct: number };
  SECURITY_TRANSPORT_HARDENING: { enabled: boolean; canary_pct: number };
}

export class SecurityHeadersManager {
  private config: SecurityHeadersConfig;
  private flags: SecurityFlags;
  private appName: string;

  constructor(appName: string, config?: Partial<SecurityHeadersConfig>) {
    this.appName = appName;
    this.config = { ...DEFAULT_S4_CONFIG, ...config };
    this.flags = this.loadSecurityFlags();
  }

  private loadSecurityFlags(): SecurityFlags {
    // In production, this would load from environment or config service
    return {
      SECURITY_CSP_NONCE: { enabled: true, canary_pct: 15 },
      SECURITY_TRUSTED_TYPES: { enabled: true, canary_pct: 10 },
      SECURITY_COOP_ENFORCE: { enabled: true, canary_pct: 20 },
      SECURITY_COEP_ENFORCE: { enabled: true, canary_pct: 15 },
      SECURITY_HSTS_PROD_ENFORCE: { enabled: true, canary_pct: 25 },
      SECURITY_FRAME_PROTECTION: { enabled: true, canary_pct: 30 },
      SECURITY_REFERRER_STRICT: { enabled: true, canary_pct: 25 },
      SECURITY_PERMISSIONS_POLICY: { enabled: true, canary_pct: 20 },
      SECURITY_TRANSPORT_HARDENING: { enabled: true, canary_pct: 30 }
    };
  }

  private shouldApplyFlag(flagName: keyof SecurityFlags, userId?: string): boolean {
    const flag = this.flags[flagName];
    if (!flag.enabled) return false;

    // Simple canary logic based on user ID hash
    if (userId && flag.canary_pct < 100) {
      const hash = createHash('sha256').update(userId + flagName).digest('hex');
      const bucket = parseInt(hash.substring(0, 8), 16) % 100;
      return bucket < flag.canary_pct;
    }

    return flag.canary_pct >= 100;
  }

  generateNonce(): string {
    return randomBytes(16).toString('base64');
  }

  buildCSP(nonce?: string, options: { 
    allowInlineStyles?: boolean; 
    allowInlineScripts?: boolean;
    additionalDomains?: string[];
  } = {}): string {
    const directives = [];

    // Default source
    directives.push("default-src 'self'");

    // Script source with nonce support
    let scriptSrc = "'self'";
    if (nonce && this.shouldApplyFlag('SECURITY_CSP_NONCE')) {
      scriptSrc += ` 'nonce-${nonce}'`;
    }
    if (options.allowInlineScripts && !nonce) {
      scriptSrc += " 'unsafe-inline'";
    }
    // Add trusted domains
    if (options.additionalDomains?.length) {
      scriptSrc += ` ${options.additionalDomains.join(' ')}`;
    }
    directives.push(`script-src ${scriptSrc}`);

    // Style source
    let styleSrc = "'self'";
    if (options.allowInlineStyles) {
      styleSrc += " 'unsafe-inline'";
    }
    directives.push(`style-src ${styleSrc}`);

    // Object and base restrictions
    directives.push("object-src 'none'");
    directives.push("base-uri 'self'");

    // Form action restriction
    directives.push("form-action 'self'");

    // Frame ancestors for clickjacking protection
    directives.push("frame-ancestors 'none'");

    // Upgrade insecure requests
    directives.push("upgrade-insecure-requests");

    // Trusted Types enforcement
    if (this.shouldApplyFlag('SECURITY_TRUSTED_TYPES')) {
      directives.push("require-trusted-types-for 'script'");
      directives.push("trusted-types 'none'");
    }

    return directives.join('; ');
  }

  buildPermissionsPolicy(): string {
    if (!this.shouldApplyFlag('SECURITY_PERMISSIONS_POLICY')) {
      return '';
    }

    const policy = this.config.permissionsPolicy || {};
    const directives = Object.entries(policy).map(([feature, allowlist]) => {
      const origins = allowlist.map(origin => 
        origin === 'self' ? '"self"' : 
        origin === 'none' ? '' : 
        origin
      ).filter(Boolean);
      
      return `${feature}=(${origins.join(' ')})`;
    });

    return directives.join(', ');
  }

  applySecurityHeaders(
    response: NextResponse, 
    request: NextRequest,
    options: {
      nonce?: string;
      userId?: string;
      skipCSP?: boolean;
      additionalHeaders?: Record<string, string>;
    } = {}
  ): NextResponse {
    const { nonce, userId, skipCSP = false, additionalHeaders = {} } = options;

    // HSTS with preload
    if (this.shouldApplyFlag('SECURITY_HSTS_PROD_ENFORCE', userId)) {
      const hstsValue = `max-age=${this.config.hstsMaxAge}; includeSubDomains${
        this.config.hstsPreload ? '; preload' : ''
      }`;
      response.headers.set('Strict-Transport-Security', hstsValue);
    }

    // Cross-Origin Opener Policy
    if (this.shouldApplyFlag('SECURITY_COOP_ENFORCE', userId)) {
      response.headers.set('Cross-Origin-Opener-Policy', this.config.coopPolicy || 'same-origin');
    }

    // Cross-Origin Embedder Policy
    if (this.shouldApplyFlag('SECURITY_COEP_ENFORCE', userId)) {
      response.headers.set('Cross-Origin-Embedder-Policy', this.config.coepPolicy || 'require-corp');
    }

    // Frame protection
    if (this.shouldApplyFlag('SECURITY_FRAME_PROTECTION', userId)) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    // Referrer policy
    if (this.shouldApplyFlag('SECURITY_REFERRER_STRICT', userId)) {
      response.headers.set('Referrer-Policy', this.config.referrerPolicy || 'strict-origin-when-cross-origin');
    }

    // Content type options
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS protection (legacy but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Permissions Policy
    const permissionsPolicy = this.buildPermissionsPolicy();
    if (permissionsPolicy) {
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // Content Security Policy
    if (!skipCSP && this.shouldApplyFlag('SECURITY_CSP_NONCE', userId)) {
      const csp = this.buildCSP(nonce, {
        allowInlineStyles: true,
        additionalDomains: ['https://cdn.jsdelivr.net', 'https://fonts.googleapis.com']
      });
      response.headers.set('Content-Security-Policy', csp);
    }

    // Transport hardening bundle
    if (this.shouldApplyFlag('SECURITY_TRANSPORT_HARDENING', userId)) {
      // Additional security headers
      response.headers.set('X-DNS-Prefetch-Control', 'off');
      response.headers.set('X-Download-Options', 'noopen');
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
      response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    }

    // Apply additional custom headers
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

// Middleware factory for different apps
export function createSecurityMiddleware(
  appName: string, 
  config?: Partial<SecurityHeadersConfig>
) {
  const manager = new SecurityHeadersManager(appName, config);

  return function securityMiddleware(request: NextRequest) {
    // Generate nonce for this request
    const nonce = manager.generateNonce();
    
    // Create response
    const response = NextResponse.next();
    
    // Extract user ID from request (implementation depends on auth system)
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   undefined;

    // Apply security headers
    return manager.applySecurityHeaders(response, request, {
      nonce,
      userId,
      additionalHeaders: {
        'X-App-Name': appName,
        'X-Security-Level': 'S4-TRANSPORT',
        'X-Request-Nonce': nonce
      }
    });
  };
}

// DPoP (Demonstration of Proof-of-Possession) utilities
export class DPoPManager {
  private static readonly ALGORITHM = 'ES256';
  
  static async createDPoPProof(
    httpMethod: string,
    httpUri: string,
    accessToken?: string,
    privateKey?: CryptoKey
  ): Promise<string> {
    if (!privateKey) {
      throw new Error('Private key required for DPoP proof generation');
    }

    const header = {
      typ: 'dpop+jwt',
      alg: this.ALGORITHM,
      jwk: await this.exportPublicKeyAsJWK(privateKey)
    };

    const payload = {
      jti: randomBytes(16).toString('hex'),
      htm: httpMethod.toUpperCase(),
      htu: httpUri,
      iat: Math.floor(Date.now() / 1000),
      ...(accessToken && { ath: createHash('sha256').update(accessToken).digest('base64url') })
    };

    // This is a simplified implementation - use a proper JWT library in production
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.signature_would_be_here`;
  }

  private static async exportPublicKeyAsJWK(privateKey: CryptoKey): Promise<any> {
    // Simplified JWK export - use WebCrypto API in production
    return {
      kty: 'EC',
      crv: 'P-256',
      alg: this.ALGORITHM,
      use: 'sig',
      x: 'example_x_coordinate',
      y: 'example_y_coordinate'
    };
  }

  static validateDPoPProof(
    dpopProof: string,
    httpMethod: string,
    httpUri: string,
    accessToken?: string
  ): boolean {
    // Simplified validation - implement proper JWT verification in production
    try {
      const [header, payload] = dpopProof.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      // Validate HTTP method and URI
      if (decodedPayload.htm !== httpMethod.toUpperCase() || decodedPayload.htu !== httpUri) {
        return false;
      }

      // Validate access token hash if provided
      if (accessToken) {
        const expectedHash = createHash('sha256').update(accessToken).digest('base64url');
        if (decodedPayload.ath !== expectedHash) {
          return false;
        }
      }

      // Check timestamp (5 minute window)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - decodedPayload.iat) > 300) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export { DEFAULT_S4_CONFIG };