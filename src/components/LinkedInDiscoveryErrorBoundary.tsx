import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMode?: 'minimal' | 'full';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorReport {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack: string;
  userAgent: string;
  url: string;
  userId?: string;
  retryCount: number;
}

export class LinkedInDiscoveryErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LinkedIn Discovery Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport: ErrorReport = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      // In a real app, you might send this to an error tracking service
      // like Sentry, LogRocket, or your own error logging endpoint
      console.warn('LinkedIn Discovery Error Report:', errorReport);
      
      // Store error locally for debugging
      const errors = JSON.parse(localStorage.getItem('linkedinDiscoveryErrors') || '[]');
      errors.push(errorReport);
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      localStorage.setItem('linkedinDiscoveryErrors', JSON.stringify(errors));
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
    }, this.retryDelay);
  };

  private handleManualEntry = () => {
    // This could trigger a callback to the parent component
    // to switch to manual entry mode
    window.dispatchEvent(new CustomEvent('linkedinDiscoveryManualEntry'));
  };

  private renderMinimalFallback = () => (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-2 text-orange-800 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>LinkedIn discovery temporarily unavailable</span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={this.handleRetry}
          disabled={this.state.isRetrying || this.state.retryCount >= this.maxRetries}
          className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {this.state.isRetrying ? 'Retrying...' : 'Retry'}
        </button>
        <button
          onClick={this.handleManualEntry}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Enter manually
        </button>
      </div>
    </div>
  );

  private renderFullFallback = () => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            LinkedIn Discovery Error
          </h3>
          
          <p className="text-red-700 mb-4">
            We encountered an issue while trying to discover LinkedIn company pages. 
            This doesn't affect the core functionality of the application.
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying || this.state.retryCount >= this.maxRetries}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                {this.state.isRetrying ? 'Retrying...' : `Retry (${this.maxRetries - this.state.retryCount} left)`}
              </button>

              <button
                onClick={this.handleManualEntry}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Enter LinkedIn URL manually
              </button>
            </div>

            {this.state.retryCount >= this.maxRetries && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  <strong>Maximum retries reached.</strong> You can still continue by entering 
                  the LinkedIn URL manually, or skip this step entirely.
                </p>
              </div>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                Show technical details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                <div><strong>Error:</strong> {this.state.error.message}</div>
                {this.state.error.stack && (
                  <div className="mt-2">
                    <strong>Stack trace:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                )}
                {this.state.errorInfo && (
                  <div className="mt-2">
                    <strong>Component stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  render() {
    if (this.state.hasError) {
      const fallbackMode = this.props.fallbackMode || 'full';
      return fallbackMode === 'minimal' ? this.renderMinimalFallback() : this.renderFullFallback();
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withLinkedInErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallbackMode?: 'minimal' | 'full';
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <LinkedInDiscoveryErrorBoundary
      fallbackMode={options?.fallbackMode}
      onError={options?.onError}
    >
      <Component {...props} />
    </LinkedInDiscoveryErrorBoundary>
  );

  WrappedComponent.displayName = `withLinkedInErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling LinkedIn discovery errors in functional components
export function useLinkedInErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;

  const handleError = React.useCallback((error: Error) => {
    console.error('LinkedIn discovery error:', error);
    setError(error);
  }, []);

  const retry = React.useCallback(() => {
    if (retryCount < maxRetries) {
      setError(null);
      setRetryCount(prev => prev + 1);
      return true;
    }
    return false;
  }, [retryCount, maxRetries]);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const canRetry = retryCount < maxRetries;

  return {
    error,
    retryCount,
    canRetry,
    maxRetries,
    handleError,
    retry,
    reset
  };
}

// Utility function to clear stored errors (for debugging/maintenance)
export function clearStoredLinkedInErrors(): void {
  localStorage.removeItem('linkedinDiscoveryErrors');
}

// Utility function to get stored errors (for debugging/monitoring)
export function getStoredLinkedInErrors(): ErrorReport[] {
  try {
    return JSON.parse(localStorage.getItem('linkedinDiscoveryErrors') || '[]');
  } catch {
    return [];
  }
}