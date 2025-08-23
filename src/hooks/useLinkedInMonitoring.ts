import { useState, useEffect, useCallback } from 'react';
import { linkedInMonitoring, HealthCheckResult, MonitoringMetrics } from '../utils/linkedinMonitoring';
import { linkedInConfig } from '../config/linkedinConfig';

interface MonitoringHookReturn {
  healthData: HealthCheckResult | null;
  metrics: MonitoringMetrics;
  isLoading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  alerts: Array<{ level: 'warning' | 'critical'; message: string }>;
  isHealthy: boolean;
  enableAutoRefresh: (enabled: boolean, interval?: number) => void;
  exportMetrics: () => string;
  clearMetrics: () => void;
}

export function useLinkedInMonitoring(
  autoRefresh: boolean = false,
  refreshInterval: number = 30000
): MonitoringHookReturn {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [metrics, setMetrics] = useState<MonitoringMetrics>(linkedInMonitoring.getMetrics());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [currentInterval, setCurrentInterval] = useState(refreshInterval);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!linkedInConfig.monitoring.enabled) {
      return;
    }

    setIsLoading(true);
    try {
      const [health, currentMetrics] = await Promise.all([
        linkedInMonitoring.performHealthCheck(),
        Promise.resolve(linkedInMonitoring.getMetrics())
      ]);
      
      setHealthData(health);
      setMetrics(currentMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enable/disable auto refresh
  const enableAutoRefresh = useCallback((enabled: boolean, interval?: number) => {
    setAutoRefreshEnabled(enabled);
    if (interval) {
      setCurrentInterval(interval);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || !linkedInConfig.monitoring.enabled) {
      return;
    }

    const intervalId = setInterval(refresh, currentInterval);
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, currentInterval, refresh]);

  // Initial load
  useEffect(() => {
    if (linkedInConfig.monitoring.enabled) {
      refresh();
    }
  }, [refresh]);

  // Update metrics periodically from the monitoring instance
  useEffect(() => {
    if (!linkedInConfig.monitoring.enabled) {
      return;
    }

    const metricsInterval = setInterval(() => {
      setMetrics(linkedInMonitoring.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(metricsInterval);
  }, []);

  // Calculate alerts
  const alerts = linkedInMonitoring.checkAlerts();

  // Determine if system is healthy
  const isHealthy = healthData?.status === 'healthy' && alerts.length === 0;

  // Export metrics
  const exportMetrics = useCallback(() => {
    return linkedInMonitoring.exportMetrics();
  }, []);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    linkedInMonitoring.reset();
    setMetrics(linkedInMonitoring.getMetrics());
    setHealthData(null);
    setLastUpdated(null);
  }, []);

  return {
    healthData,
    metrics,
    isLoading,
    lastUpdated,
    refresh,
    alerts,
    isHealthy,
    enableAutoRefresh,
    exportMetrics,
    clearMetrics
  };
}

// Hook specifically for health status monitoring
export function useLinkedInHealthStatus() {
  const [status, setStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (!linkedInConfig.monitoring.enabled) {
      return;
    }

    const checkHealth = async () => {
      try {
        const health = await linkedInMonitoring.performHealthCheck();
        setStatus(health.status);
        setLastCheck(new Date());
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus('unhealthy');
        setLastCheck(new Date());
      }
    };

    // Initial check
    checkHealth();

    // Check every 2 minutes
    const interval = setInterval(checkHealth, 120000);
    return () => clearInterval(interval);
  }, []);

  return { status, lastCheck };
}

// Hook for displaying monitoring alerts as notifications
export function useLinkedInAlerts() {
  const [alerts, setAlerts] = useState<Array<{ 
    id: string;
    level: 'warning' | 'critical'; 
    message: string; 
    timestamp: Date;
    acknowledged: boolean;
  }>>([]);

  useEffect(() => {
    if (!linkedInConfig.monitoring.enabled) {
      return;
    }

    const checkAlerts = () => {
      const currentAlerts = linkedInMonitoring.checkAlerts();
      const timestamp = new Date();
      
      const newAlerts = currentAlerts.map(alert => ({
        id: `${alert.level}_${alert.message}_${timestamp.getTime()}`,
        ...alert,
        timestamp,
        acknowledged: false
      }));

      // Only add alerts that are new (different message/level combination)
      setAlerts(prevAlerts => {
        const existingKeys = new Set(
          prevAlerts
            .filter(alert => !alert.acknowledged)
            .map(alert => `${alert.level}_${alert.message}`)
        );
        
        const filteredNewAlerts = newAlerts.filter(
          alert => !existingKeys.has(`${alert.level}_${alert.message}`)
        );

        return [...prevAlerts, ...filteredNewAlerts];
      });
    };

    // Check for alerts every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    
    // Initial check
    checkAlerts();

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts(prev => 
      prev.map(alert => ({ ...alert, acknowledged: true }))
    );
  }, []);

  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = activeAlerts.filter(alert => alert.level === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.level === 'warning');

  return {
    alerts: activeAlerts,
    criticalAlerts,
    warningAlerts,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearAcknowledgedAlerts,
    hasAlerts: activeAlerts.length > 0,
    hasCriticalAlerts: criticalAlerts.length > 0
  };
}