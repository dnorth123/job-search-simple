interface LinkedInConfig {
  api: {
    braveKey: string | undefined;
    rateLimit: number;
    timeout: number;
    retries: number;
  };
  cache: {
    ttlDays: number;
    maxMemoryItems: number;
    compressionEnabled: boolean;
  };
  confidence: {
    threshold: number;
    autoSelectThreshold: number;
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number;
  };
  features: {
    enabled: boolean;
    autoSearch: boolean;
    manualEntry: boolean;
    showConfidence: boolean;
    experimentGroup: string;
    rolloutPercentage: number;
  };
  performance: {
    debounceMs: number;
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
  };
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvFloat(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  return value ? parseFloat(value) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const linkedInConfig: LinkedInConfig = {
  api: {
    braveKey: import.meta.env.VITE_BRAVE_SEARCH_API_KEY,
    rateLimit: getEnvNumber('BRAVE_API_RATE_LIMIT', 2000),
    timeout: 10000, // 10 seconds
    retries: 3
  },
  cache: {
    ttlDays: getEnvNumber('LINKEDIN_CACHE_TTL_DAYS', 7),
    maxMemoryItems: 100,
    compressionEnabled: import.meta.env.NODE_ENV === 'production'
  },
  confidence: {
    threshold: getEnvFloat('LINKEDIN_CONFIDENCE_THRESHOLD', 0.7),
    autoSelectThreshold: 0.9
  },
  monitoring: {
    enabled: getEnvBoolean('VITE_MONITORING_ENABLED', import.meta.env.NODE_ENV === 'production'),
    sampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0
  },
  features: {
    enabled: getEnvBoolean('VITE_LINKEDIN_DISCOVERY_ENABLED', true),
    autoSearch: true,
    manualEntry: true,
    showConfidence: true,
    experimentGroup: import.meta.env.VITE_LINKEDIN_EXPERIMENT_GROUP || 'control',
    rolloutPercentage: getEnvNumber('VITE_LINKEDIN_ROLLOUT', 100)
  },
  performance: {
    debounceMs: 500,
    maxConcurrentRequests: 5,
    requestTimeoutMs: 10000
  }
};

/**
 * Check if LinkedIn discovery is enabled for the current user
 */
export function isLinkedInDiscoveryEnabled(): boolean {
  if (!linkedInConfig.features.enabled) {
    return false;
  }

  // Gradual rollout check
  if (linkedInConfig.features.rolloutPercentage < 100) {
    // Use a deterministic hash of user ID or session for consistent rollout
    const rolloutHash = Math.abs(
      (window.localStorage.getItem('user_id') || 'anonymous').split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
    );
    
    const userPercentile = rolloutHash % 100;
    return userPercentile < linkedInConfig.features.rolloutPercentage;
  }

  return true;
}

/**
 * Get experiment variant for A/B testing
 */
export function getExperimentVariant(): 'control' | 'variant_a' | 'variant_b' {
  return linkedInConfig.features.experimentGroup as 'control' | 'variant_a' | 'variant_b';
}

/**
 * Check if monitoring should be applied to this request
 */
export function shouldMonitor(): boolean {
  if (!linkedInConfig.monitoring.enabled) {
    return false;
  }

  return Math.random() < linkedInConfig.monitoring.sampleRate;
}

/**
 * Get rate limit settings
 */
export function getRateLimits() {
  return {
    monthly: linkedInConfig.api.rateLimit,
    daily: Math.floor(linkedInConfig.api.rateLimit / 30), // Rough daily limit
    perMinute: 10,
    burst: 5
  };
}

/**
 * Validate configuration on startup
 */
export function validateLinkedInConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!linkedInConfig.api.braveKey && import.meta.env.NODE_ENV === 'production') {
    errors.push('BRAVE_SEARCH_API_KEY is required in production');
  }

  if (linkedInConfig.api.rateLimit <= 0) {
    errors.push('BRAVE_API_RATE_LIMIT must be positive');
  }

  if (linkedInConfig.confidence.threshold < 0 || linkedInConfig.confidence.threshold > 1) {
    errors.push('LINKEDIN_CONFIDENCE_THRESHOLD must be between 0 and 1');
  }

  if (linkedInConfig.features.rolloutPercentage < 0 || linkedInConfig.features.rolloutPercentage > 100) {
    errors.push('VITE_LINKEDIN_ROLLOUT must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log configuration status (for debugging)
 */
export function logConfigStatus(): void {
  if (import.meta.env.NODE_ENV === 'development') {
    console.group('🔗 LinkedIn Discovery Configuration');
    console.log('Feature enabled:', linkedInConfig.features.enabled);
    console.log('User enabled:', isLinkedInDiscoveryEnabled());
    console.log('Rollout percentage:', linkedInConfig.features.rolloutPercentage);
    console.log('Experiment group:', linkedInConfig.features.experimentGroup);
    console.log('Monitoring enabled:', linkedInConfig.monitoring.enabled);
    console.log('API key configured:', !!linkedInConfig.api.braveKey);
    console.log('Rate limit:', linkedInConfig.api.rateLimit);
    console.groupEnd();
  }
}

// Initialize and validate configuration
const validation = validateLinkedInConfig();
if (!validation.valid) {
  console.error('❌ LinkedIn Discovery configuration errors:', validation.errors);
  if (import.meta.env.NODE_ENV === 'production') {
    // In production, you might want to disable the feature or send alerts
    console.error('LinkedIn Discovery will be disabled due to configuration errors');
  }
}

// Log status in development
if (import.meta.env.NODE_ENV === 'development') {
  logConfigStatus();
}