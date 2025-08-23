import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  Zap,
  WifiOff,
  FileText
} from 'lucide-react';
import { 
  linkedInErrorRecovery, 
  FallbackStrategy, 
  CircuitBreakerState 
} from '../utils/linkedinErrorRecovery';

interface ErrorRecoveryDashboardProps {
  className?: string;
  isAdmin?: boolean;
}

export function LinkedInErrorRecoveryDashboard({ 
  className = '', 
  isAdmin = false 
}: ErrorRecoveryDashboardProps) {
  const [healthStatus, setHealthStatus] = useState(linkedInErrorRecovery.getHealthStatus());
  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, CircuitBreakerState>>({});
  const [fallbackStrategies, setFallbackStrategies] = useState<FallbackStrategy[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [testError, setTestError] = useState<'network' | 'timeout' | 'api_limit' | 'generic'>('network');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [configExport, setConfigExport] = useState('');
  const [configImport, setConfigImport] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const refreshData = () => {
    setHealthStatus(linkedInErrorRecovery.getHealthStatus());
    setCircuitBreakers(linkedInErrorRecovery.getCircuitBreakerStatus());
    setLastRefresh(new Date());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleResetCircuitBreaker = (operation: string) => {
    if (isAdmin) {
      linkedInErrorRecovery.resetCircuitBreaker(operation);
      refreshData();
    }
  };

  const handleForceOpenCircuitBreaker = (operation: string) => {
    if (isAdmin) {
      linkedInErrorRecovery.forceOpenCircuitBreaker(operation);
      refreshData();
    }
  };

  const handleTestError = () => {
    if (isAdmin && selectedOperation) {
      linkedInErrorRecovery.simulateError(selectedOperation, testError);
      refreshData();
    }
  };

  const handleToggleFallbackStrategy = (strategyName: string, enabled: boolean) => {
    if (isAdmin) {
      linkedInErrorRecovery.updateFallbackStrategy(strategyName, { enabled });
      refreshData();
    }
  };

  const handleClearFallbackCache = () => {
    if (isAdmin) {
      linkedInErrorRecovery.clearFallbackCache();
      refreshData();
    }
  };

  const handleExportConfig = () => {
    const config = linkedInErrorRecovery.exportConfig();
    setConfigExport(config);
    setShowConfigModal(true);
  };

  const handleImportConfig = () => {
    if (isAdmin && configImport) {
      const success = linkedInErrorRecovery.importConfig(configImport);
      if (success) {
        alert('Configuration imported successfully!');
        setConfigImport('');
        setShowConfigModal(false);
        refreshData();
      } else {
        alert('Failed to import configuration. Please check the format.');
      }
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'text-green-600 bg-green-100';
      case 'OPEN': return 'text-red-600 bg-red-100';
      case 'HALF_OPEN': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'CLOSED': return <CheckCircle className="w-4 h-4" />;
      case 'OPEN': return <XCircle className="w-4 h-4" />;
      case 'HALF_OPEN': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return 'Now';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Health Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Error Recovery Status
          </h3>
          <button
            onClick={refreshData}
            className="p-2 text-gray-500 hover:text-gray-700 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${healthStatus.openCircuitBreakers.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {healthStatus.openCircuitBreakers.length > 0 ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className="font-medium text-gray-900">Circuit Breakers</span>
            </div>
            <div className={`text-xl font-bold ${healthStatus.openCircuitBreakers.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {healthStatus.openCircuitBreakers.length} Open
            </div>
            <div className="text-sm text-gray-500">
              {Object.keys(circuitBreakers).length} Total
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Total Failures</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {healthStatus.totalFailures}
            </div>
            <div className="text-sm text-gray-500">Across all operations</div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Fallback Strategies</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {healthStatus.activeFallbackStrategies}
            </div>
            <div className="text-sm text-gray-500">Active strategies</div>
          </div>

          <div className={`p-4 rounded-lg ${healthStatus.isOfflineMode ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {healthStatus.isOfflineMode ? (
                <WifiOff className="w-5 h-5 text-orange-600" />
              ) : (
                <Zap className="w-5 h-5 text-gray-600" />
              )}
              <span className="font-medium text-gray-900">Mode</span>
            </div>
            <div className={`text-xl font-bold ${healthStatus.isOfflineMode ? 'text-orange-600' : 'text-gray-600'}`}>
              {healthStatus.isOfflineMode ? 'Offline' : 'Online'}
            </div>
            <div className="text-sm text-gray-500">
              {healthStatus.isOfflineMode ? 'Limited functionality' : 'Full functionality'}
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Breakers */}
      {Object.keys(circuitBreakers).length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Circuit Breakers</h3>
          <div className="space-y-3">
            {Object.entries(circuitBreakers).map(([operation, state]) => (
              <div key={operation} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getCircuitBreakerColor(state.state)}`}>
                    {getCircuitBreakerIcon(state.state)}
                    {state.state}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{operation}</div>
                    <div className="text-sm text-gray-500">
                      Failures: {state.failureCount} | 
                      Last failure: {formatTime(state.lastFailureTime)}
                      {state.state === 'OPEN' && (
                        <> | Reset in: {formatDuration(state.nextAttemptTime - Date.now())}</>
                      )}
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetCircuitBreaker(operation)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Reset circuit breaker"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleForceOpenCircuitBreaker(operation)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Force open"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Controls</h3>
          
          {/* Test Error Simulation */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Test Error Simulation</h4>
            <div className="flex items-center gap-4">
              <select
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select operation...</option>
                <option value="linkedin_search">LinkedIn Search</option>
                <option value="api_request">API Request</option>
                <option value="cache_lookup">Cache Lookup</option>
              </select>
              
              <select
                value={testError}
                onChange={(e) => setTestError(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="network">Network Error</option>
                <option value="timeout">Timeout</option>
                <option value="api_limit">API Limit</option>
                <option value="generic">Generic Error</option>
              </select>
              
              <button
                onClick={handleTestError}
                disabled={!selectedOperation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Simulate Error
              </button>
            </div>
          </div>

          {/* Cache Management */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Cache Management</h4>
            <button
              onClick={handleClearFallbackCache}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Clear Fallback Cache
            </button>
          </div>

          {/* Configuration */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
            <div className="flex gap-2">
              <button
                onClick={handleExportConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export Config
              </button>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Import Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {configExport && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Configuration (Export)
                  </label>
                  <textarea
                    value={configExport}
                    readOnly
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(configExport)}
                    className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Configuration
                  </label>
                  <textarea
                    value={configImport}
                    onChange={(e) => setConfigImport(e.target.value)}
                    placeholder="Paste configuration JSON here..."
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setShowConfigModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportConfig}
                      disabled={!configImport.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-gray-500 text-center">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

// Compact error recovery status component
export function CompactErrorRecoveryStatus({ className = '' }: { className?: string }) {
  const [healthStatus, setHealthStatus] = useState(linkedInErrorRecovery.getHealthStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthStatus(linkedInErrorRecovery.getHealthStatus());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const hasIssues = healthStatus.openCircuitBreakers.length > 0 || 
                   healthStatus.totalFailures > 10 ||
                   healthStatus.isOfflineMode;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      hasIssues ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    } ${className}`}>
      {hasIssues ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Shield className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        Recovery: {hasIssues ? 'Issues' : 'Healthy'}
      </span>
    </div>
  );
}