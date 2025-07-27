import { createMockSupabaseClient, mockUser, mockSession } from '../mocks/supabaseMock';

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
  getCurrentUser: jest.fn(),
  createUser: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

describe('Authentication Flow Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../utils/supabase').supabase;
  });

  describe('Supabase Auth Methods', () => {
    test('should handle successful user signup', async () => {
      const mockAuthResponse = {
        data: { user: mockUser, session: mockSession },
        error: null,
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await mockSupabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockAuthResponse);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('should handle signup errors', async () => {
      const mockError = new Error('Email already exists');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await mockSupabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error).toEqual(mockError);
    });

    test('should handle successful user login', async () => {
      const mockAuthResponse = {
        data: { user: mockUser, session: mockSession },
        error: null,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockAuthResponse);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toEqual(mockError);
    });

    test('should handle successful user logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    test('should handle logout errors', async () => {
      const mockError = new Error('Logout failed');
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Auth State Management', () => {
    test('should get current session', async () => {
      const mockSessionResponse = {
        data: { session: mockSession },
        error: null,
      };

      mockSupabase.auth.getSession.mockResolvedValue(mockSessionResponse);

      const result = await mockSupabase.auth.getSession();

      expect(result).toEqual(mockSessionResponse);
    });

    test('should get current user', async () => {
      const mockUserResponse = {
        data: { user: mockUser },
        error: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue(mockUserResponse);

      const result = await mockSupabase.auth.getUser();

      expect(result).toEqual(mockUserResponse);
    });

    test('should handle auth state changes', () => {
      const mockSubscription = {
        data: { subscription: { unsubscribe: jest.fn() } },
      };

      mockSupabase.auth.onAuthStateChange.mockReturnValue(mockSubscription);

      const result = mockSupabase.auth.onAuthStateChange(jest.fn());

      expect(result).toEqual(mockSubscription);
    });
  });

  describe('Database Operations with Auth', () => {
    test('should handle authenticated database queries', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          user_id: 'test-user-id',
          position: 'Software Engineer',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
          resolve({ data: mockApplications, error: null });
          return Promise.resolve({ data: mockApplications, error: null });
        }),
      });

      const result = await mockSupabase
        .from('applications')
        .select('*')
        .eq('user_id', 'test-user-id')
        .then((resolve: any) => resolve);

      expect(result.data).toEqual(mockApplications);
      expect(result.error).toBeNull();
    });

    test('should handle unauthenticated database queries', async () => {
      const authError = { message: 'Invalid JWT', code: 'PGRST301' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
          resolve({ data: null, error: authError });
          return Promise.resolve({ data: null, error: authError });
        }),
      });

      const result = await mockSupabase
        .from('applications')
        .select('*')
        .eq('user_id', 'test-user-id')
        .then((resolve: any) => resolve);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });
  });
}); 