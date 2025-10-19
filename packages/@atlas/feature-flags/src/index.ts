/**
 * @atlas/feature-flags
 * Typed feature flags for Atlas PDF Tech Stack Integration
 * Remote-only, evidence-first, Vietnamese-first UX
 */

export interface AtlasFeatureFlags {
  // Cryptography & E2EE
  PQC_ON: boolean;                    // Post-Quantum Crypto (Kyber/Dilithium) canary
  MLS_ON: boolean;                    // MLS (RFC 9420) group messaging
  PASSKEYS_ON: boolean;               // WebAuthn/Passkeys authentication
  DPOP_ON: boolean;                   // DPoP (RFC 9449) token binding
  ZKP_AUTH_CANARY: boolean;           // Zero-Knowledge Proof auth experiments
  JWKS_ROTATION: boolean;             // JWKS key rotation with dual sets
  THRESHOLD_CRYPTO: boolean;          // Shamir secret splitting for service keys
  
  // Abuse & Trust
  POW_ANTISPAM_CANARY: boolean;       // Proof-of-Work anti-spam challenge
  ML_SPAM_FILTER: boolean;            // ML-based spam classification
  RATE_LIMIT_SMART: boolean;          // Smart rate limiting with reputation
  REPUTATION_MODEL: boolean;          // User reputation scoring
  
  // Policy & Ops
  OPA_ON: boolean;                    // Open Policy Agent (Rego) enforcement
  QRNG_CANARY: boolean;               // Quantum RNG integration canary
  SBOM_SLSA_COSIGN: boolean;          // Supply chain attestation
  FORMAL_MODELS: boolean;             // TLA+/ProVerif formal verification
  SIEM_HOOKS: boolean;                // Structured logging to SIEM
  
  // Transport & Performance
  QUIC_EDGE_ON: boolean;              // HTTP/3 QUIC at edge
  ZERO_RTT: boolean;                  // 0-RTT resumption (where safe)
  OFFLINE_SYNC: boolean;              // Offline queue + sync on reconnect
  PROTOBUF_API: boolean;              // Protobuf/MsgPack APIs
  
  // Security Headers (already partially implemented)
  SECURITY_CSP_NONCE: boolean;        // CSP with nonce + strict-dynamic
  SECURITY_TRUSTED_TYPES: boolean;    // Trusted Types "nextjs#bundler"
  SECURITY_COOP_COEP: boolean;        // COOP/COEP/CORP headers
  SECURITY_HSTS_PRELOAD: boolean;     // HSTS with preload
  SECURITY_SRI: boolean;              // Subresource Integrity
  SECURITY_CSRF: boolean;             // CSRF protection
}

/**
 * Default feature flags - all advanced features OFF by default
 * Production safety: additive, flag-gated, reversible
 */
export const DEFAULT_FLAGS: AtlasFeatureFlags = {
  // Crypto & E2EE - CANARY OFF
  PQC_ON: false,
  MLS_ON: false,
  PASSKEYS_ON: true,              // Safe to enable - WebAuthn is stable
  DPOP_ON: true,                  // Safe to enable - RFC 9449 ready
  ZKP_AUTH_CANARY: false,
  JWKS_ROTATION: true,            // Safe - standard practice
  THRESHOLD_CRYPTO: false,
  
  // Abuse & Trust - GRADUAL ROLLOUT
  POW_ANTISPAM_CANARY: false,
  ML_SPAM_FILTER: false,
  RATE_LIMIT_SMART: true,         // Safe - basic rate limiting
  REPUTATION_MODEL: false,
  
  // Policy & Ops - TOOLING READY
  OPA_ON: true,                   // Safe - policy enforcement
  QRNG_CANARY: false,
  SBOM_SLSA_COSIGN: true,         // Safe - CI attestation
  FORMAL_MODELS: true,            // Safe - documentation only
  SIEM_HOOKS: true,               // Safe - structured logging
  
  // Transport & Performance - INFRASTRUCTURE DEPENDENT
  QUIC_EDGE_ON: true,             // Safe if edge supports HTTP/3
  ZERO_RTT: false,                // Requires careful replay protection
  OFFLINE_SYNC: true,             // Safe - progressive enhancement
  PROTOBUF_API: false,            // Requires API migration
  
  // Security Headers - ALREADY IMPLEMENTED
  SECURITY_CSP_NONCE: true,
  SECURITY_TRUSTED_TYPES: true,
  SECURITY_COOP_COEP: true,
  SECURITY_HSTS_PRELOAD: true,
  SECURITY_SRI: true,
  SECURITY_CSRF: true,
};

/**
 * Load flags from environment with fallback to defaults
 * Supports CI/CD override via ENV vars: ATLAS_FLAG_<NAME>=true|false
 */
export function loadFlags(): AtlasFeatureFlags {
  const flags: AtlasFeatureFlags = { ...DEFAULT_FLAGS };
  
  // Override from environment
  for (const key of Object.keys(DEFAULT_FLAGS) as (keyof AtlasFeatureFlags)[]) {
    const envKey = `ATLAS_FLAG_${key}`;
    const envValue = process.env[envKey];
    
    if (envValue !== undefined) {
      flags[key] = envValue === 'true' || envValue === '1';
    }
  }
  
  return flags;
}

/**
 * Check if a specific flag is enabled
 */
export function isFlagEnabled(flag: keyof AtlasFeatureFlags): boolean {
  const flags = loadFlags();
  return flags[flag] === true;
}

/**
 * Get all enabled flags (for evidence collection)
 */
export function getEnabledFlags(): Partial<AtlasFeatureFlags> {
  const flags = loadFlags();
  const enabled: Partial<AtlasFeatureFlags> = {};
  
  for (const [key, value] of Object.entries(flags)) {
    if (value === true) {
      enabled[key as keyof AtlasFeatureFlags] = true;
    }
  }
  
  return enabled;
}

/**
 * Get flag status summary for evidence
 */
export function getFlagsSummary(): {
  total: number;
  enabled: number;
  disabled: number;
  flags: Record<string, boolean>;
} {
  const flags = loadFlags();
  const enabled = Object.values(flags).filter(v => v === true).length;
  
  return {
    total: Object.keys(flags).length,
    enabled,
    disabled: Object.keys(flags).length - enabled,
    flags: flags as Record<string, boolean>
  };
}

export default loadFlags;
