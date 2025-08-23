import { useState, useEffect } from 'react';
import { 
  linkedInFeatureFlags, 
  FeatureFlagEvaluation, 
  UserContext 
} from '../utils/linkedinFeatureFlags';

// React hook for using feature flags
export function useFeatureFlag(flagKey: string, context?: Partial<UserContext>): FeatureFlagEvaluation {
  const [evaluation, setEvaluation] = useState(() => 
    linkedInFeatureFlags.isEnabled(flagKey, context)
  );

  useEffect(() => {
    const newEvaluation = linkedInFeatureFlags.isEnabled(flagKey, context);
    setEvaluation(newEvaluation);
  }, [flagKey, context]);

  return evaluation;
}

// React hook for multiple feature flags
export function useFeatureFlags(
  flagKeys: string[], 
  context?: Partial<UserContext>
): Record<string, FeatureFlagEvaluation> {
  const [evaluations, setEvaluations] = useState(() => {
    const results: Record<string, FeatureFlagEvaluation> = {};
    flagKeys.forEach(key => {
      results[key] = linkedInFeatureFlags.isEnabled(key, context);
    });
    return results;
  });

  useEffect(() => {
    const newEvaluations: Record<string, FeatureFlagEvaluation> = {};
    flagKeys.forEach(key => {
      newEvaluations[key] = linkedInFeatureFlags.isEnabled(key, context);
    });
    setEvaluations(newEvaluations);
  }, [flagKeys, context]);

  return evaluations;
}

// Convenience hooks for specific LinkedIn features
export function useLinkedInDiscoveryEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_discovery_enabled', context);
  return evaluation.enabled;
}

export function useAutoSearchEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_auto_search', context);
  return evaluation.enabled;
}

export function useManualEntryEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_manual_entry', context);
  return evaluation.enabled;
}

export function useConfidenceDisplayEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_confidence_display', context);
  return evaluation.enabled;
}

export function useAdvancedCachingEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_advanced_caching', context);
  return evaluation.enabled;
}

export function useDetailedMonitoringEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_monitoring_detailed', context);
  return evaluation.enabled;
}

export function useStrictRateLimitingEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_rate_limit_strict', context);
  return evaluation.enabled;
}

export function useErrorBoundaryEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_error_boundary', context);
  return evaluation.enabled;
}

export function useQueueSystemEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_queue_system', context);
  return evaluation.enabled;
}

export function useNewUITestEnabled(context?: Partial<UserContext>): boolean {
  const evaluation = useFeatureFlag('linkedin_ab_test_new_ui', context);
  return evaluation.enabled;
}

// Hook for getting all LinkedIn-related feature flags
export function useLinkedInFeatureFlags(context?: Partial<UserContext>): Record<string, FeatureFlagEvaluation> {
  const linkedInFlags = [
    'linkedin_discovery_enabled',
    'linkedin_auto_search',
    'linkedin_manual_entry',
    'linkedin_confidence_display',
    'linkedin_advanced_caching',
    'linkedin_monitoring_detailed',
    'linkedin_rate_limit_strict',
    'linkedin_error_boundary',
    'linkedin_queue_system',
    'linkedin_ab_test_new_ui'
  ];

  return useFeatureFlags(linkedInFlags, context);
}

// Hook for A/B testing
export function useABTest(testKey: string, context?: Partial<UserContext>): {
  isInTest: boolean;
  variant: string | undefined;
  evaluation: FeatureFlagEvaluation;
} {
  const evaluation = useFeatureFlag(testKey, context);
  
  return {
    isInTest: evaluation.enabled,
    variant: evaluation.variant,
    evaluation
  };
}