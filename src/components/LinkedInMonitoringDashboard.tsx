import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  Database,
  Zap,
  Globe,
  Settings,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { linkedInMonitoring, HealthCheckResult, MonitoringMetrics } from '../utils/linkedinMonitoring';
import { linkedInConfig } from '../config/linkedinConfig';

interface DashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export function LinkedInMonitoringDashboard({ isVisible, onClose }: DashboardProps) {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [metrics, setMetrics] = useState<MonitoringMetrics>(linkedInMonitoring.getMetrics());
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Refresh data
  const refreshData = async () => {
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
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isVisible, autoRefresh]);

  // Initial load
  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5" />;
      case 'unhealthy': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: decimals 
    }).format(num);
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!isVisible) return null;

  const alerts = linkedInMonitoring.checkAlerts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              LinkedIn Discovery Monitoring
            </h2>
            {healthData && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
                {getStatusIcon(healthData.status)}
                {healthData.status.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Active Alerts
              </h3>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${alert.level === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}
                  >
                    <div className={`text-sm font-medium ${alert.level === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                      {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health */}
          {healthData && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Database</span>
                    </div>
                    {healthData.checks.database ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {healthData.checks.database ? 'Connected' : 'Disconnected'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Brave API</span>
                    </div>
                    {healthData.checks.braveApi ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {healthData.checks.braveApi ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Cache</span>
                    </div>
                    {healthData.checks.cache ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(healthData.metrics.cacheHitRate * 100, 1)}% hit rate
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Edge Function</span>
                    </div>
                    {healthData.checks.edgeFunction ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDuration(healthData.metrics.responseTime)} response
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatNumber(metrics.requests.total)}
                </div>
                <div className="text-sm text-blue-700 mb-1">Total Requests</div>
                <div className="text-xs text-blue-600">
                  {formatNumber(metrics.requests.successful)} successful
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatDuration(metrics.requests.averageResponseTime)}
                </div>
                <div className="text-sm text-green-700 mb-1">Avg Response Time</div>
                <div className="text-xs text-green-600">
                  {metrics.requests.failed > 0 ? `${metrics.requests.failed} failed` : 'All successful'}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatNumber(metrics.cache.hitRate * 100, 1)}%
                </div>
                <div className="text-sm text-purple-700 mb-1">Cache Hit Rate</div>
                <div className="text-xs text-purple-600">
                  {formatNumber(metrics.cache.hits)} hits, {formatNumber(metrics.cache.misses)} misses
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatNumber(metrics.api.quotaUsed)}
                </div>
                <div className="text-sm text-orange-700 mb-1">API Quota Used</div>
                <div className="text-xs text-orange-600">
                  {formatNumber(metrics.api.quotaRemaining)} remaining
                </div>
              </div>
            </div>
          </div>

          {/* Error Summary */}
          {metrics.errors.total > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Error Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-xl font-bold text-red-600 mb-1">
                    {formatNumber(metrics.errors.total)}
                  </div>
                  <div className="text-sm text-red-700 mb-2">Total Errors</div>
                  <div className="space-y-1">
                    {Object.entries(metrics.errors.byType).map(([type, count]) => (
                      <div key={type} className="text-xs text-red-600 flex justify-between">
                        <span>{type}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Errors</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {metrics.errors.recentErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs">
                        <div className="text-gray-600">{new Date(error.timestamp).toLocaleTimeString()}</div>
                        <div className="text-gray-800 truncate">{error.error}</div>
                        <div className="text-gray-500">{error.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700 mb-1">Feature Status</div>
                <div className="text-gray-600">
                  LinkedIn Discovery: {linkedInConfig.features.enabled ? '✓ Enabled' : '✗ Disabled'}
                </div>
                <div className="text-gray-600">
                  Auto Search: {linkedInConfig.features.autoSearch ? '✓ Enabled' : '✗ Disabled'}
                </div>
                <div className="text-gray-600">
                  Manual Entry: {linkedInConfig.features.manualEntry ? '✓ Enabled' : '✗ Disabled'}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700 mb-1">Performance</div>
                <div className="text-gray-600">
                  Debounce: {linkedInConfig.performance.debounceMs}ms
                </div>
                <div className="text-gray-600">
                  Max Concurrent: {linkedInConfig.performance.maxConcurrentRequests}
                </div>
                <div className="text-gray-600">
                  Request Timeout: {formatDuration(linkedInConfig.performance.requestTimeoutMs)}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700 mb-1">Caching</div>
                <div className="text-gray-600">
                  TTL: {linkedInConfig.cache.ttlDays} days
                </div>
                <div className="text-gray-600">
                  Memory Items: {linkedInConfig.cache.maxMemoryItems}
                </div>
                <div className="text-gray-600">
                  Compression: {linkedInConfig.cache.compressionEnabled ? '✓ Enabled' : '✗ Disabled'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <div>Last updated: {lastUpdated.toLocaleTimeString()}</div>
              <div>Monitoring: {linkedInConfig.monitoring.enabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}