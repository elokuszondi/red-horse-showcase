
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdvancedIncidentAnalyticsDashboard = () => {
  // Sample data based on the structure from the uploaded file
  const [sampleData] = useState([
    {
      Category: "Reporting",
      CauseCode: "Failure",
      ClosedBy: "InternalServices",
      ClosedDateTime: "2022-12-13T10:12:05+02:00",
      CreatedBy: "InternalServices",
      CreatedDateTime: "2022-11-18T08:37:48+02:00",
      ProfileFullName: "Vuyo Ntshongwana",
      RecId: "00141380EBE34E70A95718B64CBDD951",
      Resolution: "Reports were restored (Automatically Closed)",
      Source: "Email",
      ResolvedDateTime: "2022-12-08T10:12:03+02:00",
      ResolvedBy: "Princess.Mashele"
    },
    {
      Category: "Infrastructure",
      CauseCode: "Converted to Service Request",
      ClosedBy: "Princess.Mashele",
      ClosedDateTime: "2023-05-25T09:58:33+02:00",
      CreatedBy: "InternalServices",
      CreatedDateTime: "2023-04-19T10:00:19+02:00",
      ProfileFullName: "Vincent Rabie",
      RecId: "001AC0E337974327951E39ACC6AD08C1",
      Resolution: "Converted to Service Request",
      Source: "Email",
      ResolvedDateTime: null,
      ResolvedBy: null
    },
    {
      Category: "Support",
      CauseCode: "Duplicate",
      ClosedBy: "ruwayne.ludick",
      ClosedDateTime: "2016-04-25T10:56:00+02:00",
      CreatedBy: "Email Service",
      CreatedDateTime: "2016-04-12T13:00:21+02:00",
      ProfileFullName: "Candice Shellys",
      RecId: "00258D8F79174B02BEB947186CF603C1",
      Resolution: "Duplicate",
      Source: "Email",
      ResolvedDateTime: null,
      ResolvedBy: null
    },
    {
      Category: "Security",
      CauseCode: "Access Denied",
      ClosedBy: "SecurityTeam",
      ClosedDateTime: "2023-06-15T14:30:00+02:00",
      CreatedBy: "AutoMonitor",
      CreatedDateTime: "2023-06-15T09:15:00+02:00",
      ProfileFullName: "John Smith",
      RecId: "003B5D8F79174B02BEB947186CF603C2",
      Resolution: "Access permissions updated",
      Source: "Portal",
      ResolvedDateTime: "2023-06-15T14:25:00+02:00",
      ResolvedBy: "SecurityTeam"
    },
    {
      Category: "Network",
      CauseCode: "Configuration Error",
      ClosedBy: "NetworkTeam",
      ClosedDateTime: "2023-07-20T16:45:00+02:00",
      CreatedBy: "MonitoringSystem",
      CreatedDateTime: "2023-07-20T08:30:00+02:00",
      ProfileFullName: "Sarah Johnson",
      RecId: "004C6E9F79174B02BEB947186CF603C3",
      Resolution: "Network configuration corrected",
      Source: "API",
      ResolvedDateTime: "2023-07-20T16:40:00+02:00",
      ResolvedBy: "NetworkTeam"
    }
  ]);

  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Data processing and analytics calculations
  const analyticsData = useMemo(() => {
    // Calculate resolution times
    const processedData = sampleData.map(incident => {
      const created = new Date(incident.CreatedDateTime);
      const resolved = incident.ResolvedDateTime ? new Date(incident.ResolvedDateTime) : null;
      const closed = new Date(incident.ClosedDateTime);
      
      const resolutionTime = resolved ? (resolved - created) / (1000 * 60 * 60) : null; // hours
      const closureTime = (closed - created) / (1000 * 60 * 60); // hours
      
      return {
        ...incident,
        resolutionTime,
        closureTime,
        month: created.toISOString().substring(0, 7),
        year: created.getFullYear(),
        isResolved: !!resolved,
        slaStatus: resolutionTime && resolutionTime <= 24 ? 'In SLA' : 'Out of SLA'
      };
    });

    // Category distribution
    const categoryData = processedData.reduce((acc, incident) => {
      acc[incident.Category] = (acc[incident.Category] || 0) + 1;
      return acc;
    }, {});

    const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / processedData.length) * 100).toFixed(1)
    }));

    // Cause code analysis
    const causeCodeData = processedData.reduce((acc, incident) => {
      acc[incident.CauseCode] = (acc[incident.CauseCode] || 0) + 1;
      return acc;
    }, {});

    const causeCodeChartData = Object.entries(causeCodeData).map(([code, count]) => ({
      code,
      count
    }));

    // Monthly trends
    const monthlyData = processedData.reduce((acc, incident) => {
      const month = incident.month;
      if (!acc[month]) {
        acc[month] = { month, created: 0, resolved: 0, avgResolutionTime: 0 };
      }
      acc[month].created += 1;
      if (incident.isResolved) {
        acc[month].resolved += 1;
      }
      return acc;
    }, {});

    const monthlyChartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Source analysis
    const sourceData = processedData.reduce((acc, incident) => {
      acc[incident.Source] = (acc[incident.Source] || 0) + 1;
      return acc;
    }, {});

    const sourceChartData = Object.entries(sourceData).map(([source, count]) => ({
      source,
      count
    }));

    // SLA Analysis
    const slaData = processedData.filter(i => i.resolutionTime !== null);
    const inSLA = slaData.filter(i => i.slaStatus === 'In SLA').length;
    const outSLA = slaData.filter(i => i.slaStatus === 'Out of SLA').length;

    const slaChartData = [
      { status: 'In SLA', count: inSLA, color: '#10B981' },
      { status: 'Out of SLA', count: outSLA, color: '#EF4444' }
    ];

    // Resolution time distribution
    const resolutionTimeData = processedData
      .filter(i => i.resolutionTime !== null)
      .map(i => ({
        incident: i.RecId.substring(0, 8),
        resolutionTime: parseFloat(i.resolutionTime.toFixed(2)),
        category: i.Category
      }));

    return {
      processed: processedData,
      categoryData: categoryChartData,
      causeCodeData: causeCodeChartData,
      monthlyData: monthlyChartData,
      sourceData: sourceChartData,
      slaData: slaChartData,
      resolutionTimeData,
      kpis: {
        totalIncidents: processedData.length,
        resolvedIncidents: processedData.filter(i => i.isResolved).length,
        avgResolutionTime: resolutionTimeData.length > 0 
          ? (resolutionTimeData.reduce((sum, i) => sum + i.resolutionTime, 0) / resolutionTimeData.length).toFixed(1)
          : 'N/A',
        slaCompliance: slaData.length > 0 ? ((inSLA / slaData.length) * 100).toFixed(1) : 'N/A'
      }
    };
  }, [sampleData, selectedTimeRange, selectedCategory]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Incident Analytics Dashboard</h1>
            <p className="text-muted-foreground">Advanced analytics for incident management and performance monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Vector Storage Status */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Vector Storage Connected</p>
                <p className="text-green-600 text-sm">Azure Vector Store: vs_3xqhyrafPByqzpPyxd5e4Qsd | Status: Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Incidents</p>
                <p className="text-2xl font-bold">{analyticsData.kpis.totalIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Resolved Incidents</p>
                <p className="text-2xl font-bold">{analyticsData.kpis.resolvedIncidents}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{analyticsData.kpis.avgResolutionTime}h</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">SLA Compliance</p>
                <p className="text-2xl font-bold">{analyticsData.kpis.slaCompliance}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cause Code Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Root Cause Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.causeCodeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Incident Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="created" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.slaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.slaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Time Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resolution Time Distribution</CardTitle>
          <CardDescription>Resolution times across different incident categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={analyticsData.resolutionTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="category" />
              <YAxis type="number" dataKey="resolutionTime" />
              <Tooltip />
              <Scatter dataKey="resolutionTime" fill="#8B5CF6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedIncidentAnalyticsDashboard;
