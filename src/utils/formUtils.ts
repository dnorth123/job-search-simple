// Autocomplete mapping for job search forms
export const AUTOCOMPLETE_MAP = {
  'first_name': 'given-name',
  'last_name': 'family-name', 
  'email': 'email',
  'phone_number': 'tel',
  'linkedin_url': 'url',
  'location': 'address-level2',
  'company_name': 'organization',
  'position': 'organization-title',
  'password': 'current-password',
  'new_password': 'new-password',
  'confirm_password': 'new-password',
  'website_url': 'url',
  'portfolio_url': 'url',
  'headquarters_location': 'address-level2',
  'professional_title': 'organization-title',
  'years_experience': 'off',
  'founded_year': 'off',
  'company_size_range': 'off',
  'funding_stage': 'off',
  'industry_category': 'off',
  'career_level': 'off',
  'skills': 'off'
} as const;

// Atlanta-specific smart defaults
export const ATLANTA_DEFAULTS = {
  location: 'Atlanta, GA',
  timezone: 'America/New_York',
  common_industries: ['Technology', 'Healthcare', 'Finance', 'Consulting', 'Media', 'Transportation'],
  metro_areas: ['Atlanta', 'Marietta', 'Roswell', 'Sandy Springs', 'Alpharetta', 'Decatur', 'Buckhead'],
  common_companies: ['Coca-Cola', 'Delta Air Lines', 'Home Depot', 'UPS', 'Cox Enterprises', 'Southern Company']
};

// Enhanced error messaging with recovery suggestions
export const getEnhancedErrorMessage = (field: string, value: string | number | undefined, error: string) => {
  const suggestions: Record<string, string> = {
    'email': 'Please include @ symbol and domain (e.g., you@company.com)',
    'phone_number': 'Use format: +1 (555) 123-4567 or similar',
    'linkedin_url': 'LinkedIn URLs start with https://www.linkedin.com/in/',
    'years_experience': 'Enter a number between 0 and 50',
    'founded_year': 'Enter a year between 1800 and current year',
    'website_url': 'URLs should start with https:// or http://',
    'portfolio_url': 'URLs should start with https:// or http://',
    'location': 'Include city and state (e.g., Atlanta, GA)',
    'headquarters_location': 'Include city and state (e.g., Atlanta, GA)',
    'password': 'Password must be at least 6 characters long',
    'confirm_password': 'Passwords must match exactly'
  };
  
  const examples: Record<string, string> = {
    'email': 'john.doe@company.com',
    'phone_number': '+1 (555) 123-4567',
    'linkedin_url': 'https://www.linkedin.com/in/johndoe',
    'website_url': 'https://www.company.com',
    'portfolio_url': 'https://www.yourportfolio.com',
    'location': 'Atlanta, GA',
    'headquarters_location': 'Atlanta, GA'
  };
  
  return {
    message: error,
    suggestion: suggestions[field] || 'Please check your input and try again',
    example: examples[field] || undefined
  };
};

// Field validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
  url: /^https?:\/\/.+/,
  year: /^(19|20)\d{2}$/,
  experience: /^[0-9]{1,2}$/
};

// Real-time validation functions
export const validateField = (field: string, value: string | number | undefined): { isValid: boolean; error?: string } => {
  if (!value || value === '') {
    return { isValid: true }; // Empty is valid unless required
  }

  const stringValue = String(value);

  switch (field) {
    case 'email': {
      if (!VALIDATION_PATTERNS.email.test(stringValue)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      break;
    }
      
    case 'phone_number': {
      if (!VALIDATION_PATTERNS.phone.test(stringValue)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      break;
    }
      
    case 'linkedin_url': {
      if (!VALIDATION_PATTERNS.linkedin.test(stringValue)) {
        return { isValid: false, error: 'Please enter a valid LinkedIn URL' };
      }
      break;
    }
      
    case 'website_url':
    case 'portfolio_url': {
      if (!VALIDATION_PATTERNS.url.test(stringValue)) {
        return { isValid: false, error: 'Please enter a valid URL starting with http:// or https://' };
      }
      break;
    }
      
    case 'years_experience': {
      const expNum = Number(value);
      if (isNaN(expNum) || expNum < 0 || expNum > 50) {
        return { isValid: false, error: 'Please enter a number between 0 and 50' };
      }
      break;
    }
      
    case 'founded_year': {
      const yearNum = Number(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
        return { isValid: false, error: `Please enter a year between 1800 and ${currentYear}` };
      }
      break;
    }
  }

  return { isValid: true };
};

// Form analytics tracking
export const trackFormInteraction = (formName: string, fieldName: string, action: 'focus' | 'blur' | 'error' | 'success') => {
  // Track field-level analytics for optimization
  console.log('Form Analytics:', {
    form: formName,
    field: fieldName,
    action,
    timestamp: Date.now()
  });
};

export const trackFormCompletion = (formName: string, timeToComplete: number, errorCount: number) => {
  // Track form completion metrics
  console.log('Form Completion:', {
    form: formName,
    completion_time: timeToComplete,
    error_count: errorCount,
    conversion: true
  });
}; 