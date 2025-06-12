
import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsEngine, type AnalyticsData } from '@/services/analyticsEngine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAutoPrompting } from '@/hooks/useAutoPrompting';
import InsightsGrid from './InsightsGrid';

const IncidentTrendsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');
  
  // Auto-prompting hook
  const { 
    insights, 
    isLoading: insightsLoading, 
    error: insightsError, 
    refreshInsights, 
    lastUpdated 
  } = useAutoPrompting('incidents');

  useEffect(() => {
    if (user) {
      loadIncidentTrends();
    }
  }, [user]);

  const loadIncidentTrends = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await analyticsEngine.generateIncidentTrends(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load incident trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryData = analytics?.data ? 
    analytics.data.reduce((acc: any[], item: any) => {
      const existing = acc.find(cat => cat.category === item.category);
      if (existing) {
        existing.count += item.incidents;
      } else {
        acc.push({ category: item.category, count: item.incidents });
      }
      return acc;
    }, []) : [];

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please sign in to view incident trends</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Incident Trends Analysis
          </h1>
          <p className="text-gray-600">AI-powered analysis of incident patterns and trends</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="24months">Last 24 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Auto-Generated Insights */}
      <InsightsGrid
        insights={insights}
        isLoading={insightsLoading}
        error={insightsError}
        onRefresh={refreshInsights}
        lastUpdated={lastUpdated}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold">
                  {analytics?.data?.reduce((sum: number, item: any) => sum + item.incidents, 0) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold">
                  {analytics?.data ? 
                    Math.round((analytics.data.reduce((sum: number, item: any) => sum + item.resolved, 0) / 
                               analytics.data.reduce((sum: number, item: any) => sum + item.incidents, 0)) * 100) : 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Incidents</p>
                <p className="text-2xl font-bold">
                  {analytics?.data?.reduce((sum: number, item: any) => sum + (item.critical || 0), 0) || 0}
                </p>
              </div>
              <Filter className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Monthly</p>
                <p className="text-2xl font-bold">
                  {analytics?.data ? 
                    Math.round(analytics.data.reduce((sum: number, item: any) => sum + item.incidents, 0) / analytics.data.length) : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Incident Trends</CardTitle>
            <CardDescription>Incident volumes and resolution rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : analytics?.data ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} name="Incidents" />
                  <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Incidents by Category</CardTitle>
            <CardDescription>Distribution of incidents across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
            <CardDescription>Key findings from trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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

export default IncidentTrendsPage;
