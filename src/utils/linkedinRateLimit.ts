import { linkedInConfig, getRateLimits } from '../config/linkedinConfig';
import { linkedInMonitoring } from './linkedinMonitoring';

interface RateLimitConfig {
  monthly: number;
  daily: number;
  perMinute: number;
  burst: number;
}

interface RateLimitState {
  monthly: { count: number; resetTime: number };
  daily: { count: number; resetTime: number };
  perMinute: { count: number; resetTime: number };
  burst: { count: number; resetTime: number };
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
  remainingQuota: {
    monthly: number;
    daily: number;
    perMinute: number;
    burst: number;
  };
}

interface RequestRecord {
  timestamp: number;
  successful: boolean;
  responseTime: number;
  endpoint: string;
}

export class LinkedInRateLimit {
  private state: RateLimitState;
  private config: RateLimitConfig;
  private requestHistory: RequestRecord[] = [];
  private readonly STORAGE_KEY = 'linkedin_rate_limit_state';
  private readonly HISTORY_KEY = 'linkedin_request_history';
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor() {
    this.config = getRateLimits();
    this.state = this.loadState();
    this.cleanupExpiredLimits();
    
    // Save state periodically
    setInterval(() => this.saveState(), 30000); // Every 30 seconds
  }

  private loadState(): RateLimitState {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          monthly: parsed.monthly || { count: 0, resetTime: this.getMonthlyResetTime() },
          daily: parsed.daily || { count: 0, resetTime: this.getDailyResetTime() },
          perMinute: parsed.perMinute || { count: 0, resetTime: this.getMinuteResetTime() },
          burst: parsed.burst || { count: 0, resetTime: this.getBurstResetTime() }
        };
      }
    } catch (error) {
      console.error('Failed to load rate limit state:', error);
    }

    return {
      monthly: { count: 0, resetTime: this.getMonthlyResetTime() },
      daily: { count: 0, resetTime: this.getDailyResetTime() },
      perMinute: { count: 0, resetTime: this.getMinuteResetTime() },
      burst: { count: 0, resetTime: this.getBurstResetTime() }
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      
      // Also save request history (truncated)
      const recentHistory = this.requestHistory.slice(-this.MAX_HISTORY_SIZE);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save rate limit state:', error);
    }
  }

  private loadRequestHistory(): void {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      if (saved) {
        this.requestHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load request history:', error);
    }
  }

  private getMonthlyResetTime(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  private getDailyResetTime(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime();
  }

  private getMinuteResetTime(): number {
    const now = new Date();
    return now.getTime() + 60000; // 1 minute from now
  }

  private getBurstResetTime(): number {
    const now = new Date();
    return now.getTime() + 10000; // 10 seconds from now
  }

  private cleanupExpiredLimits(): void {
    const now = Date.now();
    
    if (now >= this.state.monthly.resetTime) {
      this.state.monthly = { count: 0, resetTime: this.getMonthlyResetTime() };
    }
    
    if (now >= this.state.daily.resetTime) {
      this.state.daily = { count: 0, resetTime: this.getDailyResetTime() };
    }
    
    if (now >= this.state.perMinute.resetTime) {
      this.state.perMinute = { count: 0, resetTime: this.getMinuteResetTime() };
    }
    
    if (now >= this.state.burst.resetTime) {
      this.state.burst = { count: 0, resetTime: this.getBurstResetTime() };
    }
  }

  checkRateLimit(): RateLimitResult {
    this.cleanupExpiredLimits();
    
    const now = Date.now();
    const remainingQuota = {
      monthly: Math.max(0, this.config.monthly - this.state.monthly.count),
      daily: Math.max(0, this.config.daily - this.state.daily.count),
      perMinute: Math.max(0, this.config.perMinute - this.state.perMinute.count),
      burst: Math.max(0, this.config.burst - this.state.burst.count)
    };

    // Check each limit
    if (this.state.monthly.count >= this.config.monthly) {
      return {
        allowed: false,
        reason: 'Monthly quota exceeded',
        retryAfter: Math.ceil((this.state.monthly.resetTime - now) / 1000),
        remainingQuota
      };
    }

    if (this.state.daily.count >= this.config.daily) {
      return {
        allowed: false,
        reason: 'Daily quota exceeded',
        retryAfter: Math.ceil((this.state.daily.resetTime - now) / 1000),
        remainingQuota
      };
    }

    if (this.state.perMinute.count >= this.config.perMinute) {
      return {
        allowed: false,
        reason: 'Per-minute rate limit exceeded',
        retryAfter: Math.ceil((this.state.perMinute.resetTime - now) / 1000),
        remainingQuota
      };
    }

    if (this.state.burst.count >= this.config.burst) {
      return {
        allowed: false,
        reason: 'Burst rate limit exceeded',
        retryAfter: Math.ceil((this.state.burst.resetTime - now) / 1000),
        remainingQuota
      };
    }

    return {
      allowed: true,
      remainingQuota
    };
  }

  consumeQuota(endpoint: string = 'search'): void {
    const now = Date.now();
    
    // Increment all counters
    this.state.monthly.count++;
    this.state.daily.count++;
    this.state.perMinute.count++;
    this.state.burst.count++;

    // Record the request
    this.requestHistory.push({
      timestamp: now,
      successful: true, // Will be updated later if needed
      responseTime: 0,   // Will be updated when request completes
      endpoint
    });

    // Trim history if it gets too large
    if (this.requestHistory.length > this.MAX_HISTORY_SIZE) {
      this.requestHistory = this.requestHistory.slice(-this.MAX_HISTORY_SIZE);
    }

    this.saveState();
    
    // Update monitoring
    linkedInMonitoring.recordRequest(true, 0);
  }

  recordRequestComplete(successful: boolean, responseTime: number): void {
    // Update the most recent request record
    if (this.requestHistory.length > 0) {
      const lastRequest = this.requestHistory[this.requestHistory.length - 1];
      lastRequest.successful = successful;
      lastRequest.responseTime = responseTime;
    }

    // If the request failed, we might want to give back some quota
    // This is a design decision - you could implement more sophisticated logic
    if (!successful) {
      // For now, we'll still consume the quota even for failed requests
      // to prevent abuse, but you could implement backoff logic here
    }

    this.saveState();
  }

  // Get current status
  getStatus() {
    this.cleanupExpiredLimits();
    
    const now = Date.now();
    return {
      limits: this.config,
      current: {
        monthly: this.state.monthly.count,
        daily: this.state.daily.count,
        perMinute: this.state.perMinute.count,
        burst: this.state.burst.count
      },
      remaining: {
        monthly: Math.max(0, this.config.monthly - this.state.monthly.count),
        daily: Math.max(0, this.config.daily - this.state.daily.count),
        perMinute: Math.max(0, this.config.perMinute - this.state.perMinute.count),
        burst: Math.max(0, this.config.burst - this.state.burst.count)
      },
      resetTimes: {
        monthly: new Date(this.state.monthly.resetTime),
        daily: new Date(this.state.daily.resetTime),
        perMinute: new Date(this.state.perMinute.resetTime),
        burst: new Date(this.state.burst.resetTime)
      },
      utilizationPercentage: {
        monthly: (this.state.monthly.count / this.config.monthly) * 100,
        daily: (this.state.daily.count / this.config.daily) * 100,
        perMinute: (this.state.perMinute.count / this.config.perMinute) * 100,
        burst: (this.state.burst.count / this.config.burst) * 100
      }
    };
  }

  // Get request statistics
  getRequestStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    const now = Date.now();
    let startTime: number;
    
    switch (timeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }

    const relevantRequests = this.requestHistory.filter(
      req => req.timestamp >= startTime
    );

    const successfulRequests = relevantRequests.filter(req => req.successful);
    const failedRequests = relevantRequests.filter(req => !req.successful);
    
    const responseTimes = successfulRequests.map(req => req.responseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const endpointCounts = relevantRequests.reduce((acc, req) => {
      acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      timeRange,
      totalRequests: relevantRequests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: relevantRequests.length > 0 
        ? (successfulRequests.length / relevantRequests.length) * 100 
        : 0,
      averageResponseTime: avgResponseTime,
      requestsPerHour: relevantRequests.length / (timeRange === '1h' ? 1 : 
        timeRange === '24h' ? 24 : timeRange === '7d' ? 24 * 7 : 24 * 30),
      endpointBreakdown: endpointCounts
    };
  }

  // Reset specific quotas (for testing or administrative purposes)
  resetQuota(type?: 'monthly' | 'daily' | 'perMinute' | 'burst') {
    if (type) {
      switch (type) {
        case 'monthly':
          this.state.monthly = { count: 0, resetTime: this.getMonthlyResetTime() };
          break;
        case 'daily':
          this.state.daily = { count: 0, resetTime: this.getDailyResetTime() };
          break;
        case 'perMinute':
          this.state.perMinute = { count: 0, resetTime: this.getMinuteResetTime() };
          break;
        case 'burst':
          this.state.burst = { count: 0, resetTime: this.getBurstResetTime() };
          break;
      }
    } else {
      // Reset all quotas
      this.state = {
        monthly: { count: 0, resetTime: this.getMonthlyResetTime() },
        daily: { count: 0, resetTime: this.getDailyResetTime() },
        perMinute: { count: 0, resetTime: this.getMinuteResetTime() },
        burst: { count: 0, resetTime: this.getBurstResetTime() }
      };
    }
    
    this.saveState();
  }

  // Clear request history
  clearHistory(): void {
    this.requestHistory = [];
    localStorage.removeItem(this.HISTORY_KEY);
  }

  // Get warning levels for monitoring
  getWarningLevels() {
    const status = this.getStatus();
    const warnings = [];

    if (status.utilizationPercentage.monthly > 90) {
      warnings.push({ level: 'critical', message: 'Monthly quota at 90%+ capacity' });
    } else if (status.utilizationPercentage.monthly > 75) {
      warnings.push({ level: 'warning', message: 'Monthly quota at 75%+ capacity' });
    }

    if (status.utilizationPercentage.daily > 90) {
      warnings.push({ level: 'critical', message: 'Daily quota at 90%+ capacity' });
    } else if (status.utilizationPercentage.daily > 75) {
      warnings.push({ level: 'warning', message: 'Daily quota at 75%+ capacity' });
    }

    if (status.utilizationPercentage.perMinute > 80) {
      warnings.push({ level: 'warning', message: 'Approaching per-minute rate limit' });
    }

    return warnings;
  }
}

// Global rate limiter instance
export const linkedInRateLimit = new LinkedInRateLimit();

// Utility function to check if a request should be allowed
export async function checkAndConsumeRateLimit(endpoint: string = 'search'): Promise<RateLimitResult> {
  if (!linkedInConfig.api.braveKey) {
    return {
      allowed: false,
      reason: 'API key not configured',
      remainingQuota: { monthly: 0, daily: 0, perMinute: 0, burst: 0 }
    };
  }

  const result = linkedInRateLimit.checkRateLimit();
  
  if (result.allowed) {
    linkedInRateLimit.consumeQuota(endpoint);
  } else {
    // Record rate limit hit for monitoring
    linkedInMonitoring.recordError(
      new Error(`Rate limit exceeded: ${result.reason}`),
      'rate_limiting'
    );
  }

  return result;
}

// Utility function to record request completion
export function recordRequestCompletion(successful: boolean, responseTime: number): void {
  linkedInRateLimit.recordRequestComplete(successful, responseTime);
  linkedInMonitoring.recordRequest(successful, responseTime);
}