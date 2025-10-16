'use client';

import { useState } from 'react';

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState('authentication');

  const examples = {
    authentication: {
      title: 'Authentication & DPoP',
      description: 'Implement secure authentication with Demonstration of Proof-of-Possession',
      code: `import { AtlasClient, DPoPGenerator } from '@atlas/sdk';

// Generate DPoP proof for request
const dpopGenerator = new DPoPGenerator({
  privateKey: await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign']
  )
});

// Create Atlas client with DPoP authentication
const atlas = new AtlasClient({
  apiKey: process.env.ATLAS_API_KEY,
  baseURL: 'https://api.atlas.dev',
  authentication: {
    type: 'dpop',
    generator: dpopGenerator
  }
});

// All requests will automatically include DPoP headers
const userProfile = await atlas.users.getProfile();
console.log('Authenticated user:', userProfile);`
    },
    messaging: {
      title: 'End-to-End Encrypted Messaging',
      description: 'Send secure messages with automatic encryption and receipt verification',
      code: `import { AtlasClient } from '@atlas/sdk';

const atlas = new AtlasClient({
  apiKey: process.env.ATLAS_API_KEY
});

// Send encrypted message
const message = await atlas.chat.send({
  recipient: 'alice@company.com',
  content: 'Confidential project update',
  encryption: {
    algorithm: 'AES-GCM',
    keyRotation: true
  },
  receipt: {
    required: true,
    algorithm: 'ECDSA-P256'
  }
});

// Wait for delivery confirmation
const receipt = await atlas.receipts.waitFor(message.id, {
  timeout: 30000
});

if (receipt.verified) {
  console.log('Message delivered and verified');
  console.log('Delivery timestamp:', receipt.timestamp);
} else {
  console.error('Message delivery failed');
}`
    },
    security: {
      title: 'Security Middleware Integration',
      description: 'Add Atlas security middleware to your Next.js application',
      code: `// middleware.ts
import { atlasSecurityMiddleware } from '@atlas/security-middleware';

export default atlasSecurityMiddleware({
  // Content Security Policy
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'nonce-{NONCE}'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'", "https://api.atlas.dev"]
    }
  },
  
  // Security headers
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Request validation
  validation: {
    bodySize: '1mb',
    parameterPollution: false
  }
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}`
    },
    webhooks: {
      title: 'Webhook Event Handling',
      description: 'Process real-time events and notifications from Atlas',
      code: `// api/webhooks/atlas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AtlasWebhookValidator } from '@atlas/sdk';

const webhookValidator = new AtlasWebhookValidator({
  secret: process.env.ATLAS_WEBHOOK_SECRET
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-atlas-signature');
  
  // Verify webhook authenticity
  if (!webhookValidator.verify(body, signature)) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }
  
  const event = JSON.parse(body);
  
  switch (event.type) {
    case 'message.delivered':
      await handleMessageDelivered(event.data);
      break;
      
    case 'message.read':
      await handleMessageRead(event.data);
      break;
      
    case 'user.presence.changed':
      await handlePresenceChange(event.data);
      break;
      
    case 'security.anomaly.detected':
      await handleSecurityAnomaly(event.data);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handleMessageDelivered(data: any) {
  console.log('Message delivered:', data.messageId);
  // Update UI, send notifications, etc.
}

async function handleSecurityAnomaly(data: any) {
  console.log('Security anomaly detected:', data);
  // Alert security team, log incident, etc.
}`
    },
    performance: {
      title: 'Performance Monitoring',
      description: 'Monitor and optimize Atlas application performance',
      code: `import { AtlasClient, PerformanceMonitor } from '@atlas/sdk';

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor({
  endpoint: 'https://telemetry.atlas.dev',
  sampleRate: 0.1, // Sample 10% of requests
  metrics: [
    'response_time',
    'throughput',
    'error_rate',
    'memory_usage'
  ]
});

const atlas = new AtlasClient({
  apiKey: process.env.ATLAS_API_KEY,
  plugins: [performanceMonitor]
});

// Performance will be automatically tracked
const messages = await atlas.chat.getMessages({
  limit: 50
});

// Custom performance tracking
performanceMonitor.track('custom_operation', async () => {
  // Your custom operation here
  const result = await someExpensiveOperation();
  return result;
});

// Real-time performance metrics
performanceMonitor.on('metric', (metric) => {
  console.log('Performance metric:', metric);
  
  if (metric.name === 'response_time' && metric.value > 1000) {
    console.warn('Slow response detected:', metric.value);
  }
});

// Generate performance report
const report = await performanceMonitor.generateReport({
  timeRange: '24h',
  groupBy: 'endpoint'
});

console.log('Performance report:', report);`
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {example.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {Object.entries(examples).map(([key, example]) => (
          <div
            key={key}
            className={`${activeTab === key ? 'block' : 'hidden'}`}
          >
            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {example.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {example.description}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Example Code
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(example.code)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Copy to clipboard
                </button>
              </div>
              <pre className="overflow-x-auto">
                <code className="text-sm text-gray-800 dark:text-gray-200">
                  {example.code}
                </code>
              </pre>
            </div>
            
            <div className="mt-6 flex items-center gap-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Try in Sandbox
              </button>
              <a
                href={`/docs/${key}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Read Full Documentation
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}