import { useState, useCallback } from 'react';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldState {
  value: string | number | undefined;
  error: string | null;
  isValidating: boolean;
  isValid: boolean | null;
}

export const useFormState = <T extends Record<string, string | number | undefined>>(
  initialData: T,
  validator: (data: T) => ValidationResult
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});

  const updateField = useCallback((name: keyof T, value: string | number | undefined) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    // Clear existing error for this field
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: '' }));
    }
    
    // Update field state
    setFieldStates(prev => ({
      ...prev,
      [name as string]: {
        value,
        error: null,
        isValidating: true,
        isValid: null
      }
    }));
  }, [errors]);

  const setFieldError = useCallback((name: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [name]: error || '' }));
    setFieldStates(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
        isValidating: false,
        isValid: !error
      }
    }));
  }, []);

  const setFieldValidating = useCallback((name: string, isValidating: boolean) => {
    setFieldStates(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        isValidating
      }
    }));
  }, []);

  const submitForm = useCallback(async (onSubmit: (data: T) => Promise<void>) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const validation = validator(data);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return { success: false, errors: validation.errors };
      }

      await onSubmit(data);
      return { success: true, errors: {} };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      setErrors({ submit: errorMessage });
      return { success: false, errors: { submit: errorMessage } };
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validator]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setFieldStates({});
    setIsSubmitting(false);
  }, [initialData]);

  return {
    data,
    errors,
    isSubmitting,
    fieldStates,
    updateField,
    setFieldError,
    setFieldValidating,
    submitForm,
    resetForm
  };
}; 