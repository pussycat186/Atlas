/**
 * Atlas Admin Metrics Page
 * System performance and health monitoring dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { adminService } from '@/lib/admin-client';
import { format } from 'date-fns';

interface SystemMetrics {
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  quorum_rate: number;
  conflict_rate: number;
  witness_health: Record<string, number>;
  timestamp_skew: {
    min: number;
    max: number;
    avg: number;
  };
}

interface WitnessPerformance {
  witness_id: string;
  latency: number;
  success_rate: number;
  conflict_count: number;
  region: string;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [witnessPerformance, setWitnessPerformance] = useState<WitnessPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [metricsData, performanceData] = await Promise.all([
          adminService.getMetrics(),
          adminService.getWitnessPerformance()
        ]);
        
        setMetrics(metricsData);
        setWitnessPerformance(performanceData.witnesses);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: number) => {
    if (health >= 0.95) return 'text-green-600';
    if (health >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 0.95) return 'bg-green-100';
    if (health >= 0.8) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'us-east-1': 'bg-blue-100 text-blue-800',
      'us-west-2': 'bg-purple-100 text-purple-800',
      'eu-west-1': 'bg-green-100 text-green-800',
      'ap-southeast-1': 'bg-yellow-100 text-yellow-800',
      'ap-northeast-1': 'bg-pink-100 text-pink-800',
    };
    return colors[region] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atlas-600"></div>
        <span className="ml-2 text-gray-600">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
          <p className="text-gray-600 mt-1">
            Real-time performance and health monitoring
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">P95 Latency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.latency.p95 || 0}ms
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Quorum Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {((metrics?.quorum_rate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conflict Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {((metrics?.conflict_rate || 0) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Timestamp Skew</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.timestamp_skew.avg || 0}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Distribution */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Latency Distribution</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics?.latency.p50 || 0}ms</div>
              <div className="text-sm text-gray-500">P50 (Median)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{metrics?.latency.p95 || 0}ms</div>
              <div className="text-sm text-gray-500">P95</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{metrics?.latency.p99 || 0}ms</div>
              <div className="text-sm text-gray-500">P99</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp Skew Analysis */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Timestamp Skew Analysis</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics?.timestamp_skew.min || 0}ms</div>
              <div className="text-sm text-gray-500">Minimum Skew</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics?.timestamp_skew.avg || 0}ms</div>
              <div className="text-sm text-gray-500">Average Skew</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{metrics?.timestamp_skew.max || 0}ms</div>
              <div className="text-sm text-gray-500">Maximum Skew</div>
            </div>
          </div>
          
          {/* Skew Health Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Skew Health</span>
              <span className={`text-sm font-medium ${
                (metrics?.timestamp_skew.max || 0) <= 2000 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics?.timestamp_skew.max || 0) <= 2000 ? 'Healthy' : 'Exceeded Limit'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (metrics?.timestamp_skew.max || 0) <= 2000 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(((metrics?.timestamp_skew.max || 0) / 2000) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Limit: 2000ms (Δ=2s)
            </p>
          </div>
        </div>
      </div>

      {/* Witness Performance */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Witness Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Witness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conflicts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {witnessPerformance.map((witness) => (
                <tr key={witness.witness_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ServerIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        {witness.witness_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRegionColor(witness.region)}`}>
                      {witness.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {witness.latency.toFixed(1)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {(witness.success_rate * 100).toFixed(1)}%
                      </div>
                      <div className={`ml-2 w-2 h-2 rounded-full ${getHealthBgColor(witness.success_rate)}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {witness.conflict_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthBgColor(witness.success_rate)} ${getHealthColor(witness.success_rate)}`}>
                      {witness.success_rate >= 0.95 ? 'Healthy' : witness.success_rate >= 0.8 ? 'Degraded' : 'Unhealthy'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Health Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Overall Health</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quorum Success Rate</span>
                  <span className={`text-sm font-medium ${
                    (metrics?.quorum_rate || 0) >= 0.95 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {((metrics?.quorum_rate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conflict Rate</span>
                  <span className={`text-sm font-medium ${
                    (metrics?.conflict_rate || 0) <= 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((metrics?.conflict_rate || 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Timestamp Skew</span>
                  <span className={`text-sm font-medium ${
                    (metrics?.timestamp_skew.max || 0) <= 2000 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(metrics?.timestamp_skew.max || 0)}ms
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">P95 Latency</span>
                  <span className={`text-sm font-medium ${
                    (metrics?.latency.p95 || 0) <= 500 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {metrics?.latency.p95 || 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">P99 Latency</span>
                  <span className={`text-sm font-medium ${
                    (metrics?.latency.p99 || 0) <= 1000 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {metrics?.latency.p99 || 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Witnesses</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Object.values(metrics?.witness_health || {}).filter(h => h === 1).length}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
