import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * S5 Cosign Integration for Container Signing and Verification
 * 
 * Provides keyless signing using GitHub OIDC tokens and Sigstore
 * infrastructure for transparent supply chain security.
 */

export interface CosignSignature {
  imageRef: string;
  signature: string;
  certificate: string;
  bundle: string;
  timestamp: string;
  issuer: string;
  subject: string;
}

export interface VerificationResult {
  verified: boolean;
  signatures: CosignSignature[];
  attestations: any[];
  errors: string[];
  warnings: string[];
}

export class CosignManager {
  private cosignPath: string = 'cosign';
  private rekorUrl: string = 'https://rekor.sigstore.dev';
  private fulcioUrl: string = 'https://fulcio.sigstore.dev';

  constructor(options: {
    cosignPath?: string;
    rekorUrl?: string;
    fulcioUrl?: string;
  } = {}) {
    this.cosignPath = options.cosignPath || 'cosign';
    this.rekorUrl = options.rekorUrl || 'https://rekor.sigstore.dev';
    this.fulcioUrl = options.fulcioUrl || 'https://fulcio.sigstore.dev';
  }

  /**
   * Sign container image using keyless signing with GitHub OIDC
   */
  async signImage(
    imageRef: string,
    attestations?: {
      sbom?: string;
      provenance?: string;
      vulnerability?: string;
    }
  ): Promise<CosignSignature> {
    try {
      console.log(`🔐 Signing container image: ${imageRef}`);

      // Sign the container image
      const signResult = await this.runCosign([
        'sign',
        '--yes', // Skip confirmation in CI
        imageRef
      ], {
        COSIGN_EXPERIMENTAL: '1', // Enable keyless signing
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || '',
        ACTIONS_ID_TOKEN_REQUEST_URL: process.env.ACTIONS_ID_TOKEN_REQUEST_URL || ''
      });

      // Attach SBOM attestation if provided
      if (attestations?.sbom) {
        await this.attachAttestation(imageRef, 'sbom', attestations.sbom);
      }

      // Attach SLSA provenance if provided
      if (attestations?.provenance) {
        await this.attachAttestation(imageRef, 'slsaprovenance', attestations.provenance);
      }

      // Attach vulnerability scan if provided
      if (attestations?.vulnerability) {
        await this.attachAttestation(imageRef, 'vuln', attestations.vulnerability);
      }

      // Get signature information
      const signature = await this.getSignatureInfo(imageRef);

      console.log(`✅ Successfully signed ${imageRef}`);
      return signature;

    } catch (error) {
      console.error(`❌ Failed to sign ${imageRef}:`, error);
      throw error;
    }
  }

  /**
   * Verify container image signatures and attestations
   */
  async verifyImage(
    imageRef: string,
    options: {
      certificate?: string;
      certificateChain?: string;
      certificateOidcIssuer?: string;
      certificateIdentity?: string;
      annotations?: Record<string, string>;
    } = {}
  ): Promise<VerificationResult> {
    const result: VerificationResult = {
      verified: false,
      signatures: [],
      attestations: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`🔍 Verifying container image: ${imageRef}`);

      // Build verification command
      const verifyArgs = ['verify', imageRef];
      
      if (options.certificateOidcIssuer) {
        verifyArgs.push('--certificate-oidc-issuer', options.certificateOidcIssuer);
      }
      
      if (options.certificateIdentity) {
        verifyArgs.push('--certificate-identity', options.certificateIdentity);
      }

      // Verify signatures
      try {
        const verifyResult = await this.runCosign(verifyArgs, {
          COSIGN_EXPERIMENTAL: '1'
        });

        result.verified = true;
        result.signatures = [await this.getSignatureInfo(imageRef)];
        console.log(`✅ Signature verification passed for ${imageRef}`);

      } catch (error) {
        result.errors.push(`Signature verification failed: ${error.message}`);
        console.warn(`⚠️  Signature verification failed for ${imageRef}: ${error.message}`);
      }

      // Verify attestations
      try {
        const attestations = await this.verifyAttestations(imageRef);
        result.attestations = attestations;
        
        if (attestations.length > 0) {
          console.log(`✅ Found ${attestations.length} valid attestations`);
        } else {
          result.warnings.push('No attestations found');
        }

      } catch (error) {
        result.warnings.push(`Attestation verification warning: ${error.message}`);
        console.warn(`⚠️  Attestation verification warning: ${error.message}`);
      }

    } catch (error) {
      result.errors.push(`Verification error: ${error.message}`);
      console.error(`❌ Verification error for ${imageRef}:`, error);
    }

    return result;
  }

  /**
   * Attach attestation to signed image
   */
  private async attachAttestation(
    imageRef: string,
    predicateType: string,
    attestationPath: string
  ): Promise<void> {
    const attestArgs = [
      'attest',
      '--yes',
      '--predicate', attestationPath,
      '--type', predicateType,
      imageRef
    ];

    await this.runCosign(attestArgs, {
      COSIGN_EXPERIMENTAL: '1'
    });

    console.log(`📎 Attached ${predicateType} attestation to ${imageRef}`);
  }

  /**
   * Verify attestations for an image
   */
  private async verifyAttestations(imageRef: string): Promise<any[]> {
    try {
      const verifyAttestArgs = [
        'verify-attestation',
        imageRef,
        '--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com',
        '--certificate-identity-regexp', '.*github.*'
      ];

      const result = await this.runCosign(verifyAttestArgs, {
        COSIGN_EXPERIMENTAL: '1'
      });

      // Parse attestation results
      const attestations = [];
      const lines = result.stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const attestation = JSON.parse(line);
          attestations.push(attestation);
        } catch {
          // Skip non-JSON lines
        }
      }

      return attestations;

    } catch (error) {
      console.warn('Failed to verify attestations:', error.message);
      return [];
    }
  }

  /**
   * Get signature information for an image
   */
  private async getSignatureInfo(imageRef: string): Promise<CosignSignature> {
    try {
      const triangulateResult = await this.runCosign([
        'triangulate',
        '--type', 'signature',
        imageRef
      ]);

      // Get certificate information
      const verifyResult = await this.runCosign([
        'verify',
        '--output', 'json',
        imageRef
      ], {
        COSIGN_EXPERIMENTAL: '1'
      });

      const verificationData = JSON.parse(verifyResult.stdout);
      const firstSignature = verificationData[0] || {};

      return {
        imageRef,
        signature: triangulateResult.stdout.trim(),
        certificate: firstSignature.certificate || '',
        bundle: JSON.stringify(firstSignature.bundle || {}),
        timestamp: new Date().toISOString(),
        issuer: firstSignature.certificateIssuer || 'https://token.actions.githubusercontent.com',
        subject: firstSignature.certificateIdentity || 'unknown'
      };

    } catch (error) {
      // Return minimal signature info if detailed info unavailable
      return {
        imageRef,
        signature: 'verified',
        certificate: '',
        bundle: '{}',
        timestamp: new Date().toISOString(),
        issuer: 'https://token.actions.githubusercontent.com',
        subject: 'github-actions'
      };
    }
  }

  /**
   * Generate policy for image verification
   */
  generateVerificationPolicy(options: {
    allowedIssuers: string[];
    allowedSubjects: string[];
    requireAttestations: string[];
  }): any {
    return {
      apiVersion: 'policy.sigstore.dev/v1beta1',
      kind: 'ClusterImagePolicy',
      metadata: {
        name: 'atlas-s5-policy'
      },
      spec: {
        images: [
          {
            glob: 'ghcr.io/pussycat186/atlas*'
          }
        ],
        authorities: [
          {
            keyless: {
              url: this.fulcioUrl,
              identities: options.allowedSubjects.map(subject => ({
                issuer: 'https://token.actions.githubusercontent.com',
                subject
              }))
            },
            ctlog: {
              url: this.rekorUrl
            },
            attestations: options.requireAttestations.map(type => ({
              name: type,
              predicateType: this.getPredicateType(type),
              policy: {
                type: 'cue',
                data: 'true' // Allow all for now - customize as needed
              }
            }))
          }
        ]
      }
    };
  }

  /**
   * Get predicate type for attestation type
   */
  private getPredicateType(type: string): string {
    const predicateTypes: Record<string, string> = {
      'sbom': 'https://spdx.dev/Document',
      'slsaprovenance': 'https://slsa.dev/provenance/v0.2',
      'vuln': 'https://cosign.sigstore.dev/attestation/vuln/v1'
    };

    return predicateTypes[type] || type;
  }

  /**
   * Run cosign command with proper error handling
   */
  private async runCosign(
    args: string[],
    env: Record<string, string> = {}
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const cosign = spawn(this.cosignPath, args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      cosign.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      cosign.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      cosign.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Cosign command failed with code ${code}: ${stderr}`));
        }
      });

      cosign.on('error', (error) => {
        reject(new Error(`Failed to spawn cosign: ${error.message}`));
      });
    });
  }

  /**
   * Check if cosign is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.runCosign(['version']);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * S5 Container Security Policy
 */
export class ContainerSecurityPolicy {
  private cosignManager: CosignManager;

  constructor(cosignManager: CosignManager) {
    this.cosignManager = cosignManager;
  }

  /**
   * Enforce S5 container security policy
   */
  async enforcePolicy(imageRef: string): Promise<{
    allowed: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Verify image is signed
    const verification = await this.cosignManager.verifyImage(imageRef, {
      certificateOidcIssuer: 'https://token.actions.githubusercontent.com',
      certificateIdentity: 'https://github.com/pussycat186/Atlas/.github/workflows/slsa-provenance.yml@refs/heads/main'
    });

    if (!verification.verified) {
      violations.push('Image signature verification failed');
    }

    // Check for required attestations
    const requiredAttestations = ['sbom', 'slsaprovenance'];
    const foundAttestations = verification.attestations.map(a => a.predicateType);

    for (const required of requiredAttestations) {
      const predicateType = this.cosignManager['getPredicateType'](required);
      if (!foundAttestations.includes(predicateType)) {
        violations.push(`Missing required attestation: ${required}`);
      }
    }

    // Check image source
    if (!imageRef.startsWith('ghcr.io/pussycat186/atlas')) {
      violations.push(`Image not from trusted registry: ${imageRef}`);
    }

    // Warnings for best practices
    if (verification.signatures.length === 0) {
      warnings.push('No signatures found');
    }

    if (verification.attestations.length < 2) {
      warnings.push('Fewer than expected attestations found');
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings
    };
  }
}

export const cosignManager = new CosignManager();
export const containerSecurityPolicy = new ContainerSecurityPolicy(cosignManager);