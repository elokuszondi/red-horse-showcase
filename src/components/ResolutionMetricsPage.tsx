
import React, { useState, useEffect } from 'react';
import { Clock, Target, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsEngine, type AnalyticsData } from '@/services/analyticsEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResolutionMetricsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResolutionMetrics();
    }
  }, [user]);

  const loadResolutionMetrics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await analyticsEngine.generateResolutionMetrics(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load resolution metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please sign in to view resolution metrics</p>
      </div>
    );
  }

  // Calculate average resolution time
  const avgResolutionTime = analytics?.data ? 
    (analytics.data.reduce((sum: number, item: any) => sum + item.avgTime, 0) / analytics.data.length).toFixed(1) : '0.0';

  // Calculate success rate
  const successRate = analytics?.data ? 
    Math.round(analytics.data.reduce((sum: number, item: any) => sum + item.successRate, 0) / analytics.data.length) : 0;

  // Calculate escalation rate
  const escalationRate = analytics?.data ? 
    Math.round(analytics.data.reduce((sum: number, item: any) => sum + item.escalationRate, 0) / analytics.data.length) : 0;

  // Calculate total volume
  const totalVolume = analytics?.data?.reduce((sum: number, item: any) => sum + item.volume, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="h-6 w-6" />
          Resolution Metrics Dashboard
        </h1>
        <p className="text-gray-600">Performance analysis of incident resolution processes</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{avgResolutionTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary">Target: 4.0h</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary">Target: 95%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escalation Rate</p>
                <p className="text-2xl font-bold">{escalationRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary">Target: &lt;10%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold">{totalVolume}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary">This Month</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Time by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time by Category</CardTitle>
            <CardDescription>How long different types of incidents take to resolve</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : analytics?.data ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Avg Time']} />
                  <Bar dataKey="avgTime" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No resolution time data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rate by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate by Category</CardTitle>
            <CardDescription>Percentage of incidents successfully resolved by category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : analytics?.data ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                  <Bar dataKey="successRate" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No success rate data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Summary</CardTitle>
          <CardDescription>Detailed breakdown of metrics by incident category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : analytics?.data ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Volume</th>
                    <th className="text-right p-2">Avg Time</th>
                    <th className="text-right p-2">Success Rate</th>
                    <th className="text-right p-2">Escalation Rate</th>
                    <th className="text-right p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.data.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.category}</td>
                      <td className="p-2 text-right">{item.volume}</td>
                      <td className="p-2 text-right">{item.avgTime.toFixed(1)}h</td>
                      <td className="p-2 text-right">{item.successRate.toFixed(1)}%</td>
                      <td className="p-2 text-right">{item.escalationRate.toFixed(1)}%</td>
                      <td className="p-2 text-right">
                        <Badge variant={item.successRate > 90 ? 'default' : item.successRate > 80 ? 'secondary' : 'destructive'}>
                          {item.successRate > 90 ? 'Excellent' : item.successRate > 80 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>AI-generated recommendations for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResolutionMetricsPage;
