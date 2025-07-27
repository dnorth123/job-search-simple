import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(formData.email, formData.password);
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="form-input"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="form-input"
            placeholder="Enter your password"
          />
        </div>
        
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password);
      setSuccess(true);
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
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
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-secondary-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="signup-email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="form-input"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-secondary-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="signup-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="form-input"
            placeholder="Create a password"
            minLength={6}
          />
        </div>
        
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirm-password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="form-input"
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>
        
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    const validation = validateUserProfileForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message));
      setLoading(false);
      return;
    }

    try {
      await createUserProfile(formData);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
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
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsText = e.target.value;
    const skillsArray = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="text-error-700 text-sm">{error}</div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-error-700 text-sm">{error}</div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Professional Title
            </label>
            <input
              type="text"
              name="professional_title"
              value={formData.professional_title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Senior Product Manager"
            />
          </div>
        </div>

        {/* Professional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Professional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Industry
              </label>
              <select
                name="industry_category"
                value={formData.industry_category || ''}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select industry...</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Consulting">Consulting</option>
                <option value="Media">Media</option>
                <option value="Non-profit">Non-profit</option>
                <option value="Government">Government</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Transportation">Transportation</option>
                <option value="Energy">Energy</option>
                <option value="Legal">Legal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Career Level
              </label>
              <select
                name="career_level"
                value={formData.career_level || ''}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select level...</option>
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              name="years_experience"
              value={formData.years_experience || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., 5"
              min="0"
              max="50"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="form-input"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
            Skills
          </h3>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Skills (comma-separated)
            </label>
            <textarea
              name="skills"
              value={formData.skills?.join(', ') || ''}
              onChange={handleSkillsChange}
              className="form-textarea"
              rows={3}
              placeholder="e.g., Product Management, User Research, Data Analysis, Agile"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-secondary-200">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
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