'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PrismPage() {
  const [sku, setSku] = useState<'basic' | 'pro'>('basic');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lux, setLux] = useState(sku === 'pro');
  const [activeTab, setActiveTab] = useState<'curated' | 'marketplace'>('curated');
  const [curatedApps] = useState([
    { id: '1', name: 'Quantum Calculator', description: 'Basic quantum operations', category: 'Tools' },
    { id: '2', name: 'State Visualizer', description: 'Visualize quantum states', category: 'Visualization' },
    { id: '3', name: 'Circuit Builder', description: 'Build quantum circuits', category: 'Development' }
  ]);
  const [marketplaceApps] = useState([
    { id: '4', name: 'Advanced Simulator', description: 'Enterprise quantum simulation', category: 'Pro Tools', price: '$99/mo' },
    { id: '5', name: 'ML Optimizer', description: 'Quantum machine learning', category: 'AI/ML', price: '$149/mo' },
    { id: '6', name: 'Crypto Suite', description: 'Quantum cryptography tools', category: 'Security', price: '$199/mo' }
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
            
            {/* Quickstart Section */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" data-testid="quickstart-section">
              <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-medium">Documentation</div>
                  <div className="text-sm text-gray-500">Get started with Atlas</div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium">Quick Deploy</div>
                  <div className="text-sm text-gray-500">Deploy in minutes</div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="font-medium">Support</div>
                  <div className="text-sm text-gray-500">Get help from experts</div>
                </button>
              </div>
            </div>
            
            {/* App Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('curated')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'curated'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  data-testid="curated-tab"
                >
                  Curated (Basic)
                </button>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'marketplace'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  data-testid="marketplace-tab"
                >
                  Marketplace (Pro)
                </button>
              </div>
            </div>
            
            {/* App Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="app-list">
              {(activeTab === 'curated' ? curatedApps : marketplaceApps).map((app) => (
                <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{app.name}</h3>
                    {'price' in app && (
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{app.price}</span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{app.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
                      {app.category}
                    </span>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      {'price' in app ? 'Subscribe' : 'Install'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
