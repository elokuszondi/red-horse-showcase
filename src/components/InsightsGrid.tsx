
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InsightCard from './InsightCard';
import { IncidentInsight, AnalyticsInsight } from '@/services/autoPromptingService';

interface InsightsGridProps {
  insights: (IncidentInsight | AnalyticsInsight)[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  lastUpdated: Date | null;
}

const InsightsGrid: React.FC<InsightsGridProps> = ({
  insights,
  isLoading,
  error,
  onRefresh,
  lastUpdated
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load insights: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="ml-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && insights.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse">
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2 mt-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 mb-6">
        <p className="text-gray-500 mb-4">No insights available</p>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Generate Insights
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <InsightCard
            key={index}
            insight={insight}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        ))}
      </div>
    </div>
  );
};

export default InsightsGrid;
