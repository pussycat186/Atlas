'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@atlas/design-system';
import { Code, ExternalLink, Copy, Play } from 'lucide-react';

export default function APIPage() {
  const endpoints = [
    {
      method: 'POST',
      path: '/messages',
      description: 'Send a verifiable message',
      auth: true
    },
    {
      method: 'GET',
      path: '/messages/{id}',
      description: 'Retrieve message details and verification status',
      auth: false
    },
    {
      method: 'POST',
      path: '/verify',
      description: 'Verify a message hash',
      auth: false
    },
    {
      method: 'GET',
      path: '/receipts/{id}',
      description: 'Get detailed receipt information',
      auth: false
    },
    {
      method: 'GET',
      path: '/health',
      description: 'Check API health status',
      auth: false
    }
  ];

  const getMethodBadge = (method: string) => {
    const colors = {
      'GET': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'POST': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PUT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  const exampleRequest = `curl -X POST https://api.atlas.com/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Hello World",
    "witnesses": ["w1", "w2", "w3"]
  }'`;

  const exampleResponse = `{
  "id": "msg_123456",
  "hash": "sha256:abc123...",
  "status": "pending",
  "timestamp": "2025-09-21T10:00:00Z",
  "receipt": {
    "witnesses": ["w1", "w2", "w3"],
    "verified": false
  }
}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-input bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">API Reference</h1>
          <span className="mt-2 text-muted-foreground">
            Complete REST API documentation for Atlas platform
          </span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <span className="font-mono">https://api.atlas.com</span>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <span>
              Most API endpoints require authentication using your API key. Include it in the Authorization header:
            </span>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <span className="font-mono text-sm">Authorization: Bearer YOUR_API_KEY</span>
            </div>
            <Button variant="outline" size="sm" className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get API Key
            </Button>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getMethodBadge(endpoint.method)}
                      <span className="font-mono font-semibold">{endpoint.path}</span>
                    </div>
                    {endpoint.auth && (
                      <Badge variant="warning">Auth Required</Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Example Request */}
        <Card>
          <CardHeader>
            <CardTitle>Example Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <span>Send a verifiable message:</span>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">{exampleRequest}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(exampleRequest)}
              className="flex items-center"
              aria-label="Copy request example"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Request
            </Button>
          </CardContent>
        </Card>

        {/* Example Response */}
        <Card>
          <CardHeader>
            <CardTitle>Example Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <span>Successful message creation response:</span>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">{exampleResponse}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(exampleResponse)}
              className="flex items-center"
              aria-label="Copy response example"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Response
            </Button>
          </CardContent>
        </Card>

        {/* Interactive Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="mb-4">
              Test API endpoints directly in your browser with our interactive documentation.
            </span>
            <div className="flex space-x-4">
              <Button className="flex items-center">
                <Play className="h-4 w-4 mr-2" />
                Open API Console
              </Button>
              <Button variant="outline" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Postman Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
