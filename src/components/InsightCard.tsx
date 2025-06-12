
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';
import { IncidentInsight, AnalyticsInsight } from '@/services/autoPromptingService';

interface InsightCardProps {
  insight: IncidentInsight | AnalyticsInsight;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onRefresh, isRefreshing = false }) => {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
      case 'positive':
        return 'text-green-600';
      case 'down':
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isIncidentInsight = (insight: IncidentInsight | AnalyticsInsight): insight is IncidentInsight => {
    return 'type' in insight;
  };

  const renderData = () => {
    if (isIncidentInsight(insight)) {
      return insight.data.map((item, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-600">{item.label}</span>
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
              {item.value}
            </span>
            {getTrendIcon(item.trend)}
          </div>
        </div>
      ));
    } else {
      return insight.key_metrics.map((metric, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-600">{metric.metric}</span>
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
              {metric.current_value} {metric.unit}
            </span>
            {getTrendIcon(metric.trend)}
          </div>
        </div>
      ));
    }
  };

  const getTitle = () => {
    return isIncidentInsight(insight) ? insight.title : insight.title;
  };

  const getDescription = () => {
    return isIncidentInsight(insight) ? insight.summary : insight.executive_summary;
  };

  const getActionableInsight = () => {
    if (isIncidentInsight(insight)) {
      return insight.actionable_insight;
    } else {
      return insight.insights[0] || insight.recommendations[0] || '';
    }
  };

  const getTimestamp = () => {
    if (isIncidentInsight(insight)) {
      return new Date(insight.timestamp).toLocaleString();
    } else {
      return new Date().toLocaleString(); // Analytics insights don't have timestamp yet
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{getTitle()}</CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription className="text-sm">
          {getDescription()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics/Data */}
        <div className="space-y-2">
          {renderData()}
        </div>

        {/* Actionable Insight */}
        {getActionableInsight() && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Next Action</h4>
            <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              {getActionableInsight()}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <Clock className="h-3 w-3" />
          Last updated: {getTimestamp()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
