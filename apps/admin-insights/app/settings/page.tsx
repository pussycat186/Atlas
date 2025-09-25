'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    theme: 'system',
    timezone: 'UTC'
  });

  const handleSave = () => {
    // Mock save functionality
    console.log('Settings saved:', settings);
  };

  const handleReset = () => {
    setSettings({
      notifications: true,
      autoRefresh: true,
      theme: 'system',
      timezone: 'UTC'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-input bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <span className="mt-2 text-muted-foreground">
            Configure system preferences and monitoring settings
          </span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Notifications</span>
                <span className="text-sm text-muted-foreground">Receive alerts for system events</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="h-4 w-4"
                aria-label="Enable notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Auto Refresh</span>
                <span className="text-sm text-muted-foreground">Automatically refresh dashboard data</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({...settings, autoRefresh: e.target.checked})}
                className="h-4 w-4"
                aria-label="Enable auto refresh"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Theme</span>
                <span className="text-sm text-muted-foreground">Choose your preferred theme</span>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                className="px-3 py-1 border rounded"
                aria-label="Select theme"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Timezone</span>
                <span className="text-sm text-muted-foreground">Display times in this timezone</span>
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="px-3 py-1 border rounded"
                aria-label="Select timezone"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">GMT</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-medium">Health Check Interval</span>
                <select className="w-full px-3 py-2 border rounded" aria-label="Select health check interval">
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <span className="font-medium">Alert Threshold</span>
                <select className="w-full px-3 py-2 border rounded" aria-label="Select alert threshold">
                  <option value="95">95% uptime</option>
                  <option value="99">99% uptime</option>
                  <option value="99.9">99.9% uptime</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Button onClick={handleSave} className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
