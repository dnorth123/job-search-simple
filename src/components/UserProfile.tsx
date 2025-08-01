import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { UserProfileFormData } from '../jobTypes';
import { validateUserProfileForm } from '../utils/validation';
import { ResumeUpload } from './ResumeUpload';
import { AdminBetaInvites } from './AdminBetaInvites';

export function UserProfile() {
  const { profile, updateProfile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    professional_title: profile?.professional_title || '',
    industry_category: profile?.industry_category,
    career_level: profile?.career_level,
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
    phone_number: profile?.phone_number || '',
    location: profile?.location || '',
    years_experience: profile?.years_experience,
    skills: profile?.skills || [],
  });
  const [skillsText, setSkillsText] = useState(profile?.skills?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if user is admin
  const isAdmin = user?.email === 'dan.northington@gmail.com';

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        professional_title: profile.professional_title || '',
        industry_category: profile.industry_category,
        career_level: profile.career_level,
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
        phone_number: profile.phone_number || '',
        location: profile.location || '',
        years_experience: profile.years_experience,
        skills: profile.skills || [],
      });
      setSkillsText(profile.skills?.join(', ') || '');
    }
  }, [profile]);

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
      await updateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
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
    const skillsTextValue = e.target.value;
    // Store the raw text input for free typing
    setSkillsText(skillsTextValue);
  };

  const handleSkillsBlur = (e?: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!e) return;
    const skillsTextValue = e.target.value;
    // Process skills on blur - split by comma, trim, and filter empty
    const skillsArray = skillsTextValue
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleResumeDataExtracted = (data: { first_name?: string; last_name?: string; professional_title?: string; industry_category?: import('../jobTypes').IndustryCategory; career_level?: import('../jobTypes').CareerLevel; linkedin_url?: string; portfolio_url?: string; phone_number?: string; location?: string; years_experience?: number; skills?: string[] }) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
    
    // Update skills text if skills were extracted
    if (data.skills && Array.isArray(data.skills)) {
      setSkillsText(data.skills.join(', '));
    }
  };





  // Show admin interface if admin button was clicked
  if (showAdmin && isAdmin) {
    return (
      <AdminBetaInvites onNavigateBack={() => setShowAdmin(false)} />
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-secondary-500">No profile data available</div>
      </div>
    );
  }

  if (isEditing) {
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
          {/* Resume Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
              Import Profile Data
            </h3>
            <ResumeUpload onDataExtracted={handleResumeDataExtracted} disabled={loading} />
          </div>

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
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Skills (comma-separated)
                </label>
                <textarea
                  name="skills"
                  value={skillsText}
                  onChange={handleSkillsChange}
                  onBlur={handleSkillsBlur}
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g., Product Management, User Research, Data Analysis, Agile"
                />
              </div>
              {/* Skills Preview */}
              {formData.skills && formData.skills.length > 0 && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-secondary-600 mb-2">
                    Skills Preview
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-strategic"
            >
              {loading ? (
                <div className="loading-spinner w-4 h-4 mr-2"></div>
              ) : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Basic Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Name</label>
              <p className="text-secondary-900">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
            {profile.professional_title && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Professional Title</label>
                <p className="text-secondary-900">{profile.professional_title}</p>
              </div>
            )}
            {profile.location && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Location</label>
                <p className="text-secondary-900">{profile.location}</p>
              </div>
            )}
            {profile.phone_number && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Phone</label>
                <p className="text-secondary-900">{profile.phone_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Professional Details</h3>
          </div>
          <div className="card-body space-y-4">
            {profile.industry_category && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Industry</label>
                <p className="text-secondary-900">{profile.industry_category}</p>
              </div>
            )}
            {profile.career_level && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Career Level</label>
                <p className="text-secondary-900">{profile.career_level}</p>
              </div>
            )}
            {profile.years_experience && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Years of Experience</label>
                <p className="text-secondary-900">{profile.years_experience} years</p>
              </div>
            )}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Online Presence */}
        {(profile.linkedin_url || profile.portfolio_url) && (
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h3 className="text-lg font-medium text-secondary-900">Online Presence</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.linkedin_url && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">LinkedIn</label>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
                {profile.portfolio_url && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">Portfolio</label>
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Button */}
      <div className="flex justify-end pt-6 space-x-3">
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Profile
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin
          </button>
        )}
      </div>
    </div>
  );
} 