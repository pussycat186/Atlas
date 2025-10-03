'use client';

import { useState } from 'react';
import { ConstellationView } from '@atlas/ui-system/src/constellation-view';
import { SLOGauge } from '@atlas/ui-system/src/slo-gauge';

export default function PrismPage() {
  const [sku, setSku] = useState<'basic' | 'pro'>('basic');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lux, setLux] = useState(sku === 'pro');
  const [nodes] = useState([
    { id: '1', label: 'API Gateway', x: 100, y: 100, status: 'active' as const },
    { id: '2', label: 'Database', x: 200, y: 150, status: 'active' as const },
    { id: '3', label: 'Cache', x: 300, y: 100, status: 'warning' as const },
    { id: '4', label: 'Worker', x: 150, y: 200, status: 'active' as const }
  ]);
  const [systemStatus] = useState([
    { service: 'API Gateway', status: 'Healthy', uptime: '99.9%', latency: '45ms' },
    { service: 'Database', status: 'Healthy', uptime: '99.8%', latency: '12ms' },
    { service: 'Cache', status: 'Warning', uptime: '98.5%', latency: '8ms' },
    { service: 'Worker Pool', status: 'Healthy', uptime: '99.7%', latency: '23ms' }
  ]);

  return (
    <>
      {/* SSR-visible marker (must be literal text, not computed) */}
      <div data-prism-marker data-testid="prism-marker" className="hidden">
        ATLAS • Prism UI — Peak Preview
      </div>
      <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="relative z-10">
        <div className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg"></div>
                  <span className="font-bold">ATLAS • Prism UI — Peak Preview</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${sku === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {sku.toUpperCase()}
                </span>
                {sku === 'pro' && (
                  <div className="flex items-center gap-2">
                    <select className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm">
                      <option>Tenant: acme-corp</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Live</span>
                    </div>
                    <span className="text-sm px-2 py-1 bg-purple-500/20 text-purple-400 rounded">/qtca/stream</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sku === 'pro'}
                    onChange={(e) => {
                      const newSku = e.target.checked ? 'pro' : 'basic';
                      setSku(newSku);
                      setLux(newSku === 'pro');
                    }}
                    className="sr-only"
                    aria-label="Toggle Pro SKU"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${sku === 'pro' ? 'bg-purple-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${sku === 'pro' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                  </div>
                  <span className="text-sm">PRO</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lux}
                    onChange={(e) => setLux(e.target.checked)}
                    className="w-4 h-4"
                    aria-label="Luxury animations"
                  />
                  <span className="text-sm">Luxury</span>
                </label>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Atlas Prism Preview</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {sku === 'pro' ? 'Enterprise-grade quantum computing interface' : 'Essential quantum computing tools'}
            </p>
            
            {/* Constellation View */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">System Constellation</h2>
              <ConstellationView nodes={nodes} data-testid="constellation-view" />
            </div>
            
            {/* SLO Gauges */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Service Level Objectives</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SLOGauge value={99.9} target={99.5} label="Uptime" data-testid="uptime-gauge" />
                <SLOGauge value={95.2} target={95.0} label="Performance" data-testid="performance-gauge" />
                <SLOGauge value={98.7} target={99.0} label="Availability" data-testid="availability-gauge" />
                <SLOGauge value={99.1} target={98.0} label="Reliability" data-testid="reliability-gauge" />
              </div>
            </div>
            
            {/* System Status Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b dark:border-gray-700">System Status</h2>
              <div className="overflow-x-auto" data-testid="system-status-table">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uptime</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {systemStatus.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.service}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.uptime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
