'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PrismPage() {
  const [sku, setSku] = useState<'basic' | 'pro'>('basic');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lux, setLux] = useState(sku === 'pro');

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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Admin Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">Monitor system performance and analytics</p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Dev Portal</h3>
                <p className="text-gray-600 dark:text-gray-400">Developer tools and documentation</p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Proof Messenger</h3>
                <p className="text-gray-600 dark:text-gray-400">Secure quantum-verified messaging</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
