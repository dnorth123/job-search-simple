import React, { useState, useEffect } from 'react';
import {
  Settings,
  Toggle,
  Eye,
  EyeOff,
  Users,
  Percent,
  Clock,
  Save,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  TestTube,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { 
  linkedInFeatureFlags, 
  FeatureFlag, 
  FeatureFlagEvaluation,
  UserContext 
} from '../utils/linkedinFeatureFlags';

interface FeatureFlagDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function LinkedInFeatureFlagDashboard({ 
  isVisible, 
  onClose, 
  isAdmin = false 
}: FeatureFlagDashboardProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(linkedInFeatureFlags.getAllFlags());
  const [evaluations, setEvaluations] = useState<Record<string, FeatureFlagEvaluation>>({});
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [userContext, setUserContext] = useState<Partial<UserContext>>({});
  const [showEvaluationDetails, setShowEvaluationDetails] = useState<Set<string>>(new Set());
  const [importExportMode, setImportExportMode] = useState<'none' | 'export' | 'import'>('none');
  const [importData, setImportData] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = () => {
    const currentFlags = linkedInFeatureFlags.getAllFlags();
    const currentEvaluations = linkedInFeatureFlags.evaluateAllFlags(userContext);
    
    setFlags(currentFlags);
    setEvaluations(currentEvaluations);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible, userContext]);

  const handleToggleFlag = (flagKey: string) => {
    if (!isAdmin) return;

    const flag = flags.find(f => f.key === flagKey);
    if (flag) {
      linkedInFeatureFlags.updateFlag(flagKey, { enabled: !flag.enabled });
      refreshData();
    }
  };

  const handleUpdateRollout = (flagKey: string, rolloutPercentage: number) => {
    if (!isAdmin) return;

    linkedInFeatureFlags.updateFlag(flagKey, { rolloutPercentage });
    refreshData();
  };

  const handleSaveFlag = (flag: FeatureFlag) => {
    if (!isAdmin) return;

    linkedInFeatureFlags.updateFlag(flag.key, flag);
    setEditingFlag(null);
    refreshData();
  };

  const handleDeleteFlag = (flagKey: string) => {
    if (!isAdmin) return;
    
    if (confirm('Are you sure you want to delete this feature flag?')) {
      linkedInFeatureFlags.removeFlag(flagKey);
      refreshData();
    }
  };

  const handleExport = () => {
    const exportData = linkedInFeatureFlags.exportFlags();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-feature-flags-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!isAdmin) return;

    try {
      const success = linkedInFeatureFlags.importFlags(importData);
      if (success) {
        refreshData();
        setImportExportMode('none');
        setImportData('');
        alert('Feature flags imported successfully!');
      } else {
        alert('Failed to import feature flags. Please check the format.');
      }
    } catch (error) {
      alert('Invalid JSON format.');
    }
  };

  const toggleEvaluationDetails = (flagKey: string) => {
    const newSet = new Set(showEvaluationDetails);
    if (newSet.has(flagKey)) {
      newSet.delete(flagKey);
    } else {
      newSet.add(flagKey);
    }
    setShowEvaluationDetails(newSet);
  };

  const getStatusIcon = (evaluation: FeatureFlagEvaluation) => {
    if (evaluation.enabled) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <X className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (evaluation: FeatureFlagEvaluation) => {
    if (evaluation.enabled) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-600';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              LinkedIn Feature Flags
            </h2>
            {isAdmin && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setImportExportMode('export')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Export flags"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImportExportMode('import')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Import flags"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={refreshData}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* User Context */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">User Context for Evaluation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">User ID</label>
                <input
                  type="text"
                  value={userContext.userId || ''}
                  onChange={(e) => setUserContext(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={userContext.email || ''}
                  onChange={(e) => setUserContext(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Custom Property</label>
                <input
                  type="text"
                  value={userContext.custom?.role || ''}
                  onChange={(e) => setUserContext(prev => ({ 
                    ...prev, 
                    custom: { ...prev.custom, role: e.target.value } 
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="e.g., beta_user"
                />
              </div>
            </div>
          </div>

          {/* Import/Export Modal */}
          {importExportMode !== 'none' && (
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-blue-900">
                  {importExportMode === 'export' ? 'Export Feature Flags' : 'Import Feature Flags'}
                </h3>
                <button
                  onClick={() => setImportExportMode('none')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {importExportMode === 'export' && (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Export all feature flags to a JSON file for backup or sharing.
                  </p>
                  <button
                    onClick={handleExport}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Download JSON File
                  </button>
                </div>
              )}

              {importExportMode === 'import' && (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Import feature flags from a JSON file. This will update existing flags.
                  </p>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full h-32 px-3 py-2 text-sm border border-blue-300 rounded"
                    placeholder="Paste JSON data here..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleImport}
                      disabled={!importData.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Import Flags
                    </button>
                    <button
                      onClick={() => {
                        setImportData(linkedInFeatureFlags.exportFlags());
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Load Current Flags
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feature Flags List */}
          <div className="divide-y divide-gray-200">
            {flags.map(flag => {
              const evaluation = evaluations[flag.key];
              const showDetails = showEvaluationDetails.has(flag.key);
              
              return (
                <div key={flag.key} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Flag Header */}
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(evaluation)}
                        <h4 className="font-medium text-gray-900">{flag.name}</h4>
                        <div className={`px-2 py-1 text-xs rounded ${getStatusColor(evaluation)}`}>
                          {evaluation.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                        {flag.experimentGroup && (
                          <div className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                            <TestTube className="w-3 h-3 inline mr-1" />
                            {flag.experimentGroup}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{flag.description}</p>

                      {/* Controls */}
                      <div className="flex items-center gap-4 mb-3">
                        {isAdmin && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={flag.enabled}
                              onChange={() => handleToggleFlag(flag.key)}
                              className="rounded"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rollout:</span>
                          {isAdmin ? (
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={flag.rolloutPercentage}
                              onChange={(e) => handleUpdateRollout(flag.key, parseInt(e.target.value))}
                              className="w-20"
                            />
                          ) : (
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${flag.rolloutPercentage}%` }}
                              />
                            </div>
                          )}
                          <span className="text-sm font-medium">{flag.rolloutPercentage}%</span>
                        </div>

                        <button
                          onClick={() => toggleEvaluationDetails(flag.key)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>

                      {/* Evaluation Details */}
                      {showDetails && evaluation && (
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-gray-600">Status: <span className="font-medium">{evaluation.enabled ? 'Enabled' : 'Disabled'}</span></div>
                              <div className="text-gray-600">Reason: <span className="font-medium">{evaluation.reason}</span></div>
                              {evaluation.variant && (
                                <div className="text-gray-600">Variant: <span className="font-medium">{evaluation.variant}</span></div>
                              )}
                            </div>
                            <div>
                              <div className="text-gray-600">Flag Key: <code className="text-xs bg-gray-200 px-1 rounded">{flag.key}</code></div>
                              <div className="text-gray-600">Updated: {new Date(flag.updatedAt).toLocaleString()}</div>
                              {evaluation.metadata?.evaluatedAt && (
                                <div className="text-gray-600">Evaluated: {new Date(evaluation.metadata.evaluatedAt).toLocaleString()}</div>
                              )}
                            </div>
                          </div>

                          {flag.conditions && flag.conditions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-gray-600 text-xs font-medium mb-2">CONDITIONS:</div>
                              <div className="space-y-1">
                                {flag.conditions.map((condition, index) => (
                                  <div key={index} className="text-xs text-gray-500">
                                    {condition.type} {condition.operator} {JSON.stringify(condition.value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setEditingFlag(flag)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Edit flag"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlag(flag.key)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Delete flag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {flags.length} feature flags • {Object.values(evaluations).filter(e => e.enabled).length} enabled
              </span>
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact feature flag status component
export function CompactFeatureFlagStatus({ className = '' }: { className?: string }) {
  const [enabledCount, setEnabledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const flags = linkedInFeatureFlags.getAllFlags();
    const evaluations = linkedInFeatureFlags.evaluateAllFlags();
    
    setTotalCount(flags.length);
    setEnabledCount(Object.values(evaluations).filter(e => e.enabled).length);
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-800 ${className}`}>
      <Settings className="w-4 h-4" />
      <span className="text-sm font-medium">
        Flags: {enabledCount}/{totalCount}
      </span>
    </div>
  );
}