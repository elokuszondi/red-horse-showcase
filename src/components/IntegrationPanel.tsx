
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  description: string;
  created_at: string;
}

interface ApiStatus {
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  last_checked: string;
}

const IntegrationPanel = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'https://trainer.thinktanks.co.za/HEAT/api/odata/businessobject';
  const API_USERNAME = 'ts.group15';
  const API_PASSWORD = 'PWDGroup15';

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      // Create base64 encoded credentials for Basic Auth
      const credentials = btoa(`${API_USERNAME}:${API_PASSWORD}`);
      
      console.log('Attempting to fetch incidents from:', `${API_BASE_URL}/incidents`);
      
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Handle different possible response structures
      const incidentsData = data.value || data.data || data.incidents || [];
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      
      // Set API status based on response
      setApiStatus({
        status: 'healthy',
        response_time: Math.round(responseTime),
        last_checked: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching incidents:', error);
      
      let errorMessage = 'Failed to load incidents. ';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage += 'Network error - please check your internet connection or try again later.';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      setApiStatus({
        status: 'down',
        response_time: 0,
        last_checked: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Refresh incidents every 5 minutes
    const interval = setInterval(fetchIncidents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">HEAT System Status</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* API Status */}
        {apiStatus && (
          <div className="mb-4 p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(apiStatus.status)}
                <span className="font-medium text-gray-900">
                  HEAT API Status: {apiStatus.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Response: {Math.round(apiStatus.response_time)}ms
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Incidents List */}
        {!loading && !error && (
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No incidents reported. All systems operational.</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{incident.title}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md border ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Status: {incident.status}</span>
                    <span>
                      {new Date(incident.created_at).toLocaleDateString()} at{' '}
                      {new Date(incident.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationPanel;
