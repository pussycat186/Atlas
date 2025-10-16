'use client';

export function QuickStart() {
  const steps = [
    {
      number: '1',
      title: 'Install Atlas SDK',
      description: 'Get started with the Atlas JavaScript SDK',
      code: `npm install @atlas/sdk
# or
yarn add @atlas/sdk`,
      language: 'bash'
    },
    {
      number: '2', 
      title: 'Initialize Client',
      description: 'Configure Atlas client with your API key',
      code: `import { AtlasClient } from '@atlas/sdk';

const atlas = new AtlasClient({
  apiKey: process.env.ATLAS_API_KEY,
  baseURL: 'https://api.atlas.dev'
});`,
      language: 'javascript'
    },
    {
      number: '3',
      title: 'Send First Message',
      description: 'Start using Atlas chat functionality',
      code: `const message = await atlas.chat.send({
  recipient: 'user@example.com',
  content: 'Hello from Atlas!',
  encrypted: true
});

console.log('Message sent:', message.id);`,
      language: 'javascript'
    },
    {
      number: '4',
      title: 'Verify Receipt',
      description: 'Cryptographically verify message delivery',
      code: `const receipt = await atlas.receipts.verify({
  messageId: message.id,
  signature: message.receipt.signature
});

if (receipt.valid) {
  console.log('Message delivery verified');
}`,
      language: 'javascript'
    }
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Quick Start Guide
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Get up and running with Atlas in minutes
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {steps.map((step) => (
          <div 
            key={step.number}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.number}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {step.description}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-gray-800 dark:text-gray-200">
                      {step.code}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Next Steps */}
      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
          Next Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Explore Examples
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Check out real-world implementation examples
            </p>
            <a href="/examples" className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              View Examples →
            </a>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              API Reference
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Complete API documentation and references
            </p>
            <a href="/api-reference" className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Read Docs →
            </a>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Interactive Sandbox
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Test APIs and features in your browser
            </p>
            <a href="/sandbox" className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Try Sandbox →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}