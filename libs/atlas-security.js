/**
 * Atlas Security Configuration Loader
 * Centralized security flag management from security/flags.yaml
 * Supports canary rollout, evidence collection, and safe rollback
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class AtlasSecurityConfig {
  constructor() {
    this.flagsPath = path.join(process.cwd(), 'security', 'flags.yaml');
    this.config = this.loadSecurityFlags();
    this.appName = this.detectAppName();
  }

  /**
   * Load security flags from YAML configuration
   * @returns {Object} Parsed security configuration
   */
  loadSecurityFlags() {
    try {
      if (!fs.existsSync(this.flagsPath)) {
        console.warn('⚠️  security/flags.yaml not found, using safe defaults');
        return this.getSafeDefaults();
      }

      const yamlContent = fs.readFileSync(this.flagsPath, 'utf8');
      const config = yaml.parse(yamlContent);
      
      console.log('✅ Loaded security configuration from flags.yaml');
      return config;
    } catch (error) {
      console.error('❌ Failed to load security configuration:', error.message);
      return this.getSafeDefaults();
    }
  }

  /**
   * Detect current application name from package.json or environment
   * @returns {string} Application identifier
   */
  detectAppName() {
    // Try environment variable first
    if (process.env.ATLAS_APP_NAME) {
      return process.env.ATLAS_APP_NAME;
    }

    // Try to detect from package.json name
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Extract app name from package name (e.g., "@atlas/admin-insights" -> "admin_insights")
        if (pkg.name && pkg.name.includes('atlas')) {
          const appName = pkg.name
            .replace('@atlas/', '')
            .replace('atlas-', '')
            .replace('-', '_');
          return appName;
        }
      }
    } catch (error) {
      console.warn('Could not detect app name from package.json');
    }

    // Try to detect from current working directory
    const cwd = process.cwd();
    if (cwd.includes('admin-insights')) return 'admin_insights';
    if (cwd.includes('dev-portal')) return 'dev_portal';
    if (cwd.includes('proof-messenger')) return 'proof_messenger';

    console.warn('Could not detect app name, using default');
    return 'unknown';
  }

  /**
   * Check if a security feature is enabled for the current app
   * @param {string} flagName - Security flag name (e.g., 'SECURITY_CSP_STRICT')
   * @returns {boolean} Whether the feature is enabled
   */
  isSecurityFeatureEnabled(flagName) {
    // Environment variable override (for emergency rollback)
    const envOverride = process.env[flagName];
    if (envOverride !== undefined) {
      const enabled = ['true', 'on', '1', 'yes'].includes(envOverride.toLowerCase());
      console.log(`🔧 Environment override for ${flagName}: ${enabled}`);
      return enabled;
    }

    // Global rollback mode
    if (process.env.SECURITY_ROLLBACK === 'true') {
      console.log(`🚨 Global security rollback active - ${flagName} disabled`);
      return false;
    }

    // Check YAML configuration
    const flagConfig = this.config[flagName];
    if (!flagConfig) {
      console.warn(`⚠️  Unknown security flag: ${flagName}`);
      return false;
    }

    // Check if flag is enabled for this app
    if (!flagConfig.apps || !flagConfig.apps.includes(this.appName)) {
      return false;
    }

    // Check canary rollout percentage
    if (flagConfig.canary_pct < 100) {
      const userId = this.getUserIdForCanary();
      const userHash = this.hashString(userId + flagName) % 100;
      const inCanary = userHash < flagConfig.canary_pct;
      
      if (inCanary) {
        console.log(`🎯 Canary enabled for ${flagName}: user ${userId} (${flagConfig.canary_pct}%)`);
      }
      
      return flagConfig.enabled && inCanary;
    }

    return flagConfig.enabled;
  }

  /**
   * Get user ID for consistent canary assignment
   * @returns {string} User identifier for canary targeting
   */
  getUserIdForCanary() {
    // In production, this would come from authenticated user context
    // For now, use a combination of IP and session for consistency
    return process.env.CANARY_USER_ID || 
           process.env.USER_ID || 
           process.env.NODE_ENV || 
           'default_user';
  }

  /**
   * Simple hash function for canary assignment
   * @param {string} input - String to hash
   * @returns {number} Hash value
   */
  hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate security headers based on enabled flags
   * @returns {Array} Array of security headers
   */
  getSecurityHeaders() {
    const headers = [];

    // Basic security headers (always enabled)
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

    // Conditional security headers based on flags
    
    // HSTS (basic version always on, preload conditional)
    if (this.isSecurityFeatureEnabled('SECURITY_HSTS_PRELOAD')) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      });
    } else {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      });
    }

    // Content Security Policy
    if (this.isSecurityFeatureEnabled('SECURITY_CSP_STRICT')) {
      const nonce = this.generateCSPNonce();
      headers.push({
        key: 'Content-Security-Policy',
        value: this.buildStrictCSP(nonce)
      });
      
      // Store nonce for use in templates
      process.env.CSP_NONCE = nonce;
    }

    // Trusted Types
    if (this.isSecurityFeatureEnabled('SECURITY_TRUSTED_TYPES')) {
      // Add trusted-types directive to CSP
      const existingCSP = headers.find(h => h.key === 'Content-Security-Policy');
      if (existingCSP) {
        existingCSP.value += '; trusted-types atlas-policy default';
      } else {
        headers.push({
          key: 'Content-Security-Policy',
          value: "trusted-types atlas-policy default 'allow-duplicates'"
        });
      }
    }

    // Cross-Origin Policies
    if (this.isSecurityFeatureEnabled('SECURITY_COOP_COEP')) {
      headers.push({
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
      });

      headers.push({
        key: 'Cross-Origin-Embedder-Policy',
        value: 'require-corp'
      });

      headers.push({
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-site'
      });
    }

    // CORS Lockdown
    if (this.isSecurityFeatureEnabled('SECURITY_CORS_LOCKDOWN')) {
      // Note: CORS is typically handled in middleware, not headers
      // This flag would be checked in CORS middleware configuration
    }

    return headers;
  }

  /**
   * Generate a cryptographically random CSP nonce
   * @returns {string} Base64 encoded nonce
   */
  generateCSPNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Build strict Content Security Policy
   * @param {string} nonce - CSP nonce value
   * @returns {string} CSP directive string
   */
  buildStrictCSP(nonce) {
    const directives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline'", // Needed for CSS-in-JS libraries
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://vercel-analytics.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    // Add SRI requirement if enabled
    if (this.isSecurityFeatureEnabled('SECURITY_SRI_REQUIRED')) {
      directives.push("require-sri-for script style");
    }

    return directives.join('; ');
  }

  /**
   * Get canary configuration for a specific flag
   * @param {string} flagName - Security flag name
   * @returns {Object} Canary configuration
   */
  getCanaryConfig(flagName) {
    const flagConfig = this.config[flagName];
    const globalCanary = this.config.canary;

    return {
      enabled: flagConfig?.enabled || false,
      canary_pct: flagConfig?.canary_pct || 0,
      rollout_order: globalCanary?.rollout_order || [],
      phases: globalCanary?.phases || [],
      rollback_triggers: globalCanary?.rollback_triggers || {}
    };
  }

  /**
   * Get evidence collection requirements
   * @returns {Object} Evidence configuration
   */
  getEvidenceConfig() {
    return this.config.evidence || {};
  }

  /**
   * Get compliance mapping for security controls
   * @returns {Object} Compliance mappings
   */
  getComplianceMapping() {
    return this.config.compliance || {};
  }

  /**
   * Safe default configuration when YAML file is missing
   * @returns {Object} Minimal safe configuration
   */
  getSafeDefaults() {
    return {
      // Only enable truly safe defaults
      SECURITY_BACKUP_DR: {
        enabled: true,
        canary_pct: 100,
        apps: ['admin_insights', 'dev_portal', 'proof_messenger']
      },
      SECURITY_CONTAINER_SCANNING: {
        enabled: true,
        canary_pct: 100,
        apps: ['admin_insights', 'dev_portal', 'proof_messenger']
      },
      SECURITY_SECRET_SCANNING_STRICT: {
        enabled: true,
        canary_pct: 100,
        apps: ['admin_insights', 'dev_portal', 'proof_messenger']
      },
      SECURITY_BRANCH_PROTECTION: {
        enabled: true,
        canary_pct: 100,
        apps: ['admin_insights', 'dev_portal', 'proof_messenger']
      }
    };
  }

  /**
   * Log security configuration status
   */
  logSecurityStatus() {
    console.log('🛡️  Atlas Security Configuration Status:');
    console.log(`   App: ${this.appName}`);
    console.log(`   Config loaded: ${fs.existsSync(this.flagsPath) ? '✅' : '⚠️ '}`);
    
    const enabledFlags = Object.keys(this.config)
      .filter(flag => flag.startsWith('SECURITY_') || flag.startsWith('OTEL_'))
      .filter(flag => this.isSecurityFeatureEnabled(flag));
      
    console.log(`   Enabled flags: ${enabledFlags.length}`);
    if (enabledFlags.length > 0) {
      enabledFlags.forEach(flag => {
        const config = this.config[flag];
        console.log(`     - ${flag} (${config?.canary_pct || 0}% canary)`);
      });
    }
  }

  /**
   * Emergency rollback - disable all security flags
   */
  emergencyRollback() {
    console.log('🚨 EMERGENCY SECURITY ROLLBACK ACTIVATED');
    process.env.SECURITY_ROLLBACK = 'true';
    
    // Log rollback event for audit
    const rollbackEvent = {
      timestamp: new Date().toISOString(),
      action: 'emergency_rollback',
      app: this.appName,
      triggered_by: process.env.USER || 'system'
    };
    
    console.log('📝 Rollback event:', JSON.stringify(rollbackEvent));
    
    // In production, this would also:
    // 1. Send alert to on-call team
    // 2. Create incident ticket
    // 3. Log to audit system
  }
}

// Singleton instance
let securityConfig = null;

/**
 * Get the security configuration instance
 * @returns {AtlasSecurityConfig} Security configuration instance
 */
function getSecurityConfig() {
  if (!securityConfig) {
    securityConfig = new AtlasSecurityConfig();
  }
  return securityConfig;
}

// Export convenience functions
function isSecurityFeatureEnabled(flagName) {
  return getSecurityConfig().isSecurityFeatureEnabled(flagName);
}

function getSecurityHeaders() {
  return getSecurityConfig().getSecurityHeaders();
}

function getCanaryConfig(flagName) {
  return getSecurityConfig().getCanaryConfig(flagName);
}

function logSecurityStatus() {
  return getSecurityConfig().logSecurityStatus();
}

function emergencyRollback() {
  return getSecurityConfig().emergencyRollback();
}

module.exports = {
  AtlasSecurityConfig,
  getSecurityConfig,
  isSecurityFeatureEnabled,
  getSecurityHeaders,
  getCanaryConfig,
  logSecurityStatus,
  emergencyRollback
};