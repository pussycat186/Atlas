'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // API Settings
    defaultApiKey: 'sk_test_placeholder_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    retryAttempts: 3,
    timeout: 30000,
    compression: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 3600,
    
    // Display Settings
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
  });

  const handleSave = () => {
    // Save settings logic
    console.log('Settings saved:', settings);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card title="API Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default API Key</label>
              <Input
                value={settings.defaultApiKey}
                onChange={(e) => setSettings({...settings, defaultApiKey: e.target.value})}
                placeholder="Enter API key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Retry Attempts</label>
              <Input
                type="number"
                value={settings.retryAttempts}
                onChange={(e) => setSettings({...settings, retryAttempts: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
              <Input
                type="number"
                value={settings.timeout}
                onChange={(e) => setSettings({...settings, timeout: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.compression}
                onChange={(checked) => setSettings({...settings, compression: checked})}
              />
              <label className="text-sm font-medium">Enable Compression</label>
            </div>
          </div>
        </Card>
        
        <Card title="Security">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.twoFactorAuth}
                onChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
              />
              <label className="text-sm font-medium">Two-Factor Authentication</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (seconds)</label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </Card>
        
        <Card title="Display">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern</option>
                <option value="PST">Pacific</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.notifications}
                onChange={(checked) => setSettings({...settings, notifications: checked})}
              />
              <label className="text-sm font-medium">Enable Notifications</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.autoRefresh}
                onChange={(checked) => setSettings({...settings, autoRefresh: checked})}
              />
              <label className="text-sm font-medium">Auto Refresh</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Refresh Interval (seconds)</label>
              <Input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
