import { linkedInConfig } from '../config/linkedinConfig';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  experimentGroup?: string;
  conditions?: FeatureFlagCondition[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'email_domain' | 'session_age' | 'browser' | 'custom';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  reason: string;
  variant?: string;
  metadata?: Record<string, any>;
}

export interface UserContext {
  userId?: string;
  email?: string;
  sessionId?: string;
  sessionAge?: number;
  browser?: string;
  custom?: Record<string, any>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private cache: Map<string, { result: FeatureFlagEvaluation; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'linkedin_feature_flags';
  private readonly USER_CONTEXT_KEY = 'linkedin_user_context';

  constructor() {
    this.initializeDefaultFlags();
    this.loadStoredFlags();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'linkedin_discovery_enabled',
        name: 'LinkedIn Discovery',
        description: 'Enable LinkedIn company discovery feature',
        enabled: linkedInConfig.features.enabled,
        rolloutPercentage: linkedInConfig.features.rolloutPercentage,
        experimentGroup: linkedInConfig.features.experimentGroup,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_auto_search',
        name: 'Auto Search',
        description: 'Automatically search for LinkedIn companies when typing',
        enabled: linkedInConfig.features.autoSearch,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_manual_entry',
        name: 'Manual Entry',
        description: 'Allow manual entry of LinkedIn URLs',
        enabled: linkedInConfig.features.manualEntry,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_confidence_display',
        name: 'Show Confidence Scores',
        description: 'Display confidence scores for LinkedIn matches',
        enabled: linkedInConfig.features.showConfidence,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_advanced_caching',
        name: 'Advanced Caching',
        description: 'Enable two-tier caching system for better performance',
        enabled: true,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_monitoring_detailed',
        name: 'Detailed Monitoring',
        description: 'Enable detailed monitoring and analytics collection',
        enabled: linkedInConfig.monitoring.enabled,
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'custom',
            operator: 'equals',
            value: 'production'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_rate_limit_strict',
        name: 'Strict Rate Limiting',
        description: 'Enable strict rate limiting for production',
        enabled: import.meta.env.NODE_ENV === 'production',
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_error_boundary',
        name: 'Error Boundary',
        description: 'Enable error boundary for graceful error handling',
        enabled: true,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_queue_system',
        name: 'Request Queue System',
        description: 'Enable request queuing for better performance',
        enabled: true,
        rolloutPercentage: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'linkedin_ab_test_new_ui',
        name: 'A/B Test: New UI',
        description: 'Test new LinkedIn discovery UI components',
        enabled: true,
        rolloutPercentage: 20,
        experimentGroup: 'ui_test_2024',
        conditions: [
          {
            type: 'custom',
            operator: 'equals',
            value: 'beta_user'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  private loadStoredFlags(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const storedFlags: FeatureFlag[] = JSON.parse(stored);
        storedFlags.forEach(flag => {
          // Only override if the stored flag is newer
          const existing = this.flags.get(flag.key);
          if (!existing || new Date(flag.updatedAt) > new Date(existing.updatedAt)) {
            this.flags.set(flag.key, flag);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load stored feature flags:', error);
    }
  }

  private saveFlags(): void {
    try {
      const flagsArray = Array.from(this.flags.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(flagsArray));
    } catch (error) {
      console.warn('Failed to save feature flags:', error);
    }
  }

  private getUserContext(): UserContext {
    try {
      const stored = localStorage.getItem(this.USER_CONTEXT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user context:', error);
    }

    // Generate default context
    const context: UserContext = {
      sessionId: this.generateSessionId(),
      sessionAge: Date.now(),
      browser: this.getBrowserInfo(),
      custom: {}
    };

    this.setUserContext(context);
    return context;
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getBrowserInfo(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'other';
  }

  setUserContext(context: Partial<UserContext>): void {
    try {
      const current = this.getUserContext();
      const updated = { ...current, ...context };
      localStorage.setItem(this.USER_CONTEXT_KEY, JSON.stringify(updated));
      
      // Clear evaluation cache when context changes
      this.cache.clear();
    } catch (error) {
      console.warn('Failed to save user context:', error);
    }
  }

  private evaluateConditions(conditions: FeatureFlagCondition[], context: UserContext): boolean {
    return conditions.every(condition => {
      const contextValue = this.getContextValue(condition.type, context);
      return this.evaluateCondition(condition, contextValue);
    });
  }

  private getContextValue(type: string, context: UserContext): any {
    switch (type) {
      case 'user_id': return context.userId;
      case 'email_domain': return context.email?.split('@')[1];
      case 'session_age': return Date.now() - (context.sessionAge || 0);
      case 'browser': return context.browser;
      case 'custom': return context.custom;
      default: return undefined;
    }
  }

  private evaluateCondition(condition: FeatureFlagCondition, contextValue: any): boolean {
    if (contextValue === undefined || contextValue === null) return false;

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'starts_with':
        return String(contextValue).startsWith(String(condition.value));
      case 'ends_with':
        return String(contextValue).endsWith(String(condition.value));
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      default:
        return false;
    }
  }

  private generateUserHash(context: UserContext): number {
    const hashString = context.userId || context.sessionId || 'anonymous';
    return Math.abs(hashString.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
  }

  isEnabled(flagKey: string, context?: Partial<UserContext>): FeatureFlagEvaluation {
    const cacheKey = `${flagKey}_${JSON.stringify(context || {})}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    const flag = this.flags.get(flagKey);
    if (!flag) {
      const result: FeatureFlagEvaluation = {
        flagKey,
        enabled: false,
        reason: 'Flag not found'
      };
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    const userContext = { ...this.getUserContext(), ...context };
    let result: FeatureFlagEvaluation;

    // Check if flag is globally disabled
    if (!flag.enabled) {
      result = {
        flagKey,
        enabled: false,
        reason: 'Flag is disabled',
        variant: flag.experimentGroup
      };
    }
    // Check conditions
    else if (flag.conditions && !this.evaluateConditions(flag.conditions, userContext)) {
      result = {
        flagKey,
        enabled: false,
        reason: 'Conditions not met',
        variant: flag.experimentGroup
      };
    }
    // Check rollout percentage
    else if (flag.rolloutPercentage < 100) {
      const userHash = this.generateUserHash(userContext);
      const userPercentile = userHash % 100;
      
      if (userPercentile < flag.rolloutPercentage) {
        result = {
          flagKey,
          enabled: true,
          reason: `Rollout: ${flag.rolloutPercentage}% (user in ${userPercentile}th percentile)`,
          variant: flag.experimentGroup
        };
      } else {
        result = {
          flagKey,
          enabled: false,
          reason: `Rollout: ${flag.rolloutPercentage}% (user not selected)`,
          variant: flag.experimentGroup
        };
      }
    }
    // Flag is enabled for all
    else {
      result = {
        flagKey,
        enabled: true,
        reason: 'Flag is fully enabled',
        variant: flag.experimentGroup
      };
    }

    // Add metadata
    result.metadata = {
      flagName: flag.name,
      rolloutPercentage: flag.rolloutPercentage,
      experimentGroup: flag.experimentGroup,
      evaluatedAt: new Date().toISOString()
    };

    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  // Convenience methods
  isLinkedInDiscoveryEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_discovery_enabled', context).enabled;
  }

  isAutoSearchEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_auto_search', context).enabled;
  }

  isManualEntryEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_manual_entry', context).enabled;
  }

  shouldShowConfidence(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_confidence_display', context).enabled;
  }

  isAdvancedCachingEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_advanced_caching', context).enabled;
  }

  isDetailedMonitoringEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_monitoring_detailed', context).enabled;
  }

  isStrictRateLimitingEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_rate_limit_strict', context).enabled;
  }

  isErrorBoundaryEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_error_boundary', context).enabled;
  }

  isQueueSystemEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_queue_system', context).enabled;
  }

  isNewUITestEnabled(context?: Partial<UserContext>): boolean {
    return this.isEnabled('linkedin_ab_test_new_ui', context).enabled;
  }

  // Admin methods
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) return false;

    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flagKey, updatedFlag);
    this.saveFlags();
    this.cache.clear(); // Clear cache when flags change
    return true;
  }

  addFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): boolean {
    if (this.flags.has(flag.key)) return false;

    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flag.key, newFlag);
    this.saveFlags();
    return true;
  }

  removeFlag(flagKey: string): boolean {
    if (!this.flags.has(flagKey)) return false;
    
    this.flags.delete(flagKey);
    this.saveFlags();
    this.cache.clear();
    return true;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  // Get evaluation results for all flags
  evaluateAllFlags(context?: Partial<UserContext>): Record<string, FeatureFlagEvaluation> {
    const results: Record<string, FeatureFlagEvaluation> = {};
    
    for (const flagKey of this.flags.keys()) {
      results[flagKey] = this.isEnabled(flagKey, context);
    }
    
    return results;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.CACHE_TTL,
      hitRate: this.cache.size > 0 ? 'Available' : 'No data'
    };
  }

  // Export flags for backup/sync
  exportFlags(): string {
    return JSON.stringify(Array.from(this.flags.values()), null, 2);
  }

  // Import flags from backup/sync
  importFlags(flagsJson: string): boolean {
    try {
      const importedFlags: FeatureFlag[] = JSON.parse(flagsJson);
      
      importedFlags.forEach(flag => {
        this.flags.set(flag.key, flag);
      });
      
      this.saveFlags();
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Failed to import flags:', error);
      return false;
    }
  }
}

// Global feature flag manager
export const linkedInFeatureFlags = new FeatureFlagManager();

