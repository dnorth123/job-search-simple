import React, { useState, useEffect } from 'react';
import {
  Shield,
  Settings,
  Database,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  RefreshCw,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

// Import dashboard components
import { LinkedInMonitoringDashboard } from './LinkedInMonitoringDashboard';
import { LinkedInFeatureFlagDashboard } from './LinkedInFeatureFlagDashboard';
import { LinkedInRateLimitMonitor } from './LinkedInRateLimitMonitor';

// Import utilities
import { useLinkedInMonitoring } from '../hooks/useLinkedInMonitoring';
import { linkedInFeatureFlags } from '../utils/linkedinFeatureFlags';
import { linkedInRateLimit } from '../utils/linkedinRateLimit';
import { linkedInDatabaseOptimizer, DatabaseStats, OptimizationRecommendation } from '../utils/linkedinDatabaseOptimization';

interface AdminDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType<any>;
  color: string;
}

export function LinkedInAdminDashboard({ isVisible, onClose }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [subDashboardVisible, setSubDashboardVisible] = useState<{
    monitoring: boolean;
    featureFlags: boolean;
  }>({ monitoring: false, featureFlags: false });
  
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string } | null>(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { healthData, metrics, alerts, isHealthy } = useLinkedInMonitoring(true);

  const sections: DashboardSection[] = [
    { id: 'overview', title: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'monitoring', title: 'Monitoring', icon: Activity, color: 'green' },
    { id: 'features', title: 'Feature Flags', icon: Settings, color: 'purple' },
    { id: 'database', title: 'Database', icon: Database, color: 'indigo' },
    { id: 'security', title: 'Security', icon: Shield, color: 'red' },
  ];

  // Load dashboard data
  const refreshDashboardData = async () => {
    setIsLoading(true);
    try {
      const [stats, recs, health] = await Promise.all([
        linkedInDatabaseOptimizer.getDatabaseStats(true),
        linkedInDatabaseOptimizer.getOptimizationRecommendations(),
        linkedInDatabaseOptimizer.getHealthScore()
      ]);
      
      setDatabaseStats(stats);
      setRecommendations(recs);
      setHealthScore(health);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshDashboardData();
    }
  }, [isVisible]);

  const toggleRecommendation = (index: number) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRecommendations(newExpanded);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Score */}
      {healthScore && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">System Health Score</h3>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-lg font-bold ${getHealthColor(healthScore.score)}`}>
              <CheckCircle className="w-5 h-5" />
              {healthScore.score}/100 ({healthScore.grade})
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthScore.factors.map((factor, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                  <span className="text-sm text-gray-600">{factor.score.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, factor.score)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isHealthy ? 'Healthy' : 'Issues'}
              </p>
              <p className="text-sm text-gray-500">System Status</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics.requests.total)}
              </p>
              <p className="text-sm text-gray-500">Total Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics.cache.hitRate * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Cache Hit Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.requests.averageResponseTime.toFixed(0)}ms
              </p>
              <p className="text-sm text-gray-500">Avg Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Active Alerts ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 rounded border ${alert.level === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
              >
                <div className={`text-sm font-medium ${alert.level === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Stats */}
      {databaseStats && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            Database Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-bold text-gray-900">
                {formatNumber(databaseStats.totalCacheEntries)}
              </div>
              <div className="text-sm text-gray-500">Cache Entries</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-bold text-gray-900">
                {formatNumber(databaseStats.totalMetrics)}
              </div>
              <div className="text-sm text-gray-500">Metrics Records</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-bold text-gray-900">
                {formatBytes(databaseStats.cacheTableSize)}
              </div>
              <div className="text-sm text-gray-500">Cache Table Size</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-bold text-gray-900">
                {formatBytes(databaseStats.metricsTableSize)}
              </div>
              <div className="text-sm text-gray-500">Metrics Table Size</div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Optimization Recommendations ({recommendations.length})
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div key={index} className={`border rounded-lg p-3 ${getRecommendationColor(rec.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getRecommendationIcon(rec.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      {expandedRecommendations.has(index) && rec.action && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700">Recommended Action:</p>
                          <p className="text-sm text-gray-600">{rec.action}</p>
                          <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {rec.priority}
                    </span>
                    <button
                      onClick={() => toggleRecommendation(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedRecommendations.has(index) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {recommendations.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                ... and {recommendations.length - 5} more recommendations
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'monitoring':
        return <LinkedInRateLimitMonitor showDetailed={true} />;
      case 'features':
        return (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flag Management</h3>
            <p className="text-gray-600 mb-4">
              Manage feature flags, A/B tests, and gradual rollouts for LinkedIn Discovery features.
            </p>
            <button
              onClick={() => setSubDashboardVisible(prev => ({ ...prev, featureFlags: true }))}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Open Feature Flag Dashboard
            </button>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-6">
            {databaseStats && (
              <>
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Database Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {(databaseStats.performanceMetrics.cacheHitRate).toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Cache Hit Rate</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {databaseStats.performanceMetrics.averageResponseTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-green-700">Avg Response Time</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(databaseStats.performanceMetrics.dailyRequestCount)}
                      </div>
                      <div className="text-sm text-purple-700">Daily Requests</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Cache Table</h4>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {formatBytes(databaseStats.cacheTableSize)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatNumber(databaseStats.totalCacheEntries)} entries
                        {databaseStats.expiredCacheEntries > 0 && (
                          <span className="text-orange-600 ml-2">
                            ({formatNumber(databaseStats.expiredCacheEntries)} expired)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Metrics Table</h4>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {formatBytes(databaseStats.metricsTableSize)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatNumber(databaseStats.totalMetrics)} records
                        {databaseStats.oldMetrics > 0 && (
                          <span className="text-orange-600 ml-2">
                            ({formatNumber(databaseStats.oldMetrics)} old)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'security':
        return (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Overview</h3>
            <LinkedInRateLimitMonitor showDetailed={true} />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                LinkedIn Discovery Admin Dashboard
              </h2>
              {healthScore && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(healthScore.score)}`}>
                  Health: {healthScore.grade}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshDashboardData}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <nav className="space-y-2">
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? `bg-${section.color}-100 text-${section.color}-700`
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Last updated</div>
                <div className="text-sm text-gray-700">
                  {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-dashboards */}
      <LinkedInMonitoringDashboard
        isVisible={subDashboardVisible.monitoring}
        onClose={() => setSubDashboardVisible(prev => ({ ...prev, monitoring: false }))}
      />

      <LinkedInFeatureFlagDashboard
        isVisible={subDashboardVisible.featureFlags}
        onClose={() => setSubDashboardVisible(prev => ({ ...prev, featureFlags: false }))}
        isAdmin={true}
      />
    </>
  );
}