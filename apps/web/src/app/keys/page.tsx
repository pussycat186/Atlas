'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  rateLimit: number;
  status: 'active' | 'revoked';
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'atlas_live_sk_1234567890abcdef',
      createdAt: '2024-01-15T10:30:00Z',
      lastUsed: '2024-01-20T14:22:00Z',
      rateLimit: 1000,
      status: 'active',
    },
    {
      id: '2',
      name: 'Development',
      key: 'atlas_test_sk_abcdef1234567890',
      createdAt: '2024-01-10T09:15:00Z',
      lastUsed: '2024-01-19T16:45:00Z',
      rateLimit: 100,
      status: 'active',
    },
    {
      id: '3',
      name: 'Legacy Integration',
      key: 'atlas_live_sk_old1234567890ab',
      createdAt: '2024-01-05T08:00:00Z',
      rateLimit: 500,
      status: 'revoked',
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `atlas_live_sk_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: new Date().toISOString(),
      rateLimit: 1000,
      status: 'active',
    };

    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setShowCreateForm(false);
  };

  const handleRevokeKey = (keyId: string) => {
    setKeys(keys.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' as const } : key
    ));
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // In a real app, you'd show a toast notification
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys for accessing Atlas services
        </p>
      </div>

      {/* Create New Key */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New API Key</CardTitle>
          <CardDescription>
            Generate a new API key for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              Create API Key
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, Development, etc."
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim()}>
                  Create Key
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{key.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      key.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {key.status}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && (
                      <span> • Last used {new Date(key.lastUsed).toLocaleDateString()}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyKey(key.key)}
                  >
                    Copy Key
                  </Button>
                  {key.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={key.key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyKey(key.key)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Rate Limit
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {key.rateLimit} requests/hour
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Usage
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * key.rateLimit)} / {key.rateLimit} this hour
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Guidelines */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">Rate Limits</h4>
            <p className="text-sm text-muted-foreground">
              Each key has a rate limit to prevent abuse. Monitor your usage in the metrics dashboard.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Security</h4>
            <p className="text-sm text-muted-foreground">
              Keep your API keys secure. Never commit them to version control or share them publicly.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Revocation</h4>
            <p className="text-sm text-muted-foreground">
              Revoked keys cannot be restored. Create a new key if you need to restore access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
