'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Tabs from './Tabs';
import Backgrounds from './Backgrounds';
import { Badge } from './Primitives';

export default function PrismPage() {
  const [sku, setSku] = useState<'basic' | 'pro'>('pro');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [density, setDensity] = useState(false);
  const [luxury, setLuxury] = useState(true);
  const [activeTab, setActiveTab] = useState<'messenger' | 'admin' | 'dev'>('messenger');

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Backgrounds luxury={luxury} theme={theme} />
      
      <div className="relative z-10">
        {/* Top Bar */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg"></div>
                  <span className="font-bold">ATLAS • Prism UI — Peak Preview</span>
                </div>
                <Badge variant={sku}>{sku.toUpperCase()}</Badge>
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
                    onChange={(e) => setSku(e.target.checked ? 'pro' : 'basic')}
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
                    checked={density}
                    onChange={(e) => setDensity(e.target.checked)}
                    className="w-4 h-4"
                    aria-label="Dense layout"
                  />
                  <span className="text-sm">Dense</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={luxury}
                    onChange={(e) => setLuxury(e.target.checked)}
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

                <button 
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
                  aria-label="Command palette"
                >
                  ⌘K
                </button>
              </div>
            </div>
          </div>
        </div>

        <Tabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sku={sku}
          theme={theme}
          density={density}
          luxury={luxury}
        />
      </div>
    </div>
  );
}
