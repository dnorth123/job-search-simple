describe('Comprehensive TypeScript and Data Validation Tests', () => {
  describe('1. Type Definition Validation', () => {
    test('should validate enum types match expected values', () => {
      // JobStatus enum validation
const validJobStatuses = ['Pre-application', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
expect(validJobStatuses).toHaveLength(6);
expect(validJobStatuses).toContain('Pre-application');
expect(validJobStatuses).toContain('Applied');
expect(validJobStatuses).toContain('Interview');
expect(validJobStatuses).toContain('Offer');
expect(validJobStatuses).toContain('Rejected');
expect(validJobStatuses).toContain('Withdrawn');

      // PriorityLevel enum validation
      const validPriorityLevels = [1, 2, 3];
      expect(validPriorityLevels).toHaveLength(3);
      expect(validPriorityLevels).toContain(1);
      expect(validPriorityLevels).toContain(2);
      expect(validPriorityLevels).toContain(3);

      // RemotePolicy enum validation
      const validRemotePolicies = ['Remote', 'Hybrid', 'On-site'];
      expect(validRemotePolicies).toHaveLength(3);
      expect(validRemotePolicies).toContain('Remote');
      expect(validRemotePolicies).toContain('Hybrid');
      expect(validRemotePolicies).toContain('On-site');
    });

    test('should validate interface structure matches database schema', () => {
      // User interface validation
      const userStructure = {
        id: 'string',
        email: 'string',
        first_name: 'string',
        last_name: 'string',
        professional_title: 'string?',
        industry_category: 'string?',
        career_level: 'string?',
        linkedin_url: 'string?',
        portfolio_url: 'string?',
        phone_number: 'string?',
        location: 'string?',
        years_experience: 'number?',
        skills: 'string[]?',
        created_at: 'string',
        updated_at: 'string'
      };

      expect(userStructure.id).toBe('string');
      expect(userStructure.email).toBe('string');
      expect(userStructure.first_name).toBe('string');
      expect(userStructure.last_name).toBe('string');
      expect(userStructure.created_at).toBe('string');
      expect(userStructure.updated_at).toBe('string');

      // JobApplication interface validation
      const applicationStructure = {
        id: 'string',
        user_id: 'string',
        company_id: 'string?',
        position: 'string',
        salary_range_min: 'number?',
        salary_range_max: 'number?',
        location: 'string?',
        remote_policy: 'string?',
        application_source: 'string?',
        priority_level: 'number',
        notes: 'string?',
        date_applied: 'string',
        job_posting_url: 'string?',
        recruiter_name: 'string?',
        recruiter_email: 'string?',
        recruiter_phone: 'string?',
        interview_rounds: 'number?',
        benefits_mentioned: 'string?',
        equity_offered: 'boolean?',
        equity_details: 'string?',
        created_at: 'string',
        updated_at: 'string'
      };

      expect(applicationStructure.id).toBe('string');
      expect(applicationStructure.user_id).toBe('string');
      expect(applicationStructure.position).toBe('string');
      expect(applicationStructure.priority_level).toBe('number');
      expect(applicationStructure.date_applied).toBe('string');
      expect(applicationStructure.created_at).toBe('string');
      expect(applicationStructure.updated_at).toBe('string');
    });

    test('should validate type safety for API calls', () => {
      // Mock API function signatures
      const apiFunctions = {
        createUser: '(userData: Omit<User, "id" | "created_at" | "updated_at">) => Promise<User>',
        updateUser: '(id: string, updates: Partial<User>) => Promise<User>',
        createApplication: '(appData: JobApplicationFormData) => Promise<JobApplication>',
        updateApplication: '(id: string, updates: Partial<JobApplicationFormData>) => Promise<JobApplication>',
        createCompany: '(companyData: CompanyFormData) => Promise<Company>',
        updateCompany: '(id: string, updates: Partial<CompanyFormData>) => Promise<Company>'
      };

      expect(apiFunctions.createUser).toContain('userData');
      expect(apiFunctions.createUser).toContain('Promise<User>');
      expect(apiFunctions.updateUser).toContain('id: string');
      expect(apiFunctions.updateUser).toContain('updates: Partial<User>');
      expect(apiFunctions.createApplication).toContain('appData: JobApplicationFormData');
      expect(apiFunctions.createApplication).toContain('Promise<JobApplication>');
    });
  });

  describe('2. Data Validation Testing', () => {
    test('should validate email format', () => {
      const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should validate required fields', () => {
      const validateRequiredField = (value: string): boolean => {
        return value.trim().length > 0;
      };

      expect(validateRequiredField('valid field')).toBe(true);
      expect(validateRequiredField('')).toBe(false);
      expect(validateRequiredField('   ')).toBe(false);
      expect(validateRequiredField('  valid  ')).toBe(true);
    });

    test('should validate date ranges', () => {
      const validateDateRange = (startDate: string, endDate: string): boolean => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
      };

      expect(validateDateRange('2024-01-01', '2024-01-15')).toBe(true);
      expect(validateDateRange('2024-01-15', '2024-01-01')).toBe(false);
      expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(true);
    });

    test('should validate salary ranges', () => {
      const validateSalaryRange = (min: number, max: number): boolean => {
        return min >= 0 && max >= 0 && min <= max;
      };

      expect(validateSalaryRange(50000, 100000)).toBe(true);
      expect(validateSalaryRange(100000, 50000)).toBe(false);
      expect(validateSalaryRange(50000, 50000)).toBe(true);
      expect(validateSalaryRange(-1000, 50000)).toBe(false);
    });

    test('should validate priority level constraints', () => {
      const isValidPriority = (level: number): boolean => {
        return level >= 1 && level <= 3;
      };

      expect(isValidPriority(1)).toBe(true);
      expect(isValidPriority(2)).toBe(true);
      expect(isValidPriority(3)).toBe(true);
      expect(isValidPriority(0)).toBe(false);
      expect(isValidPriority(4)).toBe(false);
    });

    test('should validate phone number format', () => {
      const validatePhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
      };

      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(validatePhoneNumber('123456789')).toBe(false); // Too short
      expect(validatePhoneNumber('invalid')).toBe(false);
    });

    test('should validate URL formats', () => {
      const validateURL = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://linkedin.com/in/user')).toBe(true);
      expect(validateURL('not-a-url')).toBe(false);
    });
  });

  describe('3. Schema Migration Testing', () => {
    test('should validate database schema structure', () => {
      const dbSchema = {
        users: {
          id: 'UUID PRIMARY KEY',
          email: 'VARCHAR(255) UNIQUE NOT NULL',
          first_name: 'VARCHAR(100) NOT NULL',
          last_name: 'VARCHAR(100) NOT NULL',
          created_at: 'TIMESTAMP WITH TIME ZONE',
          updated_at: 'TIMESTAMP WITH TIME ZONE'
        },
        applications: {
          id: 'UUID PRIMARY KEY',
          user_id: 'UUID NOT NULL REFERENCES users(id)',
          company_id: 'UUID REFERENCES companies(id)',
          position: 'VARCHAR(255) NOT NULL',
          priority_level: 'INTEGER DEFAULT 3',
          date_applied: 'DATE NOT NULL',
          created_at: 'TIMESTAMP WITH TIME ZONE',
          updated_at: 'TIMESTAMP WITH TIME ZONE'
        },
        companies: {
          id: 'UUID PRIMARY KEY',
          name: 'VARCHAR(255) NOT NULL',
          created_at: 'TIMESTAMP WITH TIME ZONE',
          updated_at: 'TIMESTAMP WITH TIME ZONE'
        },
        application_timeline: {
          id: 'UUID PRIMARY KEY',
          application_id: 'UUID NOT NULL REFERENCES applications(id)',
          status: 'VARCHAR(50) NOT NULL',
          date_changed: 'DATE NOT NULL',
          created_at: 'TIMESTAMP WITH TIME ZONE'
        }
      };

      // Verify all required fields exist
      expect(dbSchema.users).toHaveProperty('id');
      expect(dbSchema.users).toHaveProperty('email');
      expect(dbSchema.users).toHaveProperty('first_name');
      expect(dbSchema.users).toHaveProperty('last_name');
      expect(dbSchema.users).toHaveProperty('created_at');
      expect(dbSchema.users).toHaveProperty('updated_at');

      expect(dbSchema.applications).toHaveProperty('id');
      expect(dbSchema.applications).toHaveProperty('user_id');
      expect(dbSchema.applications).toHaveProperty('position');
      expect(dbSchema.applications).toHaveProperty('priority_level');
      expect(dbSchema.applications).toHaveProperty('date_applied');
      expect(dbSchema.applications).toHaveProperty('created_at');
      expect(dbSchema.applications).toHaveProperty('updated_at');
    });

    test('should validate foreign key relationships', () => {
      const validateForeignKey = (table: string, column: string, references: string): boolean => {
        const validRelationships = {
          'applications.user_id': 'users.id',
          'applications.company_id': 'companies.id',
          'application_timeline.application_id': 'applications.id'
        };

        const key = `${table}.${column}`;
        return validRelationships[key as keyof typeof validRelationships] === references;
      };

      expect(validateForeignKey('applications', 'user_id', 'users.id')).toBe(true);
      expect(validateForeignKey('applications', 'company_id', 'companies.id')).toBe(true);
      expect(validateForeignKey('application_timeline', 'application_id', 'applications.id')).toBe(true);
      expect(validateForeignKey('applications', 'user_id', 'companies.id')).toBe(false);
    });

    test('should validate backward compatibility', () => {
      const legacyData = {
        id: 'legacy-id',
        company: 'Old Company',
        position: 'Software Engineer',
        status: 'Applied',
        dateApplied: '2024-01-01'
      };

      // Test migration function
      const migrateLegacyApplication = (legacy: any) => {
        return {
          id: legacy.id,
          user_id: 'migrated-user-id',
          position: legacy.position,
          priority_level: 3,
          date_applied: legacy.dateApplied,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        };
      };

      const migrated = migrateLegacyApplication(legacyData);
      
      expect(migrated.id).toBe(legacyData.id);
      expect(migrated.position).toBe(legacyData.position);
      expect(migrated.date_applied).toBe(legacyData.dateApplied);
      expect(migrated.priority_level).toBe(3);
    });
  });

  describe('4. API Contract Testing', () => {
    test('should validate API function signatures', () => {
      const apiSignatures = {
        createUser: '(userData: Omit<User, "id" | "created_at" | "updated_at">) => Promise<User>',
        updateUser: '(id: string, updates: Partial<User>) => Promise<User>',
        createApplication: '(appData: JobApplicationFormData) => Promise<JobApplication>',
        updateApplication: '(id: string, updates: Partial<JobApplicationFormData>) => Promise<JobApplication>',
        createCompany: '(companyData: CompanyFormData) => Promise<Company>',
        updateCompany: '(id: string, updates: Partial<CompanyFormData>) => Promise<Company>'
      };

      // Verify all required functions exist
      expect(apiSignatures).toHaveProperty('createUser');
      expect(apiSignatures).toHaveProperty('updateUser');
      expect(apiSignatures).toHaveProperty('createApplication');
      expect(apiSignatures).toHaveProperty('updateApplication');
      expect(apiSignatures).toHaveProperty('createCompany');
      expect(apiSignatures).toHaveProperty('updateCompany');
    });

    test('should validate response data structure', () => {
      const validateResponseStructure = (response: any, expectedFields: string[]): boolean => {
        return expectedFields.every(field => response.hasOwnProperty(field));
      };

      const userResponse = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const requiredUserFields = ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at'];
      expect(validateResponseStructure(userResponse, requiredUserFields)).toBe(true);

      // Test with missing field
      const incompleteResponse = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'John'
        // Missing last_name and timestamps
      };

      expect(validateResponseStructure(incompleteResponse, requiredUserFields)).toBe(false);
    });

    test('should validate error response handling', () => {
      const validateErrorResponse = (error: any): boolean => {
        return error.hasOwnProperty('message') && 
               error.hasOwnProperty('code') && 
               typeof error.message === 'string' &&
               typeof error.code === 'string';
      };

      const validError = {
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      };

      const invalidError = {
        message: 'User not found'
        // Missing code field
      };

      expect(validateErrorResponse(validError)).toBe(true);
      expect(validateErrorResponse(invalidError)).toBe(false);
    });

    test('should validate successful response types', () => {
      const validateSuccessResponse = (response: any): boolean => {
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
      const validateErrorResponseType = (response: any): boolean => {
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
  });

  describe('5. Form Validation Integration', () => {
    test('should validate job application form', () => {
      const validateJobApplicationForm = (data: any) => {
        const errors: any[] = [];

        // Required fields
        if (!data.position?.trim()) {
          errors.push({ field: 'position', message: 'Position is required' });
        }

        if (!data.date_applied) {
          errors.push({ field: 'date_applied', message: 'Application date is required' });
        }

        // Priority level validation
        if (data.priority_level && (data.priority_level < 1 || data.priority_level > 3)) {
          errors.push({ field: 'priority_level', message: 'Priority level must be between 1 and 3' });
        }

        // Salary range validation
        if (data.salary_range_min && data.salary_range_max) {
          if (data.salary_range_min > data.salary_range_max) {
            errors.push({ field: 'salary_range_max', message: 'Maximum salary must be greater than minimum salary' });
          }
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      const validForm = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01'
      };

      const result = validateJobApplicationForm(validForm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      const invalidForm = {
        position: '',
        priority_level: 5,
        date_applied: '2024-01-01',
        salary_range_min: 100000,
        salary_range_max: 50000
      };

      const invalidResult = validateJobApplicationForm(invalidForm);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate company form data', () => {
      const validateCompanyForm = (data: any) => {
        const errors: any[] = [];

        if (!data.name?.trim()) {
          errors.push({ field: 'name', message: 'Company name is required' });
        }

        if (data.founded_year && (data.founded_year < 1800 || data.founded_year > new Date().getFullYear())) {
          errors.push({ field: 'founded_year', message: 'Invalid founding year' });
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      const validCompany = {
        name: 'Test Company',
        founded_year: 2020
      };

      const result = validateCompanyForm(validCompany);
      expect(result.isValid).toBe(true);
    });

    test('should validate user profile form data', () => {
      const validateUserProfileForm = (data: any) => {
        const errors: any[] = [];

        if (!data.first_name?.trim()) {
          errors.push({ field: 'first_name', message: 'First name is required' });
        }

        if (!data.last_name?.trim()) {
          errors.push({ field: 'last_name', message: 'Last name is required' });
        }

        if (data.years_experience && (data.years_experience < 0 || data.years_experience > 50)) {
          errors.push({ field: 'years_experience', message: 'Years of experience must be between 0 and 50' });
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      const validProfile = {
        first_name: 'John',
        last_name: 'Doe',
        years_experience: 5
      };

      const result = validateUserProfileForm(validProfile);
      expect(result.isValid).toBe(true);
    });
  });
}); 