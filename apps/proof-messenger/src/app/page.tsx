'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  Send, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  receipt?: Receipt;
  status: 'pending' | 'sent' | 'verified' | 'failed';
  idempotencyKey?: string;
}

interface Receipt {
  hash: string;
  quorum: {
    n: number;
    q: number;
    witnesses: string[];
    skew: number;
  };
  verifyResult: boolean;
  idempotencyOutcome: 'new' | 'deduped';
}

export default function ProofMessengerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<Message[]>([]);
  const [systemHealth] = useState({
    status: 'healthy',
    uptime: 0,
    quorumRate: 99.8,
    avgLatency: 45
  });

  // Simulate offline queue
  useEffect(() => {
    const pendingMessages = messages.filter(m => m.status === 'pending');
    setOfflineQueue(pendingMessages);
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      content: newMessage,
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage('');
    setIsSending(true);

    try {
      // Simulate sending to gateway
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate receipt generation
      const receipt: Receipt = {
        hash: Math.random().toString(36).substr(2, 16),
        quorum: {
          n: 5,
          q: 4,
          witnesses: ['w1', 'w2', 'w3', 'w4'],
          skew: 45
        },
        verifyResult: true,
        idempotencyOutcome: 'new'
      };

      setMessages(prev => prev.map(m => 
        m.id === message.id 
          ? { ...m, status: 'verified', receipt }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === message.id 
          ? { ...m, status: 'failed' }
          : m
      ));
    } finally {
      setIsSending(false);
    }
  };

  const exportEvidence = (message: Message) => {
    if (!message.receipt) return;

    const evidence = {
      messageId: message.id,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      receipt: message.receipt,
      integrityTimeline: {
        sent: message.timestamp.toISOString(),
        witnessed: new Date().toISOString(),
        verified: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-evidence-${message.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Proof Messenger</h1>
        <p className="text-muted-foreground">
          Zero-crypto messaging with multi-witness quorum verification and integrity timeline
        </p>
      </div>

      {/* Health & Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground">Uptime: {systemHealth.uptime}s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Quorum Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.quorumRate}%</div>
            <p className="text-xs text-muted-foreground">4/5 witnesses active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">p95: 89ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">{offlineQueue.length} in queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Message Input */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
          <CardDescription>
            Messages are automatically verified by the witness quorum network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-atlas-600" />
                <span className="text-sm text-muted-foreground">
                  Protected by witness quorum
                </span>
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || isSending}
                className="bg-atlas-600 hover:bg-atlas-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Queue */}
      {offlineQueue.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Offline Queue</CardTitle>
            <CardDescription className="text-yellow-700">
              {offlineQueue.length} messages waiting to be sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineQueue.map((message) => (
                <div key={message.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm truncate">{message.content}</span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Messages</h2>
        {messages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No messages yet. Send your first message above.</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(message.timestamp, 'PPpp')}
                    </p>
                    <p className="text-base">{message.content}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {message.status === 'verified' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {message.status === 'pending' && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {message.status === 'failed' && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Receipt Panel */}
                {message.receipt && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Receipt
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportEvidence(message)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Evidence
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Hash Fingerprint</p>
                        <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                          {message.receipt.hash}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Quorum Status</p>
                        <p className="font-medium">
                          {message.receipt.quorum.q}/{message.receipt.quorum.n} witnesses
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Skew: {message.receipt.quorum.skew}ms
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Witness IDs</p>
                        <div className="flex flex-wrap gap-1">
                          {message.receipt.quorum.witnesses.map((witness) => (
                            <Badge key={witness} variant="outline" className="text-xs">
                              {witness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Verification Result</p>
                        <div className="flex items-center">
                          {message.receipt.verifyResult ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={message.receipt.verifyResult ? 'text-green-700' : 'text-red-700'}>
                            {message.receipt.verifyResult ? 'Verified' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Integrity Timeline */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Integrity Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sent</span>
                          <span>{format(message.timestamp, 'PPpp')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Witnessed</span>
                          <span>{format(new Date(), 'PPpp')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Verified</span>
                          <span>{format(new Date(), 'PPpp')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
