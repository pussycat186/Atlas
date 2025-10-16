import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, timer } from 'rxjs';
import { map, switchMap, startWith, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces for S6 Security Monitoring
export interface SecurityMetricsResponse {
  overallScore: number;
  activeFlags: number;
  totalFlags: number;
  complianceStatus: ComplianceStatus;
  vulnerabilityCount: VulnerabilityCount;
  lastScan: string;
  trends: SecurityTrend[];
  performanceImpact: PerformanceImpact;
}

export interface ComplianceStatus {
  soc2: number;
  iso27001: number;
  gdpr: number;
  slsa: number;
}

export interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SecurityTrend {
  date: string;
  score: number;
  flagsEnabled: number;
}

export interface PerformanceImpact {
  cspProcessing: number;
  hstsHeaders: number;
  cosignVerification: number;
  sbomGeneration: number;
  totalOverhead: number;
  buildTimeIncrease: number;
}

export interface SupplyChainMetrics {
  slsaProvenance: boolean;
  sbomGeneration: boolean;
  cosignSigning: boolean;
  vulnerabilityScanning: boolean;
  lastAttestation: string;
  trustedBuilds: number;
  totalBuilds: number;
  attestationPipelineStatus: AttestationStatus[];
}

export interface AttestationStatus {
  stage: string;
  status: 'complete' | 'running' | 'failed' | 'pending';
  timestamp: string;
  details?: string;
}

export interface SecurityIncidentSummary {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  affectedApp: string;
  mitigationSteps: string[];
}

export interface SecurityFlagsStatus {
  phase: string;
  flags: SecurityFlag[];
  canaryProgress: CanaryProgress;
}

export interface SecurityFlag {
  name: string;
  enabled: boolean;
  canaryPct: number;
  apps: string[];
  riskLevel: 'low' | 'medium' | 'high';
  rollbackTime: string;
  description: string;
}

export interface CanaryProgress {
  currentPhase: number;
  totalPhases: number;
  successRate: number;
  errorRate: number;
  nextRolloutTime?: string;
}

export interface ComplianceReport {
  framework: string;
  score: number;
  controls: ComplianceControl[];
  lastAssessment: string;
  nextAssessment: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  evidence: string[];
  gaps: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SecurityMetricsService {
  private readonly apiBaseUrl = '/api/v1/security';
  private refreshInterval = 30000; // 30 seconds
  
  // Real-time data streams
  private metricsSubject = new BehaviorSubject<SecurityMetricsResponse | null>(null);
  private supplyChainSubject = new BehaviorSubject<SupplyChainMetrics | null>(null);
  private incidentsSubject = new BehaviorSubject<SecurityIncidentSummary[]>([]);
  private flagsSubject = new BehaviorSubject<SecurityFlagsStatus | null>(null);
  
  // Public observables
  public readonly metrics$ = this.metricsSubject.asObservable();
  public readonly supplyChain$ = this.supplyChainSubject.asObservable();
  public readonly incidents$ = this.incidentsSubject.asObservable();
  public readonly flags$ = this.flagsSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.initializeRealTimeUpdates();
  }
  
  private initializeRealTimeUpdates(): void {
    // Auto-refresh security metrics every 30 seconds
    timer(0, this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchSecurityMetrics()),
        catchError(error => {
          console.error('Failed to fetch security metrics:', error);
          return of(null);
        })
      )
      .subscribe(metrics => {
        if (metrics) {
          this.metricsSubject.next(metrics);
        }
      });
    
    // Auto-refresh supply chain status every 60 seconds
    timer(0, 60000)
      .pipe(
        switchMap(() => this.fetchSupplyChainMetrics()),
        catchError(error => {
          console.error('Failed to fetch supply chain metrics:', error);
          return of(null);
        })
      )
      .subscribe(supplyChain => {
        if (supplyChain) {
          this.supplyChainSubject.next(supplyChain);
        }
      });
    
    // Auto-refresh incidents every 15 seconds
    timer(0, 15000)
      .pipe(
        switchMap(() => this.fetchSecurityIncidents()),
        catchError(error => {
          console.error('Failed to fetch security incidents:', error);
          return of([]);
        })
      )
      .subscribe(incidents => {
        this.incidentsSubject.next(incidents);
      });
    
    // Auto-refresh flags status every 45 seconds
    timer(0, 45000)
      .pipe(
        switchMap(() => this.fetchSecurityFlags()),
        catchError(error => {
          console.error('Failed to fetch security flags:', error);
          return of(null);
        })
      )
      .subscribe(flags => {
        if (flags) {
          this.flagsSubject.next(flags);
        }
      });
  }
  
  private fetchSecurityMetrics(): Observable<SecurityMetricsResponse> {
    // In production, this would call the real API
    // For now, return mock data matching our S5/S6 implementation
    const mockMetrics: SecurityMetricsResponse = {
      overallScore: 87,
      activeFlags: 23,
      totalFlags: 29,
      complianceStatus: {
        soc2: 85,
        iso27001: 92,
        gdpr: 78,
        slsa: 95
      },
      vulnerabilityCount: {
        critical: 0,
        high: 2,
        medium: 5,
        low: 12
      },
      lastScan: new Date().toISOString(),
      trends: [
        { date: new Date(Date.now() - 86400000 * 6).toISOString(), score: 82, flagsEnabled: 18 },
        { date: new Date(Date.now() - 86400000 * 5).toISOString(), score: 84, flagsEnabled: 19 },
        { date: new Date(Date.now() - 86400000 * 4).toISOString(), score: 85, flagsEnabled: 20 },
        { date: new Date(Date.now() - 86400000 * 3).toISOString(), score: 86, flagsEnabled: 21 },
        { date: new Date(Date.now() - 86400000 * 2).toISOString(), score: 86, flagsEnabled: 22 },
        { date: new Date(Date.now() - 86400000).toISOString(), score: 87, flagsEnabled: 23 }
      ],
      performanceImpact: {
        cspProcessing: 2.3,
        hstsHeaders: 0.1,
        cosignVerification: 15.7,
        sbomGeneration: 45200, // milliseconds
        totalOverhead: 18.1,
        buildTimeIncrease: 45200
      }
    };
    
    return of(mockMetrics);
  }
  
  private fetchSupplyChainMetrics(): Observable<SupplyChainMetrics> {
    const mockSupplyChain: SupplyChainMetrics = {
      slsaProvenance: true,
      sbomGeneration: true,
      cosignSigning: true,
      vulnerabilityScanning: true,
      lastAttestation: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      trustedBuilds: 127,
      totalBuilds: 130,
      attestationPipelineStatus: [
        {
          stage: 'Build Provenance',
          status: 'complete',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          details: 'SLSA L3 provenance generated successfully'
        },
        {
          stage: 'SBOM Generation',
          status: 'complete',
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          details: 'SPDX 2.3 and CycloneDX 1.4 formats created'
        },
        {
          stage: 'Vulnerability Scanning',
          status: 'complete',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          details: 'Trivy, Grype, Semgrep scans completed'
        },
        {
          stage: 'Cosign Signing',
          status: 'complete',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          details: 'Keyless signature with GitHub OIDC'
        },
        {
          stage: 'Final Attestation',
          status: 'running',
          timestamp: new Date().toISOString(),
          details: 'Creating final attestation bundle'
        }
      ]
    };
    
    return of(mockSupplyChain);
  }
  
  private fetchSecurityIncidents(): Observable<SecurityIncidentSummary[]> {
    const mockIncidents: SecurityIncidentSummary[] = [
      {
        id: 'INC-001',
        severity: 'medium',
        type: 'Dependency Vulnerability',
        description: 'Medium severity vulnerability detected in lodash@4.17.20',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'investigating',
        affectedApp: 'dev_portal',
        mitigationSteps: [
          'Update lodash to version 4.17.21 or later',
          'Review usage of prototype manipulation functions',
          'Run additional security tests'
        ]
      },
      {
        id: 'INC-002',
        severity: 'low',
        type: 'License Compliance',
        description: 'New dependency with GPL license detected',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'resolved',
        affectedApp: 'admin_insights',
        mitigationSteps: [
          'Replaced GPL dependency with MIT alternative',
          'Updated license scanning rules',
          'Verified compliance status'
        ]
      }
    ];
    
    return of(mockIncidents);
  }
  
  private fetchSecurityFlags(): Observable<SecurityFlagsStatus> {
    const mockFlags: SecurityFlagsStatus = {
      phase: 'S6',
      flags: [
        {
          name: 'SECURITY_ADMIN_DASHBOARD',
          enabled: false,
          canaryPct: 0,
          apps: ['admin_insights'],
          riskLevel: 'low',
          rollbackTime: '< 5 minutes',
          description: 'Enhanced security monitoring and compliance dashboard'
        },
        {
          name: 'SECURITY_DEV_TOOLING',
          enabled: false,
          canaryPct: 0,
          apps: ['dev_portal'],
          riskLevel: 'low',
          rollbackTime: '< 3 minutes',
          description: 'Security tooling interface and developer documentation'
        },
        {
          name: 'SECURITY_AUTOMATED_REPORTING',
          enabled: false,
          canaryPct: 0,
          apps: ['admin_insights', 'dev_portal'],
          riskLevel: 'low',
          rollbackTime: '< 2 minutes',
          description: 'Automated security posture reporting and alerting'
        }
      ],
      canaryProgress: {
        currentPhase: 0,
        totalPhases: 3,
        successRate: 0,
        errorRate: 0,
        nextRolloutTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    return of(mockFlags);
  }
  
  // Public API methods for manual refreshes and actions
  refreshMetrics(): void {
    this.fetchSecurityMetrics().subscribe(metrics => {
      this.metricsSubject.next(metrics);
    });
  }
  
  runSecurityScan(): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/scan`, {}).pipe(
      tap(() => {
        // Refresh metrics after scan
        setTimeout(() => this.refreshMetrics(), 2000);
      })
    );
  }
  
  enableSecurityFlag(flagName: string, canaryPct: number = 10): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/flags/${flagName}/enable`, {
      canaryPct,
      reason: 'S6 Dev/Admin Experience rollout'
    });
  }
  
  rollbackSecurityFlag(flagName: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/flags/${flagName}/rollback`, {
      reason: 'Manual rollback requested'
    });
  }
  
  getComplianceReport(framework: string): Observable<ComplianceReport> {
    // Mock compliance report
    const mockReport: ComplianceReport = {
      framework,
      score: framework === 'slsa' ? 95 : 85,
      controls: [
        {
          id: 'SLSA-L3-001',
          name: 'Hermetic Builds',
          status: 'compliant',
          evidence: ['slsa-provenance.json', 'build-workflow.yml'],
          gaps: []
        },
        {
          id: 'SLSA-L3-002',
          name: 'Signed Provenance',
          status: 'compliant',
          evidence: ['cosign-signatures.log', 'rekor-entries.json'],
          gaps: []
        }
      ],
      lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessment: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return of(mockReport);
  }
  
  exportSecurityReport(format: 'json' | 'pdf' | 'csv' = 'json'): Observable<Blob> {
    return combineLatest([
      this.metrics$,
      this.supplyChain$,
      this.incidents$,
      this.flags$
    ]).pipe(
      map(([metrics, supplyChain, incidents, flags]) => {
        const report = {
          generatedAt: new Date().toISOString(),
          metrics,
          supplyChain,
          incidents,
          flags,
          summary: {
            overallSecurityScore: metrics?.overallScore || 0,
            activeSecurityControls: metrics?.activeFlags || 0,
            criticalVulnerabilities: metrics?.vulnerabilityCount?.critical || 0,
            supplyChainCompliance: supplyChain?.slsaProvenance && supplyChain?.cosignSigning
          }
        };
        
        const jsonString = JSON.stringify(report, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
      })
    );
  }
  
  getPerformanceImpactAnalysis(): Observable<PerformanceImpact> {
    return this.metrics$.pipe(
      map(metrics => metrics?.performanceImpact || {
        cspProcessing: 0,
        hstsHeaders: 0,
        cosignVerification: 0,
        sbomGeneration: 0,
        totalOverhead: 0,
        buildTimeIncrease: 0
      })
    );
  }
}