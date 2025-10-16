import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

interface SecurityTool {
  id: string;
  name: string;
  description: string;
  category: 'scanning' | 'testing' | 'documentation' | 'monitoring';
  status: 'available' | 'running' | 'error';
  lastRun?: Date;
  results?: any;
}

interface SecurityGuide {
  id: string;
  title: string;
  description: string;
  category: 'best-practices' | 'implementation' | 'troubleshooting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
}

interface VulnerabilityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  version: string;
  description: string;
  fixVersion?: string;
  cveId?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-dev-security-tooling',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="dev-security-tooling">
      <div class="tooling-header">
        <h1>🔧 Developer Security Toolkit</h1>
        <p class="subtitle">Integrated security tools and best practices for Atlas development</p>
      </div>

      <mat-tab-group class="tooling-tabs" mat-stretch-tabs>
        <!-- Security Tools Tab -->
        <mat-tab label="🛠️ Security Tools">
          <div class="tab-content">
            <div class="tools-grid">
              <!-- SLSA Provenance Tool -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('slsa-provenance')">verified</mat-icon>
                    SLSA Provenance Checker
                  </mat-card-title>
                  <mat-card-subtitle>Verify build integrity and provenance</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Validate SLSA Level 3 provenance for build artifacts and verify cryptographic signatures.
                  </div>
                  <div class="tool-status">
                    <mat-chip [color]="getToolStatusColor('slsa-provenance')">
                      {{getToolStatus('slsa-provenance')}}
                    </mat-chip>
                    <span class="last-run" *ngIf="getLastRun('slsa-provenance')">
                      Last run: {{formatLastRun('slsa-provenance')}}
                    </span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('slsa-provenance')">
                    <mat-icon>play_arrow</mat-icon>
                    Run Check
                  </button>
                  <button mat-button (click)="viewResults('slsa-provenance')">
                    View Results
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- SBOM Generator -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('sbom-generator')">inventory</mat-icon>
                    SBOM Generator
                  </mat-card-title>
                  <mat-card-subtitle>Software Bill of Materials creation</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Generate SPDX 2.3 and CycloneDX 1.4 format SBOMs for dependency tracking and compliance.
                  </div>
                  <div class="tool-status">
                    <mat-chip [color]="getToolStatusColor('sbom-generator')">
                      {{getToolStatus('sbom-generator')}}
                    </mat-chip>
                    <span class="last-run" *ngIf="getLastRun('sbom-generator')">
                      Last run: {{formatLastRun('sbom-generator')}}
                    </span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('sbom-generator')">
                    <mat-icon>build</mat-icon>
                    Generate SBOM
                  </button>
                  <button mat-button (click)="viewResults('sbom-generator')">
                    Download SBOM
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Vulnerability Scanner -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('vuln-scanner')">bug_report</mat-icon>
                    Vulnerability Scanner
                    <mat-icon 
                      *ngIf="hasHighSeverityVulns()" 
                      matBadge="{{getHighSeverityCount()}}" 
                      matBadgeColor="warn"
                      matTooltip="High severity vulnerabilities detected">
                      warning
                    </mat-icon>
                  </mat-card-title>
                  <mat-card-subtitle>Multi-engine security scanning</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Comprehensive vulnerability scanning with Trivy, Grype, and Semgrep engines.
                  </div>
                  <div class="scanner-engines">
                    <mat-chip-set>
                      <mat-chip>Trivy</mat-chip>
                      <mat-chip>Grype</mat-chip>
                      <mat-chip>Semgrep</mat-chip>
                      <mat-chip>Gitleaks</mat-chip>
                    </mat-chip-set>
                  </div>
                  <div class="tool-status">
                    <mat-chip [color]="getToolStatusColor('vuln-scanner')">
                      {{getToolStatus('vuln-scanner')}}
                    </mat-chip>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('vuln-scanner')">
                    <mat-icon>security</mat-icon>
                    Scan Now
                  </button>
                  <button mat-button (click)="viewResults('vuln-scanner')">
                    View Report
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- License Compliance -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('license-checker')">gavel</mat-icon>
                    License Compliance
                  </mat-card-title>
                  <mat-card-subtitle>Legal risk assessment</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Automated license scanning with allowlist enforcement and legal risk assessment.
                  </div>
                  <div class="license-stats">
                    <div class="stat-item">
                      <span class="stat-label">Approved:</span>
                      <span class="stat-value approved">234</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Flagged:</span>
                      <span class="stat-value flagged">2</span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('license-checker')">
                    <mat-icon>fact_check</mat-icon>
                    Check Licenses
                  </button>
                  <button mat-button (click)="viewResults('license-checker')">
                    View Report
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Cosign Verification -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('cosign-verify')">verified_user</mat-icon>
                    Cosign Verification
                  </mat-card-title>
                  <mat-card-subtitle>Container signature validation</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Verify container signatures and attestations using Sigstore infrastructure.
                  </div>
                  <div class="cosign-info">
                    <div class="info-item">
                      <mat-icon color="primary">check_circle</mat-icon>
                      <span>Keyless Signing</span>
                    </div>
                    <div class="info-item">
                      <mat-icon color="primary">check_circle</mat-icon>
                      <span>Rekor Transparency</span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('cosign-verify')">
                    <mat-icon>verified</mat-icon>
                    Verify Signatures
                  </button>
                  <button mat-button (click)="viewResults('cosign-verify')">
                    View Attestations
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Performance Impact Monitor -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getToolStatusColor('perf-monitor')">speed</mat-icon>
                    Performance Impact
                  </mat-card-title>
                  <mat-card-subtitle>Security control overhead tracking</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="tool-description">
                    Monitor performance impact of security controls and identify optimization opportunities.
                  </div>
                  <div class="perf-summary">
                    <div class="perf-item">
                      <span>Total Overhead:</span>
                      <span class="perf-value good">+18.1ms</span>
                    </div>
                    <div class="perf-item">
                      <span>Build Time:</span>
                      <span class="perf-value acceptable">+45.2s</span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="runTool('perf-monitor')">
                    <mat-icon>analytics</mat-icon>
                    Analyze Impact
                  </button>
                  <button mat-button (click)="viewResults('perf-monitor')">
                    View Metrics
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Security Documentation Tab -->
        <mat-tab label="📚 Security Guides">
          <div class="tab-content">
            <div class="guides-section">
              <mat-expansion-panel-group>
                <!-- Implementation Guides -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>integration_instructions</mat-icon>
                      Implementation Guides
                    </mat-panel-title>
                    <mat-panel-description>
                      Step-by-step security implementation tutorials
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  
                  <mat-list>
                    <mat-list-item *ngFor="let guide of getGuidesByCategory('implementation')">
                      <mat-icon matListItemIcon>{{getGuideIcon(guide.difficulty)}}</mat-icon>
                      <div matListItemTitle>{{guide.title}}</div>
                      <div matListItemLine>{{guide.description}}</div>
                      <div matListItemMeta>
                        <mat-chip-set>
                          <mat-chip [color]="getDifficultyColor(guide.difficulty)">
                            {{guide.difficulty}}
                          </mat-chip>
                          <mat-chip>{{guide.estimatedTime}}</mat-chip>
                        </mat-chip-set>
                      </div>
                    </mat-list-item>
                  </mat-list>
                </mat-expansion-panel>

                <!-- Best Practices -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>star</mat-icon>
                      Security Best Practices
                    </mat-panel-title>
                    <mat-panel-description>
                      Recommended patterns and practices
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  
                  <mat-list>
                    <mat-list-item *ngFor="let guide of getGuidesByCategory('best-practices')">
                      <mat-icon matListItemIcon>{{getGuideIcon(guide.difficulty)}}</mat-icon>
                      <div matListItemTitle>{{guide.title}}</div>
                      <div matListItemLine>{{guide.description}}</div>
                      <div matListItemMeta>
                        <mat-chip-set>
                          <mat-chip *ngFor="let tag of guide.tags.slice(0, 2)">{{tag}}</mat-chip>
                        </mat-chip-set>
                      </div>
                    </mat-list-item>
                  </mat-list>
                </mat-expansion-panel>

                <!-- Troubleshooting -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>troubleshoot</mat-icon>
                      Troubleshooting & Debugging
                    </mat-panel-title>
                    <mat-panel-description>
                      Common issues and solutions
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  
                  <mat-list>
                    <mat-list-item *ngFor="let guide of getGuidesByCategory('troubleshooting')">
                      <mat-icon matListItemIcon>{{getGuideIcon(guide.difficulty)}}</mat-icon>
                      <div matListItemTitle>{{guide.title}}</div>
                      <div matListItemLine>{{guide.description}}</div>
                      <div matListItemMeta>
                        <mat-chip [color]="getDifficultyColor(guide.difficulty)">
                          {{guide.difficulty}}
                        </mat-chip>
                      </div>
                    </mat-list-item>
                  </mat-list>
                </mat-expansion-panel>
              </mat-expansion-panel-group>
            </div>
          </div>
        </mat-tab>

        <!-- Vulnerability Alerts Tab -->
        <mat-tab label="🚨 Security Alerts">
          <div class="tab-content">
            <div class="alerts-header">
              <h3>Active Security Alerts</h3>
              <button mat-raised-button color="primary" (click)="refreshAlerts()">
                <mat-icon>refresh</mat-icon>
                Refresh Alerts
              </button>
            </div>

            <div class="vulnerability-alerts">
              <mat-card *ngFor="let alert of vulnerabilityAlerts" class="alert-card" 
                       [class]="'severity-' + alert.severity">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="getSeverityColor(alert.severity)">
                      {{getSeverityIcon(alert.severity)}}
                    </mat-icon>
                    {{alert.package}} vulnerability
                  </mat-card-title>
                  <mat-card-subtitle>
                    <mat-chip [color]="getSeverityColor(alert.severity)">
                      {{alert.severity.toUpperCase()}}
                    </mat-chip>
                    <span *ngIf="alert.cveId">{{alert.cveId}}</span>
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="alert-details">
                    <div class="detail-row">
                      <strong>Package:</strong>
                      <span>{{alert.package}}@{{alert.version}}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Description:</strong>
                      <span>{{alert.description}}</span>
                    </div>
                    <div class="detail-row" *ngIf="alert.fixVersion">
                      <strong>Fix Available:</strong>
                      <span class="fix-version">{{alert.fixVersion}}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Detected:</strong>
                      <span>{{formatAlertTime(alert.timestamp)}}</span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button 
                          [color]="alert.fixVersion ? 'primary' : 'warn'"
                          (click)="fixVulnerability(alert)">
                    <mat-icon>{{alert.fixVersion ? 'upgrade' : 'build'}}</mat-icon>
                    {{alert.fixVersion ? 'Update Package' : 'Investigate'}}
                  </button>
                  <button mat-button (click)="dismissAlert(alert)">
                    Dismiss
                  </button>
                </mat-card-actions>
              </mat-card>

              <mat-card *ngIf="vulnerabilityAlerts.length === 0" class="no-alerts">
                <mat-card-content>
                  <div class="no-alerts-message">
                    <mat-icon color="primary">shield</mat-icon>
                    <h3>No Active Security Alerts</h3>
                    <p>Your project is currently free of known high-priority vulnerabilities.</p>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Security Training Tab -->
        <mat-tab label="🎓 Security Training">
          <div class="tab-content">
            <div class="training-section">
              <mat-card class="training-overview">
                <mat-card-header>
                  <mat-card-title>Interactive Security Training</mat-card-title>
                  <mat-card-subtitle>Learn security best practices through hands-on exercises</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="training-stats">
                    <div class="stat-card">
                      <mat-icon color="primary">school</mat-icon>
                      <div class="stat-info">
                        <div class="stat-number">12</div>
                        <div class="stat-label">Modules Completed</div>
                      </div>
                    </div>
                    <div class="stat-card">
                      <mat-icon color="accent">emoji_events</mat-icon>
                      <div class="stat-info">
                        <div class="stat-number">85%</div>
                        <div class="stat-label">Security Score</div>
                      </div>
                    </div>
                    <div class="stat-card">
                      <mat-icon color="warn">schedule</mat-icon>
                      <div class="stat-info">
                        <div class="stat-number">3</div>
                        <div class="stat-label">Hours This Week</div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary">
                    <mat-icon>play_lesson</mat-icon>
                    Continue Training
                  </button>
                  <button mat-button>
                    View Progress
                  </button>
                </mat-card-actions>
              </mat-card>

              <div class="training-modules">
                <h3>Available Training Modules</h3>
                <div class="modules-grid">
                  <mat-card class="module-card">
                    <mat-card-header>
                      <mat-card-title>SLSA Framework Fundamentals</mat-card-title>
                      <mat-card-subtitle>Supply Chain Security • 45 minutes</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Learn the principles of Supply-chain Levels for Software Artifacts (SLSA) and how to implement secure build processes.</p>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button color="primary">Start Module</button>
                    </mat-card-actions>
                  </mat-card>

                  <mat-card class="module-card">
                    <mat-card-header>
                      <mat-card-title>Container Security with Cosign</mat-card-title>
                      <mat-card-subtitle>Container Security • 30 minutes</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Master keyless container signing and verification using Sigstore's Cosign tool.</p>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button color="primary">Start Module</button>
                    </mat-card-actions>
                  </mat-card>

                  <mat-card class="module-card">
                    <mat-card-header>
                      <mat-card-title>CSP and Header Security</mat-card-title>
                      <mat-card-subtitle>Web Security • 25 minutes</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Implement Content Security Policy, HSTS, and other security headers for web application protection.</p>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button color="primary">Start Module</button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./dev-security-tooling.component.scss']
})
export class DevSecurityToolingComponent implements OnInit, OnDestroy {
  securityTools: SecurityTool[] = [];
  securityGuides: SecurityGuide[] = [];
  vulnerabilityAlerts: VulnerabilityAlert[] = [];
  
  private subscriptions = new Subscription();
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.loadSecurityTools();
    this.loadSecurityGuides();
    this.loadVulnerabilityAlerts();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  private loadSecurityTools(): void {
    // Mock data - in real implementation, call security tools API
    this.securityTools = [
      {
        id: 'slsa-provenance',
        name: 'SLSA Provenance Checker',
        description: 'Verify build integrity and provenance',
        category: 'scanning',
        status: 'available',
        lastRun: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'sbom-generator',
        name: 'SBOM Generator',
        description: 'Software Bill of Materials creation',
        category: 'scanning',
        status: 'available',
        lastRun: new Date(Date.now() - 1000 * 60 * 15)
      },
      {
        id: 'vuln-scanner',
        name: 'Vulnerability Scanner',
        description: 'Multi-engine security scanning',
        category: 'scanning',
        status: 'available',
        lastRun: new Date(Date.now() - 1000 * 60 * 45)
      },
      {
        id: 'license-checker',
        name: 'License Compliance',
        description: 'Legal risk assessment',
        category: 'scanning',
        status: 'available',
        lastRun: new Date(Date.now() - 1000 * 60 * 60)
      },
      {
        id: 'cosign-verify',
        name: 'Cosign Verification',
        description: 'Container signature validation',
        category: 'testing',
        status: 'available',
        lastRun: new Date(Date.now() - 1000 * 60 * 20)
      },
      {
        id: 'perf-monitor',
        name: 'Performance Impact',
        description: 'Security control overhead tracking',
        category: 'monitoring',
        status: 'running'
      }
    ];
  }
  
  private loadSecurityGuides(): void {
    this.securityGuides = [
      {
        id: 'slsa-implementation',
        title: 'Implementing SLSA Level 3 Provenance',
        description: 'Complete guide to setting up reproducible builds with cryptographic provenance',
        category: 'implementation',
        difficulty: 'intermediate',
        estimatedTime: '45 minutes',
        tags: ['slsa', 'provenance', 'builds']
      },
      {
        id: 'csp-hardening',
        title: 'Content Security Policy Best Practices',
        description: 'Secure your web applications with proper CSP implementation',
        category: 'best-practices',
        difficulty: 'beginner',
        estimatedTime: '20 minutes',
        tags: ['csp', 'web-security', 'headers']
      },
      {
        id: 'cosign-troubleshooting',
        title: 'Debugging Cosign Signature Failures',
        description: 'Common Cosign issues and their solutions',
        category: 'troubleshooting',
        difficulty: 'advanced',
        estimatedTime: '30 minutes',
        tags: ['cosign', 'debugging', 'containers']
      },
      {
        id: 'supply-chain-security',
        title: 'Supply Chain Attack Prevention',
        description: 'Comprehensive strategies for securing your software supply chain',
        category: 'best-practices',
        difficulty: 'intermediate',
        estimatedTime: '60 minutes',
        tags: ['supply-chain', 'dependencies', 'security']
      }
    ];
  }
  
  private loadVulnerabilityAlerts(): void {
    this.vulnerabilityAlerts = [
      {
        id: 'vuln-001',
        severity: 'high',
        package: 'lodash',
        version: '4.17.20',
        description: 'Prototype pollution vulnerability in lodash',
        fixVersion: '4.17.21',
        cveId: 'CVE-2021-23337',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'vuln-002',
        severity: 'medium',
        package: 'minimist',
        version: '1.2.5',
        description: 'Argument injection vulnerability',
        fixVersion: '1.2.6',
        cveId: 'CVE-2021-44906',
        timestamp: new Date(Date.now() - 1000 * 60 * 60)
      }
    ];
  }
  
  getToolStatus(toolId: string): string {
    const tool = this.securityTools.find(t => t.id === toolId);
    return tool?.status || 'unknown';
  }
  
  getToolStatusColor(toolId: string): string {
    const status = this.getToolStatus(toolId);
    switch (status) {
      case 'available': return 'primary';
      case 'running': return 'accent';
      case 'error': return 'warn';
      default: return '';
    }
  }
  
  getLastRun(toolId: string): Date | undefined {
    const tool = this.securityTools.find(t => t.id === toolId);
    return tool?.lastRun;
  }
  
  formatLastRun(toolId: string): string {
    const lastRun = this.getLastRun(toolId);
    if (!lastRun) return 'Never';
    
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((lastRun.getTime() - Date.now()) / (1000 * 60)), 'minute');
  }
  
  hasHighSeverityVulns(): boolean {
    return this.vulnerabilityAlerts.some(v => v.severity === 'critical' || v.severity === 'high');
  }
  
  getHighSeverityCount(): number {
    return this.vulnerabilityAlerts.filter(v => v.severity === 'critical' || v.severity === 'high').length;
  }
  
  runTool(toolId: string): void {
    console.log(`Running security tool: ${toolId}`);
    // In real implementation, trigger tool execution
  }
  
  viewResults(toolId: string): void {
    console.log(`Viewing results for: ${toolId}`);
    // In real implementation, navigate to results page
  }
  
  getGuidesByCategory(category: string): SecurityGuide[] {
    return this.securityGuides.filter(g => g.category === category);
  }
  
  getGuideIcon(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'trending_up';
      case 'intermediate': return 'show_chart';
      case 'advanced': return 'insights';
      default: return 'help';
    }
  }
  
  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'primary';
      case 'intermediate': return 'accent';
      case 'advanced': return 'warn';
      default: return '';
    }
  }
  
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'warn';
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return '';
    }
  }
  
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'crisis_alert';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'help';
      default: return 'help';
    }
  }
  
  formatAlertTime(timestamp: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((timestamp.getTime() - Date.now()) / (1000 * 60)), 'minute');
  }
  
  refreshAlerts(): void {
    console.log('Refreshing vulnerability alerts');
    this.loadVulnerabilityAlerts();
  }
  
  fixVulnerability(alert: VulnerabilityAlert): void {
    console.log(`Fixing vulnerability: ${alert.id}`);
    // In real implementation, trigger package update or remediation
  }
  
  dismissAlert(alert: VulnerabilityAlert): void {
    console.log(`Dismissing alert: ${alert.id}`);
    this.vulnerabilityAlerts = this.vulnerabilityAlerts.filter(a => a.id !== alert.id);
  }
}