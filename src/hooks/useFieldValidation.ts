import { useState, useCallback, useRef } from 'react';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const useFieldValidation = (
  validator: (value: string | number | undefined) => ValidationResult | Promise<ValidationResult>,
  delay = 300
) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedValidate = useCallback(
    async (value: string | number | undefined) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set validating state immediately
      setIsValidating(true);
      setError(null);

      // Debounce the actual validation
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await validator(value);
          setError(result.error || null);
          setIsValid(result.isValid);
        } catch {
          setError('Validation failed');
          setIsValid(false);
        } finally {
          setIsValidating(false);
        }
      }, delay);
    },
    [validator, delay]
  );

  const validate = (value: string | number | undefined) => {
    debouncedValidate(value);
  };

  const clearError = () => {
    setError(null);
    setIsValid(null);
    setIsValidating(false);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  return { 
    error, 
    isValidating, 
    isValid, 
    validate, 
    clearError 
  };
}; 