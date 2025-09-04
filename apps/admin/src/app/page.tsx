/**
 * Atlas Admin Dashboard
 * Main dashboard with system overview and metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ServerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { adminService, type SystemMetrics, type WitnessStatus } from '@/lib/admin-client';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [witnessStatus, setWitnessStatus] = useState<WitnessStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, witnessData] = await Promise.all([
          adminService.getSystemMetrics('24h'),
          adminService.getWitnessStatus(),
        ]);
        
        setMetrics(metricsData);
        setWitnessStatus(witnessData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atlas-600"></div>
      </div>
    );
  }

  const healthyWitnesses = witnessStatus.filter(w => w.status === 'active').length;
  const totalWitnesses = witnessStatus.length;
  const witnessHealthRate = totalWitnesses > 0 ? healthyWitnesses / totalWitnesses : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Atlas Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System monitoring and conflict management
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Quorum Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics ? (metrics.quorum_rate * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conflict Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics ? (metrics.conflict_rate * 100).toFixed(2) : '0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ServerIcon className="h-8 w-8 text-atlas-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Witness Health</p>
              <p className="text-2xl font-semibold text-gray-900">
                {healthyWitnesses}/{totalWitnesses}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Latency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics ? metrics.latency.p95.toFixed(0) : '0'}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Witness Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Witness Status</h3>
          <div className="space-y-3">
            {witnessStatus.map((witness) => (
              <div key={witness.witness_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    witness.status === 'active' ? 'bg-green-500' : 
                    witness.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{witness.witness_id}</p>
                    <p className="text-xs text-gray-500">{witness.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${
                    witness.status === 'active' ? 'text-green-600' : 
                    witness.status === 'inactive' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {witness.status.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(witness.last_seen), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
          {metrics && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Latency (P95)</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.latency.p95}ms</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Timestamp Skew</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.timestamp_skew.avg.toFixed(0)}ms avg
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.timestamp_skew.min}ms - {metrics.timestamp_skew.max}ms
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Witness Health Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(witnessHealthRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <a
            href="/conflicts"
            className="btn-primary"
          >
            View Conflicts
          </a>
          <a
            href="/witnesses"
            className="btn-secondary"
          >
            Witness Details
          </a>
          <a
            href="/metrics"
            className="btn-secondary"
          >
            Detailed Metrics
          </a>
        </div>
      </div>
    </div>
  );
}
