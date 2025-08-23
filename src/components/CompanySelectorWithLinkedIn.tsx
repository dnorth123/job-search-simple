import React, { useState, useEffect, useCallback } from 'react';
import type { Company } from '../jobTypes';
import { searchCompanies } from '../utils/supabaseOperations';
import { supabase } from '../utils/supabase';
import { useDebounce } from '../hooks/useDebounce';
import LinkedInCompanyDiscovery from './LinkedInCompanyDiscovery';

interface CompanySelectorWithLinkedInProps {
  selectedCompanyId?: string;
  onCompanySelect: (companyId: string, linkedInData?: {
    url: string;
    confidence: number;
    method: 'auto' | 'manual';
  }) => void;
  placeholder?: string;
  className?: string;
  isEditing?: boolean;
}

export function CompanySelectorWithLinkedIn({ 
  selectedCompanyId,
  onCompanySelect, 
  placeholder = "Search or create company...",
  className = "",
  isEditing = false
}: CompanySelectorWithLinkedInProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Simple input value for company name
  const [inputValue, setInputValue] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [linkedInData, setLinkedInData] = useState<{
    url: string | null;
    confidence?: number;
    method?: 'auto' | 'manual';
    standardizedName?: string;
  }>({ url: null });

  // Debounced input for company search
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Load selected company when selectedCompanyId changes
  useEffect(() => {
    async function loadCompany() {
      if (!selectedCompanyId) {
        setSelectedCompany(null);
        setInputValue('');
        setLinkedInData({ url: null });
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
        setInputValue(data.name);
        setLinkedInData({
          url: data.linkedin_url || null,
          confidence: undefined,
          method: undefined
        });
      } catch (error) {
        console.error('Error loading company:', error);
        setSelectedCompany(null);
        setInputValue('');
        setLinkedInData({ url: null });
      }
    }

    loadCompany();
  }, [selectedCompanyId]);

  // Debounced company search effect
  useEffect(() => {
    if (debouncedInputValue.trim().length >= 2 && !selectedCompany) {
      performSearch(debouncedInputValue.trim());
    } else {
      setCompanies([]);
      setShowDropdown(false);
    }
  }, [debouncedInputValue, selectedCompany]);


  const performSearch = async (searchValue: string) => {
    setIsLoading(true);
    try {
      const results = await searchCompanies(searchValue);
      setCompanies(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelection = async (company: Company) => {
    setSelectedCompany(company);
    setInputValue(company.name);
    setShowDropdown(false);
    setLinkedInData({
      url: company.linkedin_url || null,
      confidence: undefined,
      method: undefined
    });

    // If company has LinkedIn data, pass it along
    const existingLinkedInData = company.linkedin_url ? {
      url: company.linkedin_url,
      confidence: 0,
      method: 'manual' as 'manual'
    } : undefined;

    onCompanySelect(company.id, existingLinkedInData);
  };

  const handleCreateCompany = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      // Use standardized company name from LinkedIn if available, otherwise use input value
      const standardizedName = linkedInData.url && linkedInData.standardizedName 
        ? linkedInData.standardizedName 
        : inputValue.trim();

      const newCompanyData: any = {
        name: standardizedName
      };

      // Only add LinkedIn URL if it exists
      if (linkedInData.url) {
        newCompanyData.linkedin_url = linkedInData.url;
      }


      const { data, error } = await supabase
        .from('companies')
        .insert([newCompanyData])
        .select()
        .single();

      if (error) throw error;

      setSelectedCompany(data);
      setShowDropdown(false);
      
      const linkedInDataForCallback = linkedInData.url ? {
        url: linkedInData.url,
        confidence: linkedInData.confidence || 0,
        method: linkedInData.method || 'manual'
      } : undefined;

      onCompanySelect(data.id, linkedInDataForCallback);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSelect = async (url: string | null, confidence?: number, standardizedName?: string) => {
    const method: 'auto' | 'manual' = confidence && confidence > 0 ? 'auto' : 'manual';
    
    
    setLinkedInData({
      url,
      confidence,
      method: url ? method : undefined,
      standardizedName
    });

    // If we have a selected company, update it immediately
    if (selectedCompany) {
      try {
        const updateData = {
          linkedin_url: url
        };

        const { data, error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', selectedCompany.id);

        if (error) {
          console.error('Database update error:', error);
          throw new Error(`Failed to update LinkedIn data: ${error.message}`);
        }

        // Update local state
        setSelectedCompany(prev => prev ? { ...prev, ...updateData } : null);

        // Notify parent of the update
        const linkedInDataForCallback = url ? {
          url,
          confidence: confidence || 0,
          method
        } : undefined;

        onCompanySelect(selectedCompany.id, linkedInDataForCallback);
      } catch (error) {
        console.error('Error updating company LinkedIn data:', error);
      }
    } else if (url && inputValue.trim()) {
      // No selected company but LinkedIn URL selected - auto-create company
      await handleCreateCompany();
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); // Immediate update for display
    
    if (selectedCompany && value !== selectedCompany.name) {
      setSelectedCompany(null);
      setLinkedInData({ url: null });
    }
  }, [selectedCompany]);

  const handleClearCompany = () => {
    setSelectedCompany(null);
    setInputValue('');
    setLinkedInData({ url: null });
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Company Search Input */}
      <div className="relative flex gap-2">
        <input
          key="company-search-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="form-input flex-1"
          disabled={isLoading}
        />
        
        {selectedCompany && (
          <button
            type="button"
            onClick={handleClearCompany}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {/* Company Search Results Dropdown */}
      {showDropdown && !selectedCompany && companies.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => handleCompanySelection(company)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{company.name}</div>
              {company.industry_category && (
                <div className="text-sm text-gray-500">{company.industry_category}</div>
              )}
              {company.linkedin_url && (
                <div className="text-xs text-blue-600 mt-1">Has LinkedIn</div>
              )}
            </button>
          ))}
          
          {/* Create new company option - only if user has stopped typing */}
          {debouncedInputValue === inputValue && (
            <button
              type="button"
              onClick={handleCreateCompany}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-t border-gray-200 text-blue-600 font-medium"
            >
              + Create "{inputValue}"
            </button>
          )}
        </div>
      )}

      {/* No results found - only if user has stopped typing */}
      {showDropdown && !selectedCompany && companies.length === 0 && debouncedInputValue.length >= 2 && debouncedInputValue === inputValue && !isLoading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={handleCreateCompany}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 font-medium"
          >
            + Create "{inputValue}"
          </button>
        </div>
      )}

      {/* LinkedIn Discovery Component - always show when we have input, regardless of company selection */}
      {inputValue.length >= 3 && (
        <div className="mt-4">
          <LinkedInCompanyDiscovery
            companyName={selectedCompany?.name || inputValue.trim()}
            currentLinkedInUrl={linkedInData.url}
            onLinkedInSelect={(url, confidence, standardizedName) => handleLinkedInSelect(url, confidence, standardizedName)}
          />
        </div>
      )}
    </div>
  );
}