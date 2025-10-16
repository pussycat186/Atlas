'use client';

import { useState } from 'react';

export function Sandbox() {
  const [activeEndpoint, setActiveEndpoint] = useState('chat');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoints = {
    chat: {
      name: 'Send Message',
      method: 'POST',
      url: '/api/chat/send',
      description: 'Send an encrypted message to a recipient',
      sampleRequest: `{
  "recipient": "alice@example.com",
  "content": "Hello from the sandbox!",
  "encryption": {
    "algorithm": "AES-GCM",
    "keyRotation": true
  },
  "receipt": {
    "required": true,
    "algorithm": "ECDSA-P256"
  }
}`
    },
    auth: {
      name: 'Generate DPoP Token',
      method: 'POST',
      url: '/api/auth/dpop',
      description: 'Generate a Demonstration of Proof-of-Possession token',
      sampleRequest: `{
  "method": "POST",
  "url": "https://api.atlas.dev/chat/send",
  "keyId": "your-key-id"
}`
    },
    receipts: {
      name: 'Verify Receipt',
      method: 'POST',
      url: '/api/receipts/verify',
      description: 'Verify a cryptographic receipt for message delivery',
      sampleRequest: `{
  "messageId": "msg_1234567890",
  "signature": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "publicKey": "-----BEGIN PUBLIC KEY-----\\n..."
}`
    },
    identity: {
      name: 'Get User Profile',
      method: 'GET',
      url: '/api/users/profile',
      description: 'Retrieve authenticated user profile information',
      sampleRequest: `// No request body required for GET requests
// Include Authorization header with your API key`
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const endpoint = endpoints[activeEndpoint];
      const method = endpoint.method;
      const url = `https://api.atlas.dev${endpoint.url}`;
      
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sandbox-token-demo',
          'X-Atlas-Client': 'dev-portal-sandbox'
        }
      };
      
      if (method !== 'GET' && requestBody) {
        requestOptions.body = requestBody;
      }
      
      // Simulate API call for demo purposes
      setTimeout(() => {
        const mockResponse = generateMockResponse(activeEndpoint, requestBody);
        setResponse(JSON.stringify(mockResponse, null, 2));
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  const generateMockResponse = (endpoint: string, request: string) => {
    const timestamp = new Date().toISOString();
    
    switch (endpoint) {
      case 'chat':
        return {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          recipient: 'alice@example.com',
          content: 'Hello from the sandbox!',
          encrypted: true,
          timestamp,
          receipt: {
            signature: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJtc2dfaWQiOiJtc2dfYWJjZGVmZ2hpIiwiaWF0IjoxNjk5NTU1NTU1fQ.signature',
            algorithm: 'ECDSA-P256',
            verified: true
          },
          status: 'delivered'
        };
        
      case 'auth':
        return {
          token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6ImF0K2p3dCIsImp3ayI6e319.payload.signature',
          type: 'DPoP',
          expires_in: 3600,
          scope: 'chat:send receipts:verify',
          issued_at: timestamp
        };
        
      case 'receipts':
        return {
          messageId: 'msg_1234567890',
          valid: true,
          verified_at: timestamp,
          delivery_confirmation: {
            recipient_signature: 'eyJhbGciOiJFUzI1NiJ9...',
            timestamp: timestamp,
            method: 'ECDSA-P256'
          }
        };
        
      case 'identity':
        return {
          id: 'user_demo_12345',
          email: 'developer@example.com',
          name: 'Demo Developer',
          verified: true,
          created_at: '2024-01-01T00:00:00Z',
          last_active: timestamp,
          permissions: ['chat:send', 'receipts:verify', 'keys:manage']
        };
        
      default:
        return { error: 'Unknown endpoint' };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Endpoint Selection */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          API Sandbox
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(endpoints).map(([key, endpoint]) => (
            <button
              key={key}
              onClick={() => {
                setActiveEndpoint(key);
                setRequestBody(endpoint.sampleRequest);
                setResponse('');
              }}
              className={`p-3 rounded-md text-sm font-medium text-left ${
                activeEndpoint === key
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{endpoint.name}</div>
              <div className="text-xs opacity-75">
                {endpoint.method} {endpoint.url}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        {/* Request Panel */}
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Request
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  endpoints[activeEndpoint].method === 'GET' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                }`}>
                  {endpoints[activeEndpoint].method}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {endpoints[activeEndpoint].url}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {endpoints[activeEndpoint].description}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Body
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Enter request body (JSON format)"
            />
          </div>
          
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
              loading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Sending Request...' : 'Send Request'}
          </button>
        </div>

        {/* Response Panel */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Response
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 h-80 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : response ? (
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {response}
              </pre>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Click "Send Request" to see the response
              </div>
            )}
          </div>
          
          {response && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(response)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Copy Response
              </button>
              <button
                onClick={() => setResponse('')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 dark:text-blue-400">ℹ️</div>
          <div className="text-sm">
            <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
              Sandbox Environment
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              This is a simulated environment for testing. Responses are mock data and no real API calls are made. 
              Use this to understand request/response formats before implementing in your application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}