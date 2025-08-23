import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react';
import { linkedInRateLimit } from '../utils/linkedinRateLimit';

interface RateLimitMonitorProps {
  className?: string;
  showDetailed?: boolean;
}

export function LinkedInRateLimitMonitor({ 
  className = '', 
  showDetailed = false 
}: RateLimitMonitorProps) {
  const [status, setStatus] = useState(linkedInRateLimit.getStatus());
  const [warnings, setWarnings] = useState(linkedInRateLimit.getWarningLevels());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = () => {
    setStatus(linkedInRateLimit.getStatus());
    setWarnings(linkedInRateLimit.getWarningLevels());
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUtilizationIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4" />;
    if (percentage >= 75) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const formatTimeUntilReset = (resetTime: Date) => {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Rate Limit Status</h3>
          </div>
          <button
            onClick={refreshData}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {warnings.length > 0 && (
          <div className="mt-3 space-y-2">
            {warnings.map((warning, index) => (
              <div 
                key={index}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  warning.level === 'critical' 
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {warning.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Quick Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className={`flex items-center gap-2 mb-1 ${getUtilizationColor(status.utilizationPercentage.monthly)}`}>
              {getUtilizationIcon(status.utilizationPercentage.monthly)}
              <span className="text-sm font-medium">Monthly</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(status.current.monthly)}/{formatNumber(status.limits.monthly)}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercent(status.utilizationPercentage.monthly)} used
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className={`flex items-center gap-2 mb-1 ${getUtilizationColor(status.utilizationPercentage.daily)}`}>
              {getUtilizationIcon(status.utilizationPercentage.daily)}
              <span className="text-sm font-medium">Daily</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(status.current.daily)}/{formatNumber(status.limits.daily)}
            </div>
            <div className="text-xs text-gray-500">
              Resets in {formatTimeUntilReset(status.resetTimes.daily)}
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className={`flex items-center gap-2 mb-1 ${getUtilizationColor(status.utilizationPercentage.perMinute)}`}>
              {getUtilizationIcon(status.utilizationPercentage.perMinute)}
              <span className="text-sm font-medium">Per Minute</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(status.current.perMinute)}/{formatNumber(status.limits.perMinute)}
            </div>
            <div className="text-xs text-gray-500">
              Resets in {formatTimeUntilReset(status.resetTimes.perMinute)}
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className={`flex items-center gap-2 mb-1 ${getUtilizationColor(status.utilizationPercentage.burst)}`}>
              {getUtilizationIcon(status.utilizationPercentage.burst)}
              <span className="text-sm font-medium">Burst</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(status.current.burst)}/{formatNumber(status.limits.burst)}
            </div>
            <div className="text-xs text-gray-500">
              Resets in {formatTimeUntilReset(status.resetTimes.burst)}
            </div>
          </div>
        </div>

        {showDetailed && (
          <>
            {/* Usage Progress Bars */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Monthly Usage</span>
                  <span>{formatPercent(status.utilizationPercentage.monthly)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status.utilizationPercentage.monthly >= 90 ? 'bg-red-500' :
                      status.utilizationPercentage.monthly >= 75 ? 'bg-orange-500' :
                      status.utilizationPercentage.monthly >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, status.utilizationPercentage.monthly)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Daily Usage</span>
                  <span>{formatPercent(status.utilizationPercentage.daily)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status.utilizationPercentage.daily >= 90 ? 'bg-red-500' :
                      status.utilizationPercentage.daily >= 75 ? 'bg-orange-500' :
                      status.utilizationPercentage.daily >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, status.utilizationPercentage.daily)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Request Statistics */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Request Statistics
              </h4>
              
              {['1h', '24h', '7d'].map((timeRange) => {
                const stats = linkedInRateLimit.getRequestStats(timeRange as any);
                return (
                  <div key={timeRange} className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Last {timeRange}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatNumber(stats.totalRequests)} requests
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-green-600 font-medium">
                          {formatPercent(stats.successRate)}
                        </div>
                        <div className="text-gray-500">Success Rate</div>
                      </div>
                      <div>
                        <div className="text-blue-600 font-medium">
                          {stats.averageResponseTime.toFixed(0)}ms
                        </div>
                        <div className="text-gray-500">Avg Response</div>
                      </div>
                      <div>
                        <div className="text-purple-600 font-medium">
                          {stats.requestsPerHour.toFixed(1)}/hr
                        </div>
                        <div className="text-gray-500">Rate</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Auto-refresh: 10s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for dashboards
export function CompactRateLimitStatus({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState(linkedInRateLimit.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(linkedInRateLimit.getStatus());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const highestUtilization = Math.max(
    status.utilizationPercentage.monthly,
    status.utilizationPercentage.daily,
    status.utilizationPercentage.perMinute,
    status.utilizationPercentage.burst
  );

  const getStatusColor = () => {
    if (highestUtilization >= 90) return 'text-red-600 bg-red-100';
    if (highestUtilization >= 75) return 'text-orange-600 bg-orange-100';
    if (highestUtilization >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor()} ${className}`}>
      <Shield className="w-4 h-4" />
      <span className="text-sm font-medium">
        Rate Limit: {highestUtilization.toFixed(0)}%
      </span>
    </div>
  );
}