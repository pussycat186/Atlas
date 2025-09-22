'use client';

import { useState, useEffect } from 'react';
import { getGatewayUrl } from '@atlas/config';

interface MetricsData {
  rps: number;
  p95: number;
  errorPct: number;
  quorum: number;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData>({
    rps: 0,
    p95: 0,
    errorPct: 0,
    quorum: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

    const fetchMetrics = async () => {
      try {
        const gatewayUrl = await getGatewayUrl();
      const url = new URL(`${gatewayUrl}/metrics`);
      if (timeRange) {
        url.searchParams.set('t', timeRange);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map any fields to our expected structure
      setMetrics({
        rps: data.rps || data.requests_per_second || data.rate || 0,
        p95: data.p95 || data.p95_ms || data.latency_p95 || 0,
        errorPct: data.errorPct || data.error_rate || data.error_percentage || 0,
        quorum: data.quorum || data.witness_quorum || data.active_witnesses || 0
      });
      
      setError(null);
      } catch (err) {
      console.error('Failed to fetch metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatValue = (value: number, unit: string = '') => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit}`;
    } else if (value % 1 === 0) {
      return `${value}${unit}`;
    } else {
      return `${value.toFixed(2)}${unit}`;
    }
  };

    return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-h1 font-bold">Admin & Insights</h1>
          <div className="flex items-center space-x-4">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Refresh data">
              <span className="sr-only">Refresh</span>
              🔄
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Export data">
              <span className="sr-only">Export</span>
              📊
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" data-testid="metrics-page">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" data-testid="metrics-title">System Metrics</h2>
          <p className="text-muted-foreground">Real-time performance and health indicators</p>
        </div>

        {/* Timeline Scrubber */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              data-testid="time-range-selector"
            >
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-9 px-4"
              data-testid="refresh-metrics"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
        </div>
      </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">Error loading metrics: {error}</span>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="rps-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground" data-testid="rps-label">RPS</p>
                  <p className="text-2xl font-bold" data-testid="rps-value">{formatValue(metrics.rps)}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
      </div>
      </div>
              <p className="text-xs text-muted-foreground mt-1">Requests per second</p>
            </div>
          </div>

          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="p95-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground" data-testid="p95-label">p95</p>
                  <p className="text-2xl font-bold" data-testid="p95-value">{formatValue(metrics.p95, 'ms')}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">95th percentile latency</p>
            </div>
          </div>

          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="error-rate-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground" data-testid="error-rate-label">Error%</p>
                  <p className="text-2xl font-bold" data-testid="error-rate-value">{metrics.errorPct.toFixed(2)}%</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Error rate percentage</p>
            </div>
      </div>

          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="witness-quorum-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground" data-testid="witness-quorum-label">Witness quorum</p>
                  <p className="text-2xl font-bold" data-testid="witness-quorum-value">{metrics.quorum}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active witnesses</p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm p-6">
            <div className="text-center text-muted-foreground">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2">Performance charts will be displayed here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}