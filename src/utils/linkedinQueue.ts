import { supabase } from './supabase';
import { linkedInCache } from './linkedinCache';
import type { LinkedInSearchResult } from '../jobTypes';

interface SearchRequest {
  id: string;
  companyName: string;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
  resolve: (results: LinkedInSearchResult[]) => void;
  reject: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
}

interface RateLimitConfig {
  dailyLimit: number;
  monthlyLimit: number;
  requestsPerMinute: number;
  burstLimit: number;
}

interface QueueStats {
  queueLength: number;
  processing: boolean;
  requestsToday: number;
  requestsThisMonth: number;
  requestsThisMinute: number;
  lastRequestTime: number;
  averageProcessingTime: number;
  successRate: number;
}

export class LinkedInSearchQueue {
  private queue: SearchRequest[] = [];
  private processing = false;
  private requestLog: Map<string, number[]> = new Map(); // Date -> request counts
  private dailyRequests = 0;
  private monthlyRequests = 0;
  private minuteRequests: number[] = []; // Track requests in current minute
  private lastResetTime = Date.now();
  private lastMinuteReset = Date.now();
  
  private readonly config: RateLimitConfig = {
    dailyLimit: 500, // Conservative daily limit
    monthlyLimit: 2000, // Brave API free tier limit
    requestsPerMinute: 10, // Reasonable rate to avoid overwhelming API
    burstLimit: 5 // Max burst requests
  };

  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    responseTimeSum: 0
  };

  constructor() {
    // Reset daily counter at midnight
    this.scheduleDailyReset();
    
    // Reset monthly counter at beginning of month
    this.scheduleMonthlyReset();
    
    // Process queue continuously
    this.startQueueProcessor();
  }

  /**
   * Add a search request to the queue
   */
  async add(
    companyName: string, 
    priority: 'high' | 'normal' | 'low' = 'normal',
    maxRetries = 2
  ): Promise<LinkedInSearchResult[]> {
    // Check cache first
    const cached = await linkedInCache.get(companyName);
    if (cached) {
      return cached;
    }

    // Check rate limits
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    return new Promise((resolve, reject) => {
      const request: SearchRequest = {
        id: this.generateRequestId(),
        companyName: companyName.trim(),
        timestamp: Date.now(),
        priority,
        resolve,
        reject,
        retryCount: 0,
        maxRetries
      };

      // Insert request based on priority
      this.insertByPriority(request);
      
      // Start processing if not already running
      this.processQueue();
    });
  }

  /**
   * Batch search multiple companies
   */
  async batchSearch(companies: string[]): Promise<Map<string, LinkedInSearchResult[]>> {
    const results = new Map<string, LinkedInSearchResult[]>();
    
    // Create batch of requests with high priority
    const batchPromises = companies.map(async (company) => {
      try {
        const result = await this.add(company, 'high');
        results.set(company, result);
      } catch (error) {
        console.warn(`Failed to search for ${company}:`, error);
        results.set(company, []);
      }
    });

    await Promise.allSettled(batchPromises);
    return results;
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      requestsToday: this.dailyRequests,
      requestsThisMonth: this.monthlyRequests,
      requestsThisMinute: this.minuteRequests.length,
      lastRequestTime: this.lastResetTime,
      averageProcessingTime: this.stats.totalRequests > 0 
        ? this.stats.responseTimeSum / this.stats.totalRequests 
        : 0,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
        : 0
    };
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(): { daily: number; monthly: number; minute: number } {
    return {
      daily: Math.max(0, this.config.dailyLimit - this.dailyRequests),
      monthly: Math.max(0, this.config.monthlyLimit - this.monthlyRequests),
      minute: Math.max(0, this.config.requestsPerMinute - this.minuteRequests.length)
    };
  }

  /**
   * Clear the queue (emergency stop)
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.processing = false;
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    this.processQueue();
  }

  // Private methods

  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset minute counter if needed
    if (now - this.lastMinuteReset > 60000) {
      this.minuteRequests = [];
      this.lastMinuteReset = now;
    }

    // Check all rate limits
    return (
      this.dailyRequests < this.config.dailyLimit &&
      this.monthlyRequests < this.config.monthlyLimit &&
      this.minuteRequests.length < this.config.requestsPerMinute
    );
  }

  private insertByPriority(request: SearchRequest): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    let insertIndex = this.queue.length;
    
    // Find insertion point based on priority
    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[request.priority] < priorityOrder[this.queue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, request);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.canMakeRequest()) {
      const request = this.queue.shift()!;
      
      try {
        const startTime = Date.now();
        const results = await this.executeSearch(request.companyName);
        const endTime = Date.now();
        
        // Update statistics
        this.updateStats(true, endTime - startTime);
        this.logRequest();
        
        // Cache results
        await linkedInCache.set(request.companyName, results);
        
        request.resolve(results);
      } catch (error) {
        // Handle retry logic
        if (request.retryCount < request.maxRetries) {
          request.retryCount++;
          
          // Add exponential backoff
          const delay = Math.pow(2, request.retryCount) * 1000;
          setTimeout(() => {
            this.insertByPriority(request);
          }, delay);
        } else {
          this.updateStats(false, 0);
          request.reject(error instanceof Error ? error : new Error('Search failed'));
        }
      }

      // Add delay between requests to respect rate limits
      await this.waitBetweenRequests();
    }

    this.processing = false;

    // Continue processing if more items were added
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async executeSearch(companyName: string): Promise<LinkedInSearchResult[]> {
    const response = await supabase.functions.invoke('discover-linkedin-company', {
      body: { companyName }
    });

    if (response.error) {
      throw new Error(response.error.message || 'LinkedIn search failed');
    }

    return response.data?.results || [];
  }

  private async waitBetweenRequests(): Promise<void> {
    // Calculate dynamic delay based on current load
    const baseDelay = 100; // 100ms base delay
    const queuePenalty = Math.min(this.queue.length * 50, 500); // Up to 500ms penalty for queue length
    const ratePenalty = this.minuteRequests.length > this.config.requestsPerMinute / 2 ? 200 : 0;
    
    const totalDelay = baseDelay + queuePenalty + ratePenalty;
    
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  private logRequest(): void {
    const now = Date.now();
    
    // Update counters
    this.dailyRequests++;
    this.monthlyRequests++;
    this.minuteRequests.push(now);
    
    // Clean up old minute requests
    const oneMinuteAgo = now - 60000;
    this.minuteRequests = this.minuteRequests.filter(time => time > oneMinuteAgo);
    
    // Log to persistent storage for rate limit tracking
    const today = new Date().toDateString();
    const todayRequests = this.requestLog.get(today) || [];
    todayRequests.push(now);
    this.requestLog.set(today, todayRequests);
    
    // Clean up old logs (keep last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const [date, requests] of this.requestLog.entries()) {
      if (requests[0] < thirtyDaysAgo) {
        this.requestLog.delete(date);
      }
    }
  }

  private updateStats(success: boolean, responseTime: number): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      this.stats.responseTimeSum += responseTime;
    } else {
      this.stats.failedRequests++;
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyRequests = 0;
      this.scheduleDailyReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  private scheduleMonthlyReset(): void {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const msUntilNextMonth = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.monthlyRequests = 0;
      this.scheduleMonthlyReset(); // Schedule next reset
    }, msUntilNextMonth);
  }

  private startQueueProcessor(): void {
    // Process queue every 5 seconds if there are pending requests
    setInterval(() => {
      if (this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 5000);
  }
}

// Singleton instance
export const linkedInSearchQueue = new LinkedInSearchQueue();

/**
 * Convenience function for searching companies with automatic queuing
 */
export async function searchLinkedInCompany(
  companyName: string,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<LinkedInSearchResult[]> {
  return linkedInSearchQueue.add(companyName, priority);
}

/**
 * Batch search multiple companies efficiently
 */
export async function batchSearchLinkedInCompanies(
  companies: string[]
): Promise<Map<string, LinkedInSearchResult[]>> {
  return linkedInSearchQueue.batchSearch(companies);
}

/**
 * Get queue status for monitoring
 */
export function getQueueStatus(): QueueStats {
  return linkedInSearchQueue.getStats();
}

/**
 * Emergency queue management
 */
export const queueManager = {
  pause: () => linkedInSearchQueue.pause(),
  resume: () => linkedInSearchQueue.resume(),
  clear: () => linkedInSearchQueue.clearQueue(),
  stats: () => linkedInSearchQueue.getStats(),
  quota: () => linkedInSearchQueue.getRemainingQuota()
};