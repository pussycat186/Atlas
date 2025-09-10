'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, ExternalLink, Download } from 'lucide-react';

export default function DocsPage() {
  const [selectedSection, setSelectedSection] = useState('quickstart');

  const sections = [
    { id: 'quickstart', title: 'Quick Start', icon: '🚀' },
    { id: 'api', title: 'API Reference', icon: '📚' },
    { id: 'examples', title: 'Examples', icon: '💡' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  const codeExamples = {
    quickstart: {
      title: 'Quick Start Guide',
      description: 'Get up and running with Atlas v12 in minutes',
      content: `# Install Atlas CLI
npm install -g @atlas/cli

# Initialize a new project
atlas init my-project
cd my-project

# Configure your API key
atlas config set api-key sk_live_your_api_key_here

# Send your first message
atlas send "Hello, Atlas!"`,
    },
    api: {
      title: 'API Reference',
      description: 'Complete API documentation for Atlas Gateway',
      content: `# Send a message to Atlas Gateway
curl -X POST https://api.atlas.dev/v1/messages \\
  -H "Authorization: Bearer sk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, Atlas!",
    "metadata": {
      "source": "webhook",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }'

# Response
{
  "id": "msg_abc123",
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z",
  "witnesses": ["w1", "w2", "w3", "w4"],
  "quorum": true
}`,
    },
    examples: {
      title: 'Code Examples',
      description: 'Practical examples for common use cases',
      content: `// JavaScript/Node.js
const Atlas = require('@atlas/sdk');

const client = new Atlas({
  apiKey: 'sk_live_your_api_key'
});

// Send a message
const result = await client.send({
  message: 'User signed up',
  metadata: {
    userId: '123',
    email: 'user@example.com'
  }
});

console.log('Message ID:', result.id);

// Python
from atlas_sdk import AtlasClient

client = AtlasClient(api_key='sk_live_your_api_key')

result = client.send(
    message='Order created',
    metadata={
        'orderId': '456',
        'amount': 99.99
    }
)

print(f"Message ID: {result.id}")`,
    },
    troubleshooting: {
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      content: `# Common Issues

## 1. Authentication Error
Error: "Invalid API key"
Solution: Verify your API key is correct and has proper permissions

## 2. Quorum Not Achieved
Error: "Insufficient witnesses for quorum"
Solution: Check witness node health and ensure at least 4/5 are online

## 3. Rate Limiting
Error: "Rate limit exceeded"
Solution: Implement exponential backoff or upgrade your plan

## 4. Network Timeout
Error: "Request timeout"
Solution: Check network connectivity and increase timeout values

# Debug Mode
Enable debug logging to see detailed request/response information:
export ATLAS_DEBUG=true
atlas send "test message"`,
    },
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  const downloadExample = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentation</h1>
        <p className="text-muted-foreground">
          Complete guide to using Atlas v12 for secure, multi-witness data integrity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
                      selectedSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="https://atlas-grafana-demo.loca.lt" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Grafana Dashboard
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="/playground" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  API Playground
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="/witness" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Witness Status
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{codeExamples[selectedSection as keyof typeof codeExamples].title}</CardTitle>
              <CardDescription>
                {codeExamples[selectedSection as keyof typeof codeExamples].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Code Example</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedSection === 'quickstart' && 'Bash'}
                      {selectedSection === 'api' && 'cURL'}
                      {selectedSection === 'examples' && 'JavaScript/Python'}
                      {selectedSection === 'troubleshooting' && 'Markdown'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(codeExamples[selectedSection as keyof typeof codeExamples].content)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadExample(
                        codeExamples[selectedSection as keyof typeof codeExamples].content,
                        `${selectedSection}-example.${selectedSection === 'quickstart' ? 'sh' : selectedSection === 'api' ? 'curl' : selectedSection === 'examples' ? 'js' : 'md'}`
                      )}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeExamples[selectedSection as keyof typeof codeExamples].content}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">SDKs & Libraries</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• JavaScript/Node.js SDK</li>
                    <li>• Python SDK</li>
                    <li>• Go SDK</li>
                    <li>• Rust SDK</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Tools & Integrations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CLI Tool</li>
                    <li>• Webhook Integration</li>
                    <li>• Grafana Plugin</li>
                    <li>• Postman Collection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">📧</div>
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-sm text-muted-foreground">support@atlas.dev</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-medium">Community</h4>
                  <p className="text-sm text-muted-foreground">Discord Server</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📖</div>
                  <h4 className="font-medium">GitHub</h4>
                  <p className="text-sm text-muted-foreground">Issues & PRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
