import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import { createMockSupabaseClient } from '../mocks/supabaseMock';

// Mock the supabase module
jest.mock('../../utils/supabase', () => ({
  supabase: createMockSupabaseClient(),
  TABLES: {
    USERS: 'users',
    COMPANIES: 'companies',
    APPLICATIONS: 'applications',
    APPLICATION_TIMELINE: 'application_timeline',
  },
}));

// Mock the supabaseOperations module
jest.mock('../../utils/supabaseOperations', () => ({
  getJobApplications: jest.fn().mockResolvedValue([
    {
      id: 'app-1',
      user_id: 'user-1',
      position: 'Senior Software Engineer',
      company_id: 'company-1',
      company: {
        id: 'company-1',
        name: 'Tech Corp',
        industry_category: 'Technology',
        company_size_range: '51-200'
      },
      date_applied: '2024-01-15',
      current_status: 'Applied',
      priority_level: 2,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ]),
  addJobApplication: jest.fn(),
  updateJobApplication: jest.fn(),
  deleteJobApplication: jest.fn(),
  updateApplicationStatus: jest.fn(),
  searchCompanies: jest.fn().mockResolvedValue([]),
  createCompany: jest.fn(),
  getUserProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    professional_title: 'Software Engineer'
  }),
  updateUserProfile: jest.fn()
}));

// Mock the validation module
jest.mock('../../utils/validation', () => ({
  validateJobApplicationForm: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCompanyForm: jest.fn().mockReturnValue({ isValid: true, errors: [] })
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    profile: {
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      professional_title: 'Software Engineer'
    },
    loading: false,
    profileLoading: false,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    createUserProfile: jest.fn(),
    updateUserProfile: jest.fn()
  })
}));

// Import the main App component
import App from '../../App';

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('User Interaction Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Button Clicks and State Changes', () => {
    test('should handle add application button click', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Click add application button
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Should open the form modal
      expect(screen.getByText('Add New Application')).toBeInTheDocument();
      expect(screen.getByText('Position Title *')).toBeInTheDocument();
    });

    test('should handle profile button click', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Click profile button
      const profileButton = screen.getByText('Profile');
      await user.click(profileButton);

      // Should open the profile modal
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('should handle edit application button click', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Wait for application cards to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Should open edit form modal
      expect(screen.getByText('Edit Application')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Software Engineer')).toBeInTheDocument();
    });

    test('should handle delete application button click', async () => {
      const user = userEvent.setup();
      const mockDeleteJobApplication = require('../../utils/supabaseOperations').deleteJobApplication;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Wait for application cards to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      });

      // Mock confirm dialog
      window.confirm = jest.fn().mockReturnValue(true);

      // Click delete button
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Should call delete function
      expect(mockDeleteJobApplication).toHaveBeenCalledWith('app-1');
    });

    test('should handle status change button clicks', async () => {
      const user = userEvent.setup();
      const mockUpdateApplicationStatus = require('../../utils/supabaseOperations').updateApplicationStatus;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Wait for application cards to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      });

      // Click on a status button
      const interviewButtons = screen.getAllByText('Interview');
      await user.click(interviewButtons[0]);

      // Should call update status function
      expect(mockUpdateApplicationStatus).toHaveBeenCalledWith('app-1', 'Interview');
    });

    test('should handle clear filters button click', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Set some filters
      const searchInput = screen.getByPlaceholderText('Search positions or companies...');
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const priorityFilter = screen.getByDisplayValue('All Priorities');

      await user.type(searchInput, 'Test');
      await user.selectOptions(statusFilter, 'Applied');
      await user.selectOptions(priorityFilter, '1');

      // Click clear filters button
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      // All filters should be reset
      expect(searchInput).toHaveValue('');
      expect(statusFilter).toHaveValue('All');
      expect(priorityFilter).toHaveValue('All');
    });
  });

  describe('2. Modal Opening/Closing and Data Persistence', () => {
    test('should open and close add application modal', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      expect(screen.getByText('Add New Application')).toBeInTheDocument();

      // Close modal using X button
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
      });
    });

    test('should open and close profile modal', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open profile modal
      const profileButton = screen.getByText('Profile');
      await user.click(profileButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Close modal using X button
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    test('should persist form data when modal is reopened', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in some form data
      const positionInput = screen.getByLabelText('Position Title *');
      await user.type(positionInput, 'Test Position');

      // Close modal
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Reopen modal
      await user.click(addButton);

      // Form should be reset (not persist data)
      const newPositionInput = screen.getByLabelText('Position Title *');
      expect(newPositionInput).toHaveValue('');
    });

    test('should handle modal backdrop click', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      expect(screen.getByText('Add New Application')).toBeInTheDocument();

      // Click on backdrop (the overlay div)
      const backdrop = screen.getByRole('presentation');
      await user.click(backdrop);

      // Modal should remain open (backdrop click doesn't close it in this implementation)
      expect(screen.getByText('Add New Application')).toBeInTheDocument();
    });
  });

  describe('3. Keyboard Navigation and Accessibility', () => {
    test('should support keyboard navigation through main elements', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Tab through interactive elements
      const searchInput = screen.getByPlaceholderText('Search positions or companies...');
      const addButton = screen.getByText('+ Add Application');
      const profileButton = screen.getByText('Profile');

      // Focus should be able to move through these elements
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      addButton.focus();
      expect(addButton).toHaveFocus();

      profileButton.focus();
      expect(profileButton).toHaveFocus();
    });

    test('should support keyboard navigation in forms', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Tab through form elements
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      const prioritySelect = screen.getByLabelText('Priority Level');

      positionInput.focus();
      expect(positionInput).toHaveFocus();

      // Press Tab to move to next element
      await user.tab();
      expect(dateInput).toHaveFocus();

      await user.tab();
      expect(prioritySelect).toHaveFocus();
    });

    test('should support Enter key for form submission', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Test Position');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Press Enter on the form
      const form = screen.getByRole('form');
      await user.type(form, '{Enter}');

      // Should trigger form submission
      await waitFor(() => {
        expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
      });
    });

    test('should support Escape key for modal closing', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      expect(screen.getByText('Add New Application')).toBeInTheDocument();

      // Press Escape key
      await user.keyboard('{Escape}');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
      });
    });
  });

  describe('4. Loading States and Error Message Display', () => {
    test('should show loading state during data fetching', async () => {
      // Mock a slow loading response
      const mockGetJobApplications = require('../../utils/supabaseOperations').getJobApplications;
      mockGetJobApplications.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      renderWithAuth(<App />);

      // Should show loading state initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      mockAddJobApplication.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Test Position');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Submit form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
    });

    test('should show error message when data loading fails', async () => {
      // Mock an error response
      const mockGetJobApplications = require('../../utils/supabaseOperations').getJobApplications;
      mockGetJobApplications.mockRejectedValueOnce(new Error('Failed to load applications'));

      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load applications')).toBeInTheDocument();
      });
    });

    test('should show error message when form submission fails', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      mockAddJobApplication.mockRejectedValueOnce(new Error('Failed to save application'));
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Test Position');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Submit form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to save application')).toBeInTheDocument();
      });
    });

    test('should show validation errors in form', async () => {
      const user = userEvent.setup();
      const mockValidateJobApplicationForm = require('../../utils/validation').validateJobApplicationForm;
      mockValidateJobApplicationForm.mockReturnValueOnce({
        isValid: false,
        errors: [
          { field: 'position', message: 'Position is required' },
          { field: 'date_applied', message: 'Date applied is required' }
        ]
      });
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open add application modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Position is required')).toBeInTheDocument();
        expect(screen.getByText('Date applied is required')).toBeInTheDocument();
      });
    });
  });

  describe('5. State Management and Data Persistence', () => {
    test('should maintain search state across interactions', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Set search term
      const searchInput = screen.getByPlaceholderText('Search positions or companies...');
      await user.type(searchInput, 'Software');

      // Search state should be maintained
      expect(searchInput).toHaveValue('Software');

      // Open and close modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);
      
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Search state should still be maintained
      expect(searchInput).toHaveValue('Software');
    });

    test('should maintain filter state across interactions', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Set filters
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const priorityFilter = screen.getByDisplayValue('All Priorities');

      await user.selectOptions(statusFilter, 'Applied');
      await user.selectOptions(priorityFilter, '1');

      // Filter state should be maintained
      expect(statusFilter).toHaveValue('Applied');
      expect(priorityFilter).toHaveValue('1');

      // Open and close modal
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);
      
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Filter state should still be maintained
      expect(statusFilter).toHaveValue('Applied');
      expect(priorityFilter).toHaveValue('1');
    });
  });
}); 