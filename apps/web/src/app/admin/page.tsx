'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Activity, 
  Server, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  Network,
  Settings
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1247,
    activeSessions: 89,
    totalMessages: 45678,
    errorRate: 0.2,
    uptime: '99.9%',
    lastBackup: '2024-01-01T00:00:00Z',
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'user_login',
      user: 'john.doe@example.com',
      timestamp: '2024-01-01T10:30:00Z',
      status: 'success',
    },
    {
      id: 2,
      type: 'api_key_created',
      user: 'jane.smith@example.com',
      timestamp: '2024-01-01T10:25:00Z',
      status: 'success',
    },
    {
      id: 3,
      type: 'witness_failure',
      user: 'system',
      timestamp: '2024-01-01T10:20:00Z',
      status: 'error',
    },
    {
      id: 4,
      type: 'quorum_achieved',
      user: 'system',
      timestamp: '2024-01-01T10:15:00Z',
      status: 'success',
    },
  ]);

  const [witnessNodes, setWitnessNodes] = useState([
    { id: 'w1', status: 'healthy', region: 'us-east-1', lastSeen: '2024-01-01T10:30:00Z', attestations: 12345 },
    { id: 'w2', status: 'healthy', region: 'us-west-2', lastSeen: '2024-01-01T10:30:00Z', attestations: 12340 },
    { id: 'w3', status: 'degraded', region: 'eu-west-1', lastSeen: '2024-01-01T10:25:00Z', attestations: 12300 },
    { id: 'w4', status: 'healthy', region: 'ap-southeast-2', lastSeen: '2024-01-01T10:30:00Z', attestations: 12350 },
    { id: 'w5', status: 'offline', region: 'us-east-1', lastSeen: '2024-01-01T09:45:00Z', attestations: 0 },
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'witnesses', label: 'Witnesses', icon: Server },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Settings },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      healthy: 'default',
      error: 'destructive',
      offline: 'destructive',
      degraded: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System administration and monitoring (Demo Mode - Read Only)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              DEMO MODE
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+8% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.uptime}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="text-sm font-medium">
                          {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Witness Network Status</CardTitle>
                <CardDescription>Current witness node health and quorum</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {witnessNodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(node.status)}
                        <div>
                          <p className="text-sm font-medium">{node.id.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{node.region}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{node.attestations.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">attestations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Current resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disk Usage</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Input placeholder="Search users..." className="w-64" />
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button disabled>
                    <Users className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  User management features are disabled in demo mode
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Witnesses Tab */}
      {activeTab === 'witnesses' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Witness Node Management</CardTitle>
              <CardDescription>Monitor and manage witness nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {witnessNodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(node.status)}
                      <div>
                        <h3 className="font-medium">{node.id.toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">{node.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{node.attestations.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">attestations</p>
                      </div>
                      {getStatusBadge(node.status)}
                      <Button variant="outline" size="sm" disabled>
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>Monitor security events and access patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <p className="text-sm text-muted-foreground">Security Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>System settings and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Database Status</h4>
                    <p className="text-sm text-muted-foreground">Primary database connection</p>
                  </div>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Backup Status</h4>
                    <p className="text-sm text-muted-foreground">Last backup: {new Date(systemStats.lastBackup).toLocaleString()}</p>
                  </div>
                  <Badge variant="default">Up to Date</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Network Status</h4>
                    <p className="text-sm text-muted-foreground">All network interfaces operational</p>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
