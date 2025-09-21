import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Puzzle, Download, ExternalLink, Star } from 'lucide-react';

export default function PluginsPage() {
  const plugins = [
    {
      id: 'webhook-notifier',
      name: 'Webhook Notifier',
      description: 'Send notifications to external webhooks when messages are verified',
      category: 'Integration',
      downloads: 1250,
      rating: 4.8,
      status: 'verified'
    },
    {
      id: 'slack-integration',
      name: 'Slack Integration',
      description: 'Post verified messages directly to Slack channels',
      category: 'Communication',
      downloads: 890,
      rating: 4.6,
      status: 'verified'
    },
    {
      id: 'database-logger',
      name: 'Database Logger',
      description: 'Log all message receipts to your preferred database',
      category: 'Storage',
      downloads: 654,
      rating: 4.7,
      status: 'verified'
    },
    {
      id: 'email-alerts',
      name: 'Email Alerts',
      description: 'Get email notifications for failed verifications',
      category: 'Monitoring',
      downloads: 432,
      rating: 4.5,
      status: 'beta'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge variant="success">Verified</Badge>;
      case 'beta': return <Badge variant="warning">Beta</Badge>;
      case 'deprecated': return <Badge variant="danger">Deprecated</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-input bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Plugin Registry</h1>
          <span className="mt-2 text-muted-foreground">
            Extend Atlas functionality with community-built plugins
          </span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Featured Plugins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Featured Plugins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plugins.slice(0, 2).map((plugin) => (
                <Card key={plugin.id} className="border-l-4 border-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl font-semibold">
                        <Puzzle className="h-4 w-4 mr-2" />
                        {plugin.name}
                      </CardTitle>
                      {getStatusBadge(plugin.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span className="mb-4">{plugin.description}</span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{plugin.downloads} downloads</span>
                        <span className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {plugin.rating}
                        </span>
                      </div>
                      <Button size="sm" className="flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        Install
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Plugins */}
        <Card>
          <CardHeader>
            <CardTitle>All Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plugins.map((plugin) => (
                <div key={plugin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Puzzle className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">{plugin.name}</h3>
                        <span className="text-sm text-muted-foreground">{plugin.description}</span>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline">{plugin.category}</Badge>
                          <span className="text-xs text-muted-foreground">{plugin.downloads} downloads</span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {plugin.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(plugin.status)}
                    <Button size="sm" variant="outline">
                      Install
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Plugin */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Plugin</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="mb-4">
              Have you built a useful Atlas plugin? Share it with the community!
            </span>
            <div className="flex space-x-4">
              <Button className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Submit Plugin
              </Button>
              <Button variant="outline" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Plugin Guidelines
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
