import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

// Mock data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: 1234567890,
  token_type: 'bearer',
  user: mockUser,
};

// Mock database responses
export const mockApplications = [
  {
    id: 'app-1',
    user_id: 'test-user-id',
    company_id: 'company-1',
    position: 'Software Engineer',
    date_applied: '2024-01-01',
    priority_level: 2,
    notes: 'Test application',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockCompanies = [
  {
    id: 'company-1',
    name: 'Test Company',
    industry_category: 'Technology',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  professional_title: 'Software Engineer',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockTimeline = [
  {
    id: 'timeline-1',
    application_id: 'app-1',
    status: 'Applied',
    date_changed: '2024-01-01',
    notes: 'Application submitted',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Supabase client
export const createMockSupabaseClient = (): SupabaseClient => {
  const mockClient = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      abortSignal: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(function(this: any, resolve: any) {
        // Default mock response
        const mockResponse = {
          data: mockApplications,
          error: null,
        };
        resolve(mockResponse);
        return Promise.resolve(mockResponse);
      }),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        createSignedUrl: jest.fn(),
        createSignedUploadUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
    functions: {
      invoke: jest.fn(),
    },
    rest: {
      rpc: jest.fn(),
    },
    realtime: {
      channel: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      }),
      removeAllChannels: jest.fn(),
      getChannels: jest.fn(),
    },
    schema: jest.fn(),
    serviceRoleKey: 'mock-service-role-key',
    supabaseUrl: 'https://test.supabase.co',
    supabaseKey: 'mock-anon-key',
  } as unknown as SupabaseClient;

  return mockClient;
};

// Helper to set up specific mock responses
export const setupMockResponse = (
  mockClient: SupabaseClient,
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  response: { data: any; error: any }
) => {
  const mockFrom = mockClient.from as jest.MockedFunction<any>;
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(function(this: any, resolve: any) {
      resolve(response);
      return Promise.resolve(response);
    }),
  };

  mockFrom.mockReturnValue(mockChain);
};

// Helper to simulate errors
export const setupMockError = (
  mockClient: SupabaseClient,
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  error: { message: string; code?: string }
) => {
  setupMockResponse(mockClient, table, operation, {
    data: null,
    error,
  });
}; 