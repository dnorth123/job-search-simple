import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginForm, SignupForm, ProfileSetupForm } from '../../components/AuthForms';
import { FormField } from '../../components/FormField';

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Form Accessibility - WCAG 2.2 Compliance', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: jest.fn(),
      createUserProfile: jest.fn(),
      profile: null,
      updateProfile: jest.fn(),
    });
  });

  describe('FormField Component', () => {
    it('should have proper ARIA labels and descriptions', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
          required
          helpText="This is help text"
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', 'test-field-help');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('required');
    });

    it('should show error state with proper ARIA attributes', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
          error="This field is required"
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-field-error');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('This field is required');
    });

    it('should have proper focus management', () => {
      const mockOnChange = jest.fn();
      const mockOnFocus = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      fireEvent.focus(input);
      
      expect(mockOnFocus).toHaveBeenCalled();
      expect(input).toHaveFocus();
    });

    it('should have proper keyboard navigation', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      
      // Test tab navigation
      input.focus();
      expect(input).toHaveFocus();
      
      // Test keyboard input
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Tab' });
      
      expect(input).toBeInTheDocument();
    });

    it('should have proper touch target size (48px minimum)', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      const computedStyle = window.getComputedStyle(input);
      
      // Check minimum height and width for touch targets
      expect(parseInt(computedStyle.minHeight || '0')).toBeGreaterThanOrEqual(48);
      expect(parseInt(computedStyle.minWidth || '0')).toBeGreaterThanOrEqual(48);
    });

    it('should prevent iOS zoom with 16px font size', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          id="test-field"
          name="test"
          label="Test Field"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /test field/i });
      const computedStyle = window.getComputedStyle(input);
      
      // Check font size is at least 16px to prevent iOS zoom
      expect(parseInt(computedStyle.fontSize || '0')).toBeGreaterThanOrEqual(16);
    });
  });

  describe('LoginForm Component', () => {
    it('should have proper form structure and labels', () => {
      renderWithProviders(<LoginForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByRole('textbox', { name: /password/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should provide clear error recovery paths', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        signUp: jest.fn(),
        createUserProfile: jest.fn(),
        profile: null,
        updateProfile: jest.fn(),
      });

      renderWithProviders(<LoginForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByRole('textbox', { name: /password/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('Invalid credentials');
      });
    });

    it('should work with keyboard navigation', () => {
      renderWithProviders(<LoginForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByRole('textbox', { name: /password/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Test tab order
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      expect(submitButton).toHaveFocus();
    });
  });

  describe('SignupForm Component', () => {
    it('should have proper form validation with ARIA feedback', async () => {
      renderWithProviders(<SignupForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByRole('textbox', { name: /password/i });
      const confirmPasswordInput = screen.getByRole('textbox', { name: /confirm password/i });

      // Test real-time validation
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email address/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Test password confirmation
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/passwords do not match/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should have proper autocomplete attributes', () => {
      renderWithProviders(<SignupForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByRole('textbox', { name: /password/i });
      const confirmPasswordInput = screen.getByRole('textbox', { name: /confirm password/i });

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  describe('ProfileSetupForm Component', () => {
    it('should have proper form sections with headings', () => {
      renderWithProviders(<ProfileSetupForm onComplete={jest.fn()} />);

      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /professional details/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /contact information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /skills/i })).toBeInTheDocument();
    });

    it('should have proper field grouping and layout', () => {
      renderWithProviders(<ProfileSetupForm onComplete={jest.fn()} />);

      // Check that required fields are properly marked
      const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
      const lastNameInput = screen.getByRole('textbox', { name: /last name/i });

      expect(firstNameInput).toHaveAttribute('required');
      expect(lastNameInput).toHaveAttribute('required');

      // Check that required indicators are present
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should provide real-time validation feedback', async () => {
      renderWithProviders(<ProfileSetupForm onComplete={jest.fn()} />);

      const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
      const linkedinInput = screen.getByRole('textbox', { name: /linkedin url/i });

      // Test phone number validation
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid phone number/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Test LinkedIn URL validation
      fireEvent.change(linkedinInput, { target: { value: 'not-a-url' } });
      fireEvent.blur(linkedinInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid linkedin url/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Form Experience', () => {
    it('should have 48px minimum touch targets', () => {
      renderWithProviders(<LoginForm onAuthSuccess={jest.fn()} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const computedStyle = window.getComputedStyle(submitButton);
      
      expect(parseInt(computedStyle.minHeight || '0')).toBeGreaterThanOrEqual(48);
      expect(parseInt(computedStyle.minWidth || '0')).toBeGreaterThanOrEqual(48);
    });

    it('should prevent iOS zoom with 16px font size', () => {
      renderWithProviders(<LoginForm onAuthSuccess={jest.fn()} />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const computedStyle = window.getComputedStyle(emailInput);
      
      expect(parseInt(computedStyle.fontSize || '0')).toBeGreaterThanOrEqual(16);
    });

    it('should have proper mobile layout (single column)', () => {
      renderWithProviders(<ProfileSetupForm onComplete={jest.fn()} />);

      // Check that form sections are properly structured for mobile
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Check that grid layouts are responsive
      const gridContainers = document.querySelectorAll('.grid');
      gridContainers.forEach(container => {
        const computedStyle = window.getComputedStyle(container);
        expect(computedStyle.gridTemplateColumns).toContain('1fr');
      });
    });
  });
}); 