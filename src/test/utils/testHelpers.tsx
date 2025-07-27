import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';

// Custom render function that includes AuthProvider
export const renderWithAuth = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <AuthProvider>{children}</AuthProvider>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
  ...overrides,
});

export const createMockApplication = (overrides = {}) => ({
  id: 'app-1',
  user_id: 'test-user-id',
  company_id: 'company-1',
  position: 'Software Engineer',
  date_applied: '2024-01-01',
  priority_level: 2,
  notes: 'Test application',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCompany = (overrides = {}) => ({
  id: 'company-1',
  name: 'Test Company',
  industry_category: 'Technology',
  company_size_range: '51-200',
  headquarters_location: 'San Francisco, CA',
  website_url: 'https://testcompany.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTimelineEntry = (overrides = {}) => ({
  id: 'timeline-1',
  application_id: 'app-1',
  status: 'Applied',
  date_changed: '2024-01-01',
  notes: 'Application submitted',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Error generators
export const createNetworkError = (message = 'Network error') => ({
  message,
  code: 'NETWORK_ERROR',
});

export const createAuthError = (message = 'Authentication failed') => ({
  message,
  code: 'PGRST301',
});

export const createConstraintError = (message = 'Constraint violation') => ({
  message,
  code: '23505',
});

export const createRateLimitError = (message = 'Too many requests') => ({
  message,
  code: '429',
});

// Async test helpers
export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};

export const waitForAuthStateChange = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
};

// Validation helpers
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument();
};

export const expectToHaveTextContent = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

// Form testing helpers
export const fillFormField = async (name: string, value: string) => {
  const field = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

export const submitForm = async (formElement: HTMLFormElement) => {
  formElement.dispatchEvent(new Event('submit', { bubbles: true }));
};

// Mock function helpers
export const createMockFunction = <T extends (...args: any[]) => any>(
  returnValue?: any
) => {
  return jest.fn().mockReturnValue(returnValue);
};

export const createMockAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  returnValue?: any
) => {
  return jest.fn().mockResolvedValue(returnValue);
};

export const createMockRejectedFunction = <T extends (...args: any[]) => Promise<any>>(
  error: Error | string
) => {
  return jest.fn().mockRejectedValue(error);
}; 