import React, { useState, useEffect } from 'react';
import type { Company, CompanyFormData } from '../jobTypes';
import { searchCompanies, createCompany } from '../utils/supabaseOperations';
import { validateCompanyForm } from '../utils/validation';

interface CompanySelectorProps {
  selectedCompanyId?: string;
  onCompanySelect: (companyId: string) => void;
  onCompanyCreate?: (company: Company) => void;
  placeholder?: string;
  className?: string;
}

export function CompanySelector({ 
  onCompanySelect, 
  onCompanyCreate,
  placeholder = "Search or create company...",
  className = ""
}: CompanySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyFormData>({
    name: '',
    industry_category: undefined,
    company_size_range: undefined,
    headquarters_location: '',
    website_url: '',
    linkedin_url: '',
    description: '',
    founded_year: undefined,
    funding_stage: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCompaniesByName();
    } else {
      setCompanies([]);
    }
  }, [searchTerm]);

  const searchCompaniesByName = async () => {
    setIsLoading(true);
    try {
      const results = await searchCompanies(searchTerm);
      setCompanies(results);
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    const validation = validateCompanyForm(createForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message));
      return;
    }

    setValidationErrors([]);
    setIsLoading(true);

    try {
      const newCompany = await createCompany(createForm);
      setCompanies(prev => [newCompany, ...prev]);
      onCompanySelect(newCompany.id);
      if (onCompanyCreate) {
        onCompanyCreate(newCompany);
      }
      setShowCreateForm(false);
      setCreateForm({
        name: '',
        industry_category: undefined,
        company_size_range: undefined,
        headquarters_location: '',
        website_url: '',
        linkedin_url: '',
        description: '',
        founded_year: undefined,
        funding_stage: '',
      });
    } catch (error) {
      console.error('Error creating company:', error);
      setValidationErrors(['Failed to create company. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    }
    
    setCreateForm(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="form-input pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="loading-spinner w-4 h-4"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {companies.length > 0 && !showCreateForm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium max-h-60 overflow-y-auto">
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => onCompanySelect(company.id)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-secondary-900">{company.name}</div>
              {company.headquarters_location && (
                <div className="text-sm text-secondary-600">{company.headquarters_location}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Create Company Button */}
      {!showCreateForm && searchTerm.length >= 2 && companies.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium">
          <button
            onClick={() => setShowCreateForm(true)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-primary-600 font-medium"
          >
            + Create "{searchTerm}"
          </button>
        </div>
      )}

      {/* Create Company Form */}
      {showCreateForm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium p-4">
          <h4 className="font-medium text-secondary-900 mb-3">Create New Company</h4>
          
          {validationErrors.length > 0 && (
            <div className="mb-3 p-3 bg-error-50 border border-error-200 rounded-lg">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-error-700 text-sm">{error}</div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                value={createForm.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Industry
                </label>
                <select
                  name="industry_category"
                  value={createForm.industry_category || ''}
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
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Company Size
                </label>
                <select
                  name="company_size_range"
                  value={createForm.company_size_range || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001-5000">1001-5000 employees</option>
                  <option value="5001-10000">5001-10000 employees</option>
                  <option value="10000+">10000+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Headquarters Location
              </label>
              <input
                type="text"
                name="headquarters_location"
                value={createForm.headquarters_location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={createForm.website_url}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={createForm.linkedin_url}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={createForm.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows={3}
                placeholder="Brief description of the company..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Founded Year
                </label>
                <input
                  type="number"
                  name="founded_year"
                  value={createForm.founded_year || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Funding Stage
                </label>
                <input
                  type="text"
                  name="funding_stage"
                  value={createForm.funding_stage}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Series A, Bootstrapped"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-secondary-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({
                    name: '',
                    industry_category: undefined,
                    company_size_range: undefined,
                    headquarters_location: '',
                    website_url: '',
                    linkedin_url: '',
                    description: '',
                    founded_year: undefined,
                    funding_stage: '',
                  });
                  setValidationErrors([]);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={isLoading}
                className="btn btn-intelligence"
              >
                {isLoading ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : null}
                Create Company
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && !showCreateForm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium p-3">
          <div className="flex items-center justify-center text-secondary-600">
            <div className="loading-spinner w-4 h-4 mr-2"></div>
            Searching companies...
          </div>
        </div>
      )}
    </div>
  );
} 