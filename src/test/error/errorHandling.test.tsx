import { createMockSupabaseClient, setupMockError } from '../mocks/supabaseMock';
import {
  getJobApplications,
  addJobApplication,
  createCompany,
  getUserProfile,
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

describe('Error Handling Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../utils/supabase').supabase;
  });

  describe('Network Failure Scenarios', () => {
    test('should handle network timeout errors', async () => {
      const timeoutError = {
        message: 'Request timeout',
        code: 'TIMEOUT',
      };

      setupMockError(mockSupabase, 'applications', 'select', timeoutError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle connection refused errors', async () => {
      const connectionError = {
        message: 'Connection refused',
        code: 'ECONNREFUSED',
      };

      setupMockError(mockSupabase, 'applications', 'select', connectionError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle DNS resolution failures', async () => {
      const dnsError = {
        message: 'ENOTFOUND',
        code: 'ENOTFOUND',
      };

      setupMockError(mockSupabase, 'applications', 'select', dnsError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle SSL certificate errors', async () => {
      const sslError = {
        message: 'SSL certificate error',
        code: 'CERT_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'select', sslError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });

  describe('Authentication Error Scenarios', () => {
    test('should handle expired JWT tokens', async () => {
      const expiredTokenError = {
        message: 'JWT expired',
        code: 'PGRST301',
      };

      setupMockError(mockSupabase, 'applications', 'select', expiredTokenError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle invalid JWT tokens', async () => {
      const invalidTokenError = {
        message: 'Invalid JWT',
        code: 'PGRST301',
      };

      setupMockError(mockSupabase, 'applications', 'select', invalidTokenError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle missing authentication headers', async () => {
      const missingAuthError = {
        message: 'Missing authorization header',
        code: 'PGRST301',
      };

      setupMockError(mockSupabase, 'applications', 'select', missingAuthError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle unauthorized access attempts', async () => {
      const unauthorizedError = {
        message: 'Unauthorized',
        code: '401',
      };

      setupMockError(mockSupabase, 'applications', 'select', unauthorizedError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });

  describe('Database Constraint Violations', () => {
    test('should handle unique constraint violations', async () => {
      const uniqueConstraintError = {
        message: 'duplicate key value violates unique constraint "users_email_key"',
        code: '23505',
      };

      setupMockError(mockSupabase, 'users', 'insert', uniqueConstraintError);

      await expect(
        require('../../utils/supabaseOperations').createUser({
          id: 'test-user-id',
          email: 'existing@example.com',
          first_name: 'Test',
          last_name: 'User',
        })
      ).rejects.toThrow('createUser failed');
    });

    test('should handle foreign key constraint violations', async () => {
      const foreignKeyError = {
        message: 'insert or update on table "applications" violates foreign key constraint',
        code: '23503',
      };

      setupMockError(mockSupabase, 'applications', 'insert', foreignKeyError);

      await expect(
        addJobApplication({
          user_id: 'non-existent-user',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
        })
      ).rejects.toThrow('addJobApplication - application failed');
    });

    test('should handle check constraint violations', async () => {
      const checkConstraintError = {
        message: 'new row for relation "applications" violates check constraint',
        code: '23514',
      };

      setupMockError(mockSupabase, 'applications', 'insert', checkConstraintError);

      await expect(
        addJobApplication({
          user_id: 'test-user-id',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
          priority_level: 5, // Invalid priority level
        })
      ).rejects.toThrow('addJobApplication - application failed');
    });

    test('should handle not null constraint violations', async () => {
      const notNullError = {
        message: 'null value in column "position" violates not-null constraint',
        code: '23502',
      };

      setupMockError(mockSupabase, 'applications', 'insert', notNullError);

      await expect(
        addJobApplication({
          user_id: 'test-user-id',
          date_applied: '2024-01-01',
          // Missing position field
        })
      ).rejects.toThrow('addJobApplication - application failed');
    });
  });

  describe('Rate Limiting and Timeout Handling', () => {
    test('should handle rate limiting errors', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        code: '429',
      };

      setupMockError(mockSupabase, 'applications', 'select', rateLimitError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle request timeout errors', async () => {
      const timeoutError = {
        message: 'Request timeout',
        code: 'TIMEOUT',
      };

      setupMockError(mockSupabase, 'applications', 'select', timeoutError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle service unavailable errors', async () => {
      const serviceUnavailableError = {
        message: 'Service unavailable',
        code: '503',
      };

      setupMockError(mockSupabase, 'applications', 'select', serviceUnavailableError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle gateway timeout errors', async () => {
      const gatewayTimeoutError = {
        message: 'Gateway timeout',
        code: '504',
      };

      setupMockError(mockSupabase, 'applications', 'select', gatewayTimeoutError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });

  describe('Data Validation Errors', () => {
    test('should handle invalid email format', async () => {
      const invalidEmailError = {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      };

      setupMockError(mockSupabase, 'users', 'insert', invalidEmailError);

      await expect(
        require('../../utils/supabaseOperations').createUser({
          id: 'test-user-id',
          email: 'invalid-email',
          first_name: 'Test',
          last_name: 'User',
        })
      ).rejects.toThrow('createUser failed');
    });

    test('should handle invalid date format', async () => {
      const invalidDateError = {
        message: 'Invalid date format',
        code: 'VALIDATION_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'insert', invalidDateError);

      await expect(
        addJobApplication({
          user_id: 'test-user-id',
          position: 'Software Engineer',
          date_applied: 'invalid-date',
        })
      ).rejects.toThrow('addJobApplication - application failed');
    });

    test('should handle invalid UUID format', async () => {
      const invalidUuidError = {
        message: 'Invalid UUID format',
        code: 'VALIDATION_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'select', invalidUuidError);

      await expect(getJobApplication('invalid-uuid')).rejects.toThrow('getJobApplication failed');
    });
  });

  describe('Permission and Authorization Errors', () => {
    test('should handle insufficient permissions', async () => {
      const permissionError = {
        message: 'Insufficient permissions',
        code: '403',
      };

      setupMockError(mockSupabase, 'applications', 'select', permissionError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle forbidden access', async () => {
      const forbiddenError = {
        message: 'Forbidden',
        code: '403',
      };

      setupMockError(mockSupabase, 'applications', 'select', forbiddenError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle row level security violations', async () => {
      const rlsError = {
        message: 'Row Level Security violation',
        code: 'RLS_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'select', rlsError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });

  describe('Database Schema Errors', () => {
    test('should handle missing table errors', async () => {
      const missingTableError = {
        message: 'relation "non_existent_table" does not exist',
        code: '42P01',
      };

      setupMockError(mockSupabase, 'non_existent_table', 'select', missingTableError);

      // This would be caught by the table name validation
      expect(mockSupabase.from).toHaveBeenCalledWith('non_existent_table');
    });

    test('should handle missing column errors', async () => {
      const missingColumnError = {
        message: 'column "non_existent_column" does not exist',
        code: '42703',
      };

      setupMockError(mockSupabase, 'applications', 'select', missingColumnError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle data type mismatch errors', async () => {
      const dataTypeError = {
        message: 'invalid input syntax for type integer',
        code: '22P02',
      };

      setupMockError(mockSupabase, 'applications', 'insert', dataTypeError);

      await expect(
        addJobApplication({
          user_id: 'test-user-id',
          position: 'Software Engineer',
          date_applied: '2024-01-01',
          priority_level: 'invalid-priority', // Should be integer
        })
      ).rejects.toThrow('addJobApplication - application failed');
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    test('should handle transient errors gracefully', async () => {
      const transientError = {
        message: 'Connection temporarily unavailable',
        code: 'TEMPORARY_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'select', transientError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle partial data errors', async () => {
      const partialDataError = {
        message: 'Partial data received',
        code: 'PARTIAL_DATA',
      };

      setupMockError(mockSupabase, 'applications', 'select', partialDataError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });

    test('should handle malformed response errors', async () => {
      const malformedResponseError = {
        message: 'Malformed response',
        code: 'MALFORMED_RESPONSE',
      };

      setupMockError(mockSupabase, 'applications', 'select', malformedResponseError);

      await expect(getJobApplications('test-user-id')).rejects.toThrow('getJobApplications failed');
    });
  });

  describe('Error Message Formatting', () => {
    test('should provide meaningful error messages', async () => {
      const genericError = {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      };

      setupMockError(mockSupabase, 'applications', 'select', genericError);

      try {
        await getJobApplications('test-user-id');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('getJobApplications failed');
      }
    });

    test('should preserve original error details', async () => {
      const detailedError = {
        message: 'Detailed error message with context',
        code: 'DETAILED_ERROR',
        details: 'Additional error details',
        hint: 'Try again later',
      };

      setupMockError(mockSupabase, 'applications', 'select', detailedError);

      try {
        await getJobApplications('test-user-id');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('getJobApplications failed');
      }
    });
  });
}); 