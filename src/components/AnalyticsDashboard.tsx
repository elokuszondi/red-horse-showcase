
import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, RefreshCw, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsEngine, type AnalyticsData } from '@/services/analyticsEngine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [incidentTrends, resolutionMetrics, performanceInsights] = await Promise.all([
        analyticsEngine.generateIncidentTrends(user.id),
        analyticsEngine.generateResolutionMetrics(user.id),
        analyticsEngine.generatePerformanceInsights(user.id)
      ]);

      setAnalytics([incidentTrends, resolutionMetrics, performanceInsights]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      await analyticsEngine.refreshAllAnalytics(user.id);
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderChart = (data: AnalyticsData) => {
    if (!data.data || data.data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No data available</p>
            <p className="text-xs">AI analytics in progress...</p>
          </div>
        </div>
      );
    }

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

    switch (data.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="incidents" stroke={colors[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke={colors[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTime" fill={colors[0]} />
              <Bar dataKey="successRate" fill={colors[1]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="current" stackId="1" stroke={colors[0]} fill={colors[0]} />
              <Area type="monotone" dataKey="target" stackId="2" stroke={colors[1]} fill={colors[1]} />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center">
            <span className="text-gray-500">Chart type not supported</span>
          </div>
        );
    }
  };

  const getIconForChart = (type: string) => {
    switch (type) {
      case 'line': return <TrendingUp className="h-5 w-5" />;
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'area': return <Activity className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please sign in to view analytics dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">AI-powered insights from your knowledge base</p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {analytics.map((data) => (
          <Card key={data.id} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconForChart(data.chartType)}
                  <CardTitle className="text-lg">{data.title}</CardTitle>
                </div>
                <Badge variant={data.confidence > 70 ? 'default' : 'secondary'}>
                  {data.confidence}% confidence
                </Badge>
              </div>
              <CardDescription>{data.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Chart */}
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                renderChart(data)
              )}

              {/* Insights */}
              {data.insights && data.insights.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
                  <ul className="space-y-1">
                    {data.insights.map((insight, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                <Clock className="h-3 w-3" />
                Last updated: {data.lastUpdated.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && analytics.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-96">
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
