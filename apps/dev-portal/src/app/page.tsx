'use client';

import { useState, useEffect } from 'react';
import { getGatewayUrl } from '@atlas/config';

export default function HomePage() {
  const [gatewayUrl, setGatewayUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'javascript' | 'curl'>('javascript');

  useEffect(() => {
    const fetchGatewayUrl = async () => {
      try {
        const url = await getGatewayUrl();
        setGatewayUrl(url);
      } catch (error) {
        console.error('Failed to fetch gateway URL:', error);
        setGatewayUrl('https://api.atlas.example.com');
      }
    };
    fetchGatewayUrl();
  }, []);

  const javascriptCode = `// Atlas Proof Messenger - JavaScript SDK
import { AtlasClient } from '@atlas/sdk';

const client = new AtlasClient({
  gatewayUrl: '${gatewayUrl}'
});

// Send a verifiable message
async function sendMessage(content) {
  try {
    const response = await client.record({
      message: content,
      idempotencyKey: crypto.randomUUID()
    });
    
    console.log('Message sent:', response.id);
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

// Verify a message
async function verifyMessage(messageId) {
  try {
    const response = await client.getRecord(messageId);
    console.log('Message verified:', response.status);
    return response;
  } catch (error) {
    console.error('Failed to verify message:', error);
    throw error;
  }
}

// Example usage
sendMessage('Hello Atlas!')
  .then(record => verifyMessage(record.id))
  .then(verified => console.log('Message verified:', verified));`;

  const curlCode = `# Atlas Proof Messenger - cURL Examples

# Send a verifiable message
curl -X POST '${gatewayUrl}/record' \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: $(uuidgen)' \\
  -d '{
    "message": "Hello Atlas!"
  }'

# Verify a message
curl -X GET '${gatewayUrl}/record/{message_id}'

# Get message receipts
curl -X GET '${gatewayUrl}/receipts/{message_id}'

# Health check
curl -X GET '${gatewayUrl}/health'`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-h1 font-bold">Developer Portal</h1>
          <div className="flex items-center space-x-4">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="API Documentation">
              <span className="sr-only">Docs</span>
              📚
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="API Keys">
              <span className="sr-only">Keys</span>
              🔑
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8" data-testid="dev-portal-page">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Atlas Proof Messenger API</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Build verifiable messaging into your applications with our simple, powerful API.
          </p>
        </div>

        {/* Quick Start Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Quick Start</h3>
          <p className="text-muted-foreground mb-6">
            Get up and running with Atlas in minutes. Choose your preferred language and start building.
          </p>

            {/* Language Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('javascript')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'javascript'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="language-tab-javascript"
            >
              JavaScript
            </button>
                <button
              onClick={() => setActiveTab('curl')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'curl'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="language-tab-curl"
            >
              cURL
                </button>
            </div>

            {/* Code Block */}
          <div className="relative">
            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm">
                <code>{activeTab === 'javascript' ? javascriptCode : curlCode}</code>
                </pre>
            </div>
            <button
              onClick={() => copyToClipboard(activeTab === 'javascript' ? javascriptCode : curlCode)}
              className="absolute top-4 right-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-700 text-white hover:bg-gray-600 h-8 px-3"
              data-testid={activeTab === 'javascript' ? 'copy-javascript' : 'copy-curl'}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
        </div>
      </div>

      {/* API Reference */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">API Reference</h3>
          
          <div className="space-y-6">
            {/* Send Message Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6" data-testid="send-message-endpoint">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    POST
                  </span>
                  <code className="text-lg font-mono">{gatewayUrl}/record</code>
                </div>
                  </div>
              <p className="text-muted-foreground mb-4">Send a verifiable message to the Atlas network.</p>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Headers</h4>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">
                    Content-Type: application/json<br/>
                    Idempotency-Key: &lt;uuid&gt;
                  </code>
                </div>
                  </div>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">
                    {`{
  "message": "Your message content here"
}`}
                  </code>
                </div>
              </div>
            </div>
            
            {/* Verify Message Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6" data-testid="verify-message-endpoint">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    GET
                  </span>
                  <code className="text-lg font-mono">{gatewayUrl}/record/:id</code>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">Verify a message by its ID.</p>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">
                    {`{
  "id": "msg_1234567890",
  "status": "verified",
  "timestamp": "2024-01-01T00:00:00Z",
  "witnesses": 4
}`}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SDKs and Libraries */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">SDKs & Libraries</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-2">JavaScript/TypeScript</h4>
              <p className="text-sm text-muted-foreground mb-4">Official SDK for web and Node.js applications.</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm install @atlas/sdk</code>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-2">Python</h4>
              <p className="text-sm text-muted-foreground mb-4">Python client for server-side applications.</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">pip install atlas-sdk</code>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-2">Go</h4>
              <p className="text-sm text-muted-foreground mb-4">Go client for high-performance applications.</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">go get github.com/atlas/sdk-go</code>
            </div>
          </div>
      </div>

        {/* Status and Health */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">API Status</h4>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Gateway</h4>
                  <p className="text-sm text-green-600">Healthy</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Witnesses</h4>
                  <p className="text-sm text-green-600">4 Active</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}