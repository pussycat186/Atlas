'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@atlas/design-system';
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-input bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">SDK Documentation</h1>
          <span className="mt-2 text-muted-foreground">
            Complete guide to integrating Atlas into your applications
          </span>
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
              <h2 className="text-2xl font-bold mb-4">Installation</h2>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <span className="font-mono text-sm">npm install @atlas/sdk</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Basic Usage</h2>
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
                  <h3 className="text-xl font-semibold">AtlasClient</h3>
                  <span className="text-sm text-muted-foreground">
                    Main client class for interacting with the Atlas API
                  </span>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-xl font-semibold">sendMessage()</h3>
                  <span className="text-sm text-muted-foreground">
                    Send a verifiable message with witness signatures
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-xl font-semibold">verifyMessage()</h3>
                  <span className="text-sm text-muted-foreground">
                    Verify the integrity of a previously sent message
                  </span>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-xl font-semibold">getReceipt()</h3>
                  <span className="text-sm text-muted-foreground">
                    Retrieve the receipt and verification details for a message
                  </span>
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
