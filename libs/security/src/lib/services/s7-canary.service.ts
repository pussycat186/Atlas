import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, timer, of } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay } from 'rxjs/operators';

// S7 Canary Deployment Interfaces
export interface CanaryDeploymentStatus {
  stage: 'canary-10' | 'canary-50' | 'production';
  trafficPercentage: number;
  deploymentId: string;
  startTime: Date;
  healthStatus: CanaryHealthStatus;
  securityValidation: SecurityValidationResult;
  performanceMetrics: CanaryPerformanceMetrics;
  rollbackCapability: RollbackCapability;
}

export interface CanaryHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  applications: ApplicationHealth[];
  uptime: number;
  errorRate: number;
  responseTime: number;
  lastHealthCheck: Date;
}

export interface ApplicationHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  instances: number;
  healthyInstances: number;
  version: string;
  securityScore: number;
}

export interface SecurityValidationResult {
  overallScore: number;
  s0ToS6Compliance: PhaseCompliance[];
  s7CanaryCompliance: S7CanaryCompliance;
  vulnerabilities: VulnerabilityAssessment;
  complianceFrameworks: ComplianceFramework[];
  securityGates: SecurityGate[];
}

export interface PhaseCompliance {
  phase: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  requirements: string[];
  gaps: string[];
}

export interface S7CanaryCompliance {
  canaryInfrastructure: boolean;
  monitoringIntegration: boolean;
  rollbackMechanisms: boolean;
  securityValidation: boolean;
  performanceTracking: boolean;
  incidentResponse: boolean;
}

export interface VulnerabilityAssessment {
  critical: number;
  high: number;
  medium: number;
  low: number;
  lastScan: Date;
  scanners: string[];
  mitigatedCount: number;
}

export interface ComplianceFramework {
  name: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  implemented: boolean;
  evidence: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SecurityGate {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  criteria: GateCriteria[];
  timestamp: Date;
}

export interface GateCriteria {
  name: string;
  required: any;
  actual: any;
  passed: boolean;
}

export interface CanaryPerformanceMetrics {
  lighthouseScores: LighthouseScores;
  responseTimeP95: number;
  throughput: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  securityOverhead: SecurityOverheadMetrics;
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  security: number;
}

export interface SecurityOverheadMetrics {
  cspProcessing: number;
  hstsHeaders: number;
  cosignVerification: number;
  sbomValidation: number;
  slsaVerification: number;
  totalOverhead: number;
}

export interface RollbackCapability {
  enabled: boolean;
  triggerThresholds: RollbackTrigger[];
  estimatedRollbackTime: number;
  lastTestedDate: Date;
  automatedRollback: boolean;
}

export interface RollbackTrigger {
  metric: string;
  threshold: number;
  duration: number;
  severity: 'warning' | 'critical';
}

export interface ProductionReadinessChecklist {
  category: string;
  items: ReadinessItem[];
  overallScore: number;
  status: 'ready' | 'partial' | 'not-ready';
}

export interface ReadinessItem {
  name: string;
  status: 'complete' | 'partial' | 'incomplete';
  priority: 'critical' | 'high' | 'medium' | 'low';
  evidence: string[];
  blockers: string[];
}

@Injectable({
  providedIn: 'root'
})
export class S7CanaryService {
  private readonly apiBaseUrl = '/api/v1/s7';
  private refreshInterval = 15000; // 15 seconds for real-time monitoring
  
  // Real-time data streams for S7 canary monitoring
  private canaryStatusSubject = new BehaviorSubject<CanaryDeploymentStatus | null>(null);
  private securityValidationSubject = new BehaviorSubject<SecurityValidationResult | null>(null);
  private readinessSubject = new BehaviorSubject<ProductionReadinessChecklist[]>([]);
  
  // Public observables
  public readonly canaryStatus$ = this.canaryStatusSubject.asObservable();
  public readonly securityValidation$ = this.securityValidationSubject.asObservable();
  public readonly productionReadiness$ = this.readinessSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.initializeCanaryMonitoring();
  }
  
  private initializeCanaryMonitoring(): void {
    // Real-time canary status monitoring
    timer(0, this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchCanaryStatus()),
        catchError(error => {
          console.error('Failed to fetch canary status:', error);
          return of(null);
        }),
        shareReplay(1)
      )
      .subscribe(status => {
        if (status) {
          this.canaryStatusSubject.next(status);
        }
      });
    
    // Security validation monitoring
    timer(0, 30000) // Every 30 seconds
      .pipe(
        switchMap(() => this.fetchSecurityValidation()),
        catchError(error => {
          console.error('Failed to fetch security validation:', error);
          return of(null);
        }),
        shareReplay(1)
      )
      .subscribe(validation => {
        if (validation) {
          this.securityValidationSubject.next(validation);
        }
      });
    
    // Production readiness monitoring
    timer(0, 60000) // Every minute
      .pipe(
        switchMap(() => this.fetchProductionReadiness()),
        catchError(error => {
          console.error('Failed to fetch production readiness:', error);
          return of([]);
        }),
        shareReplay(1)
      )
      .subscribe(readiness => {
        this.readinessSubject.next(readiness);
      });
  }
  
  private fetchCanaryStatus(): Observable<CanaryDeploymentStatus> {
    // Mock data for S7 canary deployment
    const mockCanaryStatus: CanaryDeploymentStatus = {
      stage: 'canary-10',
      trafficPercentage: 10,
      deploymentId: 'deploy-s7-' + Date.now(),
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      healthStatus: {
        overall: 'healthy',
        applications: [
          {
            name: 'admin-insights',
            status: 'healthy',
            instances: 3,
            healthyInstances: 3,
            version: 's7-canary-10',
            securityScore: 95
          },
          {
            name: 'dev-portal',
            status: 'healthy',
            instances: 2,
            healthyInstances: 2,
            version: 's7-canary-10',
            securityScore: 92
          },
          {
            name: 'messenger',
            status: 'degraded',
            instances: 4,
            healthyInstances: 3,
            version: 's7-canary-10',
            securityScore: 88
          }
        ],
        uptime: 99.97,
        errorRate: 0.003,
        responseTime: 145,
        lastHealthCheck: new Date()
      },
      securityValidation: {
        overallScore: 94,
        s0ToS6Compliance: [],
        s7CanaryCompliance: {
          canaryInfrastructure: true,
          monitoringIntegration: true,
          rollbackMechanisms: true,
          securityValidation: true,
          performanceTracking: true,
          incidentResponse: false // Still rolling out
        },
        vulnerabilities: {
          critical: 0,
          high: 1,
          medium: 3,
          low: 8,
          lastScan: new Date(Date.now() - 15 * 60 * 1000),
          scanners: ['Trivy', 'Grype', 'Semgrep', 'Gitleaks'],
          mitigatedCount: 15
        },
        complianceFrameworks: [],
        securityGates: [
          {
            name: 'S0-S6 Security Implementation',
            status: 'passed',
            criteria: [
              { name: 'Overall Security Score', required: 75, actual: 94, passed: true },
              { name: 'Critical Vulnerabilities', required: 0, actual: 0, passed: true }
            ],
            timestamp: new Date(Date.now() - 60 * 60 * 1000)
          }
        ]
      },
      performanceMetrics: {
        lighthouseScores: {
          performance: 94,
          accessibility: 98,
          bestPractices: 96,
          seo: 92,
          security: 100
        },
        responseTimeP95: 185,
        throughput: 1250,
        errorRate: 0.003,
        cpuUtilization: 65,
        memoryUtilization: 72,
        securityOverhead: {
          cspProcessing: 2.4,
          hstsHeaders: 0.1,
          cosignVerification: 16.2,
          sbomValidation: 8.7,
          slsaVerification: 12.3,
          totalOverhead: 39.7
        }
      },
      rollbackCapability: {
        enabled: true,
        triggerThresholds: [
          { metric: 'error_rate', threshold: 0.05, duration: 300, severity: 'critical' },
          { metric: 'response_time_p95', threshold: 500, duration: 600, severity: 'warning' },
          { metric: 'security_score', threshold: 70, duration: 180, severity: 'critical' }
        ],
        estimatedRollbackTime: 90, // seconds
        lastTestedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        automatedRollback: true
      }
    };
    
    return of(mockCanaryStatus);
  }
  
  private fetchSecurityValidation(): Observable<SecurityValidationResult> {
    const mockValidation: SecurityValidationResult = {
      overallScore: 94,
      s0ToS6Compliance: [
        {
          phase: 'S0-S2: Remote Infrastructure',
          score: 100,
          status: 'compliant',
          requirements: ['GitHub Actions', 'Remote-only development', 'SHA-pinned workflows'],
          gaps: []
        },
        {
          phase: 'S3: RFC 9421 Receipts',
          score: 95,
          status: 'compliant',
          requirements: ['JWKS service', 'Receipt verification', 'Cryptographic signatures'],
          gaps: []
        },
        {
          phase: 'S4: Transport Security',
          score: 92,
          status: 'compliant',
          requirements: ['CSP nonces', 'HSTS enforcement', 'COOP/COEP', 'DPoP tokens'],
          gaps: []
        },
        {
          phase: 'S5: Supply Chain Security',
          score: 96,
          status: 'compliant',
          requirements: ['SLSA L3', 'SBOM generation', 'Cosign signing', 'Vulnerability scanning'],
          gaps: []
        },
        {
          phase: 'S6: Dev/Admin Experience',
          score: 91,
          status: 'compliant',
          requirements: ['Admin dashboard', 'Developer tooling', 'Security education', 'Performance monitoring'],
          gaps: []
        }
      ],
      s7CanaryCompliance: {
        canaryInfrastructure: true,
        monitoringIntegration: true,
        rollbackMechanisms: true,
        securityValidation: true,
        performanceTracking: true,
        incidentResponse: true
      },
      vulnerabilities: {
        critical: 0,
        high: 1,
        medium: 3,
        low: 8,
        lastScan: new Date(),
        scanners: ['Trivy', 'Grype', 'Semgrep', 'Gitleaks'],
        mitigatedCount: 15
      },
      complianceFrameworks: [
        {
          name: 'SLSA Level 3',
          score: 96,
          status: 'compliant',
          controls: [
            {
              id: 'SLSA-L3-001',
              name: 'Hermetic Builds',
              implemented: true,
              evidence: ['workflow-logs', 'build-artifacts'],
              riskLevel: 'low'
            }
          ]
        }
      ],
      securityGates: [
        {
          name: 'S7 Canary Security Gate',
          status: 'passed',
          criteria: [
            { name: 'Security Score', required: 90, actual: 94, passed: true },
            { name: 'Vulnerability Count', required: 5, actual: 12, passed: false },
            { name: 'SLSA Compliance', required: true, actual: true, passed: true }
          ],
          timestamp: new Date()
        }
      ]
    };
    
    return of(mockValidation);
  }
  
  private fetchProductionReadiness(): Observable<ProductionReadinessChecklist[]> {
    const mockReadiness: ProductionReadinessChecklist[] = [
      {
        category: 'Security Implementation',
        overallScore: 94,
        status: 'ready',
        items: [
          {
            name: 'S0-S6 Phase Implementation',
            status: 'complete',
            priority: 'critical',
            evidence: ['s0-s6-evidence-reports', 'compliance-certificates'],
            blockers: []
          },
          {
            name: 'S7 Canary Infrastructure',
            status: 'complete',
            priority: 'critical',
            evidence: ['canary-deployment-logs', 'monitoring-dashboards'],
            blockers: []
          },
          {
            name: 'Security Monitoring',
            status: 'complete',
            priority: 'high',
            evidence: ['security-dashboard', 'alert-configurations'],
            blockers: []
          }
        ]
      },
      {
        category: 'Performance & Reliability',
        overallScore: 87,
        status: 'ready',
        items: [
          {
            name: 'Load Testing',
            status: 'complete',
            priority: 'high',
            evidence: ['load-test-reports', 'performance-baselines'],
            blockers: []
          },
          {
            name: 'Lighthouse Scores',
            status: 'complete',
            priority: 'medium',
            evidence: ['lighthouse-reports', 'performance-budgets'],
            blockers: []
          },
          {
            name: 'Rollback Testing',
            status: 'partial',
            priority: 'critical',
            evidence: ['rollback-test-logs'],
            blockers: ['Complete automated rollback testing']
          }
        ]
      },
      {
        category: 'Compliance & Audit',
        overallScore: 92,
        status: 'ready',
        items: [
          {
            name: 'SOC 2 Compliance',
            status: 'complete',
            priority: 'high',
            evidence: ['soc2-audit-report', 'control-evidence'],
            blockers: []
          },
          {
            name: 'SLSA L3 Compliance',
            status: 'complete',
            priority: 'critical',
            evidence: ['slsa-provenance', 'build-attestations'],
            blockers: []
          }
        ]
      }
    ];
    
    return of(mockReadiness);
  }
  
  // Public API methods
  triggerCanaryDeployment(stage: 'canary-10' | 'canary-50' | 'production'): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/deploy`, { stage }).pipe(
      tap(() => {
        // Refresh canary status after deployment trigger
        setTimeout(() => this.refreshCanaryStatus(), 2000);
      })
    );
  }
  
  triggerRollback(reason: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/rollback`, { reason }).pipe(
      tap(() => {
        // Refresh status after rollback
        setTimeout(() => this.refreshCanaryStatus(), 1000);
      })
    );
  }
  
  runSecurityValidation(): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/validate-security`, {}).pipe(
      tap(() => {
        // Refresh validation results
        setTimeout(() => this.refreshSecurityValidation(), 5000);
      })
    );
  }
  
  getCanaryMetrics(timeRange: string = '1h'): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/metrics`, { 
      params: { timeRange } 
    });
  }
  
  exportS7Report(): Observable<Blob> {
    return combineLatest([
      this.canaryStatus$,
      this.securityValidation$,
      this.productionReadiness$
    ]).pipe(
      map(([canary, security, readiness]) => {
        const s7Report = {
          generatedAt: new Date().toISOString(),
          phase: 'S7 - Canary Rollout & Production Deployment',
          canaryDeployment: canary,
          securityValidation: security,
          productionReadiness: readiness,
          summary: {
            canaryStage: canary?.stage,
            securityScore: security?.overallScore,
            readinessStatus: readiness.every(r => r.status === 'ready') ? 'READY' : 'PARTIAL',
            recommendedAction: this.getRecommendedAction(canary, security, readiness)
          }
        };
        
        const jsonString = JSON.stringify(s7Report, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
      })
    );
  }
  
  private getRecommendedAction(
    canary: CanaryDeploymentStatus | null, 
    security: SecurityValidationResult | null,
    readiness: ProductionReadinessChecklist[]
  ): string {
    if (!canary || !security) return 'WAIT_FOR_DATA';
    
    if (security.overallScore >= 90 && 
        canary.healthStatus.overall === 'healthy' &&
        readiness.every(r => r.status === 'ready')) {
      return canary.stage === 'canary-10' ? 'PROMOTE_TO_CANARY_50' : 
             canary.stage === 'canary-50' ? 'PROMOTE_TO_PRODUCTION' : 'MONITOR';
    }
    
    if (security.overallScore < 75 || 
        canary.healthStatus.overall === 'unhealthy') {
      return 'INITIATE_ROLLBACK';
    }
    
    return 'CONTINUE_MONITORING';
  }
  
  private refreshCanaryStatus(): void {
    this.fetchCanaryStatus().subscribe(status => {
      this.canaryStatusSubject.next(status);
    });
  }
  
  private refreshSecurityValidation(): void {
    this.fetchSecurityValidation().subscribe(validation => {
      this.securityValidationSubject.next(validation);
    });
  }
}