'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Copy,
  ExternalLink,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Message {
  id: string;
  content: string;
  status: 'pending' | 'verified' | 'failed';
  timestamp: Date;
  receipt?: {
    hash: string;
    witnesses: string[];
    verifyResult: boolean;
  };
}

export default function HomePage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_001',
      content: 'Hello World',
      status: 'verified',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      receipt: {
        hash: 'sha256:abc123...',
        witnesses: ['w1', 'w2', 'w3', 'w4'],
        verifyResult: true
      }
    },
    {
      id: 'msg_002',
      content: 'Test Message',
      status: 'pending',
      timestamp: new Date(Date.now() - 60 * 60 * 1000)
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  // Mock quantum connection state
  const quantumConnected = true;
  const quantumState = { phase: Math.PI * 1.5, amplitude: 1.0 };
  const timeCrystals = [{ id: 'crystal1' }, { id: 'crystal2' }];
  const entangledChannels = [{ id: 'channel1' }, { id: 'channel2' }];
  const quantumMetrics = { healthScore: 95 };

  // Mock realtime connection
  const connectionStatus = 'connected';

  // Mock quantum event handling
  useEffect(() => {
    console.log('Quantum state initialized');
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    
    // Create optimistic message with quantum wave effect
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content: message,
      status: 'pending',
      timestamp: new Date()
    };

    // Add optimistic message immediately with quantum wave animation
    setMessages(prev => [newMessage, ...prev]);
    setMessage('');

    // Simulate quantum state processing with real API call
    try {
      const response = await fetch('https://atlas-gateway.sonthenguyen186.workers.dev/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': newMessage.id
        },
        body: JSON.stringify({
          app: 'proof-messenger',
          record_id: newMessage.id,
          payload: message,
          meta: { source: 'web-app', timestamp: newMessage.timestamp.toISOString() }
        })
      });

      if (response.ok) {
        // Update message status to verified with quantum wave transition
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { 
                ...msg, 
                status: 'verified' as const,
                receipt: {
                  hash: `sha256:${Math.random().toString(36).substr(2, 9)}...`,
                  witnesses: ['w1', 'w2', 'w3', 'w4'],
                  verifyResult: true
                }
              }
            : msg
        ));
      } else {
        // Mark as failed
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftMessage = () => {
    if (message.trim()) {
      // In a real app, this would save to localStorage or send to draft API
      console.log('Draft saved:', message);
      setMessage('');
    }
  };

  const copyMessageId = (messageId: string) => {
    navigator.clipboard.writeText(messageId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-h1 font-bold">Atlas Messenger</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" aria-label="Search messages">
              <span className="sr-only">Search</span>
              🔍
            </Button>
            <Button variant="outline" size="sm" aria-label="Toggle theme">
              <span className="sr-only">Theme</span>
              🌙
            </Button>
            <Button variant="outline" size="sm" aria-label="Open command palette">
              <span className="sr-only">Command</span>
              ⌘K
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8" data-testid="messenger-page">
      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} data-testid="connection-indicator"></div>
            <span className="text-sm text-muted-foreground" data-testid="connection-status">
              {connectionStatus === 'connected' ? 'Connected to Atlas Network' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            data-testid="refresh-connection"
            aria-label="Refresh connection"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Message Card */}
        <Card data-testid="send-message-card">
          <CardHeader>
            <h3 className="text-lg font-semibold" data-testid="send-message-title">
              Send Message
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="send-message-description">
              Send a verifiable message with integrity timeline
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Filters */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" aria-label="Show all messages">All</Button>
                <Button variant="outline" size="sm" aria-label="Show verified messages">Verified</Button>
                <Button variant="outline" size="sm" aria-label="Show pending messages">Pending</Button>
              </div>
              
              <textarea 
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
                data-testid="message-input"
                disabled={isSending}
                aria-label="Message input"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    loading={isSending}
                    data-testid="send-message-button"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleDraftMessage}
                    disabled={!message.trim()}
                    data-testid="draft-message-button"
                  >
                    Draft
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    aria-label="Attach file"
                  >
                    📎
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {message.length}/280
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages Card */}
        <Card data-testid="recent-messages-card">
          <CardHeader>
            <h3 className="text-lg font-semibold" data-testid="recent-messages-title">
              Recent Messages
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="recent-messages-description">
              View your message history and verification status
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="message-list">
            {messages.map((msg, index) => (
              <div 
                key={msg.id} 
                className="flex items-center justify-between p-3 border border-input rounded-lg hover:bg-muted transition-all duration-300 group"
                data-testid={`message-item-${msg.id}`}
                style={{
                  viewTransitionName: `message-${msg.id}`,
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(msg.status)}
                    <span className="font-medium text-foreground" data-testid="message-content">
                      {msg.content}
                    </span>
                    {/* Quantum wave indicator */}
                    {msg.status === 'pending' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid="message-timestamp">
                    {format(msg.timestamp, 'MMM d, HH:mm')}
                  </span>
                  {msg.receipt && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Shield className="h-3 w-3 text-green-600 animate-pulse" />
                      <span className="text-xs text-muted-foreground" data-testid="witness-count">
                        {msg.receipt.witnesses.length} witnesses
                      </span>
                      {/* Quantum entanglement visualization */}
                      <div className="flex space-x-1">
                        {msg.receipt.witnesses.slice(0, 4).map((witness, i) => (
                          <div 
                            key={witness}
                            className="w-2 h-2 bg-green-500 rounded-full opacity-60"
                            style={{ 
                              animationDelay: `${i * 0.1}s`,
                              animation: 'pulse 2s infinite'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-2 py-1 text-xs rounded-full flex items-center space-x-1"
                    data-testid={`message-status-${msg.id}`}
                  >
                    <Badge 
                      variant={msg.status === 'verified' ? 'success' : msg.status === 'pending' ? 'warning' : 'destructive'}
                      className="transition-all duration-300"
                    >
                      {msg.status}
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyMessageId(msg.id)}
                    data-testid={`copy-${msg.id}`}
                    aria-label="Copy message ID"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="stats-overview">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm text-muted-foreground" data-testid="total-messages-label">Total Messages</span>
                <span className="text-2xl font-bold" data-testid="total-messages-value">{messages.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm text-muted-foreground" data-testid="verified-messages-label">Verified</span>
                <span className="text-2xl font-bold" data-testid="verified-messages-value">
                  {messages.filter(m => m.status === 'verified').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <span className="text-sm text-muted-foreground" data-testid="pending-messages-label">Pending</span>
                <span className="text-2xl font-bold" data-testid="pending-messages-value">
                  {messages.filter(m => m.status === 'pending').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <span className="text-sm text-muted-foreground" data-testid="uptime-label">Uptime</span>
                <span className="text-2xl font-bold" data-testid="uptime-value">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quantum State Information */}
      {quantumConnected && (
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700" data-testid="quantum-state-info">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Quantum Time Crystal Architecture</h4>
            </div>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Quantum Phase</span>
              <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-phase">
                {quantumState ? (quantumState.phase / Math.PI).toFixed(2) + 'π' : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Time Crystals</span>
              <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-crystals">
                {timeCrystals.length}
              </span>
            </div>
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Entangled Channels</span>
              <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-channels">
                {entangledChannels.length}
              </span>
            </div>
          </div>
          {quantumMetrics && (
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <span className="text-sm text-purple-700 dark:text-purple-300">System Health</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${quantumMetrics.healthScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100" data-testid="quantum-health">
                  {quantumMetrics.healthScore}%
                </span>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      )}
      </main>
    </div>
  );
}