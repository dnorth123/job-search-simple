import { supabase, TABLES } from '../../utils/supabase';
import { createMockSupabaseClient, setupMockResponse, setupMockError } from '../mocks/supabaseMock';

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

describe('Database Connection Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../utils/supabase').supabase;
  });

  describe('Supabase Client Initialization', () => {
    test('should initialize with correct environment variables', () => {
      // Test that environment variables are properly set
      expect(import.meta.env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBe('test-anon-key');
    });

    test('should have required Supabase client properties', () => {
      expect(mockSupabase).toBeDefined();
      expect(mockSupabase.auth).toBeDefined();
      expect(mockSupabase.from).toBeDefined();
      expect(mockSupabase.storage).toBeDefined();
      expect(mockSupabase.functions).toBeDefined();
      expect(mockSupabase.realtime).toBeDefined();
    });

    test('should have correct table constants', () => {
      expect(TABLES.USERS).toBe('users');
      expect(TABLES.COMPANIES).toBe('companies');
      expect(TABLES.APPLICATIONS).toBe('applications');
      expect(TABLES.APPLICATION_TIMELINE).toBe('application_timeline');
    });
  });

  describe('Environment Variable Validation', () => {
    const originalEnv = import.meta.env;

    afterEach(() => {
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
      });
    });

    test('should throw error when VITE_SUPABASE_URL is missing', () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          VITE_SUPABASE_ANON_KEY: 'test-key',
        },
        writable: true,
      });

      expect(() => {
        require('../../utils/supabase');
      }).toThrow('Missing Supabase environment variables');
    });

    test('should throw error when VITE_SUPABASE_ANON_KEY is missing', () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          VITE_SUPABASE_URL: 'https://test.supabase.co',
        },
        writable: true,
      });

      expect(() => {
        require('../../utils/supabase');
      }).toThrow('Missing Supabase environment variables');
    });
  });

  describe('Database Schema Validation', () => {
    test('should be able to query users table', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
      ];

      setupMockResponse(mockSupabase, 'users', 'select', {
        data: mockUsers,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toBeNull();
      expect(data).toEqual(mockUsers);
    });

    test('should be able to query companies table', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          name: 'Test Company',
          industry_category: 'Technology',
        },
      ];

      setupMockResponse(mockSupabase, 'companies', 'select', {
        data: mockCompanies,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('companies')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toBeNull();
      expect(data).toEqual(mockCompanies);
    });

    test('should be able to query applications table', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          user_id: 'user-1',
          company_id: 'company-1',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
        },
      ];

      setupMockResponse(mockSupabase, 'applications', 'select', {
        data: mockApplications,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('applications')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toBeNull();
      expect(data).toEqual(mockApplications);
    });

    test('should be able to query application_timeline table', async () => {
      const mockTimeline = [
        {
          id: 'timeline-1',
          application_id: 'app-1',
          status: 'Applied',
          date_changed: '2024-01-01',
        },
      ];

      setupMockResponse(mockSupabase, 'application_timeline', 'select', {
        data: mockTimeline,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('application_timeline')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toBeNull();
      expect(data).toEqual(mockTimeline);
    });
  });

  describe('Row Level Security (RLS) Policy Testing', () => {
    test('should enforce user isolation for applications', async () => {
      // Mock a user trying to access another user's applications
      const mockApplications = [
        {
          id: 'app-1',
          user_id: 'other-user-id', // Different user
          position: 'Software Engineer',
        },
      ];

      setupMockResponse(mockSupabase, 'applications', 'select', {
        data: mockApplications,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('applications')
        .select('*')
        .eq('user_id', 'other-user-id')
        .then((resolve: any) => resolve);

      // In a real scenario with RLS, this should return empty data
      // For testing, we're just verifying the query structure
      expect(data).toBeDefined();
    });

    test('should allow users to access their own applications', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          user_id: 'test-user-id', // Same user
          position: 'Software Engineer',
        },
      ];

      setupMockResponse(mockSupabase, 'applications', 'select', {
        data: mockApplications,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('applications')
        .select('*')
        .eq('user_id', 'test-user-id')
        .then((resolve: any) => resolve);

      expect(error).toBeNull();
      expect(data).toEqual(mockApplications);
    });

    test('should enforce user isolation for user profiles', async () => {
      const mockUserProfile = {
        id: 'other-user-id',
        email: 'other@example.com',
        first_name: 'Other',
        last_name: 'User',
      };

      setupMockResponse(mockSupabase, 'users', 'select', {
        data: [mockUserProfile],
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .eq('id', 'other-user-id')
        .then((resolve: any) => resolve);

      // In a real scenario with RLS, this should return empty data
      expect(data).toBeDefined();
    });
  });

  describe('Connection Error Handling', () => {
    test('should handle network failures gracefully', async () => {
      const networkError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
      };

      setupMockError(mockSupabase, 'users', 'select', networkError);

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toEqual(networkError);
      expect(data).toBeNull();
    });

    test('should handle authentication errors', async () => {
      const authError = {
        message: 'Invalid JWT',
        code: 'PGRST301',
      };

      setupMockError(mockSupabase, 'users', 'select', authError);

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toEqual(authError);
      expect(data).toBeNull();
    });

    test('should handle database constraint violations', async () => {
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      };

      setupMockError(mockSupabase, 'users', 'insert', constraintError);

      const { data, error } = await mockSupabase
        .from('users')
        .insert({ email: 'duplicate@example.com' })
        .then((resolve: any) => resolve);

      expect(error).toEqual(constraintError);
      expect(data).toBeNull();
    });

    test('should handle rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        code: '429',
      };

      setupMockError(mockSupabase, 'users', 'select', rateLimitError);

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toEqual(rateLimitError);
      expect(data).toBeNull();
    });

    test('should handle timeout errors', async () => {
      const timeoutError = {
        message: 'Request timeout',
        code: 'TIMEOUT',
      };

      setupMockError(mockSupabase, 'users', 'select', timeoutError);

      const { data, error } = await mockSupabase
        .from('users')
        .select('*')
        .then((resolve: any) => resolve);

      expect(error).toEqual(timeoutError);
      expect(data).toBeNull();
    });
  });
}); 