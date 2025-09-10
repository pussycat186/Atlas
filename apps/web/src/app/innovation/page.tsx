'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { 
  Brain, 
  Zap, 
  Shield, 
  Globe, 
  Code, 
  Settings, 
  Bug, 
  DollarSign, 
  Puzzle,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  featureFlags, 
  INNOVATION_FEATURES, 
  SelfHealingInfrastructure, 
  AINativeOpsConsole, 
  ZeroFrictionOnboarding,
  trackFeatureUsage 
} from '@/lib/features';

export default function InnovationPage() {
  const [features, setFeatures] = useState(INNOVATION_FEATURES);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load feature metrics
    Object.keys(features).forEach(featureId => {
      const performance = featureFlags.getFeaturePerformanceSummary(featureId);
      setMetrics(prev => ({ ...prev, [featureId]: performance }));
    });
  }, [features]);

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    featureFlags.toggleFeature(featureId, enabled);
    setFeatures(prev => ({
      ...prev,
      [featureId]: { ...prev[featureId], enabled }
    }));
  };

  const handleTestFeature = async (featureId: string) => {
    setIsLoading(true);
    
    try {
      switch (featureId) {
        case 'self_healing_infra_v2':
          await SelfHealingInfrastructure.getInstance().detectAndHeal();
          break;
        case 'ai_native_ops_console':
          await AINativeOpsConsole.getInstance().getRecommendations();
          break;
        case 'zero_friction_onboarding':
          await ZeroFrictionOnboarding.getInstance().quickSetup();
          break;
        default:
          // Simulate feature usage
          trackFeatureUsage(featureId, {
            usage: {
              totalRequests: 1,
              successRate: 95,
              averageLatency: Math.random() * 200 + 50,
              errorRate: Math.random() * 2
            },
            performance: {
              cpuUsage: Math.random() * 30 + 10,
              memoryUsage: Math.random() * 100 + 50,
              networkLatency: Math.random() * 50 + 20
            },
            business: {
              userSatisfaction: Math.random() * 1 + 4,
              conversionRate: Math.random() * 10 + 5,
              retentionRate: Math.random() * 20 + 80
            }
          });
      }
      
      // Refresh metrics
      const performance = featureFlags.getFeaturePerformanceSummary(featureId);
      setMetrics(prev => ({ ...prev, [featureId]: performance }));
      
    } catch (error) {
      console.error('Feature test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureIcon = (featureId: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'self_healing_infra_v2': Brain,
      'zero_friction_onboarding': Zap,
      'ai_native_ops_console': Activity,
      'edge_aware_ingestion': Globe,
      'local_first_dev_mode': Code,
      'policy_as_config': Shield,
      'chaos_as_feature': Bug,
      'cost_perf_lens': DollarSign,
      'plugin_surface': Puzzle
    };
    return iconMap[featureId] || Settings;
  };

  const getStatusBadge = (feature: any) => {
    if (!feature.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (feature.rolloutPercentage === 100) {
      return <Badge variant="default">Live</Badge>;
    } else if (feature.rolloutPercentage > 0) {
      return <Badge variant="outline">{feature.rolloutPercentage}% Rollout</Badge>;
    } else {
      return <Badge variant="secondary">Development</Badge>;
    }
  };

  const getPerformanceStatus = (featureId: string) => {
    const metric = metrics[featureId];
    if (!metric) return { status: 'unknown', color: 'gray' };
    
    const feature = features[featureId];
    const isHealthy = 
      metric.averageLatency <= feature.benchmarks.performance.maxLatencyMs &&
      metric.averageErrorRate <= feature.benchmarks.business.maxErrorRate &&
      metric.averageCpuUsage <= feature.benchmarks.performance.maxCpuPercent;
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      color: isHealthy ? 'green' : 'yellow'
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Atlas v12 Innovation Lab</h1>
        <p className="text-muted-foreground">
          Breakthrough features and moonshot innovations under controlled rollout
        </p>
      </div>

      {/* Innovation Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Innovation Overview
          </CardTitle>
          <CardDescription>
            Atlas v12 introduces breakthrough innovations that push the boundaries of data integrity and distributed systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(features).filter(f => f.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Features</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(features).filter(f => f.rolloutPercentage === 100).length}
              </div>
              <p className="text-sm text-muted-foreground">Fully Rolled Out</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(features).filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length}
              </div>
              <p className="text-sm text-muted-foreground">In Beta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(features).map(([featureId, feature]) => {
          const Icon = getFeatureIcon(featureId);
          const performanceStatus = getPerformanceStatus(featureId);
          const metric = metrics[featureId];

          return (
            <Card key={featureId} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(feature)}
                    <div className="flex items-center gap-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          performanceStatus.color === 'green' ? 'bg-green-500' : 
                          performanceStatus.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {performanceStatus.status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Feature Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(enabled) => handleToggleFeature(featureId, enabled)}
                      />
                      <span className="text-sm font-medium">
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestFeature(featureId)}
                      disabled={isLoading || !feature.enabled}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Feature'
                      )}
                    </Button>
                  </div>

                  {/* Performance Metrics */}
                  {metric && metric.totalRequests > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Performance Metrics (24h)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Avg Latency</div>
                          <div className="font-medium">{metric.averageLatency.toFixed(1)}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Rate</div>
                          <div className="font-medium">{metric.averageErrorRate.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CPU Usage</div>
                          <div className="font-medium">{metric.averageCpuUsage.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Memory</div>
                          <div className="font-medium">{metric.averageMemoryUsage.toFixed(1)}MB</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target Audience</span>
                      <Badge variant="outline" className="text-xs">
                        {feature.targetAudience}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rollout</span>
                      <span className="font-medium">{feature.rolloutPercentage}%</span>
                    </div>
                    {feature.dependencies.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Dependencies: </span>
                        <span className="font-medium">{feature.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Benchmarks */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Performance Benchmarks</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Max Latency:</span>
                        <span>{feature.benchmarks.performance.maxLatencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max CPU:</span>
                        <span>{feature.benchmarks.performance.maxCpuPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Memory:</span>
                        <span>{feature.benchmarks.performance.maxMemoryMB}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Success:</span>
                        <span>{feature.benchmarks.business.minSuccessRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Innovation Metrics Dashboard */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Innovation Metrics Dashboard
          </CardTitle>
          <CardDescription>
            Real-time performance and business metrics for all innovation features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(metrics).reduce((sum, m) => sum + (m.totalRequests || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Feature Requests</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(metrics).length > 0 
                  ? (Object.values(metrics).reduce((sum, m) => sum + (m.averageLatency || 0), 0) / Object.values(metrics).length).toFixed(1)
                  : 0}ms
              </div>
              <p className="text-sm text-muted-foreground">Average Latency</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(metrics).length > 0 
                  ? (Object.values(metrics).reduce((sum, m) => sum + (m.averageErrorRate || 0), 0) / Object.values(metrics).length).toFixed(2)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Average Error Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(features).filter(f => f.enabled && f.rolloutPercentage === 100).length}
              </div>
              <p className="text-sm text-muted-foreground">Production Features</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Innovation Roadmap */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Innovation Roadmap</CardTitle>
          <CardDescription>
            Upcoming breakthrough features and their development status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(features).map(([featureId, feature]) => (
              <div key={featureId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {React.createElement(getFeatureIcon(featureId), { className: "h-5 w-5 text-primary" })}
                  <div>
                    <h4 className="font-medium">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {feature.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">
                    {feature.enabled ? 'Active' : 'Development'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
