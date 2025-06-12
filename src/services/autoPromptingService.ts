
import { ThinkTankAIService } from './thinkTankAI';
import { analyticsEngine } from './analyticsEngine';
import { supabase } from '@/integrations/supabase/client';

export interface IncidentInsight {
  type: 'common_incidents' | 'last_resolved' | 'best_practices' | 'recurring_issues' | 'resolution_metrics';
  title: string;
  summary: string;
  data: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  actionable_insight: string;
  source_references: string[];
  timestamp: string;
}

export interface AnalyticsInsight {
  category: 'performance' | 'incidents' | 'knowledge_base' | 'user_engagement' | 'anomalies';
  title: string;
  executive_summary: string;
  key_metrics: Array<{
    metric: string;
    current_value: number | string;
    previous_value?: number | string;
    unit: string;
    trend: 'positive' | 'negative' | 'neutral';
    change_percentage?: number;
  }>;
  insights: string[];
  recommendations: string[];
  charts_data: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'gauge';
    data: any[];
    config: any;
  };
  source_references: string[];
}

export interface CachedInsights {
  insights: any[];
  timestamp: number;
  expiresAt: number;
}

class AutoPromptingService {
  private cache = new Map<string, CachedInsights>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private getCacheKey(userId: string, pageType: string): string {
    return `${userId}-${pageType}`;
  }

  private isCacheValid(cached: CachedInsights): boolean {
    return Date.now() < cached.expiresAt;
  }

  private async queryAI(prompt: string, userId: string): Promise<any> {
    try {
      const response = await ThinkTankAIService.sendMessage(prompt, userId);
      return this.parseAIResponse(response.response);
    } catch (error) {
      console.error('Auto-prompting AI query failed:', error);
      return null;
    }
  }

  private parseAIResponse(response: string): any {
    try {
      // Extract structured data from AI response
      const lines = response.split('\n').filter(line => line.trim());
      const parsedData: any = {
        summary: '',
        metrics: [],
        insights: [],
        recommendations: [],
        sources: []
      };

      let currentSection = '';
      
      for (const line of lines) {
        if (line.includes('EXECUTIVE SUMMARY')) {
          currentSection = 'summary';
          continue;
        } else if (line.includes('KEY METRICS')) {
          currentSection = 'metrics';
          continue;
        } else if (line.includes('ACTIONABLE INSIGHTS')) {
          currentSection = 'insights';
          continue;
        } else if (line.includes('SOURCE REFERENCES')) {
          currentSection = 'sources';
          continue;
        }

        if (line.trim() && !line.includes('**')) {
          switch (currentSection) {
            case 'summary':
              parsedData.summary += line.trim() + ' ';
              break;
            case 'metrics':
              if (line.startsWith('•') || line.startsWith('-')) {
                parsedData.metrics.push(line.substring(1).trim());
              }
              break;
            case 'insights':
              if (line.match(/^\d+\./)) {
                parsedData.insights.push(line.substring(line.indexOf('.') + 1).trim());
              }
              break;
            case 'sources':
              if (line.startsWith('•') || line.startsWith('-')) {
                parsedData.sources.push(line.substring(1).trim());
              }
              break;
          }
        }
      }

      return parsedData;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { summary: response, metrics: [], insights: [], recommendations: [], sources: [] };
    }
  }

  async generateIncidentInsights(userId: string): Promise<IncidentInsight[]> {
    const cacheKey = this.getCacheKey(userId, 'incidents');
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached.insights;
    }

    const prompts = [
      {
        type: 'common_incidents' as const,
        prompt: `Analyze incident data and provide: What are the 3 most common incident types this week with their frequency? Format your response with:

**EXECUTIVE SUMMARY** (max 3 sentences):
[Brief overview of incident patterns]

**KEY METRICS** (bulleted list):
• Most common incident: [type] ([frequency])
• Second most common: [type] ([frequency])  
• Third most common: [type] ([frequency])

**ACTIONABLE INSIGHTS** (what to do next):
1. [Immediate preventive action]
2. [Process improvement recommendation]
3. [Long-term strategy consideration]

**SOURCE REFERENCES**:
• Incident tracking data
• Resolution history logs`
      },
      {
        type: 'last_resolved' as const,
        prompt: `What was the last resolved incident, when was it resolved, and what was the solution? Use this exact format:

**EXECUTIVE SUMMARY** (max 3 sentences):
[Brief description of the resolved incident]

**KEY METRICS** (bulleted list):
• Incident type: [category]
• Resolution time: [duration] 
• Resolution method: [approach used]

**ACTIONABLE INSIGHTS** (what to do next):
1. [Apply similar solution to pending incidents]
2. [Update documentation based on this resolution]
3. [Prevent similar incidents in future]

**SOURCE REFERENCES**:
• Recent incident resolution logs
• Support team activities`
      },
      {
        type: 'best_practices' as const,
        prompt: `List current best practices for incident resolution based on recent successful resolutions. Format exactly as:

**EXECUTIVE SUMMARY** (max 3 sentences):
[Overview of current best practices effectiveness]

**KEY METRICS** (bulleted list):
• Practice 1: [method] (↑ effectiveness rating)
• Practice 2: [method] (→ standard procedure)
• Practice 3: [method] (↓ needs improvement)

**ACTIONABLE INSIGHTS** (what to do next):
1. [Implement most effective practice widely]
2. [Standardize successful resolution patterns]
3. [Train team on proven methodologies]

**SOURCE REFERENCES**:
• Successful resolution case studies
• Team feedback and performance data`
      }
    ];

    const insights: IncidentInsight[] = [];

    for (const promptConfig of prompts) {
      try {
        const result = await this.queryAI(promptConfig.prompt, userId);
        if (result) {
          insights.push({
            type: promptConfig.type,
            title: this.getTitleForType(promptConfig.type),
            summary: result.summary || '',
            data: this.extractDataFromMetrics(result.metrics || []),
            actionable_insight: result.insights?.[0] || '',
            source_references: result.sources || [],
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Failed to generate ${promptConfig.type} insight:`, error);
      }
    }

    // Cache the results
    this.cache.set(cacheKey, {
      insights,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });

    return insights;
  }

  async generateAnalyticsInsights(userId: string): Promise<AnalyticsInsight[]> {
    const cacheKey = this.getCacheKey(userId, 'analytics');
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached.insights;
    }

    const prompts = [
      {
        category: 'performance' as const,
        prompt: `Generate a system performance summary for the last 7 days including uptime, response times, and critical alerts. Use this format:

**EXECUTIVE SUMMARY** (max 3 sentences):
[System performance overview for the week]

**KEY METRICS** (bulleted list):
• System uptime: [percentage] (↑ improved/→ stable/↓ degraded)
• Average response time: [ms] (↑ faster/→ stable/↓ slower)
• Critical alerts: [count] (↑ more/→ same/↓ fewer)

**ACTIONABLE INSIGHTS** (what to do next):
1. [Address any performance issues]
2. [Optimize slow response areas]
3. [Prevent future critical alerts]

**SOURCE REFERENCES**:
• System monitoring logs
• Performance analytics data`
      },
      {
        category: 'incidents' as const,
        prompt: `Provide incident volume analysis: total incidents, by category, resolution status. Format as:

**EXECUTIVE SUMMARY** (max 3 sentences):
[Current incident landscape summary]

**KEY METRICS** (bulleted list):
• Total incidents: [count] (↑ increase/→ stable/↓ decrease vs last week)
• Open incidents: [count] ([category breakdown])
• Resolution rate: [percentage] (↑ improved/→ stable/↓ declined)

**ACTIONABLE INSIGHTS** (what to do next):
1. [Focus on highest volume category]
2. [Improve resolution processes]
3. [Prevent incident recurrence]

**SOURCE REFERENCES**:
• Incident tracking database
• Resolution analytics`
      }
    ];

    const insights: AnalyticsInsight[] = [];

    for (const promptConfig of prompts) {
      try {
        const result = await this.queryAI(promptConfig.prompt, userId);
        if (result) {
          insights.push({
            category: promptConfig.category,
            title: this.getTitleForCategory(promptConfig.category),
            executive_summary: result.summary || '',
            key_metrics: this.parseMetricsForAnalytics(result.metrics || []),
            insights: result.insights || [],
            recommendations: result.recommendations || [],
            charts_data: {
              type: 'line',
              data: [],
              config: {}
            },
            source_references: result.sources || []
          });
        }
      } catch (error) {
        console.error(`Failed to generate ${promptConfig.category} insight:`, error);
      }
    }

    // Cache the results
    this.cache.set(cacheKey, {
      insights,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });

    return insights;
  }

  private getTitleForType(type: string): string {
    const titles = {
      'common_incidents': 'Most Common Incidents',
      'last_resolved': 'Recent Resolution',
      'best_practices': 'Best Practices',
      'recurring_issues': 'Recurring Issues',
      'resolution_metrics': 'Resolution Metrics'
    };
    return titles[type as keyof typeof titles] || type;
  }

  private getTitleForCategory(category: string): string {
    const titles = {
      'performance': 'System Performance',
      'incidents': 'Incident Analysis',
      'knowledge_base': 'Knowledge Base Usage',
      'user_engagement': 'User Engagement',
      'anomalies': 'System Anomalies'
    };
    return titles[category as keyof typeof titles] || category;
  }

  private extractDataFromMetrics(metrics: string[]): Array<{label: string; value: string | number; trend?: 'up' | 'down' | 'stable'}> {
    return metrics.map(metric => {
      const [label, ...valueParts] = metric.split(':');
      const valueStr = valueParts.join(':').trim();
      
      let trend: 'up' | 'down' | 'stable' | undefined;
      if (valueStr.includes('↑')) trend = 'up';
      else if (valueStr.includes('↓')) trend = 'down';
      else if (valueStr.includes('→')) trend = 'stable';

      return {
        label: label.trim(),
        value: valueStr.replace(/[↑↓→]/g, '').trim(),
        trend
      };
    });
  }

  private parseMetricsForAnalytics(metrics: string[]): Array<{
    metric: string;
    current_value: number | string;
    unit: string;
    trend: 'positive' | 'negative' | 'neutral';
  }> {
    return metrics.map(metric => {
      const [label, ...valueParts] = metric.split(':');
      const valueStr = valueParts.join(':').trim();
      
      let trend: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (valueStr.includes('↑')) trend = 'positive';
      else if (valueStr.includes('↓')) trend = 'negative';

      return {
        metric: label.trim(),
        current_value: valueStr.replace(/[↑↓→]/g, '').trim(),
        unit: '',
        trend
      };
    });
  }

  clearCache(userId?: string, pageType?: string): void {
    if (userId && pageType) {
      this.cache.delete(this.getCacheKey(userId, pageType));
    } else {
      this.cache.clear();
    }
  }
}

export const autoPromptingService = new AutoPromptingService();
