import { createMockSupabaseClient, setupMockResponse, setupMockError } from '../mocks/supabaseMock';
import {
  getJobApplications,
  getJobApplication,
  addJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getCompanies,
  createCompany,
  updateCompany,
  searchCompanies,
  getUserProfile,
  updateUserProfile,
  getApplicationTimeline,
  updateApplicationStatus,
} from '../../utils/supabaseOperations';

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

describe('CRUD Operations Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../utils/supabase').supabase;
  });

  describe('Applications CRUD Operations', () => {
    const mockApplication = {
      id: 'app-1',
      user_id: 'test-user-id',
      company_id: 'company-1',
      position: 'Software Engineer',
      date_applied: '2024-01-01',
      priority_level: 2,
      notes: 'Test application',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockApplicationWithCompany = {
      ...mockApplication,
      company: {
        id: 'company-1',
        name: 'Test Company',
        industry_category: 'Technology',
      },
    };

    describe('Create Application', () => {
      test('should create application successfully', async () => {
        const applicationData = {
          user_id: 'test-user-id',
          company_id: 'company-1',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
          priority_level: 2,
          notes: 'Test application',
        };

        setupMockResponse(mockSupabase, 'applications', 'insert', {
          data: mockApplication,
          error: null,
        });

        setupMockResponse(mockSupabase, 'application_timeline', 'insert', {
          data: null,
          error: null,
        });

        const result = await addJobApplication(applicationData);

        expect(result).toEqual(mockApplication);
        expect(mockSupabase.from).toHaveBeenCalledWith('applications');
        expect(mockSupabase.from).toHaveBeenCalledWith('application_timeline');
      });

      test('should handle application creation error', async () => {
        const applicationData = {
          user_id: 'test-user-id',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
        };

        const error = { message: 'Database error', code: 'DB_ERROR' };
        setupMockError(mockSupabase, 'applications', 'insert', error);

        await expect(addJobApplication(applicationData)).rejects.toThrow('addJobApplication - application failed');
      });
    });

    describe('Read Applications', () => {
      test('should get all applications for user', async () => {
        const mockApplications = [mockApplicationWithCompany];

        setupMockResponse(mockSupabase, 'applications', 'select', {
          data: mockApplications,
          error: null,
        });

        const result = await getJobApplications('test-user-id');

        expect(result).toEqual(mockApplications);
        expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      });

      test('should get single application by ID', async () => {
        setupMockResponse(mockSupabase, 'applications', 'select', {
          data: mockApplicationWithCompany,
          error: null,
        });

        setupMockResponse(mockSupabase, 'application_timeline', 'select', {
          data: { status: 'Applied' },
          error: null,
        });

        const result = await getJobApplication('app-1');

        expect(result).toEqual({
          ...mockApplicationWithCompany,
          current_status: 'Applied',
        });
      });

      test('should return null for non-existent application', async () => {
        setupMockResponse(mockSupabase, 'applications', 'select', {
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        });

        const result = await getJobApplication('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('Update Application', () => {
      test('should update application successfully', async () => {
        const updates = {
          position: 'Senior Software Engineer',
          priority_level: 1,
          notes: 'Updated notes',
        };

        const updatedApplication = { ...mockApplication, ...updates };

        setupMockResponse(mockSupabase, 'applications', 'update', {
          data: updatedApplication,
          error: null,
        });

        const result = await updateJobApplication('app-1', updates);

        expect(result).toEqual(updatedApplication);
      });

      test('should handle update error', async () => {
        const updates = { position: 'Senior Software Engineer' };
        const error = { message: 'Update failed', code: 'UPDATE_ERROR' };

        setupMockError(mockSupabase, 'applications', 'update', error);

        await expect(updateJobApplication('app-1', updates)).rejects.toThrow('updateJobApplication failed');
      });
    });

    describe('Delete Application', () => {
      test('should delete application successfully', async () => {
        setupMockResponse(mockSupabase, 'applications', 'delete', {
          data: null,
          error: null,
        });

        await expect(deleteJobApplication('app-1')).resolves.not.toThrow();
      });

      test('should handle delete error', async () => {
        const error = { message: 'Delete failed', code: 'DELETE_ERROR' };
        setupMockError(mockSupabase, 'applications', 'delete', error);

        await expect(deleteJobApplication('app-1')).rejects.toThrow('deleteJobApplication failed');
      });
    });
  });

  describe('Companies CRUD Operations', () => {
    const mockCompany = {
      id: 'company-1',
      name: 'Test Company',
      industry_category: 'Technology',
      company_size_range: '51-200',
      headquarters_location: 'San Francisco, CA',
      website_url: 'https://testcompany.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('Create Company', () => {
      test('should create company successfully', async () => {
        const companyData = {
          name: 'Test Company',
          industry_category: 'Technology',
          company_size_range: '51-200',
          headquarters_location: 'San Francisco, CA',
          website_url: 'https://testcompany.com',
        };

        setupMockResponse(mockSupabase, 'companies', 'insert', {
          data: mockCompany,
          error: null,
        });

        const result = await createCompany(companyData);

        expect(result).toEqual(mockCompany);
      });

      test('should handle duplicate company name', async () => {
        const companyData = { name: 'Existing Company' };
        const error = {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        };

        setupMockError(mockSupabase, 'companies', 'insert', error);

        await expect(createCompany(companyData)).rejects.toThrow('createCompany failed');
      });
    });

    describe('Read Companies', () => {
      test('should get all companies', async () => {
        const mockCompanies = [mockCompany];

        setupMockResponse(mockSupabase, 'companies', 'select', {
          data: mockCompanies,
          error: null,
        });

        const result = await getCompanies();

        expect(result).toEqual(mockCompanies);
      });

      test('should search companies by name', async () => {
        const mockCompanies = [mockCompany];

        setupMockResponse(mockSupabase, 'companies', 'select', {
          data: mockCompanies,
          error: null,
        });

        const result = await searchCompanies('Test');

        expect(result).toEqual(mockCompanies);
        expect(mockSupabase.from).toHaveBeenCalledWith('companies');
      });
    });

    describe('Update Company', () => {
      test('should update company successfully', async () => {
        const updates = {
          name: 'Updated Company Name',
          industry_category: 'Healthcare',
        };

        const updatedCompany = { ...mockCompany, ...updates };

        setupMockResponse(mockSupabase, 'companies', 'update', {
          data: updatedCompany,
          error: null,
        });

        const result = await updateCompany('company-1', updates);

        expect(result).toEqual(updatedCompany);
      });
    });
  });

  describe('Users CRUD Operations', () => {
    const mockUserProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      professional_title: 'Software Engineer',
      industry_category: 'Technology',
      career_level: 'Mid',
      linkedin_url: 'https://linkedin.com/in/testuser',
      portfolio_url: 'https://portfolio.com',
      phone_number: '+1234567890',
      location: 'San Francisco, CA',
      years_experience: 5,
      skills: ['JavaScript', 'React', 'TypeScript'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('Create User Profile', () => {
      test('should create user profile successfully', async () => {
        const userData = {
          id: 'test-user-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          professional_title: 'Software Engineer',
        };

        setupMockResponse(mockSupabase, 'users', 'upsert', {
          data: mockUserProfile,
          error: null,
        });

        const result = await require('../../utils/supabaseOperations').createUser(userData);

        expect(result).toEqual(mockUserProfile);
      });

      test('should handle user creation error', async () => {
        const userData = {
          id: 'test-user-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        };

        const error = { message: 'User creation failed', code: 'USER_ERROR' };
        setupMockError(mockSupabase, 'users', 'upsert', error);

        await expect(require('../../utils/supabaseOperations').createUser(userData)).rejects.toThrow('createUser failed');
      });
    });

    describe('Read User Profile', () => {
      test('should get user profile successfully', async () => {
        setupMockResponse(mockSupabase, 'users', 'select', {
          data: [mockUserProfile],
          error: null,
        });

        const result = await getUserProfile('test-user-id');

        expect(result).toEqual(mockUserProfile);
      });

      test('should return null for non-existent user', async () => {
        setupMockResponse(mockSupabase, 'users', 'select', {
          data: [],
          error: null,
        });

        const result = await getUserProfile('non-existent-user');

        expect(result).toBeNull();
      });
    });

    describe('Update User Profile', () => {
      test('should update user profile successfully', async () => {
        const updates = {
          professional_title: 'Senior Software Engineer',
          years_experience: 7,
          skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
        };

        const updatedProfile = { ...mockUserProfile, ...updates };

        setupMockResponse(mockSupabase, 'users', 'update', {
          data: updatedProfile,
          error: null,
        });

        const result = await updateUserProfile('test-user-id', updates);

        expect(result).toEqual(updatedProfile);
      });
    });
  });

  describe('Application Timeline Operations', () => {
    const mockTimelineEntry = {
      id: 'timeline-1',
      application_id: 'app-1',
      status: 'Interview',
      date_changed: '2024-01-15',
      notes: 'Phone interview scheduled',
      interview_type: 'Phone',
      interview_date: '2024-01-20',
      interviewer_name: 'John Doe',
      created_at: '2024-01-15T00:00:00Z',
    };

    describe('Read Timeline', () => {
      test('should get application timeline', async () => {
        const mockTimeline = [mockTimelineEntry];

        setupMockResponse(mockSupabase, 'application_timeline', 'select', {
          data: mockTimeline,
          error: null,
        });

        const result = await getApplicationTimeline('app-1');

        expect(result).toEqual(mockTimeline);
      });
    });

    describe('Update Application Status', () => {
      test('should update application status successfully', async () => {
        setupMockResponse(mockSupabase, 'application_timeline', 'insert', {
          data: mockTimelineEntry,
          error: null,
        });

        await expect(
          updateApplicationStatus(
            'app-1',
            'Interview',
            'Phone interview scheduled',
            'Phone',
            '2024-01-20',
            'John Doe'
          )
        ).resolves.not.toThrow();
      });

      test('should handle status update error', async () => {
        const error = { message: 'Status update failed', code: 'STATUS_ERROR' };
        setupMockError(mockSupabase, 'application_timeline', 'insert', error);

        await expect(
          updateApplicationStatus('app-1', 'Interview', 'Test notes')
        ).rejects.toThrow('updateApplicationStatus failed');
      });
    });
  });

  describe('User Isolation Tests', () => {
    test('should only return applications for authenticated user', async () => {
      const userApplications = [
        {
          id: 'app-1',
          user_id: 'test-user-id',
          position: 'Software Engineer',
        },
      ];

      setupMockResponse(mockSupabase, 'applications', 'select', {
        data: userApplications,
        error: null,
      });

      const result = await getJobApplications('test-user-id');

      expect(result).toEqual(userApplications);
      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
    });

    test('should not return applications for other users', async () => {
      // Mock empty response for other user's applications
      setupMockResponse(mockSupabase, 'applications', 'select', {
        data: [],
        error: null,
      });

      const result = await getJobApplications('other-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle network failures in CRUD operations', async () => {
      const networkError = { message: 'Network error', code: 'NETWORK_ERROR' };
      setupMockError(mockSupabase, 'applications', 'select', networkError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle authentication errors in CRUD operations', async () => {
      const authError = { message: 'Invalid JWT', code: 'PGRST301' };
      setupMockError(mockSupabase, 'applications', 'select', authError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle database constraint violations', async () => {
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      };
      setupMockError(mockSupabase, 'companies', 'insert', constraintError);

      await expect(createCompany({ name: 'Duplicate Company' })).rejects.toThrow('createCompany failed');
    });

    test('should handle rate limiting in CRUD operations', async () => {
      const rateLimitError = { message: 'Too many requests', code: '429' };
      setupMockError(mockSupabase, 'applications', 'select', rateLimitError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });
}); 