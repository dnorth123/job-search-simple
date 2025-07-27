import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Configuration - set to false to completely disable the indicator
const SHOW_DATABASE_STATUS = false; // Set to false to completely remove the indicator

export const DatabaseStatus: React.FC = () => {
  const { databaseConnected } = useAuth();
  const [showConnected, setShowConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // If disabled, don't show anything
  if (!SHOW_DATABASE_STATUS) {
    return null;
  }

  // Show connected indicator briefly then hide it
  useEffect(() => {
    if (databaseConnected === true) {
      setShowConnected(true);
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [databaseConnected]);

  // Don't show anything if not visible
  if (!isVisible) {
    return null;
  }

  // Only show status when there are actual issues
  if (databaseConnected === null) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Testing database connection...
          </div>
        </div>
      </div>
    );
  }

  if (databaseConnected === false) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Database disconnected - using local mode
          </div>
        </div>
      </div>
    );
  }

  // Show brief connected indicator then hide
  if (showConnected && databaseConnected === true) {
    return (
      <div className="fixed top-4 right-4 z-50 transition-opacity duration-1000">
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Database connected
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything when connected and not in brief show mode
  return null;
}; 