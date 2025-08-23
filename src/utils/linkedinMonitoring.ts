import { linkedInConfig, shouldMonitor } from '../config/linkedinConfig';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: boolean;
    braveApi: boolean;
    cache: boolean;
    edgeFunction: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
    activeConnections: number;
  };
  errors?: string[];
}

export interface MonitoringMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  };
  api: {
    rateLimitHits: number;
    quotaUsed: number;
    quotaRemaining: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    recentErrors: Array<{
      timestamp: string;
      error: string;
      context: string;
    }>;
  };
}

class LinkedInMonitoring {
  private metrics: MonitoringMetrics = {
    requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
    cache: { hits: 0, misses: 0, hitRate: 0, evictions: 0 },
    api: { rateLimitHits: 0, quotaUsed: 0, quotaRemaining: 0 },
    errors: { total: 0, byType: {}, recentErrors: [] }
  };

  private healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  private lastHealthCheck: Date | null = null;
  private responseTimeHistory: number[] = [];
  private maxHistorySize = 100;

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = {
      database: false,
      braveApi: false,
      cache: false,
      edgeFunction: false
    };
    const errors: string[] = [];

    try {
      // Check database connectivity
      checks.database = await this.checkDatabase();
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Check Brave API
      checks.braveApi = await this.checkBraveApi();
    } catch (error) {
      errors.push(`Brave API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Check cache system
      checks.cache = await this.checkCache();
    } catch (error) {
      errors.push(`Cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Check edge function
      checks.edgeFunction = await this.checkEdgeFunction();
    } catch (error) {
      errors.push(`Edge Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const responseTime = Date.now() - startTime;
    this.recordResponseTime(responseTime);

    // Determine overall health status
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    this.healthStatus = status;
    this.lastHealthCheck = new Date();

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        responseTime,
        errorRate: this.calculateErrorRate(),
        cacheHitRate: this.metrics.cache.hitRate,
        activeConnections: await this.getActiveConnections()
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkBraveApi(): Promise<boolean> {
    if (!linkedInConfig.api.braveKey) {
      return false;
    }

    try {
      // Perform a minimal test search
      const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=test&count=1', {
        headers: {
          'X-Subscription-Token': linkedInConfig.api.braveKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update quota information if available
        if (data.quota) {
          this.metrics.api.quotaUsed = data.quota.used || 0;
          this.metrics.api.quotaRemaining = data.quota.remaining || 0;
        }
        return true;
      }

      if (response.status === 429) {
        this.metrics.api.rateLimitHits++;
        return false;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      // Test cache write and read
      const testKey = 'health_check_test';
      const testValue = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = localStorage.getItem(testKey);
      
      if (retrieved) {
        localStorage.removeItem(testKey);
        return JSON.parse(retrieved).test === true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private async checkEdgeFunction(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-linkedin-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ companyName: 'health_check', healthCheck: true })
      });

      return response.status !== 500; // Any non-500 response indicates function is running
    } catch {
      return false;
    }
  }

  private async getActiveConnections(): Promise<number> {
    // In a real implementation, this might query the database for active sessions
    // For now, return a mock value
    return Math.floor(Math.random() * 50) + 10;
  }

  recordRequest(successful: boolean, responseTime: number): void {
    if (!shouldMonitor()) return;

    this.metrics.requests.total++;
    if (successful) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    this.recordResponseTime(responseTime);
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimeHistory.push(responseTime);
    if (this.responseTimeHistory.length > this.maxHistorySize) {
      this.responseTimeHistory.shift();
    }

    this.metrics.requests.averageResponseTime = 
      this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
  }

  recordCacheHit(hit: boolean): void {
    if (!shouldMonitor()) return;

    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }

    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? this.metrics.cache.hits / total : 0;
  }

  recordCacheEviction(): void {
    if (!shouldMonitor()) return;
    this.metrics.cache.evictions++;
  }

  recordError(error: Error, context: string): void {
    if (!shouldMonitor()) return;

    this.metrics.errors.total++;
    
    const errorType = error.constructor.name;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;

    this.metrics.errors.recentErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      context
    });

    // Keep only last 50 errors
    if (this.metrics.errors.recentErrors.length > 50) {
      this.metrics.errors.recentErrors.shift();
    }
  }

  private calculateErrorRate(): number {
    const total = this.metrics.requests.total;
    const failed = this.metrics.requests.failed;
    return total > 0 ? failed / total : 0;
  }

  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    return this.healthStatus;
  }

  getLastHealthCheck(): Date | null {
    return this.lastHealthCheck;
  }

  // Alert system
  checkAlerts(): Array<{ level: 'warning' | 'critical'; message: string }> {
    const alerts = [];

    // High error rate alert
    if (this.calculateErrorRate() > 0.1) {
      alerts.push({
        level: 'critical' as const,
        message: `High error rate: ${(this.calculateErrorRate() * 100).toFixed(1)}%`
      });
    } else if (this.calculateErrorRate() > 0.05) {
      alerts.push({
        level: 'warning' as const,
        message: `Elevated error rate: ${(this.calculateErrorRate() * 100).toFixed(1)}%`
      });
    }

    // Low cache hit rate alert
    if (this.metrics.cache.hitRate < 0.5 && this.metrics.cache.hits + this.metrics.cache.misses > 100) {
      alerts.push({
        level: 'warning' as const,
        message: `Low cache hit rate: ${(this.metrics.cache.hitRate * 100).toFixed(1)}%`
      });
    }

    // High response time alert
    if (this.metrics.requests.averageResponseTime > 5000) {
      alerts.push({
        level: 'critical' as const,
        message: `High response time: ${this.metrics.requests.averageResponseTime.toFixed(0)}ms`
      });
    } else if (this.metrics.requests.averageResponseTime > 3000) {
      alerts.push({
        level: 'warning' as const,
        message: `Elevated response time: ${this.metrics.requests.averageResponseTime.toFixed(0)}ms`
      });
    }

    // Rate limit alert
    if (this.metrics.api.rateLimitHits > 0) {
      alerts.push({
        level: 'warning' as const,
        message: `Rate limit hits: ${this.metrics.api.rateLimitHits}`
      });
    }

    return alerts;
  }

  // Export metrics for external monitoring systems
  exportMetrics(): string {
    const timestamp = Date.now();
    const metrics = this.getMetrics();
    
    return [
      `linkedin_requests_total ${metrics.requests.total} ${timestamp}`,
      `linkedin_requests_successful ${metrics.requests.successful} ${timestamp}`,
      `linkedin_requests_failed ${metrics.requests.failed} ${timestamp}`,
      `linkedin_response_time_avg ${metrics.requests.averageResponseTime} ${timestamp}`,
      `linkedin_cache_hits ${metrics.cache.hits} ${timestamp}`,
      `linkedin_cache_misses ${metrics.cache.misses} ${timestamp}`,
      `linkedin_cache_hit_rate ${metrics.cache.hitRate} ${timestamp}`,
      `linkedin_cache_evictions ${metrics.cache.evictions} ${timestamp}`,
      `linkedin_api_rate_limit_hits ${metrics.api.rateLimitHits} ${timestamp}`,
      `linkedin_api_quota_used ${metrics.api.quotaUsed} ${timestamp}`,
      `linkedin_api_quota_remaining ${metrics.api.quotaRemaining} ${timestamp}`,
      `linkedin_errors_total ${metrics.errors.total} ${timestamp}`,
      `linkedin_health_status ${this.healthStatus === 'healthy' ? 1 : this.healthStatus === 'degraded' ? 0.5 : 0} ${timestamp}`
    ].join('\n');
  }

  reset(): void {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0, evictions: 0 },
      api: { rateLimitHits: 0, quotaUsed: 0, quotaRemaining: 0 },
      errors: { total: 0, byType: {}, recentErrors: [] }
    };
    this.responseTimeHistory = [];
    this.healthStatus = 'healthy';
    this.lastHealthCheck = null;
  }
}

// Global monitoring instance
export const linkedInMonitoring = new LinkedInMonitoring();

// Auto-start health checks in production
if (linkedInConfig.monitoring.enabled) {
  // Perform health check every 5 minutes
  setInterval(async () => {
    try {
      await linkedInMonitoring.performHealthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, 5 * 60 * 1000);

  // Initial health check
  setTimeout(() => {
    linkedInMonitoring.performHealthCheck().catch(console.error);
  }, 1000);
}