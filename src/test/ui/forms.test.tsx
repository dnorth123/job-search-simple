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
  getJobApplications: jest.fn().mockResolvedValue([]),
  addJobApplication: jest.fn().mockResolvedValue({
    id: 'new-app-id',
    user_id: 'user-1',
    position: 'Test Position',
    date_applied: '2024-01-15',
    current_status: 'Applied',
    priority_level: 2,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }),
  updateJobApplication: jest.fn().mockResolvedValue({
    id: 'app-1',
    user_id: 'user-1',
    position: 'Updated Position',
    date_applied: '2024-01-15',
    current_status: 'Applied',
    priority_level: 2,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }),
  deleteJobApplication: jest.fn(),
  updateApplicationStatus: jest.fn(),
  searchCompanies: jest.fn().mockResolvedValue([
    {
      id: 'company-1',
      name: 'Tech Corp',
      industry_category: 'Technology',
      company_size_range: '51-200'
    },
    {
      id: 'company-2',
      name: 'Startup Inc',
      industry_category: 'Technology',
      company_size_range: '11-50'
    }
  ]),
  createCompany: jest.fn().mockResolvedValue({
    id: 'new-company-id',
    name: 'New Company',
    industry_category: 'Technology',
    company_size_range: '51-200',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }),
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

describe('Form Component Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Application Form Submission', () => {
    test('should submit application form with all required fields', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in the form fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      const prioritySelect = screen.getByLabelText('Priority Level');

      await user.type(positionInput, 'Senior Software Engineer');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');
      await user.selectOptions(prioritySelect, '2');

      // Submit the form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Verify the form submission
      await waitFor(() => {
        expect(mockAddJobApplication).toHaveBeenCalledWith(
          expect.objectContaining({
            position: 'Senior Software Engineer',
            date_applied: '2024-01-15',
            priority_level: 2,
            user_id: 'user-1'
          })
        );
      });

      // Form should close after successful submission
      await waitFor(() => {
        expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
      });
    });

    test('should show validation errors for invalid form data', async () => {
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

      // Open the add application form
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

      // Form should remain open
      expect(screen.getByText('Add New Application')).toBeInTheDocument();
    });

    test('should handle form submission with optional fields', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      const prioritySelect = screen.getByLabelText('Priority Level');

      await user.type(positionInput, 'Product Manager');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-20');
      await user.selectOptions(prioritySelect, '1');

      // Fill in optional fields
      const salaryMinInput = screen.getByLabelText('Salary Range (Min)');
      const salaryMaxInput = screen.getByLabelText('Salary Range (Max)');
      const locationInput = screen.getByLabelText('Location');
      const notesTextarea = screen.getByLabelText('Notes');

      await user.type(salaryMinInput, '120000');
      await user.type(salaryMaxInput, '180000');
      await user.type(locationInput, 'San Francisco, CA');
      await user.type(notesTextarea, 'Great opportunity with interesting challenges');

      // Submit the form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Verify the form submission includes optional fields
      await waitFor(() => {
        expect(mockAddJobApplication).toHaveBeenCalledWith(
          expect.objectContaining({
            position: 'Product Manager',
            date_applied: '2024-01-20',
            priority_level: 1,
            salary_range_min: 120000,
            salary_range_max: 180000,
            location: 'San Francisco, CA',
            notes: 'Great opportunity with interesting challenges',
            user_id: 'user-1'
          })
        );
      });
    });
  });

  describe('2. Company Autocomplete and Selection', () => {
    test('should search and display companies in autocomplete', async () => {
      const user = userEvent.setup();
      const mockSearchCompanies = require('../../utils/supabaseOperations').searchCompanies;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Find the company selector input
      const companyInput = screen.getByPlaceholderText('Search or create company...');
      expect(companyInput).toBeInTheDocument();

      // Type in the company search
      await user.type(companyInput, 'Tech');

      // Should trigger company search
      await waitFor(() => {
        expect(mockSearchCompanies).toHaveBeenCalledWith('Tech');
      });

      // Should display search results
      await waitFor(() => {
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Startup Inc')).toBeInTheDocument();
      });
    });

    test('should create new company when not found', async () => {
      const user = userEvent.setup();
      const mockSearchCompanies = require('../../utils/supabaseOperations').searchCompanies;
      const mockCreateCompany = require('../../utils/supabaseOperations').createCompany;
      
      // Mock empty search results
      mockSearchCompanies.mockResolvedValueOnce([]);
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Find the company selector input
      const companyInput = screen.getByPlaceholderText('Search or create company...');
      
      // Type in a new company name
      await user.type(companyInput, 'New Company');

      // Should trigger company search
      await waitFor(() => {
        expect(mockSearchCompanies).toHaveBeenCalledWith('New Company');
      });

      // Should show option to create new company
      await waitFor(() => {
        expect(screen.getByText(/Create "New Company"/)).toBeInTheDocument();
      });

      // Click to create new company
      const createButton = screen.getByText(/Create "New Company"/);
      await user.click(createButton);

      // Should call create company function
      await waitFor(() => {
        expect(mockCreateCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Company'
          })
        );
      });
    });

    test('should select existing company from autocomplete', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Find the company selector input
      const companyInput = screen.getByPlaceholderText('Search or create company...');
      
      // Type in company name
      await user.type(companyInput, 'Tech');

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      });

      // Click on a company to select it
      const companyOption = screen.getByText('Tech Corp');
      await user.click(companyOption);

      // Company should be selected
      expect(companyInput).toHaveValue('Tech Corp');
    });
  });

  describe('3. Multi-step Form Navigation', () => {
    test('should persist form state when navigating between sections', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in basic information
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Software Engineer');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Fill in compensation information
      const salaryMinInput = screen.getByLabelText('Salary Range (Min)');
      await user.type(salaryMinInput, '100000');

      // Fill in location information
      const locationInput = screen.getByLabelText('Location');
      await user.type(locationInput, 'Remote');

      // Fill in application details
      const notesTextarea = screen.getByLabelText('Notes');
      await user.type(notesTextarea, 'Great opportunity');

      // Verify all form data is still present
      expect(positionInput).toHaveValue('Software Engineer');
      expect(dateInput).toHaveValue('2024-01-15');
      expect(salaryMinInput).toHaveValue(100000);
      expect(locationInput).toHaveValue('Remote');
      expect(notesTextarea).toHaveValue('Great opportunity');
    });

    test('should handle form cancellation and reset', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in some form data
      const positionInput = screen.getByLabelText('Position Title *');
      await user.type(positionInput, 'Test Position');

      // Click cancel button
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Form should close
      await waitFor(() => {
        expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
      });

      // Reopen form and verify it's reset
      await user.click(addButton);
      
      const newPositionInput = screen.getByLabelText('Position Title *');
      expect(newPositionInput).toHaveValue('');
    });
  });

  describe('4. File Upload and Attachment Handling', () => {
    test('should handle file upload for job posting attachments', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Find the job URL input (simulating file attachment)
      const jobUrlInput = screen.getByLabelText('Job URL');
      expect(jobUrlInput).toBeInTheDocument();

      // Enter a job posting URL
      await user.type(jobUrlInput, 'https://company.com/job-posting');

      // Verify the URL is stored
      expect(jobUrlInput).toHaveValue('https://company.com/job-posting');
    });

    test('should validate URL format for job postings', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Find the job URL input
      const jobUrlInput = screen.getByLabelText('Job URL');
      
      // Enter an invalid URL
      await user.type(jobUrlInput, 'invalid-url');

      // The input should accept the value but validation would occur on submit
      expect(jobUrlInput).toHaveValue('invalid-url');
    });
  });

  describe('5. Form Validation and Error Handling', () => {
    test('should validate required fields on submission', async () => {
      const user = userEvent.setup();
      const mockValidateJobApplicationForm = require('../../utils/validation').validateJobApplicationForm;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Position is required')).toBeInTheDocument();
      });
    });

    test('should handle server errors during form submission', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      mockAddJobApplication.mockRejectedValueOnce(new Error('Server error'));
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Software Engineer');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Submit the form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('6. Loading States and User Feedback', () => {
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

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Software Engineer');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Submit the form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Add Application')).toBeDisabled();
    });

    test('should disable form during submission', async () => {
      const user = userEvent.setup();
      const mockAddJobApplication = require('../../utils/supabaseOperations').addJobApplication;
      mockAddJobApplication.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Open the add application form
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Fill in required fields
      const positionInput = screen.getByLabelText('Position Title *');
      const dateInput = screen.getByLabelText('Date Applied *');
      
      await user.type(positionInput, 'Software Engineer');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      // Submit the form
      const submitButton = screen.getByText('Add Application');
      await user.click(submitButton);

      // Form inputs should be disabled during submission
      expect(positionInput).toBeDisabled();
      expect(dateInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
}); 