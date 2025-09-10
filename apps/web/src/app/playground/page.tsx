'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  status: 'pending' | 'verified' | 'conflict';
  quorumCount: number;
  latency: number;
}

export default function PlaygroundPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState('atlas_live_sk_1234567890abcdef');

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    
    // Simulate API call
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toISOString(),
      status: 'pending',
      quorumCount: 0,
      latency: 0,
    };

    setMessages([newMessage, ...messages]);
    setMessage('');

    // Simulate verification process
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? {
              ...msg,
              status: 'verified' as const,
              quorumCount: 4,
              latency: Math.floor(Math.random() * 100) + 20,
            }
          : msg
      ));
      setIsLoading(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'conflict': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'conflict': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Message Playground</h1>
        <p className="text-muted-foreground">
          Test message sending and witness verification in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Message */}
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>
              Send a test message and watch the verification process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
              </label>
              <Input
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Message Content
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </CardContent>
        </Card>

        {/* Live Status */}
        <Card>
          <CardHeader>
            <CardTitle>Live Status</CardTitle>
            <CardDescription>
              Real-time witness verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {['w1', 'w2', 'w3', 'w4', 'w5'].map((witness) => (
                  <div key={witness} className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-xs font-medium">{witness}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quorum Rate</span>
                  <span className="font-medium">99.8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Latency</span>
                  <span className="font-medium">45ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Witnesses</span>
                  <span className="font-medium">4/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            Recent messages and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages sent yet. Try sending your first message!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(msg.status)}</span>
                      <span className={`text-sm font-medium ${getStatusColor(msg.status)}`}>
                        {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{msg.content}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Quorum: {msg.quorumCount}/5</span>
                    <span>Latency: {msg.latency}ms</span>
                    <span>ID: {msg.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            Copy these snippets to integrate Atlas into your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">cURL</h4>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`curl -X POST https://api.atlas.com/v1/messages \\
  -H "Authorization: Bearer ${selectedApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello Atlas!"}'`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium mb-2">JavaScript</h4>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`const response = await fetch('https://api.atlas.com/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${selectedApiKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Hello Atlas!'
  })
});

const result = await response.json();
console.log('Message ID:', result.id);`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium mb-2">Python</h4>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import requests

response = requests.post(
    'https://api.atlas.com/v1/messages',
    headers={
        'Authorization': 'Bearer ${selectedApiKey}',
        'Content-Type': 'application/json',
    },
    json={'content': 'Hello Atlas!'}
)

result = response.json()
print('Message ID:', result['id'])`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
