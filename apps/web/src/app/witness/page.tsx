'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface Witness {
  id: string;
  name: string;
  status: 'active' | 'degraded' | 'offline';
  lastSeen: string;
  latency: number;
  region: string;
  uptime: number;
  messagesProcessed: number;
}

interface QuorumEvent {
  id: string;
  messageId: string;
  timestamp: string;
  witnesses: string[];
  result: 'success' | 'conflict' | 'timeout';
  latency: number;
}

export default function WitnessPage() {
  const [witnesses, setWitnesses] = useState<Witness[]>([
    {
      id: 'w1',
      name: 'Witness Node 1',
      status: 'active',
      lastSeen: new Date().toISOString(),
      latency: 23,
      region: 'us-east-1',
      uptime: 99.9,
      messagesProcessed: 15420,
    },
    {
      id: 'w2',
      name: 'Witness Node 2',
      status: 'active',
      lastSeen: new Date().toISOString(),
      latency: 31,
      region: 'us-west-2',
      uptime: 99.8,
      messagesProcessed: 15230,
    },
    {
      id: 'w3',
      name: 'Witness Node 3',
      status: 'degraded',
      lastSeen: new Date(Date.now() - 30000).toISOString(),
      latency: 156,
      region: 'eu-west-1',
      uptime: 98.5,
      messagesProcessed: 14890,
    },
    {
      id: 'w4',
      name: 'Witness Node 4',
      status: 'active',
      lastSeen: new Date().toISOString(),
      latency: 28,
      region: 'ap-southeast-1',
      uptime: 99.7,
      messagesProcessed: 15120,
    },
    {
      id: 'w5',
      name: 'Witness Node 5',
      status: 'offline',
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      latency: 0,
      region: 'ap-northeast-1',
      uptime: 95.2,
      messagesProcessed: 14200,
    },
  ]);

  const [recentEvents, setRecentEvents] = useState<QuorumEvent[]>([
    {
      id: '1',
      messageId: 'msg_123456',
      timestamp: new Date().toISOString(),
      witnesses: ['w1', 'w2', 'w3', 'w4'],
      result: 'success',
      latency: 45,
    },
    {
      id: '2',
      messageId: 'msg_123455',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      witnesses: ['w1', 'w2', 'w4'],
      result: 'success',
      latency: 38,
    },
    {
      id: '3',
      messageId: 'msg_123454',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      witnesses: ['w1', 'w2', 'w3', 'w4'],
      result: 'conflict',
      latency: 67,
    },
  ]);

  const [quorumRate, setQuorumRate] = useState(99.8);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setWitnesses(prev => prev.map(w => ({
        ...w,
        latency: Math.floor(Math.random() * 50) + 20,
        lastSeen: new Date().toISOString(),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'degraded': return 'Degraded';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const activeWitnesses = witnesses.filter(w => w.status === 'active').length;
  const totalWitnesses = witnesses.length;
  const quorumThreshold = 4;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Witness Status</h1>
        <p className="text-muted-foreground">
          Monitor witness node health and quorum verification
        </p>
      </div>

      {/* Quorum Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quorum Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quorumRate}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Witnesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWitnesses}/{totalWitnesses}</div>
            <p className="text-xs text-muted-foreground">
              {activeWitnesses >= quorumThreshold ? 'Quorum OK' : 'Quorum at risk'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(witnesses.reduce((acc, w) => acc + w.latency, 0) / activeWitnesses)}ms
            </div>
            <p className="text-xs text-muted-foreground">Across active nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages/Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Witness Nodes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Witness Nodes</CardTitle>
          <CardDescription>
            Individual witness node status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {witnesses.map((witness) => (
              <div key={witness.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(witness.status)}`}></div>
                    <div>
                      <h3 className="font-medium">{witness.name}</h3>
                      <p className="text-sm text-muted-foreground">{witness.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{getStatusText(witness.status)}</div>
                    <div className="text-xs text-muted-foreground">
                      {witness.latency}ms latency
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Uptime</div>
                    <div className="font-medium">{witness.uptime}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Messages</div>
                    <div className="font-medium">{witness.messagesProcessed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Seen</div>
                    <div className="font-medium">
                      {new Date(witness.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Region</div>
                    <div className="font-medium">{witness.region}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Quorum Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quorum Events</CardTitle>
          <CardDescription>
            Latest message verification events and conflicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.result === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : event.result === 'conflict'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.result}
                    </span>
                    <span className="text-sm font-medium">{event.messageId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Witnesses: {event.witnesses.join(', ')}</span>
                  <span>Latency: {event.latency}ms</span>
                  <span>Quorum: {event.witnesses.length}/5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
