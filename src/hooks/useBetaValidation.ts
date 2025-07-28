import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

// Types for beta invite validation
export interface BetaInvite {
  id: string;
  email: string;
  used_at: string | null;
  created_at: string;
  expires_at?: string;
}

export interface BetaValidationResult {
  isValid: boolean;
  error?: string;
  invite?: BetaInvite;
}

export interface UseBetaValidationReturn {
  isLoading: boolean;
  error: string | null;
  validateBetaAccess: (email: string) => Promise<BetaValidationResult>;
  markBetaInviteUsed: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export const useBetaValidation = (): UseBetaValidationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateBetaAccess = useCallback(async (email: string): Promise<BetaValidationResult> => {
    if (!email || !email.trim()) {
      return {
        isValid: false,
        error: 'Email is required'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: supabaseError } = await supabase
        .from('beta_invites')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          // No rows returned - email not found
          return {
            isValid: false,
            error: 'This email is not on our beta invite list. Please contact support for access.'
          };
        }
        
        console.error('Beta validation error:', supabaseError);
        return {
          isValid: false,
          error: 'Unable to validate beta access. Please try again.'
        };
      }

      if (!data) {
        return {
          isValid: false,
          error: 'This email is not on our beta invite list. Please contact support for access.'
        };
      }

      // Check if invite has already been used
      if (data.used_at) {
        return {
          isValid: false,
          error: 'This beta invite has already been used. Please contact support for a new invite.'
        };
      }

      // Check if invite has expired (if expires_at is set)
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          isValid: false,
          error: 'This beta invite has expired. Please contact support for a new invite.'
        };
      }

      return {
        isValid: true,
        invite: data
      };

    } catch (err) {
      console.error('Beta validation unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      
      return {
        isValid: false,
        error: 'Unable to validate beta access. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markBetaInviteUsed = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.trim()) {
      setError('Email is required to mark invite as used');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error: updateError } = await supabase
        .from('beta_invites')
        .update({ 
          used_at: new Date().toISOString() 
        })
        .eq('email', normalizedEmail)
        .is('used_at', null); // Only update if not already used

      if (updateError) {
        console.error('Error marking beta invite as used:', updateError);
        setError('Failed to mark invite as used. Please contact support.');
        return false;
      }

      return true;

    } catch (err) {
      console.error('Error marking beta invite as used:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invite as used';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    validateBetaAccess,
    markBetaInviteUsed,
    clearError
  };
}; 