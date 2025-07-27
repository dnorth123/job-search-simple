import React from 'react';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string | null;
  helpText?: string;
  autocomplete?: string;
  placeholder?: string;
  disabled?: boolean;
  isValidating?: boolean;
  isValid?: boolean | null;
  className?: string;
  min?: number;
  max?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  type = "text",
  required = false,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helpText,
  autocomplete,
  placeholder,
  disabled = false,
  isValidating = false,
  isValid = null,
  className = "",
  min,
  max,
  rows = 3,
  options
}) => {
  const inputId = id;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helpId, error && errorId].filter(Boolean).join(' ');

  const baseInputClasses = `
    w-full px-4 py-3 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    disabled:bg-secondary-100 disabled:cursor-not-allowed
    form-mobile
    touch-target
  `;

  const getInputClasses = () => {
    let classes = baseInputClasses;
    
    if (error) {
      classes += ' border-error-500 bg-error-50 focus:ring-error-500 focus:border-error-500';
    } else if (isValid === true) {
      classes += ' border-success-500 bg-success-50 focus:ring-success-500 focus:border-success-500';
    } else {
      classes += ' border-secondary-300 bg-white hover:border-secondary-400';
    }
    
    return `${classes} ${className}`;
  };

  const renderInput = () => {
    const commonProps = {
      id: inputId,
      name,
      value: value || '',
      onChange,
      onBlur,
      onFocus,
      required,
      disabled,
      autoComplete: autocomplete,
      placeholder,
      'aria-invalid': error ? 'true' as const : 'false' as const,
      'aria-describedby': describedBy || undefined,
      className: getInputClasses(),
      style: { minHeight: '48px', fontSize: '16px' } // Prevent iOS zoom
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={rows}
          minLength={min}
          maxLength={max}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          {...commonProps}
        >
          <option value="">{placeholder || 'Select an option...'}</option>
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...commonProps}
        type={type}
        min={min}
        max={max}
      />
    );
  };

  return (
    <div className="form-field space-y-2">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-medium text-secondary-700"
      >
        {label} 
        {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        {renderInput()}
        
        {/* Validation indicator */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="loading-spinner w-4 h-4 text-primary-500"></div>
          </div>
        )}
        
        {isValid === true && !isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {helpText && (
        <div id={helpId} className="text-sm text-secondary-600">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="text-sm text-error-600 flex items-start space-x-1" 
          role="alert" 
          aria-live="polite"
        >
          <svg className="w-4 h-4 text-error-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}; 