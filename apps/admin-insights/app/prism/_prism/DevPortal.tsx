'use client';

import { motion } from 'framer-motion';

interface DevPortalProps {
  sku: 'basic' | 'pro';
  theme: 'dark' | 'light';
}

export default function DevPortal({ sku, theme }: DevPortalProps) {
  const basicPlugins = [
    { name: 'Receipts', description: 'Message receipts and delivery confirmation' },
    { name: 'Escrow', description: 'Secure payment escrow integration' },
    { name: 'Workflow', description: 'Automated message workflows' }
  ];

  const proPlugins = [
    { name: 'Audit Trail', description: 'Complete message audit logging' },
    { name: 'SSO Bridge', description: 'Enterprise SSO integration' },
    { name: 'Sandbox Runner', description: 'Safe code execution environment' },
    { name: 'Data Residency', description: 'Geographic data control' }
  ];

  const plugins = sku === 'basic' ? basicPlugins : proPlugins;

  return (
    <div className="h-full space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">
          {sku === 'basic' ? 'Curated Plugins' : 'Marketplace'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {plugins.map((plugin, i) => (
            <motion.div
              key={plugin.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{plugin.name}</h4>
                {sku === 'basic' && (
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">BASIC</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-3">{plugin.description}</p>
              <button 
                className={`w-full py-2 px-4 rounded-lg font-medium ${
                  sku === 'basic' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                aria-label={`${sku === 'basic' ? 'Enable' : 'Install'} ${plugin.name}`}
              >
                {sku === 'basic' ? 'Enable' : 'Install'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h4 className="font-semibold text-white mb-3">Quickstart</h4>
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Set your environment:</div>
          <div className="p-2 bg-gray-900 rounded font-mono text-sm text-green-400">
            ATLAS_API_KEY=your_key_here
          </div>
          <div className="text-sm text-gray-400 mt-3">Test the API:</div>
          <div className="p-2 bg-gray-900 rounded font-mono text-sm text-green-400 relative">
            curl -H "Authorization: Bearer $ATLAS_API_KEY" https://api.atlas.com/v1/messages
            <button 
              onClick={() => navigator.clipboard?.writeText('curl -H "Authorization: Bearer $ATLAS_API_KEY" https://api.atlas.com/v1/messages')}
              className="absolute right-2 top-2 text-xs text-purple-400 hover:text-purple-300"
              aria-label="Copy curl command"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
