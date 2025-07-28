import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminBetaInvites } from '../../components/AdminBetaInvites';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock useAuth hook
const mockUseAuth = {
  user: {
    id: 'test-user-id',
    email: 'dan.northington@gmail.com'
  },
  profile: {
    first_name: 'Dan',
    last_name: 'Northington'
  }
};

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

describe('AdminBetaInvites', () => {
  const mockOnNavigateBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin interface for authorized user', () => {
    render(
      <AuthProvider>
        <AdminBetaInvites onNavigateBack={mockOnNavigateBack} />
      </AuthProvider>
    );

    expect(screen.getByText('Beta Invites Admin')).toBeInTheDocument();
    expect(screen.getByText('Add New Beta Invites')).toBeInTheDocument();
    expect(screen.getByText('Beta Invites')).toBeInTheDocument();
  });

  it('shows access denied for unauthorized user', () => {
    // Mock unauthorized user
    const unauthorizedMockUseAuth = {
      user: {
        id: 'test-user-id',
        email: 'unauthorized@example.com'
      },
      profile: {
        first_name: 'Test',
        last_name: 'User'
      }
    };

    jest.doMock('../../hooks/useAuth', () => ({
      useAuth: () => unauthorizedMockUseAuth
    }));

    render(
      <AuthProvider>
        <AdminBetaInvites onNavigateBack={mockOnNavigateBack} />
      </AuthProvider>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access the admin interface.")).toBeInTheDocument();
  });

  it('handles email validation correctly', async () => {
    render(
      <AuthProvider>
        <AdminBetaInvites onNavigateBack={mockOnNavigateBack} />
      </AuthProvider>
    );

    const textarea = screen.getByPlaceholderText(/Enter email addresses/);
    fireEvent.change(textarea, {
      target: { value: 'invalid-email\nvalid@email.com\nanother-invalid' }
    });

    const addButton = screen.getByText('Add Invites');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/)).toBeInTheDocument();
    });
  });

  it('shows stats dashboard', () => {
    render(
      <AuthProvider>
        <AdminBetaInvites onNavigateBack={mockOnNavigateBack} />
      </AuthProvider>
    );

    expect(screen.getByText('Total Invites')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('handles navigation back', () => {
    render(
      <AuthProvider>
        <AdminBetaInvites onNavigateBack={mockOnNavigateBack} />
      </AuthProvider>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(mockOnNavigateBack).toHaveBeenCalled();
  });
}); 