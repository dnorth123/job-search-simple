import { supabase, TABLES } from './supabase';
import { getQueueStatus } from './linkedinQueue';
import { getCacheMetrics } from './linkedinCache';

interface LinkedInMetrics {
  searchMetrics: SearchMetrics;
  userBehavior: UserBehaviorMetrics;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  system: SystemMetrics;
}

interface SearchMetrics {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  averageResultsPerSearch: number;
  searchesByTimeOfDay: Record<string, number>;
  topSearchTerms: Array<{ term: string; count: number; avgConfidence: number }>;
  searchSuccessRate: number;
}

interface UserBehaviorMetrics {
  autoSelections: number;
  manualEntries: number;
  skippedSearches: number;
  averageSelectionTime: number;
  preferredConfidenceRange: string;
  retryRate: number;
  conversionRate: number; // Searches that led to selection
}

interface PerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  queueLength: number;
  queueProcessingTime: number;
  apiSuccessRate: number;
  errorRate: number;
  slowRequestCount: number; // Requests > 3 seconds
}

interface QualityMetrics {
  averageConfidenceScore: number;
  highConfidenceSelections: number; // > 80%
  mediumConfidenceSelections: number; // 60-80%
  lowConfidenceSelections: number; // < 60%
  manualOverrideRate: number;
  falsePositiveRate: number;
}

interface SystemMetrics {
  dailyApiUsage: number;
  monthlyApiUsage: number;
  remainingQuota: number;
  rateLimitHits: number;
  systemErrors: number;
  uptimePercentage: number;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface MetricsFilter {
  userId?: string;
  timeRange?: TimeRange;
  companyName?: string;
  confidenceRange?: [number, number];
}

export class LinkedInMetrics {
  /**
   * Track a search event
   */
  static async trackSearch(
    companyName: string, 
    resultCount: number,
    responseTime?: number,
    userId?: string
  ): Promise<void> {
    try {
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .insert({
          user_id: userId,
          search_term: companyName.toLowerCase().trim(),
          results_count: resultCount,
          created_at: new Date().toISOString(),
          response_time: responseTime
        });
    } catch (error) {
      console.warn('Failed to track search metrics:', error);
    }
  }

  /**
   * Track a user selection event
   */
  static async trackSelection(
    url: string, 
    confidence: number, 
    method: 'auto' | 'manual',
    searchTerm: string,
    selectionTime?: number,
    userId?: string
  ): Promise<void> {
    try {
      const userAction = method === 'auto' ? 'selected' : 'manual_entry';
      
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .insert({
          user_id: userId,
          search_term: searchTerm.toLowerCase().trim(),
          selected_url: url,
          selection_confidence: confidence,
          user_action: userAction,
          selection_time: selectionTime,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to track selection metrics:', error);
    }
  }

  /**
   * Track a skip/cancel event
   */
  static async trackSkip(
    searchTerm: string,
    reason: 'no_results' | 'user_cancel' | 'error',
    userId?: string
  ): Promise<void> {
    try {
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .insert({
          user_id: userId,
          search_term: searchTerm.toLowerCase().trim(),
          user_action: 'skipped',
          skip_reason: reason,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to track skip metrics:', error);
    }
  }

  /**
   * Get comprehensive metrics
   */
  static async getMetrics(filter: MetricsFilter = {}): Promise<LinkedInMetrics> {
    try {
      const [
        searchMetrics,
        userBehavior,
        performance,
        quality,
        system
      ] = await Promise.all([
        this.getSearchMetrics(filter),
        this.getUserBehaviorMetrics(filter),
        this.getPerformanceMetrics(filter),
        this.getQualityMetrics(filter),
        this.getSystemMetrics(filter)
      ]);

      return {
        searchMetrics,
        userBehavior,
        performance,
        quality,
        system
      };
    } catch (error) {
      console.error('Failed to get LinkedIn metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get search-related metrics
   */
  static async getSearchMetrics(filter: MetricsFilter = {}): Promise<SearchMetrics> {
    try {
      let query = supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .select('*');

      // Apply filters
      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }
      
      if (filter.timeRange) {
        query = query
          .gte('created_at', filter.timeRange.start.toISOString())
          .lte('created_at', filter.timeRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const metrics = data || [];
      
      // Calculate search metrics
      const totalSearches = metrics.length;
      const successfulSearches = metrics.filter(m => (m.results_count || 0) > 0).length;
      const failedSearches = totalSearches - successfulSearches;
      
      const avgResults = totalSearches > 0 
        ? metrics.reduce((sum, m) => sum + (m.results_count || 0), 0) / totalSearches 
        : 0;

      // Group by hour for time analysis
      const searchesByHour: Record<string, number> = {};
      metrics.forEach(m => {
        const hour = new Date(m.created_at).getHours().toString();
        searchesByHour[hour] = (searchesByHour[hour] || 0) + 1;
      });

      // Top search terms
      const termCounts: Record<string, { count: number; totalConfidence: number; confidenceCount: number }> = {};
      metrics.forEach(m => {
        const term = m.search_term;
        if (!termCounts[term]) {
          termCounts[term] = { count: 0, totalConfidence: 0, confidenceCount: 0 };
        }
        termCounts[term].count++;
        if (m.selection_confidence != null) {
          termCounts[term].totalConfidence += m.selection_confidence;
          termCounts[term].confidenceCount++;
        }
      });

      const topSearchTerms = Object.entries(termCounts)
        .map(([term, stats]) => ({
          term,
          count: stats.count,
          avgConfidence: stats.confidenceCount > 0 
            ? stats.totalConfidence / stats.confidenceCount 
            : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalSearches,
        successfulSearches,
        failedSearches,
        averageResultsPerSearch: Math.round(avgResults * 100) / 100,
        searchesByTimeOfDay: searchesByHour,
        topSearchTerms,
        searchSuccessRate: totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get search metrics:', error);
      return {
        totalSearches: 0,
        successfulSearches: 0,
        failedSearches: 0,
        averageResultsPerSearch: 0,
        searchesByTimeOfDay: {},
        topSearchTerms: [],
        searchSuccessRate: 0
      };
    }
  }

  /**
   * Get user behavior metrics
   */
  static async getUserBehaviorMetrics(filter: MetricsFilter = {}): Promise<UserBehaviorMetrics> {
    try {
      let query = supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .select('user_action, selection_confidence, selection_time, created_at');

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.timeRange) {
        query = query
          .gte('created_at', filter.timeRange.start.toISOString())
          .lte('created_at', filter.timeRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const metrics = data || [];
      
      const autoSelections = metrics.filter(m => m.user_action === 'selected').length;
      const manualEntries = metrics.filter(m => m.user_action === 'manual_entry').length;
      const skippedSearches = metrics.filter(m => m.user_action === 'skipped').length;
      
      const selectionTimes = metrics
        .filter(m => m.selection_time != null)
        .map(m => m.selection_time);
      
      const avgSelectionTime = selectionTimes.length > 0
        ? selectionTimes.reduce((sum, time) => sum + time, 0) / selectionTimes.length
        : 0;

      // Confidence range preferences
      const confidenceScores = metrics
        .filter(m => m.selection_confidence != null)
        .map(m => m.selection_confidence);
      
      let preferredRange = 'unknown';
      if (confidenceScores.length > 0) {
        const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
        if (avgConfidence >= 0.8) preferredRange = 'high';
        else if (avgConfidence >= 0.6) preferredRange = 'medium';
        else preferredRange = 'low';
      }

      const totalInteractions = autoSelections + manualEntries + skippedSearches;
      const conversions = autoSelections + manualEntries;
      
      return {
        autoSelections,
        manualEntries,
        skippedSearches,
        averageSelectionTime: Math.round(avgSelectionTime),
        preferredConfidenceRange: preferredRange,
        retryRate: 0, // Would need additional tracking
        conversionRate: totalInteractions > 0 ? (conversions / totalInteractions) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get user behavior metrics:', error);
      return {
        autoSelections: 0,
        manualEntries: 0,
        skippedSearches: 0,
        averageSelectionTime: 0,
        preferredConfidenceRange: 'unknown',
        retryRate: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(filter: MetricsFilter = {}): Promise<PerformanceMetrics> {
    try {
      // Get cache metrics
      const cacheMetrics = await getCacheMetrics();
      
      // Get queue status
      const queueStats = getQueueStatus();
      
      // Get database performance metrics
      let query = supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .select('response_time, results_count, created_at');

      if (filter.timeRange) {
        query = query
          .gte('created_at', filter.timeRange.start.toISOString())
          .lte('created_at', filter.timeRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const metrics = data || [];
      
      const responseTimes = metrics
        .filter(m => m.response_time != null)
        .map(m => m.response_time);
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      const slowRequests = responseTimes.filter(time => time > 3000).length;
      const successfulRequests = metrics.filter(m => (m.results_count || 0) > 0).length;
      const apiSuccessRate = metrics.length > 0 ? (successfulRequests / metrics.length) * 100 : 0;

      return {
        averageResponseTime: Math.round(avgResponseTime),
        cacheHitRate: cacheMetrics.cache.hitRate,
        queueLength: queueStats.queueLength,
        queueProcessingTime: queueStats.averageProcessingTime,
        apiSuccessRate,
        errorRate: 100 - apiSuccessRate,
        slowRequestCount: slowRequests
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        averageResponseTime: 0,
        cacheHitRate: 0,
        queueLength: 0,
        queueProcessingTime: 0,
        apiSuccessRate: 0,
        errorRate: 0,
        slowRequestCount: 0
      };
    }
  }

  /**
   * Get quality metrics
   */
  static async getQualityMetrics(filter: MetricsFilter = {}): Promise<QualityMetrics> {
    try {
      let query = supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .select('selection_confidence, user_action');

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.timeRange) {
        query = query
          .gte('created_at', filter.timeRange.start.toISOString())
          .lte('created_at', filter.timeRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const metrics = data || [];
      
      const withConfidence = metrics.filter(m => m.selection_confidence != null);
      const avgConfidence = withConfidence.length > 0
        ? withConfidence.reduce((sum, m) => sum + m.selection_confidence, 0) / withConfidence.length
        : 0;

      const highConfidence = withConfidence.filter(m => m.selection_confidence >= 0.8).length;
      const mediumConfidence = withConfidence.filter(m => m.selection_confidence >= 0.6 && m.selection_confidence < 0.8).length;
      const lowConfidence = withConfidence.filter(m => m.selection_confidence < 0.6).length;

      const autoSelections = metrics.filter(m => m.user_action === 'selected').length;
      const manualOverrides = metrics.filter(m => m.user_action === 'manual_entry').length;
      const totalSelections = autoSelections + manualOverrides;
      
      const manualOverrideRate = totalSelections > 0 ? (manualOverrides / totalSelections) * 100 : 0;

      return {
        averageConfidenceScore: Math.round(avgConfidence * 100) / 100,
        highConfidenceSelections: highConfidence,
        mediumConfidenceSelections: mediumConfidence,
        lowConfidenceSelections: lowConfidence,
        manualOverrideRate,
        falsePositiveRate: 0 // Would need user feedback to calculate
      };
    } catch (error) {
      console.error('Failed to get quality metrics:', error);
      return {
        averageConfidenceScore: 0,
        highConfidenceSelections: 0,
        mediumConfidenceSelections: 0,
        lowConfidenceSelections: 0,
        manualOverrideRate: 0,
        falsePositiveRate: 0
      };
    }
  }

  /**
   * Get system metrics
   */
  static async getSystemMetrics(filter: MetricsFilter = {}): Promise<SystemMetrics> {
    try {
      const queueStats = getQueueStatus();
      
      return {
        dailyApiUsage: queueStats.requestsToday,
        monthlyApiUsage: queueStats.requestsThisMonth,
        remainingQuota: queueStats.requestsThisMonth < 2000 ? 2000 - queueStats.requestsThisMonth : 0,
        rateLimitHits: 0, // Would need additional tracking
        systemErrors: 0, // Would need error boundary reporting
        uptimePercentage: 99.9 // Would need uptime monitoring
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        dailyApiUsage: 0,
        monthlyApiUsage: 0,
        remainingQuota: 2000,
        rateLimitHits: 0,
        systemErrors: 0,
        uptimePercentage: 100
      };
    }
  }

  /**
   * Generate a metrics report
   */
  static async generateReport(filter: MetricsFilter = {}): Promise<string> {
    try {
      const metrics = await this.getMetrics(filter);
      
      const report = `
# LinkedIn Discovery Metrics Report
Generated: ${new Date().toISOString()}

## Search Performance
- Total Searches: ${metrics.searchMetrics.totalSearches}
- Success Rate: ${metrics.searchMetrics.searchSuccessRate.toFixed(1)}%
- Average Results: ${metrics.searchMetrics.averageResultsPerSearch}
- Average Response Time: ${metrics.performance.averageResponseTime}ms

## User Behavior
- Auto Selections: ${metrics.userBehavior.autoSelections}
- Manual Entries: ${metrics.userBehavior.manualEntries}
- Conversion Rate: ${metrics.userBehavior.conversionRate.toFixed(1)}%
- Preferred Confidence: ${metrics.userBehavior.preferredConfidenceRange}

## Quality Metrics
- Average Confidence: ${metrics.quality.averageConfidenceScore}
- High Confidence Selections: ${metrics.quality.highConfidenceSelections}
- Manual Override Rate: ${metrics.quality.manualOverrideRate.toFixed(1)}%

## System Health
- Cache Hit Rate: ${metrics.performance.cacheHitRate.toFixed(1)}%
- API Usage: ${metrics.system.dailyApiUsage}/${metrics.system.monthlyApiUsage} (daily/monthly)
- Queue Length: ${metrics.performance.queueLength}
- Error Rate: ${metrics.performance.errorRate.toFixed(1)}%

## Top Search Terms
${metrics.searchMetrics.topSearchTerms.slice(0, 5).map(term => 
  `- ${term.term}: ${term.count} searches (${term.avgConfidence.toFixed(2)} avg confidence)`
).join('\n')}
      `.trim();

      return report;
    } catch (error) {
      console.error('Failed to generate metrics report:', error);
      return 'Failed to generate metrics report';
    }
  }

  /**
   * Get empty metrics (fallback)
   */
  private static getEmptyMetrics(): LinkedInMetrics {
    return {
      searchMetrics: {
        totalSearches: 0,
        successfulSearches: 0,
        failedSearches: 0,
        averageResultsPerSearch: 0,
        searchesByTimeOfDay: {},
        topSearchTerms: [],
        searchSuccessRate: 0
      },
      userBehavior: {
        autoSelections: 0,
        manualEntries: 0,
        skippedSearches: 0,
        averageSelectionTime: 0,
        preferredConfidenceRange: 'unknown',
        retryRate: 0,
        conversionRate: 0
      },
      performance: {
        averageResponseTime: 0,
        cacheHitRate: 0,
        queueLength: 0,
        queueProcessingTime: 0,
        apiSuccessRate: 0,
        errorRate: 0,
        slowRequestCount: 0
      },
      quality: {
        averageConfidenceScore: 0,
        highConfidenceSelections: 0,
        mediumConfidenceSelections: 0,
        lowConfidenceSelections: 0,
        manualOverrideRate: 0,
        falsePositiveRate: 0
      },
      system: {
        dailyApiUsage: 0,
        monthlyApiUsage: 0,
        remainingQuota: 2000,
        rateLimitHits: 0,
        systemErrors: 0,
        uptimePercentage: 100
      }
    };
  }
}

/**
 * Real-time metrics monitoring
 */
export class LinkedInMetricsMonitor {
  private static instance: LinkedInMetricsMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(metrics: LinkedInMetrics) => void> = [];

  static getInstance(): LinkedInMetricsMonitor {
    if (!this.instance) {
      this.instance = new LinkedInMetricsMonitor();
    }
    return this.instance;
  }

  start(intervalMs = 60000): void { // Default: 1 minute
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        const metrics = await LinkedInMetrics.getMetrics();
        this.listeners.forEach(listener => listener(metrics));
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(listener: (metrics: LinkedInMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Export convenience functions
export const trackLinkedInSearch = LinkedInMetrics.trackSearch;
export const trackLinkedInSelection = LinkedInMetrics.trackSelection;
export const trackLinkedInSkip = LinkedInMetrics.trackSkip;
export const getLinkedInMetrics = LinkedInMetrics.getMetrics;
export const generateLinkedInReport = LinkedInMetrics.generateReport;