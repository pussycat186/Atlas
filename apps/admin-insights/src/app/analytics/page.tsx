import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Heading, Text } from '@atlas/design-system';
import { TrendingUp, Users, MessageSquare, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const analytics = {
    totalMessages: 12543,
    activeUsers: 892,
    avgResponseTime: '45ms',
    successRate: '99.8%',
    trends: [
      { metric: 'Messages Sent', value: '+12.5%', trend: 'up' },
      { metric: 'Active Users', value: '+8.3%', trend: 'up' },
      { metric: 'Response Time', value: '-5.2%', trend: 'down' },
      { metric: 'Error Rate', value: '-0.1%', trend: 'down' }
    ]
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗' : '↘';
  };

  const getTrendColor = (trend: string, metric: string) => {
    if (metric === 'Response Time' || metric === 'Error Rate') {
      return trend === 'down' ? 'text-green-600' : 'text-red-600';
    }
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <Heading level={1} className="text-h1 font-bold">Analytics Dashboard</Heading>
          <Text className="mt-2 text-muted">
            Performance metrics and usage analytics for Atlas platform
          </Text>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</Text>
              <Text className="text-xs text-muted">All time</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-bold">{analytics.activeUsers}</Text>
              <Text className="text-xs text-muted">Last 30 days</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-bold">{analytics.avgResponseTime}</Text>
              <Text className="text-xs text-muted">Last 24 hours</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-bold">{analytics.successRate}</Text>
              <Text className="text-xs text-muted">Last 7 days</Text>
            </CardContent>
          </Card>
        </div>

        {/* Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.trends.map((trend) => (
                <div key={trend.metric} className="flex items-center justify-between p-3 border rounded-lg">
                  <Text className="font-medium">{trend.metric}</Text>
                  <div className="flex items-center space-x-2">
                    <Text className={`text-sm font-semibold ${getTrendColor(trend.trend, trend.metric)}`}>
                      {getTrendIcon(trend.trend)} {trend.value}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Text className="text-muted">Chart visualization would be rendered here</Text>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
