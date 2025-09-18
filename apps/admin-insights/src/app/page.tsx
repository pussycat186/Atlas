'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Activity, 
  Server, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Zap,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface ClusterHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  services: ServiceStatus[];
  lastUpdate: Date;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  endpoint: string;
}

interface WitnessQuorum {
  total: number;
  active: number;
  required: number;
  witnesses: WitnessStatus[];
  skew: number;
  lastConsensus: Date;
}

interface WitnessStatus {
  id: string;
  status: 'active' | 'inactive' | 'lagging';
  lastSeen: Date;
  responseTime: number;
  version: string;
}

interface Metrics {
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export default function AdminDashboard() {
  const [clusterHealth] = useState<ClusterHealth>({
    status: 'healthy',
    uptime: 99.9,
    services: [
      {
        name: 'Gateway',
        status: 'healthy',
        uptime: 99.9,
        responseTime: 45,
        lastCheck: new Date(),
        endpoint: 'http://localhost:3000'
      },
      {
        name: 'Witness Node 1',
        status: 'healthy',
        uptime: 99.8,
        responseTime: 32,
        lastCheck: new Date(),
        endpoint: 'http://localhost:3001'
      },
      {
        name: 'Witness Node 2',
        status: 'healthy',
        uptime: 99.7,
        responseTime: 38,
        lastCheck: new Date(),
        endpoint: 'http://localhost:3002'
      },
      {
        name: 'Witness Node 3',
        status: 'degraded',
        uptime: 95.2,
        responseTime: 120,
        lastCheck: new Date(),
        endpoint: 'http://localhost:3003'
      }
    ],
    lastUpdate: new Date()
  });

  const [witnessQuorum] = useState<WitnessQuorum>({
    total: 5,
    active: 4,
    required: 4,
    witnesses: [
      { id: 'w1', status: 'active', lastSeen: new Date(), responseTime: 32, version: '1.0.0' },
      { id: 'w2', status: 'active', lastSeen: new Date(), responseTime: 28, version: '1.0.0' },
      { id: 'w3', status: 'active', lastSeen: new Date(), responseTime: 35, version: '1.0.0' },
      { id: 'w4', status: 'active', lastSeen: new Date(), responseTime: 42, version: '1.0.0' },
      { id: 'w5', status: 'lagging', lastSeen: new Date(Date.now() - 5000), responseTime: 120, version: '1.0.0' }
    ],
    skew: 45,
    lastConsensus: new Date()
  });

  const [metrics] = useState<Metrics>({
    requestsPerSecond: 1250,
    averageLatency: 45,
    errorRate: 0.2,
    activeConnections: 342,
    memoryUsage: 68,
    cpuUsage: 23
  });

  const [rateLimitStats] = useState({
    totalRequests: 125000,
    rateLimited: 1250,
    idempotentHits: 45000,
    cacheHitRate: 89.2
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Atlas Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time cluster health monitoring and witness quorum status
        </p>
      </div>

      {/* Cluster Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Cluster Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatusIcon(clusterHealth.status)}
              <span className="ml-2 text-sm font-medium capitalize">{clusterHealth.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: {clusterHealth.uptime}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Witness Quorum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {witnessQuorum.active}/{witnessQuorum.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Required: {witnessQuorum.required}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              RPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.requestsPerSecond}</div>
            <p className="text-xs text-muted-foreground">
              Avg Latency: {metrics.averageLatency}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              Active: {metrics.activeConnections}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>
            Real-time status of all Atlas services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clusterHealth.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Server className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{service.uptime}% uptime</p>
                    <p className="text-xs text-gray-500">{service.responseTime}ms response</p>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Witness Quorum Status */}
      <Card>
        <CardHeader>
          <CardTitle>Witness Quorum Status</CardTitle>
          <CardDescription>
            N={witnessQuorum.total}, q={witnessQuorum.required}, Δ≤2000ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-atlas-600">{witnessQuorum.active}</div>
                <p className="text-sm text-gray-500">Active Witnesses</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-atlas-600">{witnessQuorum.skew}ms</div>
                <p className="text-sm text-gray-500">Max Skew</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-atlas-600">
                  {format(witnessQuorum.lastConsensus, 'HH:mm:ss')}
                </div>
                <p className="text-sm text-gray-500">Last Consensus</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {witnessQuorum.witnesses.map((witness) => (
                <div key={witness.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{witness.id}</p>
                      <p className="text-sm text-gray-500">v{witness.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm">{witness.responseTime}ms</p>
                      <p className="text-xs text-gray-500">
                        {format(witness.lastSeen, 'HH:mm:ss')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(witness.status)}>
                      {witness.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting & Idempotency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
            <CardDescription>
              Request rate limiting and throttling statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Requests</span>
                <span className="font-medium">{rateLimitStats.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rate Limited</span>
                <span className="font-medium text-yellow-600">{rateLimitStats.rateLimited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rate Limit %</span>
                <span className="font-medium">
                  {((rateLimitStats.rateLimited / rateLimitStats.totalRequests) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idempotency Cache</CardTitle>
            <CardDescription>
              Idempotency key caching and deduplication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cache Hit Rate</span>
                <span className="font-medium text-green-600">{rateLimitStats.cacheHitRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Idempotent Hits</span>
                <span className="font-medium">{rateLimitStats.idempotentHits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Deduplication %</span>
                <span className="font-medium">
                  {((rateLimitStats.idempotentHits / rateLimitStats.totalRequests) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>
            Current resource utilization across the cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-gray-500">{metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-atlas-600 h-2 rounded-full" 
                  style={{ width: `${metrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-gray-500">{metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-atlas-600 h-2 rounded-full" 
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Active Connections</span>
                <span className="text-sm text-gray-500">{metrics.activeConnections}</span>
              </div>
              <div className="text-2xl font-bold text-atlas-600">{metrics.activeConnections}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
