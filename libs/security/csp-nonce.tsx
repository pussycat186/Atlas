import { headers } from 'next/headers';
import { ReactNode } from 'react';

/**
 * S4 CSP Nonce utilities for secure inline scripts and styles
 * Integrates with the security headers middleware
 */

/**
 * Get the CSP nonce for the current request
 */
export function getCSPNonce(): string | null {
  try {
    const headersList = headers();
    return headersList.get('x-request-nonce') || headersList.get('x-csp-nonce');
  } catch (error) {
    // Headers not available (e.g., in static generation)
    return null;
  }
}

/**
 * Create a script tag with CSP nonce
 */
export function NonceScript({ 
  children, 
  src, 
  type = 'text/javascript',
  ...props 
}: {
  children?: string;
  src?: string;
  type?: string;
  [key: string]: any;
}) {
  const nonce = getCSPNonce();
  
  return (
    <script
      {...props}
      type={type}
      src={src}
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={children ? { __html: children } : undefined}
    />
  );
}

/**
 * Create a style tag with CSP nonce
 */
export function NonceStyle({ 
  children,
  ...props 
}: {
  children: string;
  [key: string]: any;
}) {
  const nonce = getCSPNonce();
  
  return (
    <style
      {...props}
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

/**
 * Trusted Types policy for S4 security
 */
declare global {
  interface Window {
    trustedTypes?: {
      createPolicy: (name: string, policy: any) => any;
      defaultPolicy?: any;
    };
  }
}

/**
 * Create Trusted Types policy for safe DOM manipulation
 */
export function createTrustedTypesPolicy() {
  if (typeof window === 'undefined' || !window.trustedTypes) {
    return null;
  }

  try {
    return window.trustedTypes.createPolicy('atlas-trusted-html', {
      createHTML: (string: string) => {
        // Sanitize HTML - in production use a proper sanitizer like DOMPurify
        return string
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      },
      createScript: (string: string) => {
        // Only allow specific safe scripts
        const allowedScripts = [
          'console.log',
          'document.getElementById',
          'window.location'
        ];
        
        const isSafe = allowedScripts.some(allowed => string.includes(allowed));
        if (!isSafe) {
          throw new Error('Unsafe script blocked by Trusted Types');
        }
        
        return string;
      },
      createScriptURL: (url: string) => {
        // Only allow scripts from trusted origins
        const trustedOrigins = [
          'https://cdn.jsdelivr.net',
          'https://unpkg.com',
          location.origin
        ];
        
        const urlObj = new URL(url, location.href);
        const isTrusted = trustedOrigins.some(origin => 
          urlObj.origin === origin || urlObj.origin === location.origin
        );
        
        if (!isTrusted) {
          throw new Error('Untrusted script URL blocked by Trusted Types');
        }
        
        return url;
      }
    });
  } catch (error) {
    console.warn('Failed to create Trusted Types policy:', error);
    return null;
  }
}

/**
 * Safe DOM manipulation utilities with Trusted Types
 */
export class SafeDOM {
  private static policy = createTrustedTypesPolicy();

  static setInnerHTML(element: Element, html: string) {
    if (this.policy) {
      element.innerHTML = this.policy.createHTML(html) as string;
    } else {
      // Fallback without Trusted Types
      element.innerHTML = html;
    }
  }

  static createScript(content: string): HTMLScriptElement {
    const script = document.createElement('script');
    const nonce = getCSPNonce();
    
    if (nonce) {
      script.nonce = nonce;
    }
    
    if (this.policy) {
      script.textContent = this.policy.createScript(content) as string;
    } else {
      script.textContent = content;
    }
    
    return script;
  }

  static loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const nonce = getCSPNonce();
      
      if (nonce) {
        script.nonce = nonce;
      }
      
      if (this.policy) {
        script.src = this.policy.createScriptURL(src) as string;
      } else {
        script.src = src;
      }
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
}

/**
 * Hook for using CSP nonce in React components
 */
export function useCSPNonce(): string | null {
  return getCSPNonce();
}

/**
 * Higher-order component to inject CSP nonce
 */
export function withCSPNonce<P extends object>(
  Component: React.ComponentType<P & { nonce?: string }>
) {
  return function NonceWrapper(props: P) {
    const nonce = getCSPNonce();
    return <Component {...props} nonce={nonce || undefined} />;
  };
}

/**
 * Security headers validation utilities
 */
export class SecurityValidator {
  static validateCSP(response: Response): boolean {
    const csp = response.headers.get('Content-Security-Policy');
    if (!csp) return false;
    
    // Check for required directives
    const requiredDirectives = [
      'default-src',
      'script-src',
      'object-src',
      'base-uri',
      'frame-ancestors'
    ];
    
    return requiredDirectives.every(directive => csp.includes(directive));
  }

  static validateHSTS(response: Response): boolean {
    const hsts = response.headers.get('Strict-Transport-Security');
    if (!hsts) return false;
    
    // Check for minimum 1 year max-age
    const maxAgeMatch = hsts.match(/max-age=(\d+)/);
    if (!maxAgeMatch) return false;
    
    const maxAge = parseInt(maxAgeMatch[1]);
    return maxAge >= 31536000; // 1 year in seconds
  }

  static validateCOOP(response: Response): boolean {
    const coop = response.headers.get('Cross-Origin-Opener-Policy');
    return coop === 'same-origin' || coop === 'same-origin-allow-popups';
  }

  static validateCOEP(response: Response): boolean {
    const coep = response.headers.get('Cross-Origin-Embedder-Policy');
    return coep === 'require-corp' || coep === 'credentialless';
  }

  static validateS4Compliance(response: Response): {
    compliant: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!this.validateCSP(response)) {
      errors.push('Missing or invalid Content-Security-Policy');
    }
    
    if (!this.validateHSTS(response)) {
      errors.push('Missing or insufficient Strict-Transport-Security');
    }
    
    if (!this.validateCOOP(response)) {
      errors.push('Missing or invalid Cross-Origin-Opener-Policy');
    }
    
    if (!this.validateCOEP(response)) {
      errors.push('Missing or invalid Cross-Origin-Embedder-Policy');
    }
    
    return {
      compliant: errors.length === 0,
      errors
    };
  }
}

export { getCSPNonce as getNonce };