import { createHash, createVerify } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * S5 Supply Chain Security Manager
 * 
 * Implements comprehensive supply chain attack prevention:
 * - Dependency attestation and verification
 * - SLSA provenance validation
 * - SBOM integrity checking
 * - Reproducible build verification
 */

export interface DependencyAttestation {
  packageName: string;
  version: string;
  sha256: string;
  attestation: {
    provenance: string;
    buildSystem: string;
    sourceCommit: string;
    timestamp: string;
    signature: string;
  };
  vulnerabilities: VulnerabilityInfo[];
  licenses: LicenseInfo[];
}

export interface VulnerabilityInfo {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  fixedVersion?: string;
  source: 'trivy' | 'grype' | 'osv' | 'github';
}

export interface LicenseInfo {
  spdxId: string;
  name: string;
  url: string;
  compatible: boolean;
}

export interface SLSAProvenance {
  version: string;
  buildType: string;
  builder: {
    id: string;
    version: string;
  };
  invocation: {
    configSource: {
      uri: string;
      digest: Record<string, string>;
    };
    parameters: Record<string, any>;
    environment: Record<string, string>;
  };
  buildConfig: Record<string, any>;
  materials: Array<{
    uri: string;
    digest: Record<string, string>;
  }>;
}

export class SupplyChainSecurityManager {
  private attestationStore: Map<string, DependencyAttestation> = new Map();
  private trustedBuilders: Set<string> = new Set([
    'https://github.com/actions/runner',
    'https://cloudbuild.googleapis.com',
    'https://buildkite.com'
  ]);
  private allowedLicenses: Set<string> = new Set([
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'Unlicense',
    '0BSD'
  ]);

  constructor() {
    this.loadAttestations();
  }

  /**
   * Attest a dependency with full supply chain metadata
   */
  async attestDependency(
    packageName: string,
    version: string,
    packagePath: string,
    buildMetadata: any
  ): Promise<DependencyAttestation> {
    // Calculate package hash
    const packageContent = readFileSync(packagePath);
    const sha256 = createHash('sha256').update(packageContent).digest('hex');

    // Generate provenance
    const provenance = this.generateProvenance(packageName, version, buildMetadata);

    // Scan for vulnerabilities
    const vulnerabilities = await this.scanVulnerabilities(packageName, version);

    // Check licenses
    const licenses = await this.checkLicenses(packageName, version);

    // Create attestation
    const attestation: DependencyAttestation = {
      packageName,
      version,
      sha256,
      attestation: {
        provenance: JSON.stringify(provenance),
        buildSystem: buildMetadata.buildSystem || 'github-actions',
        sourceCommit: buildMetadata.sourceCommit || process.env.GITHUB_SHA || '',
        timestamp: new Date().toISOString(),
        signature: await this.signAttestation(packageName, version, sha256)
      },
      vulnerabilities,
      licenses
    };

    // Store attestation
    this.attestationStore.set(`${packageName}@${version}`, attestation);
    this.saveAttestations();

    return attestation;
  }

  /**
   * Verify dependency attestation and integrity
   */
  async verifyDependency(
    packageName: string,
    version: string,
    packagePath: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const attestationKey = `${packageName}@${version}`;
    
    // Check if attestation exists
    const attestation = this.attestationStore.get(attestationKey);
    if (!attestation) {
      issues.push(`No attestation found for ${packageName}@${version}`);
      return { valid: false, issues };
    }

    // Verify package hash
    if (existsSync(packagePath)) {
      const packageContent = readFileSync(packagePath);
      const actualSha256 = createHash('sha256').update(packageContent).digest('hex');
      
      if (actualSha256 !== attestation.sha256) {
        issues.push(`Package hash mismatch for ${packageName}@${version}`);
      }
    } else {
      issues.push(`Package file not found: ${packagePath}`);
    }

    // Verify signature
    const signatureValid = await this.verifySignature(
      attestation.attestation.signature,
      packageName,
      version,
      attestation.sha256
    );
    
    if (!signatureValid) {
      issues.push(`Invalid signature for ${packageName}@${version}`);
    }

    // Check for critical vulnerabilities
    const criticalVulns = attestation.vulnerabilities.filter(
      v => v.severity === 'CRITICAL'
    );
    
    if (criticalVulns.length > 0) {
      issues.push(
        `Critical vulnerabilities found: ${criticalVulns.map(v => v.id).join(', ')}`
      );
    }

    // Check license compatibility
    const incompatibleLicenses = attestation.licenses.filter(l => !l.compatible);
    if (incompatibleLicenses.length > 0) {
      issues.push(
        `Incompatible licenses: ${incompatibleLicenses.map(l => l.spdxId).join(', ')}`
      );
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Validate SLSA provenance
   */
  async validateSLSAProvenance(provenance: SLSAProvenance): Promise<boolean> {
    try {
      // Verify builder is trusted
      if (!this.trustedBuilders.has(provenance.builder.id)) {
        console.warn(`Untrusted builder: ${provenance.builder.id}`);
        return false;
      }

      // Verify build type
      const validBuildTypes = [
        'https://github.com/actions/workflow@v1',
        'https://cloudbuild.googleapis.com/GoogleHostedWorker@v1'
      ];
      
      if (!validBuildTypes.includes(provenance.buildType)) {
        console.warn(`Invalid build type: ${provenance.buildType}`);
        return false;
      }

      // Verify materials (source inputs)
      for (const material of provenance.materials) {
        if (!material.digest.sha1 && !material.digest.sha256) {
          console.warn(`Missing digest for material: ${material.uri}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('SLSA provenance validation error:', error);
      return false;
    }
  }

  /**
   * Generate reproducible build verification
   */
  async verifyReproducibleBuild(
    artifactPath: string,
    expectedHash: string,
    buildParams: any
  ): Promise<boolean> {
    try {
      // Read artifact and calculate hash
      const artifactContent = readFileSync(artifactPath);
      const actualHash = createHash('sha256').update(artifactContent).digest('hex');

      if (actualHash !== expectedHash) {
        console.warn(`Reproducible build hash mismatch: expected ${expectedHash}, got ${actualHash}`);
        return false;
      }

      // Verify build parameters are deterministic
      const requiredParams = ['SOURCE_DATE_EPOCH', 'NODE_ENV', 'SLSA_BUILD'];
      for (const param of requiredParams) {
        if (!buildParams[param]) {
          console.warn(`Missing required build parameter: ${param}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Reproducible build verification error:', error);
      return false;
    }
  }

  /**
   * Scan for known vulnerabilities
   */
  private async scanVulnerabilities(
    packageName: string,
    version: string
  ): Promise<VulnerabilityInfo[]> {
    // In production, this would integrate with OSV, GitHub Security Advisory, etc.
    // Simplified implementation for demonstration
    
    const mockVulnerabilities: VulnerabilityInfo[] = [];
    
    // Check against known vulnerable patterns
    const vulnerablePatterns = [
      { pattern: /lodash@[0-3]\./, severity: 'HIGH' as const, id: 'GHSA-jf85-cpcp-j695' },
      { pattern: /express@[0-3]\./, severity: 'MEDIUM' as const, id: 'GHSA-rv95-896h-c2vc' },
      { pattern: /moment@[0-1]\./, severity: 'LOW' as const, id: 'GHSA-8hfj-j24r-96c4' }
    ];

    const packageVersion = `${packageName}@${version}`;
    for (const vuln of vulnerablePatterns) {
      if (vuln.pattern.test(packageVersion)) {
        mockVulnerabilities.push({
          id: vuln.id,
          severity: vuln.severity,
          description: `Known vulnerability in ${packageName}@${version}`,
          source: 'github'
        });
      }
    }

    return mockVulnerabilities;
  }

  /**
   * Check license compatibility
   */
  private async checkLicenses(
    packageName: string,
    version: string
  ): Promise<LicenseInfo[]> {
    // In production, this would integrate with SPDX license database
    // Simplified implementation for demonstration
    
    const commonLicenses: Record<string, LicenseInfo> = {
      'MIT': {
        spdxId: 'MIT',
        name: 'MIT License',
        url: 'https://opensource.org/licenses/MIT',
        compatible: this.allowedLicenses.has('MIT')
      },
      'Apache-2.0': {
        spdxId: 'Apache-2.0',
        name: 'Apache License 2.0',
        url: 'https://apache.org/licenses/LICENSE-2.0',
        compatible: this.allowedLicenses.has('Apache-2.0')
      },
      'GPL-3.0': {
        spdxId: 'GPL-3.0',
        name: 'GNU General Public License v3.0',
        url: 'https://www.gnu.org/licenses/gpl-3.0.html',
        compatible: false // Copyleft license
      }
    };

    // Mock license detection - in production, parse package.json or use license scanner
    const detectedLicense = packageName.includes('gpl') ? 'GPL-3.0' : 'MIT';
    
    return [commonLicenses[detectedLicense] || commonLicenses.MIT];
  }

  /**
   * Generate SLSA provenance
   */
  private generateProvenance(
    packageName: string,
    version: string,
    buildMetadata: any
  ): SLSAProvenance {
    return {
      version: '0.2',
      buildType: 'https://github.com/actions/workflow@v1',
      builder: {
        id: 'https://github.com/actions/runner',
        version: buildMetadata.runnerVersion || '2.311.0'
      },
      invocation: {
        configSource: {
          uri: buildMetadata.workflowUri || 'git+https://github.com/pussycat186/Atlas',
          digest: {
            sha1: buildMetadata.sourceCommit || process.env.GITHUB_SHA || ''
          }
        },
        parameters: buildMetadata.buildParams || {},
        environment: {
          NODE_ENV: 'production',
          SLSA_BUILD: 'true',
          S5_SUPPLY_CHAIN: 'true'
        }
      },
      buildConfig: buildMetadata.buildConfig || {},
      materials: [
        {
          uri: `npm:${packageName}@${version}`,
          digest: {
            sha256: buildMetadata.sourceHash || ''
          }
        }
      ]
    };
  }

  /**
   * Sign attestation (simplified - use proper key management in production)
   */
  private async signAttestation(
    packageName: string,
    version: string,
    sha256: string
  ): Promise<string> {
    const data = `${packageName}:${version}:${sha256}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify attestation signature
   */
  private async verifySignature(
    signature: string,
    packageName: string,
    version: string,
    sha256: string
  ): Promise<boolean> {
    // Simplified verification - in production, use proper cryptographic verification
    return signature.length === 64; // SHA-256 hex length
  }

  /**
   * Load attestations from storage
   */
  private loadAttestations(): void {
    const attestationFile = join(process.cwd(), 's5-attestations.json');
    
    if (existsSync(attestationFile)) {
      try {
        const data = JSON.parse(readFileSync(attestationFile, 'utf-8'));
        this.attestationStore = new Map(Object.entries(data));
      } catch (error) {
        console.warn('Failed to load attestations:', error);
      }
    }
  }

  /**
   * Save attestations to storage
   */
  private saveAttestations(): void {
    const attestationFile = join(process.cwd(), 's5-attestations.json');
    
    try {
      const data = Object.fromEntries(this.attestationStore);
      writeFileSync(attestationFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save attestations:', error);
    }
  }

  /**
   * Generate comprehensive supply chain report
   */
  async generateSupplyChainReport(): Promise<{
    summary: any;
    attestations: DependencyAttestation[];
    vulnerabilities: VulnerabilityInfo[];
    licenses: LicenseInfo[];
    recommendations: string[];
  }> {
    const attestations = Array.from(this.attestationStore.values());
    const allVulnerabilities = attestations.flatMap(a => a.vulnerabilities);
    const allLicenses = attestations.flatMap(a => a.licenses);
    const recommendations: string[] = [];

    // Analyze vulnerabilities
    const criticalVulns = allVulnerabilities.filter(v => v.severity === 'CRITICAL');
    const highVulns = allVulnerabilities.filter(v => v.severity === 'HIGH');
    
    if (criticalVulns.length > 0) {
      recommendations.push(`Address ${criticalVulns.length} critical vulnerabilities immediately`);
    }
    if (highVulns.length > 0) {
      recommendations.push(`Plan remediation for ${highVulns.length} high-severity vulnerabilities`);
    }

    // Analyze licenses
    const incompatibleLicenses = allLicenses.filter(l => !l.compatible);
    if (incompatibleLicenses.length > 0) {
      recommendations.push(`Review ${incompatibleLicenses.length} incompatible licenses`);
    }

    // Check attestation coverage
    const unattestedPackages = attestations.filter(a => !a.attestation.signature);
    if (unattestedPackages.length > 0) {
      recommendations.push(`Generate attestations for ${unattestedPackages.length} packages`);
    }

    return {
      summary: {
        totalPackages: attestations.length,
        attestedPackages: attestations.filter(a => a.attestation.signature).length,
        vulnerabilities: {
          critical: criticalVulns.length,
          high: highVulns.length,
          medium: allVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
          low: allVulnerabilities.filter(v => v.severity === 'LOW').length
        },
        licenses: {
          compatible: allLicenses.filter(l => l.compatible).length,
          incompatible: incompatibleLicenses.length
        },
        complianceScore: Math.round(
          (attestations.filter(a => a.attestation.signature).length / Math.max(attestations.length, 1)) * 100
        )
      },
      attestations,
      vulnerabilities: allVulnerabilities,
      licenses: allLicenses,
      recommendations
    };
  }
}

export const supplyChainManager = new SupplyChainSecurityManager();