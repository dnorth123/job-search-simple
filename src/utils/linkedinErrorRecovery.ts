import { linkedInConfig } from '../config/linkedinConfig';
import { linkedInMonitoring } from './linkedinMonitoring';

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeMs: number;
  fallbackStrategies: FallbackStrategy[];
}

export interface FallbackStrategy {
  name: string;
  enabled: boolean;
  priority: number;
  handler: () => Promise<any> | any;
  condition?: (error: Error) => boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
}

export interface ErrorContext {
  operation: string;
  attempt: number;
  originalError: Error;
  timestamp: number;
  userContext?: any;
}

export class LinkedInErrorRecovery {
  private config: ErrorRecoveryConfig;
  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private fallbackCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly FALLBACK_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.config = {
      maxRetries: linkedInConfig.api.retries || 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTimeMs: 60000, // 1 minute
      fallbackStrategies: this.getDefaultFallbackStrategies()
    };
  }

  private getDefaultFallbackStrategies(): FallbackStrategy[] {
    return [
      {
        name: 'cached_results',
        enabled: true,
        priority: 1,
        handler: async () => this.getCachedResults(),
        condition: (error) => error.message.includes('network') || error.message.includes('timeout')
      },
      {
        name: 'manual_entry_prompt',
        enabled: true,
        priority: 2,
        handler: () => this.promptManualEntry(),
        condition: () => true
      },
      {
        name: 'skip_linkedin_discovery',
        enabled: true,
        priority: 3,
        handler: () => this.skipLinkedInDiscovery(),
        condition: () => true
      },
      {
        name: 'offline_mode',
        enabled: true,
        priority: 4,
        handler: () => this.activateOfflineMode(),
        condition: (error) => error.message.includes('network') || !navigator.onLine
      },
      {
        name: 'degraded_search',
        enabled: true,
        priority: 5,
        handler: (companyName: string) => this.degradedSearch(companyName),
        condition: (error) => error.message.includes('api_limit') || error.message.includes('quota')
      }
    ];
  }

  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> {
    const operationKey = `${operationName}_${JSON.stringify(context)}`;
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(operationName)) {
      const fallback = await this.executeFallbackStrategies(
        new Error('Circuit breaker is open'),
        { operation: operationName, attempt: 0, originalError: new Error('Circuit breaker open'), timestamp: Date.now(), userContext: context }
      );
      if (fallback.success) {
        return fallback.result;
      }
      throw new Error(`Circuit breaker is open for ${operationName}`);
    }

    const startTime = Date.now();
    let lastError: Error;
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Record success
        this.recordSuccess(operationName, Date.now() - startTime);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        // Record failure
        this.recordFailure(operationName, lastError, Date.now() - startTime);
        
        // Check if we should retry
        if (attempt < maxAttempts && this.shouldRetry(lastError)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        }
        
        // Final attempt failed, try fallback strategies
        const errorContext: ErrorContext = {
          operation: operationName,
          attempt,
          originalError: lastError,
          timestamp: Date.now(),
          userContext: context
        };

        const fallback = await this.executeFallbackStrategies(lastError, errorContext);
        if (fallback.success) {
          return fallback.result;
        }
        
        // All fallbacks failed, throw original error
        throw lastError;
      }
    }

    throw lastError!;
  }

  private async executeFallbackStrategies(
    error: Error, 
    context: ErrorContext
  ): Promise<{ success: boolean; result?: any; strategy?: string }> {
    // Sort strategies by priority
    const applicableStrategies = this.config.fallbackStrategies
      .filter(strategy => strategy.enabled && (!strategy.condition || strategy.condition(error)))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of applicableStrategies) {
      try {
        console.log(`Attempting fallback strategy: ${strategy.name}`);
        
        const result = await strategy.handler(context.userContext);
        
        // Record successful fallback
        linkedInMonitoring.recordError(
          new Error(`Fallback used: ${strategy.name}`),
          `fallback_${context.operation}`
        );

        return {
          success: true,
          result,
          strategy: strategy.name
        };
        
      } catch (fallbackError) {
        console.warn(`Fallback strategy ${strategy.name} failed:`, fallbackError);
        continue;
      }
    }

    return { success: false };
  }

  private shouldRetry(error: Error): boolean {
    const retryableErrorMessages = [
      'timeout',
      'network error',
      'connection failed',
      'ECONNRESET',
      'ETIMEDOUT',
      'fetch failed',
      '5', // 5xx status codes
      'rate limit'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrorMessages.some(msg => errorMessage.includes(msg));
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelayMs;
    
    if (this.config.exponentialBackoff) {
      // Exponential backoff with jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * exponentialDelay;
      return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }
    
    return baseDelay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isCircuitBreakerOpen(operation: string): boolean {
    const state = this.circuitBreakerStates.get(operation);
    if (!state) return false;

    const now = Date.now();
    
    if (state.state === 'OPEN') {
      if (now > state.nextAttemptTime) {
        state.state = 'HALF_OPEN';
        state.successCount = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordSuccess(operation: string, responseTime: number): void {
    const state = this.circuitBreakerStates.get(operation) || {
      state: 'CLOSED' as const,
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextAttemptTime: 0
    };

    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      if (state.successCount >= 2) {
        state.state = 'CLOSED';
        state.failureCount = 0;
      }
    } else if (state.state === 'CLOSED') {
      state.failureCount = Math.max(0, state.failureCount - 1);
    }

    this.circuitBreakerStates.set(operation, state);
    linkedInMonitoring.recordRequest(true, responseTime);
  }

  private recordFailure(operation: string, error: Error, responseTime: number): void {
    const state = this.circuitBreakerStates.get(operation) || {
      state: 'CLOSED' as const,
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextAttemptTime: 0
    };

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= this.config.circuitBreakerThreshold) {
      state.state = 'OPEN';
      state.nextAttemptTime = Date.now() + this.config.circuitBreakerResetTimeMs;
    }

    this.circuitBreakerStates.set(operation, state);
    linkedInMonitoring.recordRequest(false, responseTime);
    linkedInMonitoring.recordError(error, operation);
  }

  // Fallback strategy implementations
  private async getCachedResults(): Promise<any> {
    try {
      const cachedData = localStorage.getItem('linkedin_fallback_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        
        // Return cached results if they're not too old
        if (now - parsed.timestamp < this.FALLBACK_CACHE_TTL) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached fallback data:', error);
    }
    
    throw new Error('No cached results available');
  }

  private promptManualEntry(): any {
    // Dispatch custom event for manual entry
    window.dispatchEvent(new CustomEvent('linkedinDiscoveryManualEntry', {
      detail: { reason: 'fallback_manual_entry' }
    }));
    
    return {
      mode: 'manual',
      message: 'Please enter LinkedIn URL manually'
    };
  }

  private skipLinkedInDiscovery(): any {
    return {
      mode: 'skip',
      message: 'LinkedIn discovery skipped due to errors'
    };
  }

  private activateOfflineMode(): any {
    // Store offline mode state
    localStorage.setItem('linkedin_offline_mode', 'true');
    
    return {
      mode: 'offline',
      message: 'Working in offline mode',
      features: {
        discovery: false,
        validation: false,
        analytics: false
      }
    };
  }

  private async degradedSearch(companyName: string): Promise<any> {
    // Simple pattern matching for common companies
    const commonCompanies = [
      { pattern: /microsoft/i, url: 'https://linkedin.com/company/microsoft' },
      { pattern: /google/i, url: 'https://linkedin.com/company/google' },
      { pattern: /apple/i, url: 'https://linkedin.com/company/apple' },
      { pattern: /amazon/i, url: 'https://linkedin.com/company/amazon' },
      { pattern: /meta/i, url: 'https://linkedin.com/company/meta' },
      { pattern: /tesla/i, url: 'https://linkedin.com/company/tesla-motors' },
      { pattern: /netflix/i, url: 'https://linkedin.com/company/netflix' }
    ];

    for (const company of commonCompanies) {
      if (company.pattern.test(companyName)) {
        return [{
          url: company.url,
          companyName: companyName,
          vanityName: company.url.split('/').pop(),
          description: `${companyName} - LinkedIn company page`,
          confidence: 0.8,
          source: 'degraded_search'
        }];
      }
    }

    // Generate a best-guess LinkedIn URL
    const vanityName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return [{
      url: `https://linkedin.com/company/${vanityName}`,
      companyName: companyName,
      vanityName: vanityName,
      description: `Suggested LinkedIn URL for ${companyName}`,
      confidence: 0.5,
      source: 'degraded_search'
    }];
  }

  // Public methods for configuration
  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addFallbackStrategy(strategy: FallbackStrategy): void {
    this.config.fallbackStrategies.push(strategy);
    this.config.fallbackStrategies.sort((a, b) => a.priority - b.priority);
  }

  removeFallbackStrategy(name: string): void {
    this.config.fallbackStrategies = this.config.fallbackStrategies
      .filter(s => s.name !== name);
  }

  updateFallbackStrategy(name: string, updates: Partial<FallbackStrategy>): boolean {
    const strategy = this.config.fallbackStrategies.find(s => s.name === name);
    if (strategy) {
      Object.assign(strategy, updates);
      if (updates.priority !== undefined) {
        this.config.fallbackStrategies.sort((a, b) => a.priority - b.priority);
      }
      return true;
    }
    return false;
  }

  // Cache management
  setCachedFallback(data: any): void {
    try {
      localStorage.setItem('linkedin_fallback_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache fallback data:', error);
    }
  }

  clearFallbackCache(): void {
    localStorage.removeItem('linkedin_fallback_cache');
    localStorage.removeItem('linkedin_offline_mode');
    this.fallbackCache.clear();
  }

  // Circuit breaker management
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakerStates);
  }

  resetCircuitBreaker(operation: string): boolean {
    const state = this.circuitBreakerStates.get(operation);
    if (state) {
      state.state = 'CLOSED';
      state.failureCount = 0;
      state.successCount = 0;
      state.nextAttemptTime = 0;
      return true;
    }
    return false;
  }

  forceOpenCircuitBreaker(operation: string): void {
    const state = this.circuitBreakerStates.get(operation) || {
      state: 'CLOSED' as const,
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextAttemptTime: 0
    };
    
    state.state = 'OPEN';
    state.nextAttemptTime = Date.now() + this.config.circuitBreakerResetTimeMs;
    this.circuitBreakerStates.set(operation, state);
  }

  // Health check
  getHealthStatus(): {
    openCircuitBreakers: string[];
    totalFailures: number;
    activeFallbackStrategies: number;
    isOfflineMode: boolean;
  } {
    const openCircuitBreakers = Array.from(this.circuitBreakerStates.entries())
      .filter(([_, state]) => state.state === 'OPEN')
      .map(([operation]) => operation);

    const totalFailures = Array.from(this.circuitBreakerStates.values())
      .reduce((sum, state) => sum + state.failureCount, 0);

    const activeFallbackStrategies = this.config.fallbackStrategies
      .filter(s => s.enabled).length;

    const isOfflineMode = localStorage.getItem('linkedin_offline_mode') === 'true';

    return {
      openCircuitBreakers,
      totalFailures,
      activeFallbackStrategies,
      isOfflineMode
    };
  }

  // Testing utilities
  simulateError(operation: string, errorType: 'network' | 'timeout' | 'api_limit' | 'generic'): void {
    const errorMessages = {
      network: 'Network error: Failed to fetch',
      timeout: 'Request timeout',
      api_limit: 'API rate limit exceeded',
      generic: 'Unknown error'
    };

    const error = new Error(errorMessages[errorType]);
    this.recordFailure(operation, error, 0);
  }

  // Export/import configuration
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      this.updateConfig(config);
      return true;
    } catch (error) {
      console.error('Failed to import error recovery config:', error);
      return false;
    }
  }
}

// Global error recovery instance
export const linkedInErrorRecovery = new LinkedInErrorRecovery();

// Wrapper function for easy use
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: any
): Promise<T> {
  return linkedInErrorRecovery.executeWithRecovery(operation, operationName, context);
}