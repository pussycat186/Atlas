'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MetricData {
  timestamp: string;
  value: number;
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState('1h');
  const [metrics, setMetrics] = useState({
    messageRate: 1247,
    latencyP50: 45,
    latencyP95: 89,
    errorRate: 0.2,
    quorumRate: 99.8,
  });

  const [chartData, setChartData] = useState<MetricData[]>([]);

  useEffect(() => {
    // Generate mock chart data
    const data: MetricData[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      data.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        value: Math.floor(Math.random() * 100) + 50,
      });
    }
    setChartData(data);
  }, [timeRange]);

  const timeRanges = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Metrics Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time performance metrics and system health
            </p>
          </div>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Message Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messageRate}</div>
            <p className="text-xs text-muted-foreground">messages/hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latency P50</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.latencyP50}ms</div>
            <p className="text-xs text-muted-foreground">median response time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latency P95</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.latencyP95}ms</div>
            <p className="text-xs text-muted-foreground">95th percentile</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">failed requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Message Rate Over Time</CardTitle>
            <CardDescription>
              Messages processed per minute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end space-x-1">
              {chartData.map((point, index) => (
                <div
                  key={index}
                  className="bg-primary rounded-t-sm flex-1"
                  style={{ height: `${(point.value / 100) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Last 60 minutes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latency Distribution</CardTitle>
            <CardDescription>
              Response time percentiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">P50</span>
                <span className="font-medium">{metrics.latencyP50}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: '50%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">P95</span>
                <span className="font-medium">{metrics.latencyP95}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: '95%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">P99</span>
                <span className="font-medium">156ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: '99%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quorum Health</CardTitle>
            <CardDescription>
              Witness node participation and consensus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Quorum Rate</span>
                <span className="font-medium">{metrics.quorumRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${metrics.quorumRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Active Witnesses</div>
                  <div className="font-medium">4/5</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Conflicts</div>
                  <div className="font-medium">2</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>
              System resource consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">CPU Usage</span>
                <span className="font-medium">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: '23%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: '67%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Disk Usage</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: '45%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafana Link */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Advanced Metrics</CardTitle>
          <CardDescription>
            Access detailed metrics and create custom dashboards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Grafana Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                View detailed metrics, create alerts, and build custom dashboards
              </p>
            </div>
            <Button asChild>
              <a href="https://atlas-grafana-demo.loca.lt" target="_blank" rel="noopener noreferrer">
                Open Grafana
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
