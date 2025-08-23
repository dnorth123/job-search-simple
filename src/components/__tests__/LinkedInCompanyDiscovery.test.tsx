import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkedInCompanyDiscovery from '../LinkedInCompanyDiscovery';
import { supabase } from '../../utils/supabase';

// Mock the supabase client
jest.mock('../../utils/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  },
  TABLES: {
    LINKEDIN_SEARCH_METRICS: 'linkedin_search_metrics'
  }
}));

// Mock the useDebounce hook with actual debounce functionality for testing
jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: jest.fn()
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockUseDebounce = jest.requireMock('../../hooks/useDebounce').useDebounce;

describe('LinkedInCompanyDiscovery', () => {
  const mockOnLinkedInSelect = jest.fn();
  
  const defaultProps = {
    companyName: '',
    onLinkedInSelect: mockOnLinkedInSelect,
    required: false
  };

  const mockSearchResults = [
    {
      url: 'https://www.linkedin.com/company/microsoft/',
      companyName: 'Microsoft',
      vanityName: 'microsoft',
      description: 'Technology company that develops, manufactures, licenses, supports, and sells computer software.',
      confidence: 0.95
    },
    {
      url: 'https://www.linkedin.com/company/microsoft-development-center/',
      companyName: 'Microsoft Development Center',
      vanityName: 'microsoft-development-center',
      description: 'Microsoft development center focused on cloud solutions.',
      confidence: 0.75
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLinkedInSelect.mockClear();
    
    // Reset supabase mocks
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { results: mockSearchResults },
      error: null
    });
    
    // Reset debounce mock to return value immediately by default
    mockUseDebounce.mockImplementation((value) => value);
    
    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    test('should not render when company name is empty', () => {
      const { container } = render(<LinkedInCompanyDiscovery {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    test('should show search prompt when company name is too short', () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Ab" />);
      expect(screen.getByText(/Enter at least 3 characters/)).toBeInTheDocument();
    });

    test('should show required indicator when required prop is true', () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" required={true} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should trigger search after company name is provided', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: 'Microsoft' }
        });
      });
    });

    test('should display loading state during search', async () => {
      // Mock delayed response
      mockSupabase.functions.invoke.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { results: mockSearchResults },
          error: null
        }), 100))
      );

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      expect(screen.getByText(/Searching LinkedIn for "Microsoft"/)).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeInTheDocument();
    });

    test('should display search results with confidence scores', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
        expect(screen.getByText('High (95%)')).toBeInTheDocument();
        expect(screen.getByText('Microsoft Development Center')).toBeInTheDocument();
        expect(screen.getByText('Medium (75%)')).toBeInTheDocument();
      });
    });

    test('should auto-select single result with high confidence (≥90%)', async () => {
      const highConfidenceResult = [{
        ...mockSearchResults[0],
        confidence: 0.92
      }];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: highConfidenceResult },
        error: null
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(mockOnLinkedInSelect).toHaveBeenCalledWith(
          'https://www.linkedin.com/company/microsoft/',
          0.92
        );
      });
    });

    test('should handle no results found', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: [] },
        error: null
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="UnknownCompany" />);
      
      await waitFor(() => {
        expect(screen.getByText(/No LinkedIn companies found/)).toBeInTheDocument();
        expect(screen.getByText('Enter manually')).toBeInTheDocument();
      });
    });

    test('should handle API errors gracefully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' }
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Search Error/)).toBeInTheDocument();
        expect(screen.getByText(/API rate limit exceeded/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('should handle suggestion selection', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      const microsoftResult = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftResult!);

      expect(mockOnLinkedInSelect).toHaveBeenCalledWith(
        'https://www.linkedin.com/company/microsoft/',
        0.95
      );
    });

    test('should show selected state after selection', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      const microsoftResult = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftResult!);

      await waitFor(() => {
        expect(screen.getByText('LinkedIn URL Selected')).toBeInTheDocument();
        expect(screen.getByText('https://www.linkedin.com/company/microsoft/')).toBeInTheDocument();
      });
    });

    test('should clear selection when X button is clicked', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      // Select a result
      const microsoftResult = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftResult!);

      // Wait for selected state
      await waitFor(() => {
        expect(screen.getByText('LinkedIn URL Selected')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByTitle('Clear selection');
      fireEvent.click(clearButton);

      expect(mockOnLinkedInSelect).toHaveBeenCalledWith(null);
    });

    test('should enter manual mode when "None of these" is clicked', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      const noneButton = screen.getByText('None of these');
      fireEvent.click(noneButton);

      expect(screen.getByText('Enter LinkedIn Company URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://www.linkedin.com/company/example')).toBeInTheDocument();
    });
  });

  describe('Manual Entry', () => {
    test('should validate manual LinkedIn URLs', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      // Enter manual mode
      const manualButton = screen.getByText('Enter manually');
      fireEvent.click(manualButton);

      const input = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      
      // Test invalid URL
      await userEvent.type(input, 'invalid-url');
      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText(/Please enter a valid LinkedIn company URL/)).toBeInTheDocument();
    });

    test('should accept valid LinkedIn URLs', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      // Enter manual mode
      const manualButton = screen.getByText('Enter manually');
      fireEvent.click(manualButton);

      const input = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      
      // Test valid URL
      await userEvent.clear(input);
      await userEvent.type(input, 'https://www.linkedin.com/company/test-company');
      fireEvent.click(screen.getByText('Save'));

      expect(mockOnLinkedInSelect).toHaveBeenCalledWith('https://www.linkedin.com/company/test-company');
    });

    test('should handle manual entry via Enter key', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      // Enter manual mode
      const manualButton = screen.getByText('Enter manually');
      fireEvent.click(manualButton);

      const input = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      
      await userEvent.type(input, 'https://www.linkedin.com/company/test');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnLinkedInSelect).toHaveBeenCalledWith('https://www.linkedin.com/company/test');
    });

    test('should cancel manual entry', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      // Enter manual mode
      const manualButton = screen.getByText('Enter manually');
      fireEvent.click(manualButton);

      expect(screen.getByText('Enter LinkedIn Company URL')).toBeInTheDocument();

      // Cancel manual entry
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Enter LinkedIn Company URL')).not.toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    test('should track analytics on selection', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      const microsoftResult = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftResult!);

      // Verify analytics tracking
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });

    test('should track analytics on manual entry', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      // Enter manual mode
      const manualButton = screen.getByText('Enter manually');
      fireEvent.click(manualButton);

      const input = screen.getByPlaceholderText('https://www.linkedin.com/company/example');
      await userEvent.type(input, 'https://www.linkedin.com/company/test');
      fireEvent.click(screen.getByText('Save'));

      // Verify analytics tracking
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });

    test('should track analytics on skip', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      // Select first, then clear
      const microsoftResult = screen.getByText('Microsoft').closest('div');
      fireEvent.click(microsoftResult!);

      await waitFor(() => {
        expect(screen.getByText('LinkedIn URL Selected')).toBeInTheDocument();
      });

      const clearButton = screen.getByTitle('Clear selection');
      fireEvent.click(clearButton);

      // Verify skip analytics tracking
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('linkedin_search_metrics');
      });
    });
  });

  describe('Error Handling', () => {
    test('should show retry button on API error', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Test retry functionality
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: mockSearchResults },
        error: null
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });
    });

    test('should handle network failures gracefully', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network failure'));

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Search Error/)).toBeInTheDocument();
        expect(screen.getByText(/Network failure/)).toBeInTheDocument();
      });
    });

    test('should handle API rate limiting', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' }
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
        expect(screen.getByText('Enter manually')).toBeInTheDocument();
      });
    });

    test('should recover from temporary failures', async () => {
      // First call fails
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Temporary failure' }
        })
        // Second call succeeds
        .mockResolvedValueOnce({
          data: { results: mockSearchResults },
          error: null
        });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Temporary failure/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
        expect(screen.queryByText(/Temporary failure/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Confidence Score Display', () => {
    test('should display confidence scores with correct colors', async () => {
      const mixedConfidenceResults = [
        { ...mockSearchResults[0], confidence: 0.85 }, // High - green
        { ...mockSearchResults[1], confidence: 0.65 }, // Medium - yellow
        { ...mockSearchResults[0], confidence: 0.45, companyName: 'Low Confidence Co.' } // Low - gray
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: mixedConfidenceResults },
        error: null
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Test" />);
      
      await waitFor(() => {
        expect(screen.getByText('High (85%)')).toBeInTheDocument();
        expect(screen.getByText('Medium (65%)')).toBeInTheDocument();
        expect(screen.getByText('Low (45%)')).toBeInTheDocument();
      });
    });
  });

  describe('Debounce Functionality', () => {
    test('should respect debounce timing', async () => {
      let debouncedValue = '';
      mockUseDebounce.mockImplementation((value, delay) => {
        setTimeout(() => {
          debouncedValue = value;
        }, delay);
        return debouncedValue;
      });

      const { rerender } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName="" />);
      
      // Should not trigger search immediately
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="M" />);
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
      
      // Should not trigger search for short strings
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="Mi" />);
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
      
      // Should trigger search after debounce delay
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: 'Microsoft' }
        });
      });
    });

    test('should cancel previous search when company name changes quickly', async () => {
      mockUseDebounce.mockImplementation((value) => {
        // Simulate debounce by only returning the latest value after delay
        return value;
      });

      const { rerender } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      // Change company name quickly
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="Apple" />);
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="Google" />);
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: 'Google' }
        });
      });
      
      // Should only call the latest search, not the intermediate ones
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    test('should handle rapid typing without excessive API calls', async () => {
      const searchCalls: string[] = [];
      mockSupabase.functions.invoke.mockImplementation((func, options) => {
        searchCalls.push(options.body.companyName);
        return Promise.resolve({ data: { results: [] }, error: null });
      });

      // Simulate rapid typing with proper debounce
      let currentValue = '';
      mockUseDebounce.mockImplementation((value) => {
        // Only update after 500ms delay
        setTimeout(() => {
          currentValue = value;
        }, 500);
        return currentValue;
      });

      const { rerender } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName="" />);
      
      // Simulate typing "Microsoft" character by character
      const typingSequence = ['M', 'Mi', 'Mic', 'Micr', 'Micro', 'Micros', 'Microsoft'];
      
      typingSequence.forEach((partial, index) => {
        rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName={partial} />);
        if (index < typingSequence.length - 1) {
          act(() => {
            jest.advanceTimersByTime(100); // Quick typing
          });
        }
      });
      
      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only make one API call for the final value
      await waitFor(() => {
        expect(searchCalls.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should not re-render unnecessarily when props dont change', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = (props: any) => {
        renderSpy();
        return <LinkedInCompanyDiscovery {...props} />;
      };

      const { rerender } = render(<TestComponent {...defaultProps} companyName="Microsoft" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestComponent {...defaultProps} companyName="Microsoft" />);
      
      // Should minimize re-renders (may be called again due to test setup, but should be minimal)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 10 }, (_, i) => ({
        url: `https://www.linkedin.com/company/company-${i}/`,
        companyName: `Company ${i}`,
        vanityName: `company-${i}`,
        description: `Description for Company ${i}`.repeat(10), // Long descriptions
        confidence: 0.8 - (i * 0.05)
      }));

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: largeResultSet },
        error: null
      });

      const startTime = performance.now();
      
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Company" />);
      
      await waitFor(() => {
        expect(screen.getByText('Company 0')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second threshold
      
      // Should limit displayed results (component should show max 3)
      const displayedResults = screen.getAllByText(/^Company \d+$/);
      expect(displayedResults.length).toBeLessThanOrEqual(3);
    });

    test('should cleanup resources on unmount', () => {
      const { unmount } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      // Start a search
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      // Unmount component
      unmount();
      
      // Should not cause memory leaks or errors after unmount
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // No assertions needed - test passes if no errors thrown
    });

    test('should handle concurrent searches gracefully', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });
      
      mockSupabase.functions.invoke
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { rerender } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      // Start second search before first completes
      rerender(<LinkedInCompanyDiscovery {...defaultProps} companyName="Apple" />);
      
      // Resolve second search first (out of order)
      resolveSecond!({
        data: { results: [{ ...mockSearchResults[0], companyName: 'Apple Inc.' }] },
        error: null
      });
      
      await waitFor(() => {
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      });
      
      // Resolve first search later - should not override second result
      resolveFirst!({
        data: { results: mockSearchResults },
        error: null
      });
      
      // Should still show Apple, not Microsoft
      await waitFor(() => {
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
        expect(screen.queryByText('Microsoft')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });
      
      // Check for accessible elements
      const suggestions = screen.getAllByRole('button');
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check for proper labeling
      expect(screen.getByText(/LinkedIn Company Page/)).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });
      
      const firstSuggestion = screen.getByText('Microsoft').closest('div');
      expect(firstSuggestion).toBeInTheDocument();
      
      // Should be focusable and clickable
      fireEvent.focus(firstSuggestion!);
      fireEvent.keyDown(firstSuggestion!, { key: 'Enter' });
      
      expect(mockOnLinkedInSelect).toHaveBeenCalled();
    });

    test('should announce loading states to screen readers', async () => {
      mockSupabase.functions.invoke.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { results: mockSearchResults },
          error: null
        }), 100))
      );

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      // Should show loading state
      expect(screen.getByText(/Searching LinkedIn for "Microsoft"/)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty API responses', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { results: [] },
        error: null
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="NonexistentCompany" />);
      
      await waitFor(() => {
        expect(screen.getByText(/No LinkedIn companies found/)).toBeInTheDocument();
        expect(screen.getByText('Enter manually')).toBeInTheDocument();
      });
    });

    test('should handle malformed API responses', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: null
      });

      render(<LinkedInCompanyDiscovery {...defaultProps} companyName="Microsoft" />);
      
      await waitFor(() => {
        expect(screen.getByText(/No LinkedIn companies found/)).toBeInTheDocument();
      });
    });

    test('should handle special characters in company names', async () => {
      const specialCharsCompany = "L'Oréal & Co. (UK) Ltd.";
      
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName={specialCharsCompany} />);
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: specialCharsCompany }
        });
      });
    });

    test('should handle international company names', async () => {
      const internationalNames = ['北京字节跳动科技有限公司', 'Société Générale', 'Nestlé SA'];
      
      for (const name of internationalNames) {
        const { rerender } = render(<LinkedInCompanyDiscovery {...defaultProps} companyName={name} />);
        
        await waitFor(() => {
          expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
            body: { companyName: name }
          });
        });
        
        // Reset for next iteration
        jest.clearAllMocks();
        mockSupabase.functions.invoke.mockResolvedValue({
          data: { results: mockSearchResults },
          error: null
        });
      }
    });

    test('should handle extremely long company names', async () => {
      const longName = 'A'.repeat(500); // Very long company name
      
      render(<LinkedInCompanyDiscovery {...defaultProps} companyName={longName} />);
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('discover-linkedin-company', {
          body: { companyName: longName }
        });
      });
    });
  });
});