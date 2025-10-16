import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription, interval, combineLatest } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

// Security interfaces
interface SecurityMetrics {
  overallScore: number;
  activeFlags: number;
  totalFlags: number;
  complianceStatus: ComplianceStatus;
  vulnerabilityCount: VulnerabilityCount;
  lastScan: Date;
  trends: SecurityTrend[];
}

interface ComplianceStatus {
  soc2: number;
  iso27001: number;
  gdpr: number;
  slsa: number;
}

interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SecurityTrend {
  date: Date;
  score: number;
  flagsEnabled: number;
}

interface SupplyChainStatus {
  slsaProvenance: boolean;
  sbomGeneration: boolean;
  cosignSigning: boolean;
  vulnerabilityScanning: boolean;
  lastAttestation: Date;
  trustedBuilds: number;
  totalBuilds: number;
}

interface SecurityIncident {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved';
  affectedApp: string;
}

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule
  ],
  template: `
    <div class="security-dashboard">
      <!-- Header Section -->
      <div class="dashboard-header">
        <h1>🛡️ Atlas Security Command Center</h1>
        <div class="header-metrics">
          <mat-card class="metric-card overall-score">
            <mat-card-header>
              <mat-card-title>Security Score</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="score-display">
                <span class="score-value" [class]="getScoreClass(securityMetrics?.overallScore || 0)">
                  {{securityMetrics?.overallScore || 0}}
                </span>
                <span class="score-total">/100</span>
              </div>
              <mat-progress-bar 
                [value]="securityMetrics?.overallScore || 0" 
                [color]="getScoreColor(securityMetrics?.overallScore || 0)">
              </mat-progress-bar>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-card-title>Security Flags</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="flag-stats">
                <span class="active-flags">{{securityMetrics?.activeFlags || 0}}</span>
                <span class="total-flags">/{{securityMetrics?.totalFlags || 0}}</span>
              </div>
              <div class="flag-percentage">
                {{getFlagPercentage()}}% Active
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-card-title>Vulnerabilities</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="vuln-summary">
                <mat-chip-set>
                  <mat-chip [color]="vulnerabilityCount?.critical ? 'warn' : 'primary'">
                    Critical: {{vulnerabilityCount?.critical || 0}}
                  </mat-chip>
                  <mat-chip [color]="vulnerabilityCount?.high ? 'accent' : 'primary'">
                    High: {{vulnerabilityCount?.high || 0}}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Main Dashboard Tabs -->
      <mat-tab-group class="dashboard-tabs" mat-stretch-tabs>
        <!-- S5 Supply Chain Security Tab -->
        <mat-tab label="🔗 Supply Chain Security">
          <div class="tab-content">
            <div class="supply-chain-grid">
              <mat-card class="slsa-status">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>verified</mat-icon>
                    SLSA L3 Provenance
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="status-indicator">
                    <mat-icon [color]="supplyChainStatus?.slsaProvenance ? 'primary' : 'warn'">
                      {{supplyChainStatus?.slsaProvenance ? 'check_circle' : 'warning'}}
                    </mat-icon>
                    <span>{{supplyChainStatus?.slsaProvenance ? 'Active' : 'Inactive'}}</span>
                  </div>
                  <div class="build-stats">
                    Trusted Builds: {{supplyChainStatus?.trustedBuilds}}/{{supplyChainStatus?.totalBuilds}}
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="sbom-status">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>inventory</mat-icon>
                    SBOM Generation
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="status-indicator">
                    <mat-icon [color]="supplyChainStatus?.sbomGeneration ? 'primary' : 'warn'">
                      {{supplyChainStatus?.sbomGeneration ? 'check_circle' : 'warning'}}
                    </mat-icon>
                    <span>{{supplyChainStatus?.sbomGeneration ? 'Active' : 'Inactive'}}</span>
                  </div>
                  <div class="sbom-formats">
                    Formats: SPDX 2.3, CycloneDX 1.4
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="cosign-status">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>security</mat-icon>
                    Cosign Signing
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="status-indicator">
                    <mat-icon [color]="supplyChainStatus?.cosignSigning ? 'primary' : 'warn'">
                      {{supplyChainStatus?.cosignSigning ? 'check_circle' : 'warning'}}
                    </mat-icon>
                    <span>{{supplyChainStatus?.cosignSigning ? 'Keyless Signing' : 'Inactive'}}</span>
                  </div>
                  <div class="attestation-info">
                    Last Attestation: {{formatDate(supplyChainStatus?.lastAttestation)}}
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="vuln-scanning">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>bug_report</mat-icon>
                    Vulnerability Scanning
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="scanner-list">
                    <div class="scanner-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Trivy: Container & FS</span>
                    </div>
                    <div class="scanner-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Grype: OSV Integration</span>
                    </div>
                    <div class="scanner-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Gitleaks: Secret Scanning</span>
                    </div>
                    <div class="scanner-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Semgrep: SAST Analysis</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Compliance Monitoring Tab -->
        <mat-tab label="📋 Compliance Status">
          <div class="tab-content">
            <div class="compliance-grid">
              <mat-card class="compliance-card">
                <mat-card-header>
                  <mat-card-title>SOC 2 Compliance</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-progress-bar 
                    [value]="securityMetrics?.complianceStatus?.soc2 || 0" 
                    color="primary">
                  </mat-progress-bar>
                  <div class="compliance-score">
                    {{securityMetrics?.complianceStatus?.soc2 || 0}}%
                  </div>
                  <div class="compliance-controls">
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>CC6.1 - Encryption</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="warn">warning</mat-icon>
                      <span>CC6.2 - Access Control</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>CC7.1 - Monitoring</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="compliance-card">
                <mat-card-header>
                  <mat-card-title>ISO 27001</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-progress-bar 
                    [value]="securityMetrics?.complianceStatus?.iso27001 || 0" 
                    color="accent">
                  </mat-progress-bar>
                  <div class="compliance-score">
                    {{securityMetrics?.complianceStatus?.iso27001 || 0}}%
                  </div>
                  <div class="compliance-controls">
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>A.10.1.1 - Cryptography</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>A.13.1.1 - Network Controls</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>A.14.2.1 - Development</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="compliance-card">
                <mat-card-header>
                  <mat-card-title>SLSA Level 3</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-progress-bar 
                    [value]="securityMetrics?.complianceStatus?.slsa || 0" 
                    color="primary">
                  </mat-progress-bar>
                  <div class="compliance-score">
                    {{securityMetrics?.complianceStatus?.slsa || 0}}%
                  </div>
                  <div class="slsa-requirements">
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Hermetic Builds</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Reproducible Outputs</span>
                    </div>
                    <div class="control-item">
                      <mat-icon color="primary">check</mat-icon>
                      <span>Signed Provenance</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Security Incidents Tab -->
        <mat-tab label="🚨 Incident Response">
          <div class="tab-content">
            <mat-card class="incidents-card">
              <mat-card-header>
                <mat-card-title>Recent Security Events</mat-card-title>
                <mat-card-subtitle>Last 24 hours</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="securityIncidents" class="incidents-table">
                  <ng-container matColumnDef="severity">
                    <th mat-header-cell *matHeaderCellDef>Severity</th>
                    <td mat-cell *matCellDef="let incident">
                      <mat-chip [color]="getSeverityColor(incident.severity)">
                        {{incident.severity.toUpperCase()}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let incident">{{incident.type}}</td>
                  </ng-container>

                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let incident">{{incident.description}}</td>
                  </ng-container>

                  <ng-container matColumnDef="app">
                    <th mat-header-cell *matHeaderCellDef>App</th>
                    <td mat-cell *matCellDef="let incident">{{incident.affectedApp}}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let incident">
                      <mat-chip [color]="getStatusColor(incident.status)">
                        {{incident.status.toUpperCase()}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="timestamp">
                    <th mat-header-cell *matHeaderCellDef>Time</th>
                    <td mat-cell *matCellDef="let incident">{{formatTime(incident.timestamp)}}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="incidentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: incidentColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Performance Impact Tab -->
        <mat-tab label="📊 Performance Impact">
          <div class="tab-content">
            <div class="performance-grid">
              <mat-card class="perf-card">
                <mat-card-header>
                  <mat-card-title>Security Control Overhead</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="perf-metrics">
                    <div class="metric-row">
                      <span>CSP Processing:</span>
                      <span class="metric-value">+2.3ms</span>
                    </div>
                    <div class="metric-row">
                      <span>HSTS Headers:</span>
                      <span class="metric-value">+0.1ms</span>
                    </div>
                    <div class="metric-row">
                      <span>Cosign Verification:</span>
                      <span class="metric-value">+15.7ms</span>
                    </div>
                    <div class="metric-row">
                      <span>SBOM Generation:</span>
                      <span class="metric-value">+45.2s (build)</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="lighthouse-scores">
                <mat-card-header>
                  <mat-card-title>Lighthouse Security Scores</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="lighthouse-grid">
                    <div class="score-item">
                      <span>Admin Insights:</span>
                      <span class="score-badge excellent">98</span>
                    </div>
                    <div class="score-item">
                      <span>Dev Portal:</span>
                      <span class="score-badge excellent">96</span>
                    </div>
                    <div class="score-item">
                      <span>Messenger:</span>
                      <span class="score-badge good">92</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./security-dashboard.component.scss']
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  securityMetrics: SecurityMetrics | null = null;
  supplyChainStatus: SupplyChainStatus | null = null;
  vulnerabilityCount: VulnerabilityCount | null = null;
  securityIncidents: SecurityIncident[] = [];
  
  incidentColumns = ['severity', 'type', 'description', 'app', 'status', 'timestamp'];
  
  private subscriptions = new Subscription();
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    // Auto-refresh dashboard every 30 seconds
    const refresh$ = interval(30000).pipe(startWith(0));
    
    this.subscriptions.add(
      refresh$.pipe(
        switchMap(() => this.loadSecurityData())
      ).subscribe()
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  private loadSecurityData() {
    return combineLatest([
      this.loadSecurityMetrics(),
      this.loadSupplyChainStatus(),
      this.loadSecurityIncidents()
    ]);
  }
  
  private loadSecurityMetrics() {
    // Mock data - in real implementation, call security metrics API
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.securityMetrics = {
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
          lastScan: new Date(),
          trends: []
        };
        this.vulnerabilityCount = this.securityMetrics.vulnerabilityCount;
        this.cdr.detectChanges();
        resolve();
      }, 500);
    });
  }
  
  private loadSupplyChainStatus() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.supplyChainStatus = {
          slsaProvenance: true,
          sbomGeneration: true,
          cosignSigning: true,
          vulnerabilityScanning: true,
          lastAttestation: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          trustedBuilds: 127,
          totalBuilds: 130
        };
        this.cdr.detectChanges();
        resolve();
      }, 300);
    });
  }
  
  private loadSecurityIncidents() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.securityIncidents = [
          {
            id: 'INC-001',
            severity: 'medium',
            type: 'Dependency Vulnerability',
            description: 'Medium severity vulnerability detected in lodash@4.17.20',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'investigating',
            affectedApp: 'dev_portal'
          },
          {
            id: 'INC-002',
            severity: 'low',
            type: 'License Compliance',
            description: 'New dependency with GPL license detected',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            status: 'resolved',
            affectedApp: 'admin_insights'
          }
        ];
        this.cdr.detectChanges();
        resolve();
      }, 200);
    });
  }
  
  getFlagPercentage(): number {
    if (!this.securityMetrics) return 0;
    return Math.round((this.securityMetrics.activeFlags / this.securityMetrics.totalFlags) * 100);
  }
  
  getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-warning';
    return 'score-critical';
  }
  
  getScoreColor(score: number): string {
    if (score >= 90) return 'primary';
    if (score >= 80) return 'accent';
    if (score >= 70) return 'warn';
    return 'warn';
  }
  
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'medium': return 'primary';
      default: return '';
    }
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'resolved': return 'primary';
      case 'investigating': return 'accent';
      case 'open': return 'warn';
      default: return '';
    }
  }
  
  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60)), 'minute');
  }
  
  formatTime(date: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60)), 'minute');
  }
}