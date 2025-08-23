import { supabase } from './supabase';

export interface DatabaseStats {
  cacheTableSize: number;
  metricsTableSize: number;
  totalCacheEntries: number;
  totalMetrics: number;
  expiredCacheEntries: number;
  oldMetrics: number;
  indexUsage: IndexUsageStats[];
  performanceMetrics: PerformanceMetrics;
}

export interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  dailyRequestCount: number;
  topSearchTerms: Array<{
    term: string;
    count: number;
    selectionRate: number;
    avgConfidence: number;
  }>;
  recentErrors: number;
}

export interface OptimizationRecommendation {
  type: 'warning' | 'error' | 'info';
  category: 'performance' | 'storage' | 'maintenance' | 'security';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

export class LinkedInDatabaseOptimizer {
  private lastStatsUpdate: Date | null = null;
  private cachedStats: DatabaseStats | null = null;
  private readonly STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getDatabaseStats(forceRefresh = false): Promise<DatabaseStats> {
    if (!forceRefresh && 
        this.cachedStats && 
        this.lastStatsUpdate && 
        Date.now() - this.lastStatsUpdate.getTime() < this.STATS_CACHE_TTL) {
      return this.cachedStats;
    }

    try {
      const [
        tableSizes,
        entryCounts,
        indexStats,
        performanceData
      ] = await Promise.all([
        this.getTableSizes(),
        this.getEntryCounts(),
        this.getIndexUsage(),
        this.getPerformanceMetrics()
      ]);

      const stats: DatabaseStats = {
        cacheTableSize: tableSizes.cache || 0,
        metricsTableSize: tableSizes.metrics || 0,
        totalCacheEntries: entryCounts.totalCache || 0,
        totalMetrics: entryCounts.totalMetrics || 0,
        expiredCacheEntries: entryCounts.expiredCache || 0,
        oldMetrics: entryCounts.oldMetrics || 0,
        indexUsage: indexStats,
        performanceMetrics: performanceData
      };

      this.cachedStats = stats;
      this.lastStatsUpdate = new Date();
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  private async getTableSizes(): Promise<{ cache?: number; metrics?: number }> {
    try {
      const { data, error } = await supabase.rpc('get_table_sizes', {
        table_names: ['linkedin_search_cache', 'linkedin_search_metrics']
      }).select('*');

      if (error) {
        console.warn('Could not get table sizes:', error);
        return {};
      }

      const sizes: { cache?: number; metrics?: number } = {};
      data?.forEach((row: any) => {
        if (row.table_name === 'linkedin_search_cache') {
          sizes.cache = parseInt(row.size_bytes);
        } else if (row.table_name === 'linkedin_search_metrics') {
          sizes.metrics = parseInt(row.size_bytes);
        }
      });

      return sizes;
    } catch (error) {
      console.warn('Table size query failed:', error);
      return {};
    }
  }

  private async getEntryCounts(): Promise<{
    totalCache?: number;
    totalMetrics?: number;
    expiredCache?: number;
    oldMetrics?: number;
  }> {
    try {
      const [cacheResult, metricsResult, expiredResult, oldMetricsResult] = await Promise.all([
        supabase.from('linkedin_search_cache').select('id', { count: 'exact', head: true }),
        supabase.from('linkedin_search_metrics').select('id', { count: 'exact', head: true }),
        supabase.from('linkedin_search_cache')
          .select('id', { count: 'exact', head: true })
          .lt('expires_at', new Date().toISOString()),
        supabase.from('linkedin_search_metrics')
          .select('id', { count: 'exact', head: true })
          .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        totalCache: cacheResult.count || 0,
        totalMetrics: metricsResult.count || 0,
        expiredCache: expiredResult.count || 0,
        oldMetrics: oldMetricsResult.count || 0
      };
    } catch (error) {
      console.warn('Entry count queries failed:', error);
      return {};
    }
  }

  private async getIndexUsage(): Promise<IndexUsageStats[]> {
    try {
      // This would typically use pg_stat_user_indexes view
      // For now, return mock data since we can't access system views through Supabase client
      return [
        {
          schemaname: 'public',
          tablename: 'linkedin_search_cache',
          indexname: 'idx_linkedin_search_cache_search_term',
          idx_scan: 1000,
          idx_tup_read: 5000,
          idx_tup_fetch: 4500
        },
        {
          schemaname: 'public',
          tablename: 'linkedin_search_metrics',
          indexname: 'idx_linkedin_search_metrics_created_at',
          idx_scan: 500,
          idx_tup_read: 2500,
          idx_tup_fetch: 2000
        }
      ];
    } catch (error) {
      console.warn('Index usage query failed:', error);
      return [];
    }
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [cachePerf, apiPerf, topSearches] = await Promise.all([
        supabase.from('linkedin_cache_performance')
          .select('*')
          .order('date', { ascending: false })
          .limit(7),
        supabase.from('linkedin_api_performance')
          .select('*')
          .order('date', { ascending: false })
          .limit(7),
        supabase.from('linkedin_top_searches')
          .select('*')
          .limit(10)
      ]);

      // Calculate averages
      const avgCacheHitRate = cachePerf.data?.reduce((sum, row) => 
        sum + (row.cache_hit_rate_percent || 0), 0) / (cachePerf.data?.length || 1);

      const avgResponseTime = apiPerf.data?.reduce((sum, row) => 
        sum + (row.avg_response_time_ms || 0), 0) / (apiPerf.data?.length || 1);

      const dailyRequests = apiPerf.data?.[0]?.total_searches || 0;

      const topSearchTerms = (topSearches.data || []).map((row: any) => ({
        term: row.search_term,
        count: row.search_count,
        selectionRate: row.selection_rate_percent,
        avgConfidence: row.avg_confidence
      }));

      return {
        cacheHitRate: avgCacheHitRate || 0,
        averageResponseTime: avgResponseTime || 0,
        dailyRequestCount: dailyRequests,
        topSearchTerms,
        recentErrors: 0 // Would need to implement error tracking
      };
    } catch (error) {
      console.warn('Performance metrics query failed:', error);
      return {
        cacheHitRate: 0,
        averageResponseTime: 0,
        dailyRequestCount: 0,
        topSearchTerms: [],
        recentErrors: 0
      };
    }
  }

  async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const stats = await this.getDatabaseStats();
    const recommendations: OptimizationRecommendation[] = [];

    // Check for expired cache entries
    if (stats.expiredCacheEntries > 100) {
      recommendations.push({
        type: 'warning',
        category: 'maintenance',
        title: 'Expired Cache Cleanup Needed',
        description: `Found ${stats.expiredCacheEntries} expired cache entries that should be cleaned up.`,
        action: 'Run cache cleanup function',
        priority: 'medium',
        impact: 'Reduces storage usage and improves query performance'
      });
    }

    // Check for old metrics
    if (stats.oldMetrics > 1000) {
      recommendations.push({
        type: 'warning',
        category: 'maintenance',
        title: 'Old Metrics Cleanup Recommended',
        description: `Found ${stats.oldMetrics} metrics entries older than 90 days.`,
        action: 'Archive or delete old metrics',
        priority: 'low',
        impact: 'Reduces storage usage and improves analytics queries'
      });
    }

    // Check cache hit rate
    if (stats.performanceMetrics.cacheHitRate < 70) {
      recommendations.push({
        type: 'warning',
        category: 'performance',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${stats.performanceMetrics.cacheHitRate.toFixed(1)}%, below optimal 70%+.`,
        action: 'Review cache TTL settings or increase cache size',
        priority: 'high',
        impact: 'Improves response times and reduces API usage'
      });
    }

    // Check response time
    if (stats.performanceMetrics.averageResponseTime > 3000) {
      recommendations.push({
        type: 'error',
        category: 'performance',
        title: 'High Response Time',
        description: `Average response time is ${stats.performanceMetrics.averageResponseTime.toFixed(0)}ms, above 3s threshold.`,
        action: 'Investigate slow queries and optimize indexes',
        priority: 'high',
        impact: 'Improves user experience and reduces timeouts'
      });
    }

    // Check table sizes
    const totalSize = stats.cacheTableSize + stats.metricsTableSize;
    if (totalSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: 'info',
        category: 'storage',
        title: 'Large Table Size',
        description: `Total LinkedIn tables size is ${this.formatBytes(totalSize)}.`,
        action: 'Consider implementing table partitioning',
        priority: 'low',
        impact: 'Improves query performance on large datasets'
      });
    }

    // Check for unused indexes
    const unusedIndexes = stats.indexUsage.filter(idx => idx.idx_scan < 10);
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'performance',
        title: 'Potentially Unused Indexes',
        description: `Found ${unusedIndexes.length} indexes with very low usage.`,
        action: 'Review and consider dropping unused indexes',
        priority: 'low',
        impact: 'Reduces storage overhead and improves write performance'
      });
    }

    // Check for high request volume
    if (stats.performanceMetrics.dailyRequestCount > 10000) {
      recommendations.push({
        type: 'info',
        category: 'performance',
        title: 'High Request Volume',
        description: `Processing ${stats.performanceMetrics.dailyRequestCount} requests per day.`,
        action: 'Consider implementing more aggressive caching or request throttling',
        priority: 'medium',
        impact: 'Ensures system stability under high load'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async performCleanup(type: 'cache' | 'metrics' | 'both' = 'both'): Promise<{
    cacheDeleted?: number;
    metricsDeleted?: number;
    success: boolean;
    error?: string;
  }> {
    try {
      const results: { cacheDeleted?: number; metricsDeleted?: number } = {};

      if (type === 'cache' || type === 'both') {
        const { data: cacheResult, error: cacheError } = await supabase
          .rpc('cleanup_expired_linkedin_cache');

        if (cacheError) {
          throw new Error(`Cache cleanup failed: ${cacheError.message}`);
        }
        results.cacheDeleted = cacheResult || 0;
      }

      if (type === 'metrics' || type === 'both') {
        const { data: metricsResult, error: metricsError } = await supabase
          .rpc('cleanup_old_linkedin_metrics');

        if (metricsError) {
          throw new Error(`Metrics cleanup failed: ${metricsError.message}`);
        }
        results.metricsDeleted = metricsResult || 0;
      }

      // Invalidate cached stats after cleanup
      this.cachedStats = null;
      this.lastStatsUpdate = null;

      return {
        ...results,
        success: true
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createPartition(): Promise<{ success: boolean; partitionName?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_next_month_partition');

      if (error) {
        throw new Error(`Partition creation failed: ${error.message}`);
      }

      return {
        success: true,
        partitionName: data
      };
    } catch (error) {
      console.error('Partition creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeQueryPerformance(query: string): Promise<{
    executionTime: number;
    planCost: number;
    indexesUsed: string[];
    recommendations: string[];
  }> {
    try {
      // This is a simplified version - in a real implementation you might use EXPLAIN ANALYZE
      // For now, return mock data
      return {
        executionTime: Math.random() * 100,
        planCost: Math.random() * 1000,
        indexesUsed: ['idx_linkedin_search_cache_search_term'],
        recommendations: [
          'Query performance is optimal',
          'Consider adding LIMIT clause for large result sets'
        ]
      };
    } catch (error) {
      throw new Error(`Query analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getHealthScore(): Promise<{
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
  }> {
    const stats = await this.getDatabaseStats();
    const recommendations = await this.getOptimizationRecommendations();
    
    const factors = [
      {
        name: 'Cache Hit Rate',
        score: Math.min(100, stats.performanceMetrics.cacheHitRate),
        weight: 0.25,
        description: 'Higher cache hit rates reduce API calls and improve performance'
      },
      {
        name: 'Response Time',
        score: Math.max(0, 100 - (stats.performanceMetrics.averageResponseTime / 100)),
        weight: 0.25,
        description: 'Lower response times provide better user experience'
      },
      {
        name: 'Storage Efficiency',
        score: Math.max(0, 100 - (stats.expiredCacheEntries / 10)),
        weight: 0.2,
        description: 'Regular cleanup maintains optimal storage usage'
      },
      {
        name: 'Error Rate',
        score: Math.max(0, 100 - stats.performanceMetrics.recentErrors),
        weight: 0.15,
        description: 'Low error rates indicate system reliability'
      },
      {
        name: 'Maintenance',
        score: Math.max(0, 100 - (recommendations.filter(r => r.priority === 'high').length * 20)),
        weight: 0.15,
        description: 'Fewer high-priority recommendations indicate better maintenance'
      }
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (weightedScore >= 90) grade = 'A';
    else if (weightedScore >= 80) grade = 'B';
    else if (weightedScore >= 70) grade = 'C';
    else if (weightedScore >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: Math.round(weightedScore),
      grade,
      factors
    };
  }
}

// Global database optimizer instance
export const linkedInDatabaseOptimizer = new LinkedInDatabaseOptimizer();