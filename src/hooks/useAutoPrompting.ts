
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { autoPromptingService, type IncidentInsight, type AnalyticsInsight } from '@/services/autoPromptingService';

type PageType = 'incidents' | 'analytics' | 'knowledge' | 'performance';

interface UseAutoPromptingReturn {
  insights: (IncidentInsight | AnalyticsInsight)[];
  isLoading: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useAutoPrompting = (pageType: PageType): UseAutoPromptingReturn => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<(IncidentInsight | AnalyticsInsight)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateInsights = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      let newInsights: (IncidentInsight | AnalyticsInsight)[] = [];
      
      switch (pageType) {
        case 'incidents':
          newInsights = await autoPromptingService.generateIncidentInsights(user.id);
          break;
        case 'analytics':
          newInsights = await autoPromptingService.generateAnalyticsInsights(user.id);
          break;
        default:
          console.log(`Auto-prompting not implemented for page type: ${pageType}`);
          break;
      }

      setInsights(newInsights);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInsights = async () => {
    if (!user) return;
    
    setIsLoading(true);
    // Clear cache to force fresh data
    autoPromptingService.clearCache(user.id, pageType);
    await generateInsights();
  };

  useEffect(() => {
    if (user && pageType) {
      generateInsights();
    }
  }, [user, pageType]);

  return {
    insights,
    isLoading,
    error,
    refreshInsights,
    lastUpdated
  };
};
