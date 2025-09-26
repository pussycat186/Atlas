'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AdminProps {
  sku: 'basic' | 'pro';
  theme: 'dark' | 'light';
}

export default function Admin({ sku, theme }: AdminProps) {
  const [timelineValue, setTimelineValue] = useState(50);
  const nodes = ['api', 'auth', 'billing', 'witness', 'gateway'];
  
  return (
    <div className="h-full space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-4">Constellations</h3>
        <div className="relative h-64 bg-gray-900/50 rounded-xl p-8">
          {nodes.map((node, i) => (
            <motion.div
              key={node}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium ${
                sku === 'pro' ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-gray-700 border border-gray-600 text-gray-300'
              }`}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${30 + (i % 2) * 30}%`
              }}
              animate={sku === 'pro' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              aria-label={`${node} service node`}
            >
              {node}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="timeline-slider" className="block text-sm text-gray-400 mb-2">Timeline</label>
          <input
            id="timeline-slider"
            type="range"
            min="0"
            max="100"
            value={timelineValue}
            onChange={(e) => setTimelineValue(Number(e.target.value))}
            className="w-full"
            aria-label="Timeline control"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{Math.round(95 + timelineValue * 0.05)}ms</div>
            <div className="text-sm text-gray-400">P99 Latency</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{(timelineValue * 0.01).toFixed(2)}%</div>
            <div className="text-sm text-gray-400">Error Rate</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{Math.round(1000 + timelineValue * 10)}</div>
            <div className="text-sm text-gray-400">RPS</div>
          </div>
        </div>

        {sku === 'pro' ? (
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
            <div className="text-green-400 font-semibold">Auto-heal ≤ 1 tick</div>
            <div className="text-sm text-gray-300">Automatic recovery enabled</div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
            <div className="text-purple-400 font-semibold">Upgrade to Pro</div>
            <div className="text-sm text-gray-300">Unlock auto-healing and advanced monitoring</div>
          </div>
        )}
      </div>
    </div>
  );
}
