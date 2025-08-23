import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { supabase } from '../../utils/supabase';
import LinkedInCompanyDiscovery from '../../components/LinkedInCompanyDiscovery';
import { CompanySelectorWithLinkedIn } from '../../components/CompanySelectorWithLinkedIn';

// Mock the entire supabase module
jest.mock('../../utils/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        gte: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-company-id', 
              name: 'Test Company',
              linkedin_url: 'https://www.linkedin.com/company/test/'
            }, 
            error: null 
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  },
  TABLES: {
    COMPANIES: 'companies',
    LINKEDIN_SEARCH_CACHE: 'linkedin_search_cache',
    LINKEDIN_SEARCH_METRICS: 'linkedin_search_metrics'
  }
}));

// Mock the useDebounce hook
jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value)
}));

// Mock company operations
jest.mock('../../utils/supabaseOperations', () => ({
  searchCompanies: jest.fn(() => Promise.resolve([])),
  createCompany: jest.fn(() => Promise.resolve({
    id: 'new-company-id',
    name: 'New Company',
    linkedin_url: null
  }))
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('LinkedIn Discovery Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        results: [
          {
            url: 'https://www.linkedin.com/company/microsoft/',
            companyName: 'Microsoft',
            vanityName: 'microsoft',
            description: 'Technology company that develops software',
            confidence: 0.95
          }
        ],
        cached: false,
        searchTerm: 'Microsoft'
      },
      error: null
    });
  });

  describe('Complete Flow: Search → Select → Save', () => {
    test('should complete full LinkedIn discovery and selection flow', async () => {
      const mockOnCompanySelect = jest.fn();
      
      render(
        <CompanySelectorWithLinkedIn
          onCompanySelect={mockOnCompanySelect}
          placeholder="Search companies..."
        />
      );

      // Step 1: Enter company name
      const companyInput = screen.getByPlaceholderText('Search companies...');
      await userEvent.type(companyInput, 'Microsoft');

      // Step 2: Wait for LinkedIn search to trigger
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: 'Microsoft' }
        });
      });

      // Step 3: Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
        expect(screen.getByText('High (95%)')).toBeInTheDocument();
      });

      // Step 4: Select a LinkedIn suggestion
      const microsoftSuggestion = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftSuggestion!);

      // Step 5: Verify callback was called with LinkedIn data
      await waitFor(() => {
        expect(mockOnCompanySelect).toHaveBeenCalledWith(
          expect.any(String), // company ID
          {
            url: 'https://www.linkedin.com/company/microsoft/',
            confidence: 0.95,
            method: 'auto'
          }
        );
      });
    });

    test('should handle new company creation with LinkedIn data', async () => {
      const mockOnCompanySelect = jest.fn();
      
      // Mock no existing companies found
      const { searchCompanies } = require('../../utils/supabaseOperations');
      searchCompanies.mockResolvedValue([]);

      render(
        <CompanySelectorWithLinkedIn
          onCompanySelect={mockOnCompanySelect}
          placeholder="Search companies..."
        />
      );

      // Enter a new company name
      const companyInput = screen.getByPlaceholderText('Search companies...');
      await userEvent.type(companyInput, 'NewTech Corp');

      // Wait for no results and create option
      await waitFor(() => {
        expect(screen.getByText('+ Create "NewTech Corp"')).toBeInTheDocument();
      });

      // Select LinkedIn suggestion first
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument(); // From mock response
      });

      const linkedinSuggestion = screen.getByText('Microsoft').closest('div');
      fireEvent.click(linkedinSuggestion!);

      // Now click create company
      fireEvent.click(screen.getByText('+ Create "NewTech Corp"'));

      // Should create company with LinkedIn data
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('companies');
      });
    });
  });

  describe('Manual Entry Flow', () => {
    test('should handle manual LinkedIn URL entry', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Custom Company"
          onLinkedInSelect={mockOnLinkedInSelect}
        />
      );

      // Wait for auto-search to complete
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      // Click "None of these" to enter manual mode
      fireEvent.click(screen.getByText('None of these'));

      // Should show manual entry form
      expect(screen.getByText('Enter LinkedIn Company URL')).toBeInTheDocument();
      
      const urlInput = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      
      // Enter valid LinkedIn URL
      await userEvent.type(urlInput, 'https://www.linkedin.com/company/custom-company');
      
      // Click save
      fireEvent.click(screen.getByText('Save'));

      // Should call callback with manual entry
      expect(mockOnLinkedInSelect).toHaveBeenCalledWith('https://www.linkedin.com/company/custom-company');
    });

    test('should validate manual LinkedIn URLs', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Test Company"
          onLinkedInSelect={mockOnLinkedInSelect}
        />
      );

      // Enter manual mode
      fireEvent.click(screen.getByText('None of these'));
      
      const urlInput = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      
      // Enter invalid URL
      await userEvent.type(urlInput, 'invalid-url');
      fireEvent.click(screen.getByText('Save'));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid LinkedIn company URL/)).toBeInTheDocument();
      });

      // Should not call callback
      expect(mockOnLinkedInSelect).not.toHaveBeenCalled();
    });
  });

  describe('Cache Behavior', () => {
    test('should use cached results when available', async () => {
      // Mock cached response
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          results: [
            {
              url: 'https://www.linkedin.com/company/microsoft/',
              companyName: 'Microsoft',
              vanityName: 'microsoft', 
              description: 'Technology company (cached)',
              confidence: 0.95
            }
          ],
          cached: true,
          searchTerm: 'Microsoft'
        },
        error: null
      });

      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Technology company (cached)')).toBeInTheDocument();
      });

      // Should still call the API (cache check happens server-side)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
        body: { companyName: 'Microsoft' }
      });
    });

    test('should handle cache expiration gracefully', async () => {
      // First call returns cached data
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                url: 'https://www.linkedin.com/company/microsoft/',
                companyName: 'Microsoft',
                vanityName: 'microsoft',
                description: 'Cached result',
                confidence: 0.95
              }
            ],
            cached: true,
            searchTerm: 'Microsoft'
          },
          error: null
        })
        // Second call returns fresh data  
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                url: 'https://www.linkedin.com/company/microsoft/',
                companyName: 'Microsoft',
                vanityName: 'microsoft',
                description: 'Fresh result',
                confidence: 0.95
              }
            ],
            cached: false,
            searchTerm: 'Microsoft'
          },
          error: null
        });

      const { rerender } = render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={jest.fn()}
        />
      );

      // First render - cached result
      await waitFor(() => {
        expect(screen.getByText('Cached result')).toBeInTheDocument();
      });

      // Simulate cache expiration by re-rendering
      rerender(
        <LinkedInCompanyDiscovery
          companyName="Microsoft" 
          onLinkedInSelect={jest.fn()}
        />
      );

      // Should show fresh result
      await waitFor(() => {
        expect(screen.getByText('Fresh result')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    test('should recover from API failures with retry', async () => {
      // First call fails
      mockSupabase.functions.invoke
        .mockRejectedValueOnce(new Error('Network timeout'))
        // Second call succeeds
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                url: 'https://www.linkedin.com/company/microsoft/',
                companyName: 'Microsoft',
                vanityName: 'microsoft',
                description: 'Technology company',
                confidence: 0.95
              }
            ],
            cached: false,
            searchTerm: 'Microsoft'
          },
          error: null
        });

      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={jest.fn()}
        />
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByText('Retry'));

      // Should show results after retry
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
        expect(screen.queryByText(/Network timeout/)).not.toBeInTheDocument();
      });
    });

    test('should provide manual entry fallback on persistent failures', async () => {
      // All API calls fail
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Service unavailable'));

      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Service unavailable/)).toBeInTheDocument();
        expect(screen.getByText('Enter manually')).toBeInTheDocument();
      });

      // Should be able to enter manual mode
      fireEvent.click(screen.getByText('Enter manually'));
      
      expect(screen.getByText('Enter LinkedIn Company URL')).toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    test('should track user interactions for analytics', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={mockOnLinkedInSelect}
        />
      );

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      // Select a suggestion
      const suggestion = screen.getByText('Microsoft').closest('div');
      fireEvent.click(suggestion!);

      // Should track the selection
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });

    test('should track manual entry analytics', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={mockOnLinkedInSelect}
        />
      );

      // Enter manual mode
      fireEvent.click(screen.getByText('None of these'));
      
      const urlInput = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      await userEvent.type(urlInput, 'https://www.linkedin.com/company/manual-company');
      fireEvent.click(screen.getByText('Save'));

      // Should track manual entry
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });

    test('should track skip events', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Microsoft"
          onLinkedInSelect={mockOnLinkedInSelect}
          currentLinkedInUrl="https://www.linkedin.com/company/microsoft/"
        />
      );

      // Should show selected state
      await waitFor(() => {
        expect(screen.getByText('LinkedIn URL Selected')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByTitle('Clear selection');
      fireEvent.click(clearButton);

      // Should track skip action
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });
  });

  describe('Performance under Load', () => {
    test('should handle rapid consecutive searches', async () => {
      const mockOnLinkedInSelect = jest.fn();
      
      // Set up different responses for different companies
      const companies = ['Microsoft', 'Apple', 'Google', 'Amazon', 'Meta'];
      let callCount = 0;
      
      mockSupabase.functions.invoke.mockImplementation(() => {
        const company = companies[callCount % companies.length];
        callCount++;
        
        return Promise.resolve({
          data: {
            results: [
              {
                url: `https://www.linkedin.com/company/${company.toLowerCase()}/`,
                companyName: company,
                vanityName: company.toLowerCase(),
                description: `${company} company description`,
                confidence: 0.90
              }
            ],
            cached: false,
            searchTerm: company
          },
          error: null
        });
      });

      const { rerender } = render(
        <LinkedInCompanyDiscovery
          companyName=""
          onLinkedInSelect={mockOnLinkedInSelect}
        />
      );

      // Rapidly change company names
      for (const company of companies) {
        rerender(
          <LinkedInCompanyDiscovery
            companyName={company}
            onLinkedInSelect={mockOnLinkedInSelect}
          />
        );
        
        // Small delay to simulate real typing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Should handle all searches without errors
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Component should still be responsive
      expect(screen.getByText(/LinkedIn Company Page/)).toBeInTheDocument();
    });

    test('should handle large result sets efficiently', async () => {
      // Mock large result set
      const largeResults = Array.from({ length: 50 }, (_, i) => ({
        url: `https://www.linkedin.com/company/company-${i}/`,
        companyName: `Company ${i}`,
        vanityName: `company-${i}`,
        description: `Description for Company ${i}`.repeat(20), // Very long descriptions
        confidence: 0.8 - (i * 0.01)
      }));

      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          results: largeResults,
          cached: false,
          searchTerm: 'Company'
        },
        error: null
      });

      const startTime = performance.now();
      
      render(
        <LinkedInCompanyDiscovery
          companyName="Company"
          onLinkedInSelect={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Company 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (1 second threshold)
      expect(renderTime).toBeLessThan(1000);

      // Should only display top 3 results (component optimization)
      const displayedCompanies = screen.getAllByText(/^Company \d+$/);
      expect(displayedCompanies.length).toBeLessThanOrEqual(3);
    });
  });
});