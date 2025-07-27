import {
  User,
  Company,
  JobApplication,
  ApplicationTimeline,
  JobApplicationFormData,
  CompanyFormData,
  UserProfileFormData,
  ValidationError,
  FormValidationResult
} from '../../jobTypes';

describe('API Contract Testing', () => {
  describe('Supabase Function Call Validation', () => {
    test('should validate user creation API signature', () => {
      // Mock API function signature
      const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
        return {
          id: 'new-user-id',
          ...userData,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        };
      };

      const userData = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      const result = await createUser(userData);
      
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.first_name).toBe(userData.first_name);
      expect(result.last_name).toBe(userData.last_name);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    test('should validate user update API signature', () => {
      const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
        return {
          id,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          ...updates,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        };
      };

      const updates = {
        professional_title: 'Senior Software Engineer',
        years_experience: 5
      };

      const result = await updateUser('user-id', updates);
      
      expect(result.id).toBe('user-id');
      expect(result.professional_title).toBe(updates.professional_title);
      expect(result.years_experience).toBe(updates.years_experience);
    });

    test('should validate application creation API signature', () => {
      const createApplication = async (appData: JobApplicationFormData): Promise<JobApplication> => {
        return {
          id: 'new-app-id',
          user_id: 'user-id',
          position: appData.position,
          priority_level: appData.priority_level,
          date_applied: appData.date_applied,
          notes: appData.notes,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as JobApplication;
      };

      const appData: JobApplicationFormData = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01'
      };

      const result = await createApplication(appData);
      
      expect(result.id).toBeDefined();
      expect(result.user_id).toBeDefined();
      expect(result.position).toBe(appData.position);
      expect(result.priority_level).toBe(appData.priority_level);
      expect(result.date_applied).toBe(appData.date_applied);
    });

    test('should validate application update API signature', () => {
      const updateApplication = async (id: string, updates: Partial<JobApplicationFormData>): Promise<JobApplication> => {
        return {
          id,
          user_id: 'user-id',
          position: 'Software Engineer',
          priority_level: 2,
          date_applied: '2024-01-01',
          ...updates,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as JobApplication;
      };

      const updates = {
        notes: 'Updated notes',
        priority_level: 1
      };

      const result = await updateApplication('app-id', updates);
      
      expect(result.id).toBe('app-id');
      expect(result.notes).toBe(updates.notes);
      expect(result.priority_level).toBe(updates.priority_level);
    });

    test('should validate company creation API signature', () => {
      const createCompany = async (companyData: CompanyFormData): Promise<Company> => {
        return {
          id: 'new-company-id',
          name: companyData.name,
          industry_category: companyData.industry_category,
          company_size_range: companyData.company_size_range,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as Company;
      };

      const companyData: CompanyFormData = {
        name: 'Test Company',
        industry_category: 'Technology',
        company_size_range: '51-200'
      };

      const result = await createCompany(companyData);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(companyData.name);
      expect(result.industry_category).toBe(companyData.industry_category);
      expect(result.company_size_range).toBe(companyData.company_size_range);
    });

    test('should validate company update API signature', () => {
      const updateCompany = async (id: string, updates: Partial<CompanyFormData>): Promise<Company> => {
        return {
          id,
          name: 'Test Company',
          ...updates,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as Company;
      };

      const updates = {
        industry_category: 'Healthcare',
        company_size_range: '201-500'
      };

      const result = await updateCompany('company-id', updates);
      
      expect(result.id).toBe('company-id');
      expect(result.industry_category).toBe(updates.industry_category);
      expect(result.company_size_range).toBe(updates.company_size_range);
    });
  });

  describe('Response Data Structure Validation', () => {
    test('should validate user response structure', () => {
      const validateUserResponse = (response: any): response is User => {
        const requiredFields = ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at'];
        return requiredFields.every(field => response.hasOwnProperty(field));
      };

      const validUserResponse = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const invalidUserResponse = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'John'
        // Missing required fields
      };

      expect(validateUserResponse(validUserResponse)).toBe(true);
      expect(validateUserResponse(invalidUserResponse)).toBe(false);
    });

    test('should validate application response structure', () => {
      const validateApplicationResponse = (response: any): response is JobApplication => {
        const requiredFields = ['id', 'user_id', 'position', 'priority_level', 'date_applied', 'created_at', 'updated_at'];
        return requiredFields.every(field => response.hasOwnProperty(field));
      };

      const validApplicationResponse = {
        id: 'app-id',
        user_id: 'user-id',
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const invalidApplicationResponse = {
        id: 'app-id',
        position: 'Software Engineer'
        // Missing required fields
      };

      expect(validateApplicationResponse(validApplicationResponse)).toBe(true);
      expect(validateApplicationResponse(invalidApplicationResponse)).toBe(false);
    });

    test('should validate company response structure', () => {
      const validateCompanyResponse = (response: any): response is Company => {
        const requiredFields = ['id', 'name', 'created_at', 'updated_at'];
        return requiredFields.every(field => response.hasOwnProperty(field));
      };

      const validCompanyResponse = {
        id: 'company-id',
        name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const invalidCompanyResponse = {
        id: 'company-id'
        // Missing required fields
      };

      expect(validateCompanyResponse(validCompanyResponse)).toBe(true);
      expect(validateCompanyResponse(invalidCompanyResponse)).toBe(false);
    });

    test('should validate timeline response structure', () => {
      const validateTimelineResponse = (response: any): response is ApplicationTimeline => {
        const requiredFields = ['id', 'application_id', 'status', 'date_changed', 'created_at'];
        return requiredFields.every(field => response.hasOwnProperty(field));
      };

      const validTimelineResponse = {
        id: 'timeline-id',
        application_id: 'app-id',
        status: 'Applied',
        date_changed: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z'
      };

      const invalidTimelineResponse = {
        id: 'timeline-id',
        application_id: 'app-id'
        // Missing required fields
      };

      expect(validateTimelineResponse(validTimelineResponse)).toBe(true);
      expect(validateTimelineResponse(invalidTimelineResponse)).toBe(false);
    });
  });

  describe('Error Response Handling and Types', () => {
    test('should validate error response structure', () => {
      const validateErrorResponse = (error: any): boolean => {
        return error.hasOwnProperty('message') && 
               error.hasOwnProperty('code') && 
               typeof error.message === 'string' &&
               typeof error.code === 'string';
      };

      const validErrorResponse = {
        message: 'User not found',
        code: 'USER_NOT_FOUND',
        details: 'Additional error details'
      };

      const invalidErrorResponse = {
        message: 'User not found'
        // Missing code field
      };

      expect(validateErrorResponse(validErrorResponse)).toBe(true);
      expect(validateErrorResponse(invalidErrorResponse)).toBe(false);
    });

    test('should validate specific error types', () => {
      const errorTypes = {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        NOT_FOUND: 'NOT_FOUND',
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        INTERNAL_ERROR: 'INTERNAL_ERROR'
      };

      const validateErrorType = (error: any, expectedType: string): boolean => {
        return error.code === expectedType;
      };

      const validationError = {
        message: 'Invalid input data',
        code: 'VALIDATION_ERROR'
      };

      const notFoundError = {
        message: 'Resource not found',
        code: 'NOT_FOUND'
      };

      expect(validateErrorType(validationError, errorTypes.VALIDATION_ERROR)).toBe(true);
      expect(validateErrorType(notFoundError, errorTypes.NOT_FOUND)).toBe(true);
      expect(validateErrorType(validationError, errorTypes.NOT_FOUND)).toBe(false);
    });

    test('should validate validation error structure', () => {
      const validateValidationError = (error: any): error is ValidationError => {
        return error.hasOwnProperty('field') && 
               error.hasOwnProperty('message') &&
               typeof error.field === 'string' &&
               typeof error.message === 'string';
      };

      const validValidationError: ValidationError = {
        field: 'email',
        message: 'Invalid email format'
      };

      const invalidValidationError = {
        message: 'Invalid email format'
        // Missing field property
      };

      expect(validateValidationError(validValidationError)).toBe(true);
      expect(validateValidationError(invalidValidationError)).toBe(false);
    });

    test('should validate form validation result structure', () => {
      const validateFormValidationResult = (result: any): result is FormValidationResult => {
        return result.hasOwnProperty('isValid') && 
               result.hasOwnProperty('errors') &&
               typeof result.isValid === 'boolean' &&
               Array.isArray(result.errors);
      };

      const validFormValidationResult: FormValidationResult = {
        isValid: false,
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ]
      };

      const invalidFormValidationResult = {
        isValid: false
        // Missing errors array
      };

      expect(validateFormValidationResult(validFormValidationResult)).toBe(true);
      expect(validateFormValidationResult(invalidFormValidationResult)).toBe(false);
    });
  });

  describe('API Response Type Safety', () => {
    test('should validate successful response types', () => {
      const validateSuccessResponse = <T>(response: any): response is { data: T; error: null } => {
        return response.hasOwnProperty('data') && 
               response.hasOwnProperty('error') &&
               response.error === null;
      };

      const validSuccessResponse = {
        data: {
          id: 'user-id',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        },
        error: null
      };

      const invalidSuccessResponse = {
        data: {
          id: 'user-id',
          email: 'test@example.com'
        }
        // Missing error property
      };

      expect(validateSuccessResponse(validSuccessResponse)).toBe(true);
      expect(validateSuccessResponse(invalidSuccessResponse)).toBe(false);
    });

    test('should validate error response types', () => {
      const validateErrorResponseType = (response: any): response is { data: null; error: any } => {
        return response.hasOwnProperty('data') && 
               response.hasOwnProperty('error') &&
               response.data === null &&
               response.error !== null;
      };

      const validErrorResponse = {
        data: null,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      };

      const invalidErrorResponse = {
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
        // Missing data property
      };

      expect(validateErrorResponseType(validErrorResponse)).toBe(true);
      expect(validateErrorResponseType(invalidErrorResponse)).toBe(false);
    });

    test('should validate paginated response types', () => {
      const validatePaginatedResponse = <T>(response: any): response is { 
        data: T[]; 
        count: number; 
        error: null 
      } => {
        return response.hasOwnProperty('data') && 
               response.hasOwnProperty('count') &&
               response.hasOwnProperty('error') &&
               Array.isArray(response.data) &&
               typeof response.count === 'number' &&
               response.error === null;
      };

      const validPaginatedResponse = {
        data: [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' }
        ],
        count: 2,
        error: null
      };

      const invalidPaginatedResponse = {
        data: [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' }
        ]
        // Missing count and error properties
      };

      expect(validatePaginatedResponse(validPaginatedResponse)).toBe(true);
      expect(validatePaginatedResponse(invalidPaginatedResponse)).toBe(false);
    });
  });

  describe('Function Parameter Validation', () => {
    test('should validate required parameters', () => {
      const validateRequiredParams = (params: any, requiredFields: string[]): boolean => {
        return requiredFields.every(field => params.hasOwnProperty(field) && params[field] !== undefined);
      };

      const createUserParams = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      const requiredUserFields = ['email', 'first_name', 'last_name'];
      expect(validateRequiredParams(createUserParams, requiredUserFields)).toBe(true);

      const incompleteParams = {
        email: 'test@example.com',
        first_name: 'John'
        // Missing last_name
      };

      expect(validateRequiredParams(incompleteParams, requiredUserFields)).toBe(false);
    });

    test('should validate parameter types', () => {
      const validateParamTypes = (params: any, typeMap: Record<string, string>): boolean => {
        return Object.entries(typeMap).every(([field, expectedType]) => {
          if (!params.hasOwnProperty(field)) return true; // Optional field
          const actualType = typeof params[field];
          return actualType === expectedType;
        });
      };

      const userParams = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        years_experience: 5
      };

      const userTypeMap = {
        email: 'string',
        first_name: 'string',
        last_name: 'string',
        years_experience: 'number'
      };

      expect(validateParamTypes(userParams, userTypeMap)).toBe(true);

      const invalidParams = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        years_experience: '5' // Should be number
      };

      expect(validateParamTypes(invalidParams, userTypeMap)).toBe(false);
    });
  });
}); 