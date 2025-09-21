import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Heading, Text } from '@atlas/design-system';
import { BookOpen, Download, Code, ExternalLink } from 'lucide-react';

export default function SDKDocsPage() {
  const codeExample = `import { AtlasClient } from '@atlas/sdk';

const client = new AtlasClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.atlas.com'
});

// Send a verifiable message
const message = await client.sendMessage({
  content: 'Hello World',
  witnesses: ['w1', 'w2', 'w3']
});

console.log('Message hash:', message.hash);
console.log('Verification status:', message.verified);`;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <Heading level={1} className="text-h1 font-bold">SDK Documentation</Heading>
          <Text className="mt-2 text-muted">
            Complete guide to integrating Atlas into your applications
          </Text>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Heading level={2} className="text-h2 mb-4">Installation</Heading>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <Text className="font-mono text-sm">npm install @atlas/sdk</Text>
              </div>
            </div>

            <div>
              <Heading level={2} className="text-h2 mb-4">Basic Usage</Heading>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">{codeExample}</pre>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(codeExample)}
                aria-label="Copy code example"
              >
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Card>
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <Heading level={3} className="text-h3">AtlasClient</Heading>
                  <Text className="text-sm text-muted">
                    Main client class for interacting with the Atlas API
                  </Text>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <Heading level={3} className="text-h3">sendMessage()</Heading>
                  <Text className="text-sm text-muted">
                    Send a verifiable message with witness signatures
                  </Text>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <Heading level={3} className="text-h3">verifyMessage()</Heading>
                  <Text className="text-sm text-muted">
                    Verify the integrity of a previously sent message
                  </Text>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <Heading level={3} className="text-h3">getReceipt()</Heading>
                  <Text className="text-sm text-muted">
                    Retrieve the receipt and verification details for a message
                  </Text>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center justify-center">
                <Code className="h-4 w-4 mr-2" />
                Node.js Example
              </Button>
              
              <Button variant="outline" className="flex items-center justify-center">
                <Code className="h-4 w-4 mr-2" />
                Python Example
              </Button>
              
              <Button variant="outline" className="flex items-center justify-center">
                <Code className="h-4 w-4 mr-2" />
                React Example
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center justify-between">
                <span>GitHub Repository</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="flex items-center justify-between">
                <span>API Documentation</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="flex items-center justify-between">
                <span>Community Support</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="flex items-center justify-between">
                <span>Download SDK</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
