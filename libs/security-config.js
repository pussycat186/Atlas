/**
 * Atlas Security Configuration Loader
 * Loads security feature flags from .env.security files
 * All flags default to OFF for staged security rollout
 */

const path = require('path');
const fs = require('fs');

function loadSecurityConfig() {
  const securityEnvPath = path.join(__dirname, '.env.security');
  
  if (!fs.existsSync(securityEnvPath)) {
    console.warn('⚠️  .env.security not found, using default security settings');
    return getDefaultSecurityConfig();
  }
  
  // Parse .env.security file
  const envContent = fs.readFileSync(securityEnvPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    }
  });
  
  return config;
}

function getDefaultSecurityConfig() {
  return {
    // Browser Policy - Conservative defaults
    SECURITY_CSP_STRICT: 'OFF',
    SECURITY_CSP_REPORT_ONLY: 'ON',
    SECURITY_COOP_COEP: 'OFF',
    SECURITY_HSTS_PRELOAD: 'OFF',
    SECURITY_HSTS_BASIC: 'ON',
    
    // Authentication - Basic security only
    SECURITY_DPOP_ENFORCE: 'OFF',
    SECURITY_DPOP_VALIDATE: 'OFF', 
    SECURITY_MTLS_INTERNAL: 'OFF',
    SECURITY_OAUTH_PKCE_REQUIRED: 'ON',
    
    // Cryptography - Classical algorithms
    SECURITY_PQC_HYBRID_ENCRYPT: 'OFF',
    SECURITY_PQC_SIGNATURES: 'OFF',
    SECURITY_CRYPTO_ALGO_PREFERENCE: 'classical',
    
    // Data Protection - Minimal
    SECURITY_FIELD_ENCRYPTION: 'OFF',
    SECURITY_DATABASE_TDE: 'OFF',
    SECURITY_BACKUP_ENCRYPTION: 'ON',
    
    // Edge Protection - Permissive
    SECURITY_WAF_STRICT: 'OFF',
    SECURITY_RATE_LIMIT_STRICT: 'OFF',
    SECURITY_GEO_BLOCKING: 'OFF',
    
    // Supply Chain - Basic
    SECURITY_SBOM_SLSA: 'OFF',
    SECURITY_COSIGN_VERIFY: 'OFF',
    SECURITY_DEP_VULNERABILITY_SCAN: 'ON',
    
    // Observability - Basic logging
    SECURITY_OTEL_SECURITY_EVENTS: 'OFF',
    SECURITY_AUDIT_LOGGING: 'ON',
    SECURITY_BREACH_DETECTION: 'OFF'
  };
}

function isSecurityFeatureEnabled(flagName) {
  const config = loadSecurityConfig();
  const value = config[flagName] || process.env[flagName] || 'OFF';
  return value.toUpperCase() === 'ON' || value.toUpperCase() === 'TRUE';
}

function getSecurityHeaders() {
  const config = loadSecurityConfig();
  const headers = [];
  
  // Basic security headers (always on)
  headers.push({
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  });
  
  headers.push({
    key: 'X-Frame-Options', 
    value: 'DENY'
  });
  
  headers.push({
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  });
  
  // HSTS - Basic or Preload
  if (isSecurityFeatureEnabled('SECURITY_HSTS_PRELOAD')) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload'
    });
  } else if (isSecurityFeatureEnabled('SECURITY_HSTS_BASIC')) {
    headers.push({
      key: 'Strict-Transport-Security', 
      value: 'max-age=31536000; includeSubDomains'
    });
  }
  
  // CSP - Report Only or Strict
  if (isSecurityFeatureEnabled('SECURITY_CSP_STRICT')) {
    headers.push({
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'"
    });
  } else if (isSecurityFeatureEnabled('SECURITY_CSP_REPORT_ONLY')) {
    headers.push({
      key: 'Content-Security-Policy-Report-Only',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; report-uri /api/csp-report"
    });
  }
  
  // COOP/COEP - Advanced isolation
  if (isSecurityFeatureEnabled('SECURITY_COOP_COEP')) {
    headers.push({
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin'
    });
    
    headers.push({
      key: 'Cross-Origin-Embedder-Policy',
      value: 'require-corp'
    });
  }
  
  return headers;
}

module.exports = {
  loadSecurityConfig,
  getDefaultSecurityConfig,
  isSecurityFeatureEnabled,
  getSecurityHeaders
};