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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, interval } from 'rxjs';

import { 
  S7CanaryService, 
  CanaryDeploymentStatus, 
  SecurityValidationResult,
  ProductionReadinessChecklist 
} from '../../services/s7-canary.service';

@Component({
  selector: 'app-s7-canary-dashboard',
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
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="s7-canary-dashboard">
      <!-- S7 Header -->
      <div class="dashboard-header">
        <h1>🚀 S7 Canary Deployment Command Center</h1>
        <div class="deployment-status">
          <mat-chip-set>
            <mat-chip [color]="getStageColor(canaryStatus?.stage)">
              {{getStageDisplayName(canaryStatus?.stage)}}
            </mat-chip>
            <mat-chip [color]="getHealthColor(canaryStatus?.healthStatus?.overall)">
              {{canaryStatus?.healthStatus?.overall?.toUpperCase() || 'UNKNOWN'}}
            </mat-chip>
            <mat-chip color="primary">
              {{canaryStatus?.trafficPercentage || 0}}% Traffic
            </mat-chip>
          </mat-chip-set>
        </div>
      </div>

      <!-- Real-time Metrics Summary -->
      <div class="metrics-summary">
        <mat-card class="metric-card security-score">
          <mat-card-header>
            <mat-card-title>Security Score</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="score-display">
              <span class="score-value" [class]="getScoreClass(securityValidation?.overallScore || 0)">
                {{securityValidation?.overallScore || 0}}
              </span>
              <span class="score-total">/100</span>
            </div>
            <mat-progress-bar 
              [value]="securityValidation?.overallScore || 0" 
              [color]="getScoreColor(securityValidation?.overallScore || 0)">
            </mat-progress-bar>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card health-status">
          <mat-card-header>
            <mat-card-title>System Health</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="health-display">
              <mat-icon [color]="getHealthIconColor(canaryStatus?.healthStatus?.overall)">
                {{getHealthIcon(canaryStatus?.healthStatus?.overall)}}
              </mat-icon>
              <div class="health-metrics">
                <div class="metric-row">
                  <span>Uptime:</span>
                  <span>{{canaryStatus?.healthStatus?.uptime || 0}}%</span>
                </div>
                <div class="metric-row">
                  <span>Error Rate:</span>
                  <span>{{(canaryStatus?.healthStatus?.errorRate || 0) * 100}}%</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card performance">
          <mat-card-header>
            <mat-card-title>Performance</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="perf-metrics">
              <div class="metric-item">
                <span>Response Time:</span>
                <span class="metric-value">{{canaryStatus?.performanceMetrics?.responseTimeP95 || 0}}ms</span>
              </div>
              <div class="metric-item">
                <span>Lighthouse:</span>
                <span class="metric-value">{{canaryStatus?.performanceMetrics?.lighthouseScores?.performance || 0}}/100</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card vulnerabilities">
          <mat-card-header>
            <mat-card-title>Vulnerabilities</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="vuln-summary">
              <mat-chip-set>
                <mat-chip [color]="securityValidation?.vulnerabilities?.critical ? 'warn' : 'primary'">
                  Critical: {{securityValidation?.vulnerabilities?.critical || 0}}
                </mat-chip>
                <mat-chip [color]="securityValidation?.vulnerabilities?.high ? 'accent' : 'primary'">
                  High: {{securityValidation?.vulnerabilities?.high || 0}}
                </mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Main Dashboard Tabs -->
      <mat-tab-group class="dashboard-tabs" mat-stretch-tabs>
        <!-- Canary Status Tab -->
        <mat-tab label="🎯 Canary Status">
          <div class="tab-content">
            <div class="canary-grid">
              <!-- Application Health -->
              <mat-card class="app-health-card">
                <mat-card-header>
                  <mat-card-title>Application Health Status</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="app-health-list">
                    <div *ngFor="let app of canaryStatus?.healthStatus?.applications" class="app-item">
                      <div class="app-info">
                        <mat-icon [color]="getHealthIconColor(app.status)">
                          {{getHealthIcon(app.status)}}
                        </mat-icon>
                        <div class="app-details">
                          <div class="app-name">{{app.name}}</div>
                          <div class="app-version">{{app.version}}</div>
                        </div>
                      </div>
                      <div class="app-metrics">
                        <div class="instance-count">
                          {{app.healthyInstances}}/{{app.instances}} healthy
                        </div>
                        <div class="security-score">
                          Security: {{app.securityScore}}/100
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Deployment Timeline -->
              <mat-card class="deployment-timeline">
                <mat-card-header>
                  <mat-card-title>Deployment Timeline</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="timeline">
                    <div class="timeline-item completed">
                      <mat-icon>check_circle</mat-icon>
                      <div class="timeline-content">
                        <div class="timeline-title">Security Validation</div>
                        <div class="timeline-time">{{formatTime(canaryStatus?.startTime)}}</div>
                      </div>
                    </div>
                    <div class="timeline-item" [class.completed]="canaryStatus?.stage !== 'canary-10'">
                      <mat-icon>{{canaryStatus?.stage === 'canary-10' ? 'radio_button_unchecked' : 'check_circle'}}</mat-icon>
                      <div class="timeline-content">
                        <div class="timeline-title">Canary 10% Deployment</div>
                        <div class="timeline-time">In Progress</div>
                      </div>
                    </div>
                    <div class="timeline-item" [class.completed]="canaryStatus?.stage === 'production'">
                      <mat-icon>radio_button_unchecked</mat-icon>
                      <div class="timeline-content">
                        <div class="timeline-title">Canary 50% Promotion</div>
                        <div class="timeline-time">Pending</div>
                      </div>
                    </div>
                    <div class="timeline-item">
                      <mat-icon>radio_button_unchecked</mat-icon>
                      <div class="timeline-content">
                        <div class="timeline-title">Production Deployment</div>
                        <div class="timeline-time">Scheduled</div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Rollback Controls -->
              <mat-card class="rollback-controls">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>settings_backup_restore</mat-icon>
                    Rollback Controls
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="rollback-info">
                    <div class="rollback-status">
                      <mat-icon [color]="canaryStatus?.rollbackCapability?.enabled ? 'primary' : 'warn'">
                        {{canaryStatus?.rollbackCapability?.enabled ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Automated Rollback: {{canaryStatus?.rollbackCapability?.enabled ? 'Enabled' : 'Disabled'}}</span>
                    </div>
                    <div class="rollback-time">
                      Estimated Rollback Time: {{canaryStatus?.rollbackCapability?.estimatedRollbackTime || 0}}s
                    </div>
                  </div>
                  <div class="rollback-triggers">
                    <h4>Trigger Thresholds:</h4>
                    <div *ngFor="let trigger of canaryStatus?.rollbackCapability?.triggerThresholds" class="trigger-item">
                      <mat-chip [color]="trigger.severity === 'critical' ? 'warn' : 'accent'">
                        {{trigger.metric}}: {{trigger.threshold}}
                      </mat-chip>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="warn" (click)="initiateRollback()">
                    <mat-icon>undo</mat-icon>
                    Emergency Rollback
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Security Validation Tab -->
        <mat-tab label="🔒 Security Validation">
          <div class="tab-content">
            <div class="security-validation-grid">
              <!-- S0-S6 Compliance -->
              <mat-card class="compliance-card">
                <mat-card-header>
                  <mat-card-title>S0-S6 Phase Compliance</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div *ngFor="let phase of securityValidation?.s0ToS6Compliance" class="phase-item">
                    <div class="phase-header">
                      <span class="phase-name">{{phase.phase}}</span>
                      <mat-chip [color]="getComplianceColor(phase.status)">
                        {{phase.status.toUpperCase()}}
                      </mat-chip>
                    </div>
                    <mat-progress-bar [value]="phase.score" [color]="getScoreColor(phase.score)"></mat-progress-bar>
                    <div class="phase-score">{{phase.score}}/100</div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- S7 Canary Compliance -->
              <mat-card class="s7-compliance">
                <mat-card-header>
                  <mat-card-title>S7 Canary Compliance</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="compliance-checks">
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.canaryInfrastructure ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.canaryInfrastructure ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Canary Infrastructure</span>
                    </div>
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.monitoringIntegration ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.monitoringIntegration ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Monitoring Integration</span>
                    </div>
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.rollbackMechanisms ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.rollbackMechanisms ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Rollback Mechanisms</span>
                    </div>
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.securityValidation ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.securityValidation ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Security Validation</span>
                    </div>
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.performanceTracking ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.performanceTracking ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Performance Tracking</span>
                    </div>
                    <div class="check-item">
                      <mat-icon [color]="securityValidation?.s7CanaryCompliance?.incidentResponse ? 'primary' : 'warn'">
                        {{securityValidation?.s7CanaryCompliance?.incidentResponse ? 'check_circle' : 'warning'}}
                      </mat-icon>
                      <span>Incident Response</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Security Gates -->
              <mat-card class="security-gates">
                <mat-card-header>
                  <mat-card-title>Security Gate Status</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div *ngFor="let gate of securityValidation?.securityGates" class="gate-item">
                    <div class="gate-header">
                      <mat-icon [color]="getGateStatusColor(gate.status)">
                        {{getGateStatusIcon(gate.status)}}
                      </mat-icon>
                      <span class="gate-name">{{gate.name}}</span>
                      <span class="gate-time">{{formatTime(gate.timestamp)}}</span>
                    </div>
                    <div class="gate-criteria">
                      <div *ngFor="let criteria of gate.criteria" class="criteria-item">
                        <mat-icon [color]="criteria.passed ? 'primary' : 'warn'">
                          {{criteria.passed ? 'check' : 'close'}}
                        </mat-icon>
                        <span>{{criteria.name}}: {{criteria.actual}} (required: {{criteria.required}})</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Production Readiness Tab -->
        <mat-tab label="✅ Production Readiness">
          <div class="tab-content">
            <div class="readiness-overview">
              <div *ngFor="let category of productionReadiness" class="readiness-category">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>{{category.category}}</mat-card-title>
                    <mat-card-subtitle>
                      <mat-chip [color]="getReadinessStatusColor(category.status)">
                        {{category.status.toUpperCase()}}
                      </mat-chip>
                      <span class="category-score">{{category.overallScore}}/100</span>
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div *ngFor="let item of category.items" class="readiness-item">
                      <div class="item-header">
                        <mat-icon [color]="getItemStatusColor(item.status)">
                          {{getItemStatusIcon(item.status)}}
                        </mat-icon>
                        <span class="item-name">{{item.name}}</span>
                        <mat-chip [color]="getPriorityColor(item.priority)" class="priority-chip">
                          {{item.priority.toUpperCase()}}
                        </mat-chip>
                      </div>
                      <div *ngIf="item.blockers?.length" class="item-blockers">
                        <strong>Blockers:</strong>
                        <ul>
                          <li *ngFor="let blocker of item.blockers">{{blocker}}</li>
                        </ul>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Deployment Actions Tab -->
        <mat-tab label="🚀 Deployment Actions">
          <div class="tab-content">
            <div class="deployment-actions">
              <mat-card class="actions-card">
                <mat-card-header>
                  <mat-card-title>Deployment Controls</mat-card-title>
                  <mat-card-subtitle>Manage S7 canary deployment progression</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="action-buttons">
                    <button mat-raised-button color="primary" 
                            [disabled]="!canPromoteToCanary50()"
                            (click)="promoteToCanary50()">
                      <mat-icon>trending_up</mat-icon>
                      Promote to Canary 50%
                    </button>
                    
                    <button mat-raised-button color="accent" 
                            [disabled]="!canPromoteToProduction()"
                            (click)="promoteToProduction()">
                      <mat-icon>rocket_launch</mat-icon>
                      Deploy to Production
                    </button>
                    
                    <button mat-raised-button color="warn" (click)="runSecurityValidation()">
                      <mat-icon>security</mat-icon>
                      Run Security Validation
                    </button>
                    
                    <button mat-button (click)="exportS7Report()">
                      <mat-icon>download</mat-icon>
                      Export S7 Report
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="recommendations-card">
                <mat-card-header>
                  <mat-card-title>Recommended Actions</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="recommendation">
                    <mat-icon color="primary">lightbulb</mat-icon>
                    <span>{{getRecommendedAction()}}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./s7-canary-dashboard.component.scss']
})
export class S7CanaryDashboardComponent implements OnInit, OnDestroy {
  canaryStatus: CanaryDeploymentStatus | null = null;
  securityValidation: SecurityValidationResult | null = null;
  productionReadiness: ProductionReadinessChecklist[] = [];
  
  private subscriptions = new Subscription();
  
  constructor(
    private s7CanaryService: S7CanaryService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    // Subscribe to real-time S7 canary data
    this.subscriptions.add(
      this.s7CanaryService.canaryStatus$.subscribe(status => {
        this.canaryStatus = status;
        this.cdr.detectChanges();
      })
    );
    
    this.subscriptions.add(
      this.s7CanaryService.securityValidation$.subscribe(validation => {
        this.securityValidation = validation;
        this.cdr.detectChanges();
      })
    );
    
    this.subscriptions.add(
      this.s7CanaryService.productionReadiness$.subscribe(readiness => {
        this.productionReadiness = readiness;
        this.cdr.detectChanges();
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Deployment Actions
  promoteToCanary50(): void {
    if (!this.canPromoteToCanary50()) return;
    
    this.s7CanaryService.triggerCanaryDeployment('canary-50').subscribe({
      next: () => {
        this.snackBar.open('Canary 50% promotion initiated', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Promotion failed: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }
  
  promoteToProduction(): void {
    if (!this.canPromoteToProduction()) return;
    
    this.s7CanaryService.triggerCanaryDeployment('production').subscribe({
      next: () => {
        this.snackBar.open('Production deployment initiated', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Deployment failed: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }
  
  initiateRollback(): void {
    const reason = 'Manual rollback initiated from S7 dashboard';
    
    this.s7CanaryService.triggerRollback(reason).subscribe({
      next: () => {
        this.snackBar.open('Rollback initiated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Rollback failed: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }
  
  runSecurityValidation(): void {
    this.s7CanaryService.runSecurityValidation().subscribe({
      next: () => {
        this.snackBar.open('Security validation started', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Validation failed: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }
  
  exportS7Report(): void {
    this.s7CanaryService.exportS7Report().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `s7-canary-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }
  
  // Helper Methods
  canPromoteToCanary50(): boolean {
    return this.canaryStatus?.stage === 'canary-10' &&
           this.canaryStatus?.healthStatus?.overall === 'healthy' &&
           (this.securityValidation?.overallScore || 0) >= 85;
  }
  
  canPromoteToProduction(): boolean {
    return this.canaryStatus?.stage === 'canary-50' &&
           this.canaryStatus?.healthStatus?.overall === 'healthy' &&
           (this.securityValidation?.overallScore || 0) >= 90 &&
           this.productionReadiness.every(r => r.status === 'ready');
  }
  
  getRecommendedAction(): string {
    if (!this.canaryStatus || !this.securityValidation) {
      return 'Waiting for deployment data...';
    }
    
    if (this.canPromoteToProduction()) {
      return 'Ready for production deployment';
    }
    
    if (this.canPromoteToCanary50()) {
      return 'Ready to promote to canary 50%';
    }
    
    if (this.canaryStatus.healthStatus?.overall === 'unhealthy') {
      return 'Consider rollback due to health issues';
    }
    
    if ((this.securityValidation.overallScore || 0) < 75) {
      return 'Address security issues before promotion';
    }
    
    return 'Continue monitoring canary deployment';
  }
  
  // UI Helper Methods
  getStageColor(stage: string | undefined): string {
    switch (stage) {
      case 'canary-10': return 'accent';
      case 'canary-50': return 'primary';
      case 'production': return 'warn';
      default: return '';
    }
  }
  
  getStageDisplayName(stage: string | undefined): string {
    switch (stage) {
      case 'canary-10': return 'CANARY 10%';
      case 'canary-50': return 'CANARY 50%';
      case 'production': return 'PRODUCTION';
      default: return 'UNKNOWN';
    }
  }
  
  getHealthColor(health: string | undefined): string {
    switch (health) {
      case 'healthy': return 'primary';
      case 'degraded': return 'accent';
      case 'unhealthy': return 'warn';
      default: return '';
    }
  }
  
  getHealthIcon(health: string | undefined): string {
    switch (health) {
      case 'healthy': return 'check_circle';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'help';
    }
  }
  
  getHealthIconColor(health: string | undefined): string {
    switch (health) {
      case 'healthy': return 'primary';
      case 'degraded': return 'accent';
      case 'unhealthy': return 'warn';
      default: return '';
    }
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
  
  getComplianceColor(status: string): string {
    switch (status) {
      case 'compliant': return 'primary';
      case 'partial': return 'accent';
      case 'non-compliant': return 'warn';
      default: return '';
    }
  }
  
  getGateStatusColor(status: string): string {
    switch (status) {
      case 'passed': return 'primary';
      case 'failed': return 'warn';
      case 'pending': return 'accent';
      default: return '';
    }
  }
  
  getGateStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return 'check_circle';
      case 'failed': return 'cancel';
      case 'pending': return 'schedule';
      default: return 'help';
    }
  }
  
  getReadinessStatusColor(status: string): string {
    switch (status) {
      case 'ready': return 'primary';
      case 'partial': return 'accent';
      case 'not-ready': return 'warn';
      default: return '';
    }
  }
  
  getItemStatusColor(status: string): string {
    switch (status) {
      case 'complete': return 'primary';
      case 'partial': return 'accent';
      case 'incomplete': return 'warn';
      default: return '';
    }
  }
  
  getItemStatusIcon(status: string): string {
    switch (status) {
      case 'complete': return 'check_circle';
      case 'partial': return 'schedule';
      case 'incomplete': return 'radio_button_unchecked';
      default: return 'help';
    }
  }
  
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'medium': return 'primary';
      case 'low': return '';
      default: return '';
    }
  }
  
  formatTime(date: Date | undefined): string {
    if (!date) return 'Unknown';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60)), 'minute');
  }
}