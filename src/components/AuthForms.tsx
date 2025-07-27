import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FormField } from './FormField';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { validateField, AUTOCOMPLETE_MAP, trackFormInteraction, trackFormCompletion } from '../utils/formUtils';
import type { UserProfileFormData } from '../jobTypes';
import { validateUserProfileForm } from '../utils/validation';

interface AuthFormsProps {
  onAuthSuccess: () => void;
}

export function LoginForm({ onAuthSuccess }: AuthFormsProps) {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // Real-time validation
  const emailValidation = useFieldValidation(
    (value) => validateField('email', value),
    300
  );
  const passwordValidation = useFieldValidation(
    (value) => validateField('password', value),
    300
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(formData.email, formData.password);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('login', completionTime, 0);
      onAuthSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('login', completionTime, 1);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Trigger real-time validation
    if (field === 'email') {
      emailValidation.validate(value);
    } else if (field === 'password') {
      passwordValidation.validate(value);
    }
    
    trackFormInteraction('login', field, 'blur');
  };

  const handleFieldFocus = (field: string) => () => {
    trackFormInteraction('login', field, 'focus');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4" role="alert">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={handleFieldChange('email')}
          onFocus={handleFieldFocus('email')}
          onBlur={() => emailValidation.validate(formData.email)}
          error={emailValidation.error}
          autocomplete={AUTOCOMPLETE_MAP.email}
          placeholder="Enter your email"
          isValidating={emailValidation.isValidating}
          isValid={emailValidation.isValid}
        />
        
        <FormField
          id="password"
          name="password"
          label="Password"
          type="password"
          required
          value={formData.password}
          onChange={handleFieldChange('password')}
          onFocus={handleFieldFocus('password')}
          onBlur={() => passwordValidation.validate(formData.password)}
          error={passwordValidation.error}
          autocomplete={AUTOCOMPLETE_MAP.password}
          placeholder="Enter your password"
          isValidating={passwordValidation.isValidating}
          isValid={passwordValidation.isValid}
        />
        
        <button 
          type="submit" 
          disabled={loading || !formData.email || !formData.password} 
          className="btn btn-primary w-full touch-target"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export function SignupForm({ onAuthSuccess }: AuthFormsProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [startTime] = useState(Date.now());

  // Real-time validation
  const emailValidation = useFieldValidation(
    (value) => validateField('email', value),
    300
  );
  const passwordValidation = useFieldValidation(
    (value) => validateField('password', value),
    300
  );
  const confirmPasswordValidation = useFieldValidation(
    (value) => ({ 
      isValid: !value || value === formData.password, 
      error: value && value !== formData.password ? 'Passwords do not match' : undefined 
    }),
    300
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('signup', completionTime, 1);
      return;
    }

    try {
      await signUp(formData.email, formData.password);
      setSuccess(true);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('signup', completionTime, 0);
      onAuthSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('signup', completionTime, 1);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Trigger real-time validation
    if (field === 'email') {
      emailValidation.validate(value);
    } else if (field === 'password') {
      passwordValidation.validate(value);
      // Re-validate confirm password when password changes
      if (formData.confirmPassword) {
        confirmPasswordValidation.validate(formData.confirmPassword);
      }
    } else if (field === 'confirmPassword') {
      confirmPasswordValidation.validate(value);
    }
    
    trackFormInteraction('signup', field, 'blur');
  };

  const handleFieldFocus = (field: string) => () => {
    trackFormInteraction('signup', field, 'focus');
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="text-success-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Check your email</h3>
        <p className="text-secondary-600">
          We've sent you a confirmation link to complete your registration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4" role="alert">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="signup-email"
          name="email"
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={handleFieldChange('email')}
          onFocus={handleFieldFocus('email')}
          onBlur={() => emailValidation.validate(formData.email)}
          error={emailValidation.error}
          autocomplete={AUTOCOMPLETE_MAP.email}
          placeholder="Enter your email"
          isValidating={emailValidation.isValidating}
          isValid={emailValidation.isValid}
        />
        
        <FormField
          id="signup-password"
          name="password"
          label="Password"
          type="password"
          required
          value={formData.password}
          onChange={handleFieldChange('password')}
          onFocus={handleFieldFocus('password')}
          onBlur={() => passwordValidation.validate(formData.password)}
          error={passwordValidation.error}
          autocomplete={AUTOCOMPLETE_MAP.new_password}
          placeholder="Create a password"
          min={6}
          isValidating={passwordValidation.isValidating}
          isValid={passwordValidation.isValid}
        />
        
        <FormField
          id="confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleFieldChange('confirmPassword')}
          onFocus={handleFieldFocus('confirmPassword')}
          onBlur={() => confirmPasswordValidation.validate(formData.confirmPassword)}
          error={confirmPasswordValidation.error}
          autocomplete={AUTOCOMPLETE_MAP.confirm_password}
          placeholder="Confirm your password"
          min={6}
          isValidating={confirmPasswordValidation.isValidating}
          isValid={confirmPasswordValidation.isValid}
        />
        
        <button 
          type="submit" 
          disabled={loading || !formData.email || !formData.password || !formData.confirmPassword} 
          className="btn btn-primary w-full touch-target"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export function ProfileSetupForm({ onComplete }: { onComplete: () => void }) {
  const { createUserProfile } = useAuth();
  const [formData, setFormData] = useState<UserProfileFormData>({
    first_name: '',
    last_name: '',
    professional_title: '',
    industry_category: undefined,
    career_level: undefined,
    linkedin_url: '',
    portfolio_url: '',
    phone_number: '',
    location: '',
    years_experience: undefined,
    skills: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  // Real-time validation for key fields
  const phoneValidation = useFieldValidation(
    (value) => validateField('phone_number', value),
    300
  );
  const linkedinValidation = useFieldValidation(
    (value) => validateField('linkedin_url', value),
    300
  );
  const portfolioValidation = useFieldValidation(
    (value) => validateField('portfolio_url', value),
    300
  );
  const experienceValidation = useFieldValidation(
    (value) => validateField('years_experience', value),
    300
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    const validation = validateUserProfileForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message));
      setLoading(false);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('profile_setup', completionTime, validation.errors.length);
      return;
    }

    try {
      await createUserProfile(formData);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('profile_setup', completionTime, 0);
      onComplete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      const completionTime = Date.now() - startTime;
      trackFormCompletion('profile_setup', completionTime, 1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Trigger real-time validation for specific fields
    if (name === 'phone_number') {
      phoneValidation.validate(processedValue);
    } else if (name === 'linkedin_url') {
      linkedinValidation.validate(processedValue);
    } else if (name === 'portfolio_url') {
      portfolioValidation.validate(processedValue);
    } else if (name === 'years_experience') {
      experienceValidation.validate(processedValue);
    }

    trackFormInteraction('profile_setup', name, 'blur');
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const skillsText = e.target.value;
    const skillsArray = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
    trackFormInteraction('profile_setup', 'skills', 'blur');
  };

  const industryOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Education', label: 'Education' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Media', label: 'Media' },
    { value: 'Non-profit', label: 'Non-profit' },
    { value: 'Government', label: 'Government' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Other', label: 'Other' }
  ];

  const careerLevelOptions = [
    { value: 'Entry', label: 'Entry Level' },
    { value: 'Mid', label: 'Mid Level' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'Executive', label: 'Executive' }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4" role="alert">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4" role="alert">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-error-700 text-sm">{error}</div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="first_name"
              name="first_name"
              label="First Name"
              type="text"
              required
              value={formData.first_name}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.first_name}
              placeholder="Enter your first name"
            />
            <FormField
              id="last_name"
              name="last_name"
              label="Last Name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.last_name}
              placeholder="Enter your last name"
            />
          </div>
          
          <FormField
            id="professional_title"
            name="professional_title"
            label="Professional Title"
            type="text"
            value={formData.professional_title}
            onChange={handleInputChange}
            autocomplete={AUTOCOMPLETE_MAP.professional_title}
            placeholder="e.g., Senior Product Manager"
          />
        </div>

        {/* Professional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Professional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="industry_category"
              name="industry_category"
              label="Industry"
              type="select"
              value={formData.industry_category || ''}
              onChange={handleInputChange}
              options={industryOptions}
              placeholder="Select industry..."
            />
            <FormField
              id="career_level"
              name="career_level"
              label="Career Level"
              type="select"
              value={formData.career_level || ''}
              onChange={handleInputChange}
              options={careerLevelOptions}
              placeholder="Select level..."
            />
          </div>
          
          <FormField
            id="years_experience"
            name="years_experience"
            label="Years of Experience"
            type="number"
            value={formData.years_experience || ''}
            onChange={handleInputChange}
            placeholder="e.g., 5"
            min={0}
            max={50}
            error={experienceValidation.error}
            isValidating={experienceValidation.isValidating}
            isValid={experienceValidation.isValid}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="location"
              name="location"
              label="Location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.location}
              placeholder="e.g., Atlanta, GA"
            />
            <FormField
              id="phone_number"
              name="phone_number"
              label="Phone Number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.phone_number}
              placeholder="+1 (555) 123-4567"
              error={phoneValidation.error}
              isValidating={phoneValidation.isValidating}
              isValid={phoneValidation.isValid}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="linkedin_url"
              name="linkedin_url"
              label="LinkedIn URL"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.linkedin_url}
              placeholder="https://linkedin.com/in/..."
              error={linkedinValidation.error}
              isValidating={linkedinValidation.isValidating}
              isValid={linkedinValidation.isValid}
            />
            <FormField
              id="portfolio_url"
              name="portfolio_url"
              label="Portfolio URL"
              type="url"
              value={formData.portfolio_url}
              onChange={handleInputChange}
              autocomplete={AUTOCOMPLETE_MAP.portfolio_url}
              placeholder="https://yourportfolio.com"
              error={portfolioValidation.error}
              isValidating={portfolioValidation.isValidating}
              isValid={portfolioValidation.isValid}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Skills
          </h3>
          <FormField
            id="skills"
            name="skills"
            label="Skills (comma-separated)"
            type="textarea"
            value={formData.skills?.join(', ') || ''}
            onChange={handleSkillsChange}
            placeholder="e.g., Product Management, User Research, Data Analysis, Agile"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-secondary-200">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary touch-target"
          >
            {loading ? (
              <div className="loading-spinner w-4 h-4 mr-2"></div>
            ) : null}
            Complete Profile Setup
          </button>
        </div>
      </form>
    </div>
  );
} 