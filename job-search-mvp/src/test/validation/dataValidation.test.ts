import {
  JobApplicationFormData,
  CompanyFormData,
  UserProfileFormData,
  ValidationError,
  FormValidationResult,
  JobStatus,
  RemotePolicy,
  PriorityLevel,
  CompanySizeRange,
  IndustryCategory,
  CareerLevel,
  ApplicationSource
} from '../../jobTypes';

describe('Data Validation Testing', () => {
  describe('Email Format Validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    test('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
        'user-name@domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com',
        'user@.domain.com',
        'user@domain..com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should validate recruiter email in application form', () => {
      const applicationData: JobApplicationFormData = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01',
        recruiter_email: 'recruiter@company.com'
      };

      if (applicationData.recruiter_email) {
        expect(validateEmail(applicationData.recruiter_email)).toBe(true);
      }
    });
  });

  describe('Date Range Validation', () => {
    const validateDateRange = (startDate: string, endDate: string): boolean => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return start <= end;
    };

    const validateDateInPast = (date: string): boolean => {
      const inputDate = new Date(date);
      const today = new Date();
      return inputDate <= today;
    };

    test('should validate date ranges', () => {
      expect(validateDateRange('2024-01-01', '2024-01-15')).toBe(true);
      expect(validateDateRange('2024-01-15', '2024-01-01')).toBe(false);
      expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(true);
    });

    test('should validate application dates are in the past', () => {
      const pastDates = [
        '2024-01-01',
        '2023-12-31',
        '2023-06-15'
      ];

      const futureDates = [
        '2025-01-01',
        '2024-12-31',
        '2024-06-15'
      ];

      pastDates.forEach(date => {
        expect(validateDateInPast(date)).toBe(true);
      });

      futureDates.forEach(date => {
        expect(validateDateInPast(date)).toBe(false);
      });
    });

    test('should validate interview dates are in the future', () => {
      const validateInterviewDate = (date: string): boolean => {
        const interviewDate = new Date(date);
        const today = new Date();
        return interviewDate > today;
      };

      const futureDates = [
        '2024-12-31',
        '2025-01-01',
        '2024-06-15'
      ];

      const pastDates = [
        '2024-01-01',
        '2023-12-31',
        '2023-06-15'
      ];

      futureDates.forEach(date => {
        expect(validateInterviewDate(date)).toBe(true);
      });

      pastDates.forEach(date => {
        expect(validateInterviewDate(date)).toBe(false);
      });
    });

    test('should handle edge cases for date validation', () => {
      // Test with invalid date strings
      expect(() => validateDateRange('invalid-date', '2024-01-01')).toThrow();
      expect(() => validateDateRange('2024-01-01', 'invalid-date')).toThrow();
    });
  });

  describe('Salary Range Validation', () => {
    const validateSalaryRange = (min: number, max: number): boolean => {
      return min >= 0 && max >= 0 && min <= max;
    };

    const validateSalaryAmount = (amount: number): boolean => {
      return amount >= 0 && amount <= 1000000; // Reasonable upper limit
    };

    test('should validate salary ranges', () => {
      expect(validateSalaryRange(50000, 100000)).toBe(true);
      expect(validateSalaryRange(100000, 50000)).toBe(false);
      expect(validateSalaryRange(50000, 50000)).toBe(true);
      expect(validateSalaryRange(-1000, 50000)).toBe(false);
      expect(validateSalaryRange(50000, -1000)).toBe(false);
    });

    test('should validate individual salary amounts', () => {
      expect(validateSalaryAmount(50000)).toBe(true);
      expect(validateSalaryAmount(0)).toBe(true);
      expect(validateSalaryAmount(1000000)).toBe(true);
      expect(validateSalaryAmount(-1000)).toBe(false);
      expect(validateSalaryAmount(2000000)).toBe(false);
    });

    test('should validate salary data in application form', () => {
      const applicationData: JobApplicationFormData = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01',
        salary_range_min: 80000,
        salary_range_max: 120000
      };

      if (applicationData.salary_range_min && applicationData.salary_range_max) {
        expect(validateSalaryRange(
          applicationData.salary_range_min,
          applicationData.salary_range_max
        )).toBe(true);
      }
    });
  });

  describe('Form Input Validation', () => {
    const validateRequiredField = (value: string): boolean => {
      return value.trim().length > 0;
    };

    const validateFieldLength = (value: string, maxLength: number): boolean => {
      return value.length <= maxLength;
    };

    test('should validate required fields', () => {
      expect(validateRequiredField('valid field')).toBe(true);
      expect(validateRequiredField('')).toBe(false);
      expect(validateRequiredField('   ')).toBe(false);
      expect(validateRequiredField('  valid  ')).toBe(true);
    });

    test('should validate field lengths', () => {
      expect(validateFieldLength('short', 10)).toBe(true);
      expect(validateFieldLength('very long field name', 10)).toBe(false);
      expect(validateFieldLength('', 10)).toBe(true);
    });

    test('should validate position field in application form', () => {
      const applicationData: JobApplicationFormData = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01'
      };

      expect(validateRequiredField(applicationData.position)).toBe(true);
      expect(validateFieldLength(applicationData.position, 255)).toBe(true);
    });

    test('should validate company name field', () => {
      const companyData: CompanyFormData = {
        name: 'Test Company Inc.'
      };

      expect(validateRequiredField(companyData.name)).toBe(true);
      expect(validateFieldLength(companyData.name, 255)).toBe(true);
    });

    test('should validate user name fields', () => {
      const userData: UserProfileFormData = {
        first_name: 'John',
        last_name: 'Doe'
      };

      expect(validateRequiredField(userData.first_name)).toBe(true);
      expect(validateRequiredField(userData.last_name)).toBe(true);
      expect(validateFieldLength(userData.first_name, 100)).toBe(true);
      expect(validateFieldLength(userData.last_name, 100)).toBe(true);
    });
  });

  describe('Business Rule Validation', () => {
    test('should validate priority level constraints', () => {
      const isValidPriority = (level: number): level is PriorityLevel => {
        return level >= 1 && level <= 3;
      };

      expect(isValidPriority(1)).toBe(true);
      expect(isValidPriority(2)).toBe(true);
      expect(isValidPriority(3)).toBe(true);
      expect(isValidPriority(0)).toBe(false);
      expect(isValidPriority(4)).toBe(false);
    });

    test('should validate years of experience', () => {
      const validateYearsExperience = (years: number): boolean => {
        return years >= 0 && years <= 50;
      };

      expect(validateYearsExperience(0)).toBe(true);
      expect(validateYearsExperience(25)).toBe(true);
      expect(validateYearsExperience(50)).toBe(true);
      expect(validateYearsExperience(-1)).toBe(false);
      expect(validateYearsExperience(51)).toBe(false);
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
      expect(validateURL('https://portfolio.com')).toBe(true);
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('ftp://example.com')).toBe(true);
    });

    test('should validate enum values', () => {
      const validateEnum = <T extends string>(value: string, validValues: T[]): value is T => {
        return validValues.includes(value as T);
      };

      // Test JobStatus
      expect(validateEnum('Applied', ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'])).toBe(true);
      expect(validateEnum('Invalid', ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'])).toBe(false);

      // Test RemotePolicy
      expect(validateEnum('Remote', ['Remote', 'Hybrid', 'On-site'])).toBe(true);
      expect(validateEnum('Invalid', ['Remote', 'Hybrid', 'On-site'])).toBe(false);

      // Test IndustryCategory
      expect(validateEnum('Technology', ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'])).toBe(true);
      expect(validateEnum('Invalid', ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'])).toBe(false);
    });
  });

  describe('Form Validation Integration', () => {
    const validateJobApplicationForm = (data: JobApplicationFormData): FormValidationResult => {
      const errors: ValidationError[] = [];

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

      // Email validation
      if (data.recruiter_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.recruiter_email)) {
          errors.push({ field: 'recruiter_email', message: 'Invalid email format' });
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    };

    test('should validate complete job application form', () => {
      const validForm: JobApplicationFormData = {
        position: 'Software Engineer',
        priority_level: 2,
        date_applied: '2024-01-01',
        recruiter_email: 'recruiter@company.com'
      };

      const result = validateJobApplicationForm(validForm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should catch validation errors in job application form', () => {
      const invalidForm: JobApplicationFormData = {
        position: '',
        priority_level: 5 as PriorityLevel,
        date_applied: '2024-01-01',
        recruiter_email: 'invalid-email',
        salary_range_min: 100000,
        salary_range_max: 50000
      };

      const result = validateJobApplicationForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'position')).toBe(true);
      expect(result.errors.some(e => e.field === 'priority_level')).toBe(true);
      expect(result.errors.some(e => e.field === 'recruiter_email')).toBe(true);
      expect(result.errors.some(e => e.field === 'salary_range_max')).toBe(true);
    });

    test('should validate company form data', () => {
      const validateCompanyForm = (data: CompanyFormData): FormValidationResult => {
        const errors: ValidationError[] = [];

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

      const validCompany: CompanyFormData = {
        name: 'Test Company',
        founded_year: 2020
      };

      const result = validateCompanyForm(validCompany);
      expect(result.isValid).toBe(true);
    });

    test('should validate user profile form data', () => {
      const validateUserProfileForm = (data: UserProfileFormData): FormValidationResult => {
        const errors: ValidationError[] = [];

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

      const validProfile: UserProfileFormData = {
        first_name: 'John',
        last_name: 'Doe',
        years_experience: 5
      };

      const result = validateUserProfileForm(validProfile);
      expect(result.isValid).toBe(true);
    });
  });
}); 