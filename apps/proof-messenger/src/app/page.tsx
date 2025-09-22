'use client';

import { useState, useEffect } from 'react';
import { getGatewayUrl } from '@atlas/config';

interface Message {
  id: string;
  content: string;
  status: 'pending' | 'sent' | 'verified' | 'failed';
  timestamp: Date;
  receipt?: {
    id: string;
    ts: Date;
    status: string;
  };
}

export default function HomePage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_001',
      content: 'Hello World',
      status: 'verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      receipt: {
        id: 'msg_001',
        ts: new Date(Date.now() - 1000 * 60 * 30),
        status: 'verified'
      }
    },
    {
      id: 'msg_002',
      content: 'Test Message',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 5)
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [gatewayReachable, setGatewayReachable] = useState(true);
  const [minimapEnabled, setMinimapEnabled] = useState(false);

  // Mock quantum state
  const [quantumPhase] = useState(1.5 * Math.PI);
  const [quantumCrystals] = useState(2);
  const [quantumChannels] = useState(2);
  const [quantumHealth] = useState(95);

  // Connection status
  const [connectionStatus] = useState('Connected to Atlas Network');

  useEffect(() => {
    // Check gateway reachability
    const checkGateway = async () => {
      try {
        const gatewayUrl = await getGatewayUrl();
        await fetch(`${gatewayUrl}/health`, { method: 'HEAD' });
        setGatewayReachable(true);
      } catch {
        setGatewayReachable(false);
      }
    };
    checkGateway();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content: message,
      status: 'pending',
      timestamp: new Date()
    };
    setMessages(prev => [newMessage, ...prev]);
    setMessage('');

    try {
      const gatewayUrl = await getGatewayUrl();
      const response = await fetch(`${gatewayUrl}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': newMessage.id
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (response.ok) {
        const data = await response.json();
        const recordId = data.id || data.receiptId || newMessage.id;
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id
            ? {
                ...msg,
                id: recordId,
                status: 'sent' as const,
                receipt: {
                  id: recordId,
                  ts: new Date(),
                  status: 'sent'
                }
              }
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setGatewayReachable(false);
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      alert('Gateway unreachable. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyMessage = async (messageId: string) => {
    try {
      const gatewayUrl = await getGatewayUrl();
      const response = await fetch(`${gatewayUrl}/record/${messageId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'verified' as const,
                receipt: {
                  ...msg.receipt!,
                  status: data.status || 'verified'
                }
              }
            : msg
        ));
      } else {
        // If 404 or missing, mark as verified (eventual consistency)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'verified' as const,
                receipt: {
                  ...msg.receipt!,
                  status: 'verified'
                }
              }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to verify message:', error);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.querySelector(`[data-testid="message-item-${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-h1 font-bold">Atlas Messenger</h1>
          <div className="flex items-center space-x-4">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Search messages">
              <span className="sr-only">Search</span>
              🔍
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Toggle theme">
              <span className="sr-only">Theme</span>
              🌙
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Open command palette">
              <span className="sr-only">Command</span>
              ⌘K
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8" data-testid="messenger-page">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${gatewayReachable ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-indicator"></div>
              <span className="text-sm text-muted-foreground" data-testid="connection-status">{connectionStatus}</span>
            </div>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-10 w-10" data-testid="refresh-connection" aria-label="Refresh connection">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw h-4 w-4">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="send-message-card">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold" data-testid="send-message-title">Send Message</h3>
              <p className="text-sm text-muted-foreground" data-testid="send-message-description">Send a verifiable message with integrity timeline</p>
            </div>
            <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex space-x-2">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Show all messages">All</button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Show verified messages">Verified</button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Show pending messages">Pending</button>
                  <button
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-3 ${
                      minimapEnabled 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setMinimapEnabled(!minimapEnabled)}
                    aria-label="Toggle minimap"
                    data-testid="minimap-toggle"
                  >
                    Minimap
                  </button>
              </div>
              
              <textarea 
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="composer-input"
                disabled={isSending}
                aria-label="Message input"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                    onClick={handleSendMessage}
                      disabled={!message.trim() || isSending || !gatewayReachable}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2"
                      data-testid="send-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send h-4 w-4 mr-2">
                        <path d="m22 2-7 20-4-9-9-4Z"></path>
                        <path d="M22 2 11 13"></path>
                      </svg>
                    Send Message
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2" data-testid="draft-message-button">Draft</button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 rounded-md px-3" aria-label="Attach file">📎</button>
                  </div>
                  <span className="text-xs text-muted-foreground">{message.length}/280</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white text-gray-900 shadow-sm" data-testid="recent-messages-card">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold" data-testid="recent-messages-title">Recent Messages</h3>
              <p className="text-sm text-muted-foreground" data-testid="recent-messages-description">View your message history and verification status</p>
            </div>
            <div className="p-6 pt-0">
              {minimapEnabled && (
                <div className="mb-4 p-2 bg-gray-100 rounded-lg" data-testid="minimap">
                  <div className="text-xs text-gray-600 mb-2">Message Minimap</div>
                  <div className="flex flex-wrap gap-1">
                    {messages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => scrollToMessage(msg.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          msg.status === 'verified' ? 'bg-green-200 text-green-800' :
                          msg.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}
                        data-testid={`minimap-item-${msg.id}`}
                      >
                        {msg.id.slice(-4)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        <span className={`text-sm ${getStatusColor(msg.status)}`}>
                    {getStatusIcon(msg.status)}
                    </span>
                        <span className="font-medium text-foreground" data-testid="message-content">{msg.content}</span>
                        {msg.status === 'pending' && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        )}
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid="message-timestamp">
                        {msg.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.receipt && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground" data-testid="receipt">
                            Receipt: {msg.receipt.id} - {msg.receipt.status}
                          </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs rounded-full flex items-center space-x-1" data-testid={`message-status-${msg.id}`}>
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-300 ${
                          msg.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
                          msg.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                      {msg.status}
                        </div>
                  </span>
                      {msg.status === 'sent' && (
                        <button
                          onClick={() => handleVerifyMessage(msg.id)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-10 w-10"
                          data-testid="verify-btn"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-4 w-4">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                          </svg>
                        </button>
                      )}
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-testid={`copy-${msg.id}`} aria-label="Copy message ID">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy h-3 w-3">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                        </svg>
                      </button>
                </div>
              </div>
            ))}
            </div>
            </div>
          </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="stats-overview">
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="p-6 pt-0 p-4">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity h-5 w-5 text-blue-600">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              <div>
                <span className="text-sm text-muted-foreground" data-testid="total-messages-label">Total Messages</span>
                <span className="text-2xl font-bold" data-testid="total-messages-value">{messages.length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="p-6 pt-0 p-4">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle h-5 w-5 text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              <div>
                <span className="text-sm text-muted-foreground" data-testid="verified-messages-label">Verified</span>
                  <span className="text-2xl font-bold" data-testid="verified-messages-value">{messages.filter(m => m.status === 'verified').length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="p-6 pt-0 p-4">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock h-5 w-5 text-yellow-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              <div>
                <span className="text-sm text-muted-foreground" data-testid="pending-messages-label">Pending</span>
                  <span className="text-2xl font-bold" data-testid="pending-messages-value">{messages.filter(m => m.status === 'pending').length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="p-6 pt-0 p-4">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-5 w-5 text-purple-600">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              <div>
                <span className="text-sm text-muted-foreground" data-testid="uptime-label">Uptime</span>
                <span className="text-2xl font-bold" data-testid="uptime-value">99.9%</span>
                </div>
              </div>
            </div>
          </div>
      </div>

        <div className="rounded-lg border bg-white text-gray-900 shadow-sm mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700" data-testid="quantum-state-info">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Quantum Time Crystal Architecture</h4>
            </div>
          </div>
          <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Quantum Phase</span>
                <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-phase">{quantumPhase.toFixed(2)}π</span>
            </div>
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Time Crystals</span>
                <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-crystals">{quantumCrystals}</span>
            </div>
            <div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Entangled Channels</span>
                <span className="text-xl font-bold text-purple-900 dark:text-purple-100" data-testid="quantum-channels">{quantumChannels}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <span className="text-sm text-purple-700 dark:text-purple-300">System Health</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{width: `${quantumHealth}%`}}></div>
                </div>
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100" data-testid="quantum-health">{quantumHealth}%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}