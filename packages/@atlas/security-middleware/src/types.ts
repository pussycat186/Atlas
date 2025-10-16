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

export interface DPoPToken {
  typ: string;
  alg: string;
  jwk: {
    kty: string;
    x: string;
    y: string;
    crv: string;
  };
  jti: string;
  htm: string;
  htu: string;
  iat: number;
}

export interface CSRFProtectionOptions {
  validateFetchMetadata?: boolean;
  allowedOrigins?: string[];
  csrfTokenHeader?: string;
}

export interface MTLSOptions {
  requireClientCert?: boolean;
  trustedCAs?: string[];
  allowedFingerprints?: string[];
}