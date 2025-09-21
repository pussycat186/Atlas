import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-input bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">System Status</h1>
          <span className="mt-2 text-muted-foreground">
            Real-time monitoring of Atlas infrastructure components
          </span>
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
                  <span className="text-lg font-semibold capitalize">{systemStatus.status}</span>
                  <span className="text-sm text-muted-foreground">Uptime: {systemStatus.uptime}</span>
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
                  <span className="text-sm text-muted-foreground">Latency: {component.latency}</span>
                  {getStatusBadge(component.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Last Update */}
        <Card>
          <CardContent className="pt-6">
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(systemStatus.lastUpdate).toLocaleString()}
            </span>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
