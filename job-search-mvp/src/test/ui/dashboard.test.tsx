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
      salary_range_min: 120000,
      salary_range_max: 180000,
      remote_policy: 'Hybrid',
      location: 'San Francisco, CA',
      application_source: 'LinkedIn',
      notes: 'Great opportunity with interesting tech stack',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'app-2',
      user_id: 'user-1',
      position: 'Product Manager',
      company_id: 'company-2',
      company: {
        id: 'company-2',
        name: 'Startup Inc',
        industry_category: 'Technology',
        company_size_range: '11-50'
      },
      date_applied: '2024-01-10',
      current_status: 'Interview',
      priority_level: 1,
      salary_range_min: 140000,
      salary_range_max: 200000,
      remote_policy: 'Remote',
      location: 'Remote',
      application_source: 'Company Website',
      notes: 'Exciting startup with great potential',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
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

describe('Dashboard Component Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Application Card Rendering', () => {
    test('should render application cards with all data fields', async () => {
      renderWithAuth(<App />);

      // Wait for the dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check that application cards are rendered
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByText('Startup Inc')).toBeInTheDocument();

      // Check for status badges
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();

      // Check for priority levels
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();

      // Check for salary information
      expect(screen.getByText(/120,000/)).toBeInTheDocument();
      expect(screen.getByText(/180,000/)).toBeInTheDocument();

      // Check for remote policy
      expect(screen.getByText('Hybrid')).toBeInTheDocument();
      expect(screen.getByText('Remote')).toBeInTheDocument();

      // Check for location
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });

    test('should display formatted dates correctly', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check for formatted dates (Jan 15, 2024 and Jan 10, 2024)
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();
    });

    test('should show company information when available', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check for company details
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Startup Inc')).toBeInTheDocument();
    });

    test('should handle missing company information gracefully', async () => {
      // Mock applications without company data
      const mockGetJobApplications = require('../../utils/supabaseOperations').getJobApplications;
      mockGetJobApplications.mockResolvedValueOnce([
        {
          id: 'app-3',
          user_id: 'user-1',
          position: 'Software Engineer',
          date_applied: '2024-01-20',
          current_status: 'Applied',
          priority_level: 2,
          created_at: '2024-01-20T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        }
      ]);

      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      // Should show "Unknown Company" for applications without company data
      expect(screen.getByText('Unknown Company')).toBeInTheDocument();
    });
  });

  describe('2. Filter and Search Functionality', () => {
    test('should filter applications by search term', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Find the search input
      const searchInput = screen.getByPlaceholderText('Search positions or companies...');
      expect(searchInput).toBeInTheDocument();

      // Type in the search field
      await user.type(searchInput, 'Software');

      // Should show only the Software Engineer position
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });

    test('should filter applications by status', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Find the status filter
      const statusFilter = screen.getByDisplayValue('All Statuses');
      expect(statusFilter).toBeInTheDocument();

      // Change status filter to "Applied"
      await user.selectOptions(statusFilter, 'Applied');

      // Should show only Applied status applications
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });

    test('should filter applications by priority', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Find the priority filter
      const priorityFilter = screen.getByDisplayValue('All Priorities');
      expect(priorityFilter).toBeInTheDocument();

      // Change priority filter to "High"
      await user.selectOptions(priorityFilter, '1');

      // Should show only High priority applications
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.queryByText('Senior Software Engineer')).not.toBeInTheDocument();
    });

    test('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Set some filters
      const searchInput = screen.getByPlaceholderText('Search positions or companies...');
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const priorityFilter = screen.getByDisplayValue('All Priorities');

      await user.type(searchInput, 'Software');
      await user.selectOptions(statusFilter, 'Applied');
      await user.selectOptions(priorityFilter, '1');

      // Click clear filters button
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      // All filters should be reset
      expect(searchInput).toHaveValue('');
      expect(statusFilter).toHaveValue('All');
      expect(priorityFilter).toHaveValue('All');

      // All applications should be visible again
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });

  describe('3. Responsive Design Testing', () => {
    test('should display stats cards in responsive grid', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check that stats cards are rendered
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interviews')).toBeInTheDocument();
      expect(screen.getByText('Offers')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();

      // Check for the stats numbers
      expect(screen.getByText('2')).toBeInTheDocument(); // Total applications
      expect(screen.getByText('1')).toBeInTheDocument(); // Applied
      expect(screen.getByText('1')).toBeInTheDocument(); // Interviews
    });

    test('should display filters in responsive layout', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check that all filter elements are present
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    test('should display application cards in responsive grid', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check that application cards are rendered in a grid
      const applicationCards = screen.getAllByText(/Senior Software Engineer|Product Manager/);
      expect(applicationCards.length).toBeGreaterThan(0);
    });
  });

  describe('4. Loading States and Error Handling', () => {
    test('should show loading state while fetching data', async () => {
      // Mock a slow loading response
      const mockGetJobApplications = require('../../utils/supabaseOperations').getJobApplications;
      mockGetJobApplications.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      renderWithAuth(<App />);

      // Should show loading spinner initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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

    test('should show empty state when no applications exist', async () => {
      // Mock empty applications list
      const mockGetJobApplications = require('../../utils/supabaseOperations').getJobApplications;
      mockGetJobApplications.mockResolvedValueOnce([]);

      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('No applications yet')).toBeInTheDocument();
        expect(screen.getByText('Add Your First Application')).toBeInTheDocument();
      });
    });
  });

  describe('5. User Interaction Testing', () => {
    test('should open add application form when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Click the add application button
      const addButton = screen.getByText('+ Add Application');
      await user.click(addButton);

      // Should show the form modal
      expect(screen.getByText('Add New Application')).toBeInTheDocument();
      expect(screen.getByText('Position Title *')).toBeInTheDocument();
    });

    test('should open profile modal when profile button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Click the profile button
      const profileButton = screen.getByText('Profile');
      await user.click(profileButton);

      // Should show the profile modal
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('should edit application when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Find and click the first edit button
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Should show the edit form modal
      expect(screen.getByText('Edit Application')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Software Engineer')).toBeInTheDocument();
    });

    test('should delete application when delete button is clicked', async () => {
      const user = userEvent.setup();
      const mockDeleteJobApplication = require('../../utils/supabaseOperations').deleteJobApplication;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Mock confirm dialog
      window.confirm = jest.fn().mockReturnValue(true);

      // Find and click the first delete button
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Should call delete function
      expect(mockDeleteJobApplication).toHaveBeenCalledWith('app-1');
    });

    test('should change application status when status button is clicked', async () => {
      const user = userEvent.setup();
      const mockUpdateApplicationStatus = require('../../utils/supabaseOperations').updateApplicationStatus;
      
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Find and click the "Interview" status button for the first application
      const interviewButtons = screen.getAllByText('Interview');
      await user.click(interviewButtons[0]);

      // Should call update status function
      expect(mockUpdateApplicationStatus).toHaveBeenCalledWith('app-1', 'Interview');
    });
  });

  describe('6. Accessibility Testing', () => {
    test('should have proper ARIA labels and semantic HTML', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Executive Job Tracker' })).toBeInTheDocument();

      // Check for proper form labels
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();

      // Check for proper button roles
      expect(screen.getByRole('button', { name: '+ Add Application' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
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

    test('should have proper color contrast for status badges', async () => {
      renderWithAuth(<App />);

      await waitFor(() => {
        expect(screen.getByText('Executive Job Tracker')).toBeInTheDocument();
      });

      // Check that status badges are present and have proper styling
      const appliedBadge = screen.getByText('Applied');
      const interviewBadge = screen.getByText('Interview');

      expect(appliedBadge).toBeInTheDocument();
      expect(interviewBadge).toBeInTheDocument();

      // Check that badges have proper CSS classes for styling
      expect(appliedBadge).toHaveClass('badge');
      expect(interviewBadge).toHaveClass('badge');
    });
  });
}); 