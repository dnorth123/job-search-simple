import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const DatabaseStatus: React.FC = () => {
  const { databaseConnected } = useAuth();

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

  // Don't show "Database connected" indicator when everything is working
  // This reduces visual clutter and improves UX
  return null;
}; 