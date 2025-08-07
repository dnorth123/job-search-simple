import React, { useState, useEffect } from 'react';
import type { Company } from '../jobTypes';
import { searchCompanies } from '../utils/supabaseOperations';
import { supabase } from '../utils/supabase';

interface CompanySelectorProps {
  selectedCompanyId?: string;
  onCompanySelect: (companyId: string) => void;
  placeholder?: string;
  className?: string;
  isEditing?: boolean;
}

export function CompanySelector({ 
  selectedCompanyId,
  onCompanySelect, 
  placeholder = "Search or create company...",
  className = "",
  isEditing = false
}: CompanySelectorProps) {
  // Debug group to track component lifecycle and state changes
  console.groupCollapsed(`CompanySelector Render: ${selectedCompanyId || 'no company'}`);
  console.log('Props:', { selectedCompanyId, isEditing });
  console.groupEnd();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load selected company when selectedCompanyId changes
  useEffect(() => {
    async function loadCompany() {
      console.log('State Transition - Loading Company:', { selectedCompanyId });
      if (!selectedCompanyId) {
        setSelectedCompany(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', selectedCompanyId)
          .single();

        if (error) throw error;
        setSelectedCompany(data);
      } catch (error) {
        console.error('Error loading company:', error);
        setSelectedCompany(null);
      }
    }

    loadCompany();
  }, [selectedCompanyId]);

  // Search for companies when searchTerm changes
  useEffect(() => {
    async function searchForCompanies() {
      if (searchTerm.length < 2) {
        setCompanies([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchCompanies(searchTerm);
        setCompanies(results);
      } catch (error) {
        console.error('Error searching companies:', error);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!selectedCompany) {
      searchForCompanies();
    }
  }, [searchTerm, selectedCompany]);

  const handleRemoveCompany = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCompany(null);
    setSearchTerm('');
    onCompanySelect('');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleCompanySelect = (companyId: string) => {
    onCompanySelect(companyId);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`} onClick={e => e.stopPropagation()}>
      <div className="relative">
        {selectedCompany ? (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-800 rounded-md border border-gray-300 text-sm">
            <span className="font-medium">{selectedCompany.name}</span>
            <button
              onClick={handleRemoveCompany}
              className="ml-1 text-gray-500 hover:text-gray-700 p-0.5 rounded hover:bg-gray-300 transition-colors"
              title="Remove company"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onClick={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="form-input pr-10"
            data-testid="company-name-input"
          />
        )}

        {isLoading && !selectedCompany && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="loading-spinner w-4 h-4"></div>
          </div>
        )}
      </div>

      {!selectedCompany && showDropdown && companies.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium max-h-60 overflow-y-auto">
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => handleCompanySelect(company.id)}
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
    </div>
  );
}