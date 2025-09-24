import React, { useState, useEffect } from 'react';

export interface AtlasPrismSKUDemoProps {
  app: 'messenger' | 'admin' | 'dev';
  skuDefault: 'basic' | 'pro';
  gateway: string;
  testids?: {
    [key: string]: string;
  };
  renderTimestamp?: (msg: { ts: number }) => React.ReactNode;
  showTenantForPro?: boolean;
  showPqcForPro?: boolean; 
  showQtcaBadgeForPro?: boolean;
  minimapDefault?: 'on' | 'off';
}

const TEST_IDS = {
  'sku-basic': 'sku-basic',
  'sku-pro': 'sku-pro',
  'theme-toggle': 'theme-toggle',
  'composer-input': 'composer-input',
  'send-btn': 'send-btn',
  'verify-btn': 'verify-btn',
  'receipt': 'receipt',
  'minimap-toggle': 'minimap-toggle',
  'copy-javascript': 'copy-javascript',
  'copy-curl': 'copy-curl'
};

export function AtlasPrismSKUDemo({
  app,
  skuDefault,
  gateway,
  testids = TEST_IDS,
  renderTimestamp,
  showTenantForPro = true,
  showPqcForPro = true,
  showQtcaBadgeForPro = true,
  minimapDefault = app === 'messenger' ? 'off' : 'on'
}: AtlasPrismSKUDemoProps) {
  const [currentSku, setCurrentSku] = useState<'basic' | 'pro'>(skuDefault);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [composerValue, setComposerValue] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [minimapEnabled, setMinimapEnabled] = useState(minimapDefault === 'on');

  const isPro = currentSku === 'pro';
  const isMessenger = app === 'messenger';

  const handleSend = async () => {
    if (!composerValue.trim()) return;
    
    try {
      const idempotencyKey = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch(`${gateway}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          content: composerValue,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const receiptData = {
          id: data.id || `rec_${Date.now()}`,
          content: composerValue,
          timestamp: Date.now(),
          gateway: gateway,
          verified: false
        };
        setReceipt(receiptData);
        setComposerValue('');
      }
    } catch (error) {
      console.warn('Send failed, showing mock receipt:', error);
      const receiptData = {
        id: `rec_${Date.now()}`,
        content: composerValue,
        timestamp: Date.now(),
        gateway: gateway,
        verified: false
      };
      setReceipt(receiptData);
      setComposerValue('');
    }
  };

  const handleVerify = () => {
    if (receipt) {
      setReceipt({ ...receipt, verified: true });
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const generateJavaScript = () => {
    return `// Atlas JavaScript SDK
const atlas = new Atlas({ gateway: '${gateway}' });
const result = await atlas.record({ content: 'Hello World' });`;
  };

  const generateCurl = () => {
    return `curl -X POST '${gateway}/record' \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: \${IDEMPOTENCY_KEY}' \\
  -d '{"content":"Hello World","timestamp":1234567890}'`;
  };

  const containerTestId = `tab-${app}`;
  const themeClasses = theme === 'light' 
    ? 'bg-[#f7f7fb] text-[#111827]' 
    : 'bg-[#0a0a0a] text-[#ffffff] atlas-aurora-overlay';

  return (
    <div 
      data-testid={containerTestId}
      className={`min-h-screen ${themeClasses} transition-colors duration-200`}
    >
      {/* Aurora overlay for dark theme */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-pulse"></div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Atlas {app.charAt(0).toUpperCase() + app.slice(1)}</h1>
            
            {/* SKU Toggle */}
            <div className="flex gap-2">
              <button
                data-testid={testids['sku-basic']}
                onClick={() => setCurrentSku('basic')}
                className={`px-3 py-1 rounded ${currentSku === 'basic' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Basic
              </button>
              <button
                data-testid={testids['sku-pro']}
                onClick={() => setCurrentSku('pro')}
                className={`px-3 py-1 rounded ${currentSku === 'pro' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Pro
              </button>
            </div>
          </div>

          <button
            data-testid={testids['theme-toggle']}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Pro Features */}
        {isPro && showTenantForPro && (
          <div className="mb-4 p-3 rounded bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tenant: enterprise-demo</span>
              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Live</span>
              
              {showQtcaBadgeForPro && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">/qtca/stream</span>
              )}
              
              {showPqcForPro && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">PQC</span>
              )}
            </div>
          </div>
        )}

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Composer */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700">
              <textarea
                data-testid={testids['composer-input']}
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                placeholder="Enter your message..."
                className="w-full h-24 p-3 border rounded resize-none bg-white dark:bg-gray-900 dark:border-gray-600"
              />
              
              <div className="flex gap-2 mt-3">
                <button
                  data-testid={testids['send-btn']}
                  onClick={handleSend}
                  disabled={!composerValue.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>

                {receipt && (
                  <button
                    data-testid={testids['verify-btn']}
                    onClick={handleVerify}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>

            {/* Receipt */}
            {receipt && (
              <div 
                data-testid={testids.receipt}
                className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700"
              >
                <h3 className="font-medium mb-2">Receipt</h3>
                <div className="space-y-1 text-sm">
                  <div>ID: {receipt.id}</div>
                  <div>Content: {receipt.content}</div>
                  <div>
                    Timestamp: {renderTimestamp ? 
                      renderTimestamp({ ts: receipt.timestamp }) : 
                      new Date(receipt.timestamp).toISOString()
                    }
                  </div>
                  <div>Gateway: {receipt.gateway}</div>
                  <div>Status: {receipt.verified ? '✅ Verified' : '⏳ Pending'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Minimap and Tools */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Minimap</h3>
                <button
                  data-testid={testids['minimap-toggle']}
                  onClick={() => setMinimapEnabled(!minimapEnabled)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded"
                >
                  {minimapEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {minimapEnabled && (
                <div 
                  className="h-32 bg-gray-100 dark:bg-gray-700 rounded border cursor-pointer"
                  onClick={(e) => {
                    // Simulate center click changing scrollTop
                    const rect = e.currentTarget.getBoundingClientRect();
                    const centerY = rect.height / 2;
                    window.scrollTo({ top: centerY * 10, behavior: 'smooth' });
                  }}
                >
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Click center to scroll
                  </div>
                </div>
              )}
            </div>

            {/* Code Examples */}
            <div className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700">
              <h3 className="font-medium mb-3">Code Examples</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">JavaScript</span>
                    <button
                      data-testid={testids['copy-javascript']}
                      onClick={() => copyToClipboard(generateJavaScript())}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {generateJavaScript()}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">cURL</span>
                    <button
                      data-testid={testids['copy-curl']}
                      onClick={() => copyToClipboard(generateCurl())}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {generateCurl()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App-specific content */}
        {app === 'admin' && isPro && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700">
              <h3 className="font-medium mb-2">Metrics</h3>
              <div className="text-sm space-y-1">
                <div>Total Records: 1,234</div>
                <div>Success Rate: 99.9%</div>
                <div>Avg Latency: 45ms</div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-[#ffffffcc] dark:bg-gray-800/80 border border-[#e5e7eb] dark:border-gray-700">
              <h3 className="font-medium mb-2">Health Status</h3>
              <div className="text-sm">
                <span className="text-green-600">● All systems operational</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}