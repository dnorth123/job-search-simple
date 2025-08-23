import { supabase, TABLES } from './supabase';
import type { LinkedInSearchResult } from '../jobTypes';

interface CachedResult {
  results: LinkedInSearchResult[];
  timestamp: number;
  expires: number;
  searchCount: number;
}

export class LinkedInCache {
  private memoryCache: Map<string, CachedResult>;
  private readonly CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_MEMORY_CACHE_SIZE = 100; // Maximum items in memory cache
  private readonly MEMORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for memory cache

  constructor() {
    this.memoryCache = new Map();
    
    // Clean up memory cache periodically
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get cached results for a company search
   */
  async get(companyName: string): Promise<LinkedInSearchResult[] | null> {
    const normalizedName = this.normalizeSearchTerm(companyName);
    
    // Check memory cache first (fastest)
    const memoryCached = this.getFromMemoryCache(normalizedName);
    if (memoryCached) {
      return memoryCached;
    }

    // Check database cache
    try {
      const { data, error } = await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .select('results, expires_at, search_count')
        .eq('search_term', normalizedName)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Update search count
      await this.updateSearchCount(normalizedName);

      // Store in memory cache for faster subsequent access
      this.setInMemoryCache(normalizedName, data.results as LinkedInSearchResult[]);

      return data.results as LinkedInSearchResult[];
    } catch (error) {
      console.warn('Failed to get cached LinkedIn results:', error);
      return null;
    }
  }

  /**
   * Cache search results
   */
  async set(companyName: string, results: LinkedInSearchResult[]): Promise<void> {
    const normalizedName = this.normalizeSearchTerm(companyName);
    const expiresAt = new Date(Date.now() + this.CACHE_TTL_MS);

    try {
      // Store in database cache
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .upsert({
          search_term: normalizedName,
          results,
          expires_at: expiresAt.toISOString(),
          search_count: 1
        });

      // Store in memory cache
      this.setInMemoryCache(normalizedName, results);
    } catch (error) {
      console.warn('Failed to cache LinkedIn results:', error);
      // Don't throw - caching failure shouldn't break main functionality
    }
  }

  /**
   * Preload cache for common companies
   */
  async preload(commonCompanies: string[]): Promise<void> {
    const preloadPromises = commonCompanies.map(async (company) => {
      try {
        // Only preload if not already cached
        const existing = await this.get(company);
        if (!existing) {
          // Trigger a search for this company
          const response = await supabase.functions.invoke('discover-linkedin-company', {
            body: { companyName: company }
          });

          if (response.data?.results) {
            await this.set(company, response.data.results);
          }
        }
      } catch (error) {
        console.warn(`Failed to preload cache for ${company}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    memoryEntries: number;
    hitRate: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  }> {
    try {
      const { data: cacheEntries } = await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .select('search_term, created_at, search_count')
        .order('created_at', { ascending: true });

      const totalSearches = cacheEntries?.reduce((sum, entry) => sum + (entry.search_count || 1), 0) || 0;
      const uniqueSearches = cacheEntries?.length || 0;
      
      // Hit rate calculation: (total searches - unique searches) / total searches
      const hitRate = totalSearches > 0 ? ((totalSearches - uniqueSearches) / totalSearches) * 100 : 0;

      return {
        totalEntries: uniqueSearches,
        memoryEntries: this.memoryCache.size,
        hitRate: Math.round(hitRate * 100) / 100,
        oldestEntry: cacheEntries?.[0]?.search_term || null,
        newestEntry: cacheEntries?.[cacheEntries.length - 1]?.search_term || null
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        memoryEntries: this.memoryCache.size,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }

  /**
   * Clear expired entries from cache
   */
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} expired LinkedIn cache entries`);
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup LinkedIn cache:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(companyName: string): Promise<void> {
    const normalizedName = this.normalizeSearchTerm(companyName);
    
    try {
      // Remove from memory cache
      this.memoryCache.delete(normalizedName);

      // Remove from database cache
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .delete()
        .eq('search_term', normalizedName);
    } catch (error) {
      console.warn('Failed to invalidate cache entry:', error);
    }
  }

  /**
   * Get cache performance metrics
   */
  getPerformanceMetrics(): {
    memoryCacheSize: number;
    memoryCacheHitRate: number;
    averageResponseTime: number;
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheHitRate: this.calculateMemoryCacheHitRate(),
      averageResponseTime: this.getAverageResponseTime()
    };
  }

  // Private methods

  private normalizeSearchTerm(term: string): string {
    return term.toLowerCase().trim();
  }

  private getFromMemoryCache(normalizedName: string): LinkedInSearchResult[] | null {
    const cached = this.memoryCache.get(normalizedName);
    
    if (!cached) {
      return null;
    }

    // Check if memory cache entry is expired
    if (Date.now() > cached.expires) {
      this.memoryCache.delete(normalizedName);
      return null;
    }

    // Update access count
    cached.searchCount++;
    return cached.results;
  }

  private setInMemoryCache(normalizedName: string, results: LinkedInSearchResult[]): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(normalizedName, {
      results,
      timestamp: Date.now(),
      expires: Date.now() + this.MEMORY_CACHE_TTL_MS,
      searchCount: 1
    });
  }

  private async updateSearchCount(normalizedName: string): Promise<void> {
    try {
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_CACHE)
        .update({ 
          search_count: supabase.sql`search_count + 1` 
        })
        .eq('search_term', normalizedName);
    } catch (error) {
      console.warn('Failed to update search count:', error);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expires) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.memoryCache.delete(key));
  }

  private calculateMemoryCacheHitRate(): number {
    let totalAccess = 0;
    let hitCount = 0;

    for (const cached of this.memoryCache.values()) {
      totalAccess += cached.searchCount;
      if (cached.searchCount > 1) {
        hitCount += cached.searchCount - 1; // First access is not a hit
      }
    }

    return totalAccess > 0 ? (hitCount / totalAccess) * 100 : 0;
  }

  private getAverageResponseTime(): number {
    // This would be calculated based on actual measurements
    // For now, return a placeholder value
    const memoryCacheTime = 5; // 5ms for memory cache
    const dbCacheTime = 50; // 50ms for database cache
    const apiTime = 1000; // 1000ms for API call

    const memoryHitRate = this.calculateMemoryCacheHitRate() / 100;
    const dbHitRate = 0.7; // Estimated database hit rate
    
    return (memoryHitRate * memoryCacheTime) + 
           ((1 - memoryHitRate) * dbHitRate * dbCacheTime) + 
           ((1 - memoryHitRate) * (1 - dbHitRate) * apiTime);
  }
}

// Singleton instance
export const linkedInCache = new LinkedInCache();

// Utility functions for cache management

/**
 * Warm up cache with commonly searched companies
 */
export async function warmUpCache(): Promise<void> {
  const commonCompanies = [
    'Microsoft', 'Apple', 'Google', 'Amazon', 'Meta',
    'Netflix', 'Tesla', 'Spotify', 'Uber', 'Airbnb',
    'Salesforce', 'Adobe', 'Oracle', 'IBM', 'Intel'
  ];

  console.log('Warming up LinkedIn cache with common companies...');
  await linkedInCache.preload(commonCompanies);
  console.log('Cache warm-up complete');
}

/**
 * Scheduled cache cleanup
 */
export async function scheduleCleanup(): Promise<void> {
  // Run cleanup every 6 hours
  setInterval(async () => {
    const deleted = await linkedInCache.cleanup();
    if (deleted > 0) {
      console.log(`LinkedIn cache cleanup: removed ${deleted} expired entries`);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Run initial cleanup
  await linkedInCache.cleanup();
}

/**
 * Get comprehensive cache metrics for monitoring
 */
export async function getCacheMetrics(): Promise<{
  cache: Awaited<ReturnType<LinkedInCache['getStats']>>;
  performance: ReturnType<LinkedInCache['getPerformanceMetrics']>;
}> {
  const [cacheStats, performanceMetrics] = await Promise.all([
    linkedInCache.getStats(),
    Promise.resolve(linkedInCache.getPerformanceMetrics())
  ]);

  return {
    cache: cacheStats,
    performance: performanceMetrics
  };
}