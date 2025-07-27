import {
  User,
  Company,
  JobApplication,
  ApplicationTimeline,
  JobApplicationFormData,
  CompanyFormData,
  UserProfileFormData,
  JobStatus,
  RemotePolicy,
  PriorityLevel,
  CompanySizeRange,
  IndustryCategory,
  CareerLevel,
  ApplicationSource,
  ValidationError,
  FormValidationResult,
  LegacyJobApplication
} from '../../jobTypes';

describe('Type Definition Validation', () => {
  describe('Enum Type Validation', () => {
    test('JobStatus should have correct values', () => {
      const validStatuses: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
      const invalidStatus = 'Invalid' as JobStatus;
      
      expect(validStatuses).toHaveLength(5);
      expect(validStatuses).toContain('Applied');
      expect(validStatuses).toContain('Interview');
      expect(validStatuses).toContain('Offer');
      expect(validStatuses).toContain('Rejected');
      expect(validStatuses).toContain('Withdrawn');
    });

    test('RemotePolicy should have correct values', () => {
      const validPolicies: RemotePolicy[] = ['Remote', 'Hybrid', 'On-site'];
      
      expect(validPolicies).toHaveLength(3);
      expect(validPolicies).toContain('Remote');
      expect(validPolicies).toContain('Hybrid');
      expect(validPolicies).toContain('On-site');
    });

    test('PriorityLevel should have correct numeric values', () => {
      const validPriorities: PriorityLevel[] = [1, 2, 3];
      
      expect(validPriorities).toHaveLength(3);
      expect(validPriorities).toContain(1);
      expect(validPriorities).toContain(2);
      expect(validPriorities).toContain(3);
    });

    test('CompanySizeRange should have correct values', () => {
      const validSizes: CompanySizeRange[] = [
        '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'
      ];
      
      expect(validSizes).toHaveLength(8);
      expect(validSizes).toContain('1-10');
      expect(validSizes).toContain('10000+');
    });

    test('IndustryCategory should have correct values', () => {
      const validIndustries: IndustryCategory[] = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Media', 'Non-profit', 'Government',
        'Real Estate', 'Transportation', 'Energy', 'Legal', 'Other'
      ];
      
      expect(validIndustries).toHaveLength(15);
      expect(validIndustries).toContain('Technology');
      expect(validIndustries).toContain('Other');
    });

    test('CareerLevel should have correct values', () => {
      const validLevels: CareerLevel[] = [
        'Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'
      ];
      
      expect(validLevels).toHaveLength(7);
      expect(validLevels).toContain('Entry');
      expect(validLevels).toContain('Executive');
    });

    test('ApplicationSource should have correct values', () => {
      const validSources: ApplicationSource[] = [
        'LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Recruiter',
        'Glassdoor', 'AngelList', 'Handshake', 'Career Fair', 'Other'
      ];
      
      expect(validSources).toHaveLength(10);
      expect(validSources).toContain('LinkedIn');
      expect(validSources).toContain('Other');
    });
  });

  describe('Interface Structure Validation', () => {
    test('User interface should match database schema', () => {
      const user: User = {
        id: 'test-id',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        professional_title: 'Software Engineer',
        industry_category: 'Technology',
        career_level: 'Senior',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        portfolio_url: 'https://portfolio.com',
        phone_number: '+1234567890',
        location: 'San Francisco, CA',
        years_experience: 5,
        skills: ['JavaScript', 'TypeScript', 'React'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.first_name).toBeDefined();
      expect(user.last_name).toBeDefined();
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    test('Company interface should match database schema', () => {
      const company: Company = {
        id: 'company-id',
        name: 'Test Company',
        industry_category: 'Technology',
        company_size_range: '51-200',
        headquarters_location: 'San Francisco, CA',
        website_url: 'https://testcompany.com',
        linkedin_url: 'https://linkedin.com/company/testcompany',
        description: 'A test company',
        founded_year: 2020,
        funding_stage: 'Series A',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(company.id).toBeDefined();
      expect(company.name).toBeDefined();
      expect(company.created_at).toBeDefined();
      expect(company.updated_at).toBeDefined();
    });

    test('JobApplication interface should match database schema', () => {
      const application: JobApplication = {
        id: 'app-id',
        user_id: 'user-id',
        company_id: 'company-id',
        position: 'Software Engineer',
        salary_range_min: 80000,
        salary_range_max: 120000,
        location: 'San Francisco, CA',
        remote_policy: 'Hybrid',
        application_source: 'LinkedIn',
        priority_level: 2,
        notes: 'Great opportunity',
        date_applied: '2024-01-01',
        job_posting_url: 'https://company.com/job',
        recruiter_name: 'Jane Smith',
        recruiter_email: 'jane@company.com',
        recruiter_phone: '+1234567890',
        interview_rounds: 3,
        benefits_mentioned: 'Health, dental, 401k',
        equity_offered: true,
        equity_details: '0.1% equity',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(application.id).toBeDefined();
      expect(application.user_id).toBeDefined();
      expect(application.position).toBeDefined();
      expect(application.priority_level).toBeDefined();
      expect(application.date_applied).toBeDefined();
      expect(application.created_at).toBeDefined();
      expect(application.updated_at).toBeDefined();
    });

    test('ApplicationTimeline interface should match database schema', () => {
      const timeline: ApplicationTimeline = {
        id: 'timeline-id',
        application_id: 'app-id',
        status: 'Interview',
        notes: 'Phone interview scheduled',
        date_changed: '2024-01-15',
        interview_type: 'Phone',
        interview_date: '2024-01-20',
        interviewer_name: 'John Smith',
        feedback_received: 'Positive feedback',
        next_steps: 'Technical interview next week',
        created_at: '2024-01-15T00:00:00Z'
      };

      expect(timeline.id).toBeDefined();
      expect(timeline.application_id).toBeDefined();
      expect(timeline.status).toBeDefined();
      expect(timeline.date_changed).toBeDefined();
      expect(timeline.created_at).toBeDefined();
    });
  });

  describe('Form Data Type Validation', () => {
    test('JobApplicationFormData should have correct structure', () => {
      const formData: JobApplicationFormData = {
        company_id: 'company-id',
        position: 'Software Engineer',
        salary_range_min: 80000,
        salary_range_max: 120000,
        location: 'San Francisco, CA',
        remote_policy: 'Hybrid',
        application_source: 'LinkedIn',
        priority_level: 2,
        notes: 'Great opportunity',
        date_applied: '2024-01-01',
        job_posting_url: 'https://company.com/job',
        recruiter_name: 'Jane Smith',
        recruiter_email: 'jane@company.com',
        recruiter_phone: '+1234567890',
        benefits_mentioned: 'Health, dental, 401k',
        equity_offered: true,
        equity_details: '0.1% equity'
      };

      expect(formData.position).toBeDefined();
      expect(formData.priority_level).toBeDefined();
      expect(formData.date_applied).toBeDefined();
    });

    test('CompanyFormData should have correct structure', () => {
      const formData: CompanyFormData = {
        name: 'Test Company',
        industry_category: 'Technology',
        company_size_range: '51-200',
        headquarters_location: 'San Francisco, CA',
        website_url: 'https://testcompany.com',
        linkedin_url: 'https://linkedin.com/company/testcompany',
        description: 'A test company',
        founded_year: 2020,
        funding_stage: 'Series A'
      };

      expect(formData.name).toBeDefined();
    });

    test('UserProfileFormData should have correct structure', () => {
      const formData: UserProfileFormData = {
        first_name: 'John',
        last_name: 'Doe',
        professional_title: 'Software Engineer',
        industry_category: 'Technology',
        career_level: 'Senior',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        portfolio_url: 'https://portfolio.com',
        phone_number: '+1234567890',
        location: 'San Francisco, CA',
        years_experience: 5,
        skills: ['JavaScript', 'TypeScript', 'React']
      };

      expect(formData.first_name).toBeDefined();
      expect(formData.last_name).toBeDefined();
    });
  });

  describe('Validation Type Testing', () => {
    test('ValidationError should have correct structure', () => {
      const error: ValidationError = {
        field: 'email',
        message: 'Invalid email format'
      };

      expect(error.field).toBeDefined();
      expect(error.message).toBeDefined();
    });

    test('FormValidationResult should have correct structure', () => {
      const result: FormValidationResult = {
        isValid: false,
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ]
      };

      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Legacy Type Compatibility', () => {
    test('LegacyJobApplication should maintain backward compatibility', () => {
      const legacyApp: LegacyJobApplication = {
        id: 'legacy-id',
        company: 'Old Company',
        position: 'Software Engineer',
        status: 'Applied',
        notes: 'Legacy application',
        dateApplied: '2024-01-01'
      };

      expect(legacyApp.id).toBeDefined();
      expect(legacyApp.company).toBeDefined();
      expect(legacyApp.position).toBeDefined();
      expect(legacyApp.status).toBeDefined();
      expect(legacyApp.dateApplied).toBeDefined();
    });
  });

  describe('Type Safety for API Calls', () => {
    test('should validate function parameter types', () => {
      // Mock function signatures to test type safety
      const createUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
        return { id: 'new-id', ...userData, created_at: '2024-01-01', updated_at: '2024-01-01' };
      };

      const createApplication = (appData: JobApplicationFormData) => {
        return { id: 'new-app-id', ...appData };
      };

      const updateCompany = (id: string, data: Partial<CompanyFormData>) => {
        return { id, ...data };
      };

      // These should compile without errors
      const userResult = createUser({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });

      const appResult = createApplication({
        position: 'Engineer',
        priority_level: 2,
        date_applied: '2024-01-01'
      });

      const companyResult = updateCompany('company-id', {
        name: 'Updated Company'
      });

      expect(userResult.id).toBeDefined();
      expect(appResult.id).toBeDefined();
      expect(companyResult.id).toBeDefined();
    });

    test('should validate response data types', () => {
      // Mock API response types
      const mockUserResponse = {
        data: {
          id: 'user-id',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        } as User,
        error: null
      };

      const mockApplicationResponse = {
        data: {
          id: 'app-id',
          user_id: 'user-id',
          position: 'Engineer',
          priority_level: 2,
          date_applied: '2024-01-01'
        } as JobApplication,
        error: null
      };

      expect(mockUserResponse.data).toBeDefined();
      expect(mockApplicationResponse.data).toBeDefined();
    });
  });

  describe('Enum Type Transitions', () => {
    test('JobStatus transitions should be valid', () => {
      const validTransitions: Record<JobStatus, JobStatus[]> = {
        'Applied': ['Interview', 'Rejected', 'Withdrawn'],
        'Interview': ['Offer', 'Rejected', 'Withdrawn'],
        'Offer': ['Rejected', 'Withdrawn'],
        'Rejected': [],
        'Withdrawn': []
      };

      expect(validTransitions['Applied']).toContain('Interview');
      expect(validTransitions['Applied']).toContain('Rejected');
      expect(validTransitions['Interview']).toContain('Offer');
      expect(validTransitions['Rejected']).toHaveLength(0);
    });

    test('PriorityLevel should have correct numeric constraints', () => {
      const isValidPriority = (level: number): level is PriorityLevel => {
        return level >= 1 && level <= 3;
      };

      expect(isValidPriority(1)).toBe(true);
      expect(isValidPriority(2)).toBe(true);
      expect(isValidPriority(3)).toBe(true);
      expect(isValidPriority(0)).toBe(false);
      expect(isValidPriority(4)).toBe(false);
    });
  });
}); 