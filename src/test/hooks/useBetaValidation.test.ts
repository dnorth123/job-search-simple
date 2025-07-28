import { renderHook, act, waitFor } from '@testing-library/react';
import { useBetaValidation } from '../../hooks/useBetaValidation';
import { supabase } from '../../utils/supabase';

// @ts-expect-error - Mock types are complex for testing

// Mock Supabase client
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn()
        }))
      }))
    }))
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useBetaValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBetaAccess', () => {
    it('should return error for empty email', async () => {
      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('');
      });

      expect(validationResult).toEqual({
        isValid: false,
        error: 'Email is required'
      });
    });

    it('should return error for whitespace-only email', async () => {
      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('   ');
      });

      expect(validationResult).toEqual({
        isValid: false,
        error: 'Email is required'
      });
    });

    it('should handle email not found in beta_invites', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('test@example.com');
      });

      expect(validationResult).toEqual({
        isValid: false,
        error: 'This email is not on our beta invite list. Please contact support for access.'
      });
    });

    it('should handle already used invite', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: '123',
          email: 'test@example.com',
          used_at: '2023-01-01T00:00:00Z',
          created_at: '2023-01-01T00:00:00Z'
        },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('test@example.com');
      });

      expect(validationResult).toEqual({
        isValid: false,
        error: 'This beta invite has already been used. Please contact support for a new invite.'
      });
    });

    it('should handle expired invite', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: '123',
          email: 'test@example.com',
          used_at: null,
          created_at: '2023-01-01T00:00:00Z',
          expires_at: '2023-01-01T00:00:00Z' // Past date
        },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('test@example.com');
      });

      expect(validationResult).toEqual({
        isValid: false,
        error: 'This beta invite has expired. Please contact support for a new invite.'
      });
    });

    it('should return valid result for valid invite', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: '123',
          email: 'test@example.com',
          used_at: null,
          created_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-12-31T23:59:59Z' // Future date
        },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const validationResult = await act(async () => {
        return await result.current.validateBetaAccess('test@example.com');
      });

      expect(validationResult).toEqual({
        isValid: true,
        invite: {
          id: '123',
          email: 'test@example.com',
          used_at: null,
          created_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-12-31T23:59:59Z'
        }
      });
    });

    it('should normalize email to lowercase', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: '123',
          email: 'test@example.com',
          used_at: null,
          created_at: '2023-01-01T00:00:00Z'
        },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      await act(async () => {
        await result.current.validateBetaAccess('TEST@EXAMPLE.COM');
      });

      // Check that the email was normalized to lowercase
      expect(mockSupabase.from).toHaveBeenCalledWith('beta_invites');
    });
  });

  describe('markBetaInviteUsed', () => {
    it('should return false for empty email', async () => {
      const { result } = renderHook(() => useBetaValidation());

      const success = await act(async () => {
        return await result.current.markBetaInviteUsed('');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Email is required to mark invite as used');
    });

    it('should successfully mark invite as used', async () => {
      const mockIs = jest.fn().mockResolvedValue({
        error: null
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const success = await act(async () => {
        return await result.current.markBetaInviteUsed('test@example.com');
      });

      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle database error when marking invite as used', async () => {
      const mockIs = jest.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      const success = await act(async () => {
        return await result.current.markBetaInviteUsed('test@example.com');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to mark invite as used. Please contact support.');
    });
  });

  describe('loading states', () => {
    it('should set loading state during validation', async () => {
      const mockSingle = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: null,
          error: { code: 'PGRST116' }
        }), 100))
      );

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.validateBetaAccess('test@example.com');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading state during markBetaInviteUsed', async () => {
      const mockIs = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          error: null
        }), 100))
      );

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      } as any);

      const { result } = renderHook(() => useBetaValidation());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.markBetaInviteUsed('test@example.com');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useBetaValidation());

      // Set an error first
      act(() => {
        result.current.markBetaInviteUsed('');
      });

      expect(result.current.error).toBe('Email is required to mark invite as used');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
}); 