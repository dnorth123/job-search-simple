import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Authentication Required</h2>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 