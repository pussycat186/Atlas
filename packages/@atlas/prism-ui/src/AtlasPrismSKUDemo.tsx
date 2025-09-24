import React, { useState, useEffect } from 'react';

export interface AtlasPrismSKUDemoProps {
  app: 'messenger' | 'admin' | 'dev';
  skuDefault: 'basic' | 'pro';
  gateway: string;
  renderTimestamp?: (m: { ts: number }) => Date;
  showTenantForPro?: boolean;
  showPqcForPro?: boolean;
  showQtcaBadgeForPro?: boolean;
  minimapDefault?: 'on' | 'off';
}

export function AtlasPrismSKUDemo({
  app,
  skuDefault,
  gateway,
  renderTimestamp,
  showTenantForPro = true,
  showPqcForPro = true,
  showQtcaBadgeForPro = true,
  minimapDefault = 'off'
}: AtlasPrismSKUDemoProps) {
  const [activeTab, setActiveTab] = useState(app);
  const [sku, setSku] = useState<'basic' | 'pro'>(skuDefault);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [minimapEnabled, setMinimapEnabled] = useState(minimapDefault === 'on');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Design tokens
  const tokens = {
    light: {
      bg: '#f7f7fb',
      surface: '#ffffffcc',
      border: '#e5e7eb',
      text: '#111827'
    },
    dark: {
      bg: '#0a0a0f',
      surface: '#1a1a2ecc',
      border: '#3b3b5c',
      text: '#f0f0ff'
    }
  };

  const currentTheme = tokens[theme];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const response = await fetch(`${gateway}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ message: message.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setReceipt({
          id: data.id || crypto.randomUUID(),
          ts: Date.now(),
          status: 'sent',
          verified: false
        });
        setMessage('');
      }
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleVerify = async () => {
    if (!receipt?.id) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch(`${gateway}/record/${receipt.id}`);
      if (response.ok) {
        const data = await response.json();
        setReceipt(prev => ({
          ...prev,
          verified: true,
          status: 'verified'
        }));
      }
    } catch (error) {
      console.error('Verify failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyJavaScript = () => {
    const jsCode = `const response = await fetch('${gateway}/record', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({ message: 'Hello Atlas' })
});`;
    navigator.clipboard.writeText(jsCode);
  };

  const handleCopyCurl = () => {
    const curlCode = `curl -X POST '${gateway}/record' \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: '$(uuidgen) \\
  -d '{"message":"Hello Atlas"}'`;
    navigator.clipboard.writeText(curlCode);
  };

  const containerStyle = {
    backgroundColor: currentTheme.bg,
    color: currentTheme.text,
    minHeight: '100vh',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const surfaceStyle = {
    backgroundColor: currentTheme.surface,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  };

  return (
    <div style={containerStyle} data-testid={`tab-${app}`}>
      {/* Theme Toggle */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
        <button
          data-testid="theme-toggle"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          style={{
            ...surfaceStyle,
            border: `1px solid ${currentTheme.border}`,
            cursor: 'pointer',
            padding: '0.5rem 1rem'
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'} {theme}
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {(['messenger', 'admin', 'dev'] as const).map(tab => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{
              ...surfaceStyle,
              cursor: 'pointer',
              opacity: activeTab === tab ? 1 : 0.7,
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* SKU Selection */}
      <div style={surfaceStyle}>
        <h3>SKU Selection</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            data-testid="sku-basic"
            onClick={() => setSku('basic')}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${sku === 'basic' ? currentTheme.text : currentTheme.border}`,
              backgroundColor: 'transparent',
              color: currentTheme.text,
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Basic
          </button>
          <button
            data-testid="sku-pro"
            onClick={() => setSku('pro')}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${sku === 'pro' ? currentTheme.text : currentTheme.border}`,
              backgroundColor: 'transparent',
              color: currentTheme.text,
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Pro {showPqcForPro && sku === 'pro' && <span style={{ color: '#10b981' }}>🔮 PQC</span>}
          </button>
        </div>
      </div>

      {/* Pro Features */}
      {sku === 'pro' && (
        <div style={surfaceStyle}>
          <h3>Pro Features</h3>
          {showTenantForPro && <div>🏢 Tenant: enterprise-demo</div>}
          {showQtcaBadgeForPro && <div>🔗 /qtca/stream endpoint available</div>}
          {showPqcForPro && <div>🔮 Post-Quantum Cryptography enabled</div>}
        </div>
      )}

      {/* Minimap Toggle (Pro only or forced on) */}
      {(sku === 'pro' || minimapDefault === 'on') && (
        <div style={surfaceStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              data-testid="minimap-toggle"
              checked={minimapEnabled}
              onChange={(e) => setMinimapEnabled(e.target.checked)}
            />
            Enable Minimap
          </label>
          {minimapEnabled && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              📊 Network topology view active
            </div>
          )}
        </div>
      )}

      {/* Main App Content */}
      {activeTab === 'messenger' && (
        <div style={surfaceStyle}>
          <h2>Atlas Proof Messenger</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              data-testid="composer-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '4px',
                backgroundColor: currentTheme.surface,
                color: currentTheme.text
              }}
            />
            <button
              data-testid="send-btn"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                opacity: message.trim() ? 1 : 0.5
              }}
            >
              Send
            </button>
          </div>
          
          {receipt && (
            <div data-testid="receipt" style={{ ...surfaceStyle, backgroundColor: theme === 'light' ? '#f0f9ff' : '#1e293b' }}>
              <h4>Receipt</h4>
              <div>ID: {receipt.id}</div>
              <div>Timestamp: {renderTimestamp ? renderTimestamp({ ts: receipt.ts }).toISOString() : new Date(receipt.ts).toISOString()}</div>
              <div>Status: {receipt.status}</div>
              {receipt.verified && <div style={{ color: '#10b981' }}>✅ Verified</div>}
              <button
                data-testid="verify-btn"
                onClick={handleVerify}
                disabled={isVerifying || receipt.verified}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: receipt.verified ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (isVerifying || receipt.verified) ? 'not-allowed' : 'pointer'
                }}
              >
                {isVerifying ? 'Verifying...' : receipt.verified ? 'Verified' : 'Verify'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={surfaceStyle}>
          <h2>Atlas Admin Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={surfaceStyle}>
              <h4>System Health</h4>
              <div>Status: ✅ Operational</div>
              <div>Uptime: 99.9%</div>
            </div>
            <div style={surfaceStyle}>
              <h4>Performance</h4>
              <div>RPS: 1,234</div>
              <div>P95: 45ms</div>
            </div>
            <div style={surfaceStyle}>
              <h4>Network</h4>
              <div>Witnesses: 4/4 online</div>
              <div>Consensus: Active</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dev' && (
        <div style={surfaceStyle}>
          <h2>Atlas Dev Portal</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4>JavaScript Example</h4>
              <pre style={{ backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                {`const response = await fetch('${gateway}/record', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({ message: 'Hello Atlas' })
});`}
              </pre>
              <button
                data-testid="copy-javascript"
                onClick={handleCopyJavaScript}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Copy JavaScript
              </button>
            </div>
            
            <div>
              <h4>cURL Example</h4>
              <pre style={{ backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                {`curl -X POST '${gateway}/record' \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: '$(uuidgen) \\
  -d '{"message":"Hello Atlas"}'`}
              </pre>
              <button
                data-testid="copy-curl"
                onClick={handleCopyCurl}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Copy cURL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}