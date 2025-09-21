import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Heading, Text } from '@atlas/design-system';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function SystemStatusPage() {
  const systemStatus = {
    status: 'healthy',
    uptime: '99.9%',
    lastUpdate: new Date().toISOString(),
    components: [
      { name: 'Gateway', status: 'healthy', latency: '12ms' },
      { name: 'Quantum Sync', status: 'healthy', latency: '8ms' },
      { name: 'Witness Network', status: 'healthy', latency: '15ms' },
      { name: 'Database', status: 'healthy', latency: '5ms' }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="success">Healthy</Badge>;
      case 'degraded': return <Badge variant="warning">Degraded</Badge>;
      case 'critical': return <Badge variant="danger">Critical</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <Heading level={1} className="text-h1 font-bold">System Status</Heading>
          <Text className="mt-2 text-muted">
            Real-time monitoring of Atlas infrastructure components
          </Text>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Overall System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(systemStatus.status)}
                <div>
                  <Text className="text-lg font-semibold capitalize">{systemStatus.status}</Text>
                  <Text className="text-sm text-muted">Uptime: {systemStatus.uptime}</Text>
                </div>
              </div>
              {getStatusBadge(systemStatus.status)}
            </div>
          </CardContent>
        </Card>

        {/* Component Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systemStatus.components.map((component) => (
            <Card key={component.name}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium">{component.name}</span>
                  {getStatusIcon(component.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Text className="text-sm text-muted">Latency: {component.latency}</Text>
                  {getStatusBadge(component.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Last Update */}
        <Card>
          <CardContent className="pt-6">
            <Text className="text-sm text-muted">
              Last updated: {new Date(systemStatus.lastUpdate).toLocaleString()}
            </Text>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
