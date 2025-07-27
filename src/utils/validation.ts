import type { 
  JobApplicationFormData, 
  CompanyFormData, 
  UserProfileFormData, 
  ValidationError, 
  FormValidationResult
} from '../jobTypes';

// Validation helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

function isValidYear(year: number): boolean {
  return year >= 1800 && year <= new Date().getFullYear();
}

// Job Application Form Validation
export function validateJobApplicationForm(data: JobApplicationFormData): FormValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.position?.trim()) {
    errors.push({ field: 'position', message: 'Position is required' });
  }

  if (!data.date_applied) {
    errors.push({ field: 'date_applied', message: 'Date applied is required' });
  }

  // Date validation
  if (data.date_applied) {
    const appliedDate = new Date(data.date_applied);
    const today = new Date();
    if (appliedDate > today) {
      errors.push({ field: 'date_applied', message: 'Date applied cannot be in the future' });
    }
  }

  // Salary range validation
  if (data.salary_range_min && data.salary_range_max) {
    if (data.salary_range_min > data.salary_range_max) {
      errors.push({ field: 'salary_range_max', message: 'Maximum salary must be greater than minimum salary' });
    }
    if (data.salary_range_min < 0 || data.salary_range_max < 0) {
      errors.push({ field: 'salary_range_min', message: 'Salary values must be positive' });
    }
  }

  // Email validation for recruiter
  if (data.recruiter_email && !isValidEmail(data.recruiter_email)) {
    errors.push({ field: 'recruiter_email', message: 'Please enter a valid email address' });
  }

  // Phone validation for recruiter
  if (data.recruiter_phone && !isValidPhoneNumber(data.recruiter_phone)) {
    errors.push({ field: 'recruiter_phone', message: 'Please enter a valid phone number' });
  }

  // URL validation
  if (data.job_posting_url && !isValidUrl(data.job_posting_url)) {
    errors.push({ field: 'job_posting_url', message: 'Please enter a valid URL' });
  }



  return {
    isValid: errors.length === 0,
    errors
  };
}

// Company Form Validation
export function validateCompanyForm(data: CompanyFormData): FormValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Company name is required' });
  }

  // URL validations
  if (data.website_url && !isValidUrl(data.website_url)) {
    errors.push({ field: 'website_url', message: 'Please enter a valid website URL' });
  }

  if (data.linkedin_url && !isValidUrl(data.linkedin_url)) {
    errors.push({ field: 'linkedin_url', message: 'Please enter a valid LinkedIn URL' });
  }

  // Year validation
  if (data.founded_year && !isValidYear(data.founded_year)) {
    errors.push({ field: 'founded_year', message: 'Please enter a valid year' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// User Profile Form Validation
export function validateUserProfileForm(data: UserProfileFormData): FormValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.first_name?.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  }

  if (!data.last_name?.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  }

  // Email validation (if provided)
  if (data.linkedin_url && !isValidUrl(data.linkedin_url)) {
    errors.push({ field: 'linkedin_url', message: 'Please enter a valid LinkedIn URL' });
  }

  if (data.portfolio_url && !isValidUrl(data.portfolio_url)) {
    errors.push({ field: 'portfolio_url', message: 'Please enter a valid portfolio URL' });
  }

  // Phone validation
  if (data.phone_number && !isValidPhoneNumber(data.phone_number)) {
    errors.push({ field: 'phone_number', message: 'Please enter a valid phone number' });
  }

  // Years experience validation
  if (data.years_experience && (data.years_experience < 0 || data.years_experience > 50)) {
    errors.push({ field: 'years_experience', message: 'Years of experience must be between 0 and 50' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generic form validation
export function validateRequiredField(value: unknown, fieldName: string): ValidationError | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

export function validateEmailField(email: string, fieldName: string): ValidationError | null {
  if (email && !isValidEmail(email)) {
    return { field: fieldName, message: 'Please enter a valid email address' };
  }
  return null;
}

export function validateUrlField(url: string, fieldName: string): ValidationError | null {
  if (url && !isValidUrl(url)) {
    return { field: fieldName, message: 'Please enter a valid URL' };
  }
  return null;
}

// Helper function to get field error message
export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  return errors.find(error => error.field === fieldName)?.message;
}

// Helper function to check if field has error
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(error => error.field === fieldName);
} 