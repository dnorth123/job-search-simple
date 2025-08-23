import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Loader2, Building2, ExternalLink, CheckCircle, AlertCircle, X, Search, Clock } from 'lucide-react';
import { supabase, TABLES } from '../utils/supabase';
import { checkAndConsumeRateLimit, recordRequestCompletion } from '../utils/linkedinRateLimit';

interface LinkedInResult {
  url: string;
  companyName: string;
  vanityName: string;
  description: string;
  confidence: number;
}

interface LinkedInCompanyDiscoveryProps {
  companyName: string;
  currentLinkedInUrl?: string;
  onLinkedInSelect: (url: string | null, confidence?: number, standardizedName?: string) => void;
  required?: boolean;
}

interface ComponentState {
  searching: boolean;
  suggestions: LinkedInResult[];
  selectedUrl: string | null;
  manualMode: boolean;
  error: string | null;
  manualUrl: string;
  hasSearched: boolean;
}

const LinkedInCompanyDiscovery: React.FC<LinkedInCompanyDiscoveryProps> = ({
  companyName,
  currentLinkedInUrl,
  onLinkedInSelect,
  required = false
}) => {
  const [state, setState] = useState<ComponentState>({
    searching: false,
    suggestions: [],
    selectedUrl: currentLinkedInUrl || null,
    manualMode: false,
    error: null,
    manualUrl: currentLinkedInUrl || '',
    hasSearched: !!currentLinkedInUrl // Mark as searched if we already have a URL
  });

  // Update state when currentLinkedInUrl prop changes (important for edit mode)
  useEffect(() => {
    if (currentLinkedInUrl && currentLinkedInUrl !== state.selectedUrl) {
      setState(prev => ({
        ...prev,
        selectedUrl: currentLinkedInUrl,
        manualUrl: currentLinkedInUrl,
        hasSearched: true,
        suggestions: [], // Clear any existing suggestions
        error: null,
        searching: false
      }));
    } else if (!currentLinkedInUrl && state.selectedUrl) {
      // If currentLinkedInUrl becomes null, reset the selected state
      setState(prev => ({
        ...prev,
        selectedUrl: null,
        manualUrl: '',
        hasSearched: false,
        suggestions: [],
        error: null
      }));
    }
  }, [currentLinkedInUrl]);

  const debouncedCompanyName = useDebounce(companyName, 500);

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+\/?$/;
    return linkedinPattern.test(url.trim());
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const extractVanityName = (url: string): string => {
    try {
      const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  };

  const extractCompanyName = (title: string, description: string): string => {
    // Try to extract company name from title (usually comes before " | LinkedIn")
    const titleMatch = title.match(/^([^|]+)(?:\s*\|\s*LinkedIn)?/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Fallback to first words of description
    const descWords = description.split(' ').slice(0, 3).join(' ');
    return descWords.length > 0 ? descWords : 'Unknown Company';
  };

  const calculateConfidence = (
    result: any, 
    searchTerm: string, 
    isFirstResult: boolean
  ): number => {
    let confidence = 0.6; // Base confidence for valid LinkedIn company URL
    
    const companyName = extractCompanyName(result.title, result.description);
    const vanityName = extractVanityName(result.url);
    
    // +0.25 if company name matches search term (case insensitive)
    if (companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])) {
      confidence += 0.25;
    }
    
    // +0.10 if first result
    if (isFirstResult) {
      confidence += 0.10;
    }
    
    // +0.05 if URL contains search term as slug
    if (vanityName.toLowerCase().includes(searchTerm.toLowerCase().replace(/\s+/g, ''))) {
      confidence += 0.05;
    }
    
    // Cap at 0.95 maximum
    return Math.min(confidence, 0.95);
  };

  const trackAnalytics = async (
    searchTerm: string,
    action: 'selected' | 'manual_entry' | 'skipped',
    selectedUrl?: string,
    confidence?: number
  ) => {
    try {
      await supabase
        .from(TABLES.LINKEDIN_SEARCH_METRICS)
        .insert({
          search_term: searchTerm,
          selected_url: selectedUrl,
          selection_confidence: confidence,
          user_action: action
        });
    } catch (error) {
      console.warn('Failed to track analytics:', error);
    }
  };

  const searchLinkedInCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setState(prev => ({ ...prev, suggestions: [], error: null, hasSearched: false }));
      return;
    }

    // Let the server handle rate limiting with multiple providers

    setState(prev => ({ ...prev, searching: true, error: null, hasSearched: true }));

    const startTime = Date.now();
    try {
      // Call our backend API endpoint
      const response = await fetch('/api/linkedin-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: searchTerm }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
        }
        throw new Error(errorData.error || `Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search request failed');
      }

      const results = data.results || [];
      
      setState(prev => ({ ...prev, suggestions: results, searching: false }));

      // Auto-select if single result with ≥90% confidence
      if (results.length === 1 && results[0].confidence >= 0.9) {
        handleSuggestionSelect(results[0]);
      }

    } catch (error) {
      console.error('LinkedIn search error:', error);
      setState(prev => ({
        ...prev,
        searching: false,
        suggestions: [],
        error: error instanceof Error ? error.message : 'Failed to search for companies'
      }));
    }
  }, []);

  const handleSuggestionSelect = (suggestion: LinkedInResult) => {
    setState(prev => ({
      ...prev,
      selectedUrl: suggestion.url,
      manualMode: false,
      error: null,
      manualUrl: suggestion.url
    }));
    
    onLinkedInSelect(suggestion.url, suggestion.confidence, suggestion.companyName);
    trackAnalytics(companyName, 'selected', suggestion.url, suggestion.confidence);
  };

  const handleManualEntry = () => {
    setState(prev => ({
      ...prev,
      manualMode: true,
      selectedUrl: null,
      error: null
    }));
  };

  const handleManualUrlChange = (url: string) => {
    setState(prev => ({ ...prev, manualUrl: url, error: null }));
  };

  const handleManualUrlSubmit = () => {
    const trimmedUrl = state.manualUrl.trim();
    
    if (!trimmedUrl) {
      setState(prev => ({
        ...prev,
        selectedUrl: null,
        manualMode: false
      }));
      onLinkedInSelect(null, undefined, undefined);
      return;
    }

    if (!validateLinkedInUrl(trimmedUrl)) {
      setState(prev => ({
        ...prev,
        error: 'Please enter a valid LinkedIn company URL (e.g., https://www.linkedin.com/company/microsoft)'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      selectedUrl: trimmedUrl,
      manualMode: false,
      error: null
    }));

    onLinkedInSelect(trimmedUrl, undefined, undefined);
    trackAnalytics(companyName, 'manual_entry', trimmedUrl);
  };

  const handleClearSelection = () => {
    setState(prev => ({
      ...prev,
      selectedUrl: null,
      manualMode: false,
      manualUrl: '',
      error: null
    }));
    onLinkedInSelect(null, undefined, undefined);
    trackAnalytics(companyName, 'skipped');
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, error: null }));
    searchLinkedInCompanies(debouncedCompanyName);
  };

  // Effect for auto-search - only search if we don't already have a LinkedIn URL
  useEffect(() => {
    if (debouncedCompanyName && debouncedCompanyName.length >= 3 && !state.selectedUrl && !state.manualMode && !currentLinkedInUrl) {
      searchLinkedInCompanies(debouncedCompanyName);
    }
  }, [debouncedCompanyName, searchLinkedInCompanies, state.selectedUrl, state.manualMode, currentLinkedInUrl]);

  // Don't render if no company name
  if (!companyName) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Building2 className="w-4 h-4" />
        <span>LinkedIn Company Page</span>
        {required && <span className="text-red-500">*</span>}
      </div>

      {/* Selected State */}
      {state.selectedUrl && !state.manualMode && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">LinkedIn URL Selected</div>
              <a
                href={state.selectedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
              >
                {state.selectedUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="p-1 text-green-600 hover:text-green-800 transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Mode */}
      {state.manualMode && (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <Building2 className="w-4 h-4" />
            Enter LinkedIn Company URL
          </div>
          <div className="space-y-2">
            <input
              type="url"
              value={state.manualUrl}
              onChange={(e) => handleManualUrlChange(e.target.value)}
              placeholder="https://www.linkedin.com/company/example"
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleManualUrlSubmit()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleManualUrlSubmit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, manualMode: false, error: null }))}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search States - only show if not selected and not in manual mode */}
      {!state.selectedUrl && !state.manualMode && (
        <>
          {/* Initial/Empty State */}
          {!state.hasSearched && debouncedCompanyName.length < 3 && (
            <div className="flex items-center gap-2 p-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
              <Search className="w-4 h-4" />
              Enter at least 3 characters to search for LinkedIn company pages
            </div>
          )}

          {/* Searching State */}
          {state.searching && (
            <div className="flex items-center gap-2 p-3 text-blue-600 bg-blue-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching LinkedIn for "{debouncedCompanyName}"...
            </div>
          )}

          {/* Error State */}
          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <AlertCircle className="w-4 h-4" />
                Search Error
              </div>
              <p className="text-sm text-red-600 mt-1">{state.error}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleManualEntry}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
                >
                  Enter manually
                </button>
              </div>
            </div>
          )}

          {/* Results Found State */}
          {!state.searching && state.suggestions.length > 0 && !state.error && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Found {state.suggestions.length} LinkedIn company page{state.suggestions.length !== 1 ? 's' : ''}:
              </div>
              {state.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{suggestion.companyName}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                          {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                        </span>
                      </div>
                      <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                        {suggestion.url}
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleManualEntry}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  None of these
                </button>
              </div>
            </div>
          )}

          {/* No Results State */}
          {!state.searching && state.suggestions.length === 0 && state.hasSearched && !state.error && debouncedCompanyName.length >= 3 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800 font-medium">
                <AlertCircle className="w-4 h-4" />
                No LinkedIn companies found
              </div>
              <p className="text-sm text-orange-600 mt-1">
                We couldn't find a LinkedIn company page for "{debouncedCompanyName}". You can enter the URL manually if you know it.
              </p>
              <button
                onClick={handleManualEntry}
                className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-md hover:bg-orange-200 transition-colors"
              >
                Enter manually
              </button>
            </div>
          )}
        </>
      )}

      {/* Manual URL Error */}
      {state.error && state.manualMode && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default LinkedInCompanyDiscovery;