import { createMockApplication } from '../utils/testHelpers';

// Mock business rule validation functions
const validateStatusTransition = (
  currentStatus: string, 
  newStatus: string, 
  application: any
): { isValid: boolean; reason?: string } => {
  const validTransitions: { [key: string]: string[] } = {
    'draft': ['applied', 'draft'],
    'applied': ['interview_scheduled', 'response_received', 'rejected', 'withdrawn'],
    'interview_scheduled': ['interview_completed', 'interview_cancelled', 'rejected'],
    'interview_completed': ['follow_up', 'offer_received', 'rejected'],
    'follow_up': ['interview_scheduled', 'offer_received', 'rejected'],
    'offer_received': ['accepted', 'rejected', 'negotiating'],
    'negotiating': ['accepted', 'rejected'],
    'accepted': ['hired', 'rejected'],
    'hired': ['hired'], // Terminal state
    'rejected': ['rejected'], // Terminal state
    'withdrawn': ['withdrawn'] // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      isValid: false,
      reason: `Invalid transition from ${currentStatus} to ${newStatus}`
    };
  }

  // Additional business rules
  if (newStatus === 'hired' && !application.offer_details) {
    return {
      isValid: false,
      reason: 'Offer details required for hired status'
    };
  }

  if (newStatus === 'interview_scheduled' && !application.interview_details) {
    return {
      isValid: false,
      reason: 'Interview details required for interview_scheduled status'
    };
  }

  return { isValid: true };
};

const shouldCreateTimelineEntry = (
  action: string, 
  application: any, 
  previousStatus?: string
): boolean => {
  const timelineActions = [
    'application_submitted',
    'interview_scheduled',
    'interview_completed',
    'response_received',
    'follow_up',
    'offer_received',
    'offer_accepted',
    'offer_rejected',
    'application_rejected',
    'application_withdrawn'
  ];

  if (!timelineActions.includes(action)) {
    return false;
  }

  // Don't create duplicate entries for the same action
  const existingEntry = application.timeline?.find((entry: any) => entry.action === action);
  if (existingEntry) {
    return false;
  }

  // Status-specific rules
  if (action === 'application_submitted' && application.status !== 'draft') {
    return true;
  }

  if (action === 'interview_scheduled' && application.status === 'interview_scheduled') {
    return true;
  }

  if (action === 'offer_received' && application.status === 'offer_received') {
    return true;
  }

  if (action === 'application_rejected' && application.status === 'rejected') {
    return true;
  }

  return false;
};

const detectDuplicateApplications = (
  newApplication: any, 
  existingApplications: any[]
): { isDuplicate: boolean; confidence: number; reason?: string } => {
  const duplicates = existingApplications.filter(existing => {
    // Exact match on company and job title
    if (existing.company_id === newApplication.company_id && 
        existing.job_title === newApplication.job_title) {
      return true;
    }

    // Similar job titles (fuzzy matching)
    const titleSimilarity = calculateStringSimilarity(
      existing.job_title || '', 
      newApplication.job_title || ''
    );
    
    if (titleSimilarity > 0.8 && existing.company_id === newApplication.company_id) {
      return true;
    }

    // Same company within 30 days
    if (existing.company_id === newApplication.company_id) {
      const existingDate = new Date(existing.created_at);
      const newDate = new Date(newApplication.created_at);
      const daysDiff = Math.abs(newDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 30) {
        return true;
      }
    }

    return false;
  });

  if (duplicates.length === 0) {
    return { isDuplicate: false, confidence: 0 };
  }

  const exactMatches = duplicates.filter(d => 
    d.company_id === newApplication.company_id && 
    d.job_title === newApplication.job_title
  );

  if (exactMatches.length > 0) {
    return { 
      isDuplicate: true, 
      confidence: 1.0, 
      reason: 'Exact match on company and job title' 
    };
  }

  const highConfidenceMatches = duplicates.filter(d => {
    const titleSimilarity = calculateStringSimilarity(
      d.job_title || '', 
      newApplication.job_title || ''
    );
    return titleSimilarity > 0.8 && d.company_id === newApplication.company_id;
  });

  if (highConfidenceMatches.length > 0) {
    return { 
      isDuplicate: true, 
      confidence: 0.9, 
      reason: 'High similarity match on company and job title' 
    };
  }

  return { 
    isDuplicate: true, 
    confidence: 0.7, 
    reason: 'Recent application to same company' 
  };
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const calculateDataCompletenessScore = (application: any): number => {
  const requiredFields = [
    'job_title',
    'company_id',
    'status',
    'created_at'
  ];

  const optionalFields = [
    'salary_range',
    'location',
    'job_description',
    'application_url',
    'notes',
    'contact_person',
    'contact_email',
    'interview_details',
    'offer_details'
  ];

  let score = 0;
  let totalFields = requiredFields.length + optionalFields.length;

  // Check required fields (weighted more heavily)
  requiredFields.forEach(field => {
    if (application[field] && application[field].toString().trim() !== '') {
      score += 2; // Required fields count double
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (application[field] && application[field].toString().trim() !== '') {
      score += 1;
    }
  });

  // Additional scoring for timeline entries
  if (application.timeline && application.timeline.length > 0) {
    score += Math.min(application.timeline.length * 0.5, 5); // Max 5 points for timeline
  }

  // Bonus for complete contact information
  if (application.contact_person && application.contact_email) {
    score += 2;
  }

  // Bonus for detailed information
  if (application.job_description && application.job_description.length > 100) {
    score += 1;
  }

  if (application.notes && application.notes.length > 50) {
    score += 1;
  }

  const maxScore = requiredFields.length * 2 + optionalFields.length + 9; // Including bonuses
  return Math.round((score / maxScore) * 100);
};

describe('Business Rule Validation Tests', () => {
  describe('Application Status Transition Rules', () => {
    test('should allow valid status transitions', () => {
      const application = createMockApplication({ status: 'applied' });
      
      const result = validateStatusTransition('applied', 'interview_scheduled', application);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid status transitions', () => {
      const application = createMockApplication({ status: 'applied' });
      
      const result = validateStatusTransition('applied', 'hired', application);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    test('should require offer details for hired status', () => {
      const application = createMockApplication({ 
        status: 'accepted',
        offer_details: null
      });
      
      const result = validateStatusTransition('accepted', 'hired', application);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Offer details required');
    });

    test('should allow hired status with offer details', () => {
      const application = createMockApplication({ 
        status: 'accepted',
        offer_details: { salary: '100k', benefits: 'Health insurance' }
      });
      
      const result = validateStatusTransition('accepted', 'hired', application);
      expect(result.isValid).toBe(true);
    });

    test('should require interview details for interview_scheduled status', () => {
      const application = createMockApplication({ 
        status: 'applied',
        interview_details: null
      });
      
      const result = validateStatusTransition('applied', 'interview_scheduled', application);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Interview details required');
    });

    test('should allow same status transition', () => {
      const application = createMockApplication({ status: 'applied' });
      
      const result = validateStatusTransition('applied', 'applied', application);
      expect(result.isValid).toBe(true);
    });

    test('should handle terminal states correctly', () => {
      const application = createMockApplication({ status: 'hired' });
      
      // Should not allow transitions from terminal states
      const result = validateStatusTransition('hired', 'applied', application);
      expect(result.isValid).toBe(false);
    });

    test('should handle unknown current status', () => {
      const application = createMockApplication({ status: 'unknown' });
      
      const result = validateStatusTransition('unknown', 'applied', application);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Timeline Entry Creation Triggers', () => {
    test('should create timeline entry for application submission', () => {
      const application = createMockApplication({ 
        status: 'applied',
        timeline: []
      });
      
      const shouldCreate = shouldCreateTimelineEntry('application_submitted', application);
      expect(shouldCreate).toBe(true);
    });

    test('should not create duplicate timeline entries', () => {
      const application = createMockApplication({
        status: 'interview_scheduled',
        timeline: [
          { action: 'interview_scheduled', created_at: '2024-01-15T00:00:00Z' }
        ]
      });
      
      const shouldCreate = shouldCreateTimelineEntry('interview_scheduled', application);
      expect(shouldCreate).toBe(false);
    });

    test('should create timeline entry for status change', () => {
      const application = createMockApplication({
        status: 'interview_scheduled',
        timeline: []
      });
      
      const shouldCreate = shouldCreateTimelineEntry('interview_scheduled', application);
      expect(shouldCreate).toBe(true);
    });

    test('should not create entry for invalid action', () => {
      const application = createMockApplication({ status: 'applied' });
      
      const shouldCreate = shouldCreateTimelineEntry('invalid_action', application);
      expect(shouldCreate).toBe(false);
    });

    test('should create offer received entry', () => {
      const application = createMockApplication({
        status: 'offer_received',
        timeline: []
      });
      
      const shouldCreate = shouldCreateTimelineEntry('offer_received', application);
      expect(shouldCreate).toBe(true);
    });

    test('should create rejection entry', () => {
      const application = createMockApplication({
        status: 'rejected',
        timeline: []
      });
      
      const shouldCreate = shouldCreateTimelineEntry('application_rejected', application);
      expect(shouldCreate).toBe(true);
    });
  });

  describe('Duplicate Detection Algorithms', () => {
    test('should detect exact duplicates', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Software Engineer',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toContain('Exact match');
    });

    test('should detect similar job titles', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Senior Software Engineer',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer Senior',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should detect recent applications to same company', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Product Manager',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer',
        created_at: '2024-01-20T00:00:00Z' // 5 days later
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBe(0.7);
      expect(result.reason).toContain('Recent application');
    });

    test('should not detect duplicates for different companies', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Software Engineer',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '2',
        job_title: 'Software Engineer',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should not detect duplicates for old applications', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Product Manager',
          created_at: '2023-01-15T00:00:00Z' // 1 year ago
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should handle empty existing applications', () => {
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer'
      });
      
      const result = detectDuplicateApplications(newApplication, []);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should handle applications with missing job titles', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: null
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Software Engineer'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBe(0.7); // Recent application to same company
    });
  });

  describe('Data Completeness Scoring', () => {
    test('should calculate perfect score for complete application', () => {
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        salary_range: '100k-150k',
        location: 'San Francisco, CA',
        job_description: 'We are looking for a talented software engineer...',
        application_url: 'https://example.com/apply',
        notes: 'Great opportunity with interesting challenges',
        contact_person: 'John Doe',
        contact_email: 'john@example.com',
        interview_details: { date: '2024-02-01', type: 'phone' },
        offer_details: { salary: '120k', benefits: 'Health insurance' },
        timeline: [
          { action: 'application_submitted', created_at: '2024-01-15T00:00:00Z' },
          { action: 'interview_scheduled', created_at: '2024-01-20T00:00:00Z' }
        ]
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeGreaterThan(90);
    });

    test('should calculate low score for minimal application', () => {
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z'
        // Missing all optional fields
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeLessThan(50);
    });

    test('should handle missing required fields', () => {
      const application = createMockApplication({
        job_title: '',
        company_id: null,
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z'
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeLessThan(30);
    });

    test('should award bonus for complete contact information', () => {
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        contact_person: 'John Doe',
        contact_email: 'john@example.com'
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeGreaterThan(60); // Higher than base score
    });

    test('should award bonus for detailed descriptions', () => {
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        job_description: 'This is a very detailed job description that exceeds 100 characters to test the bonus scoring system for comprehensive information.',
        notes: 'This is a detailed note that exceeds 50 characters to test the bonus scoring for comprehensive notes.'
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeGreaterThan(60); // Higher than base score
    });

    test('should award points for timeline entries', () => {
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        timeline: [
          { action: 'application_submitted', created_at: '2024-01-15T00:00:00Z' },
          { action: 'interview_scheduled', created_at: '2024-01-20T00:00:00Z' },
          { action: 'interview_completed', created_at: '2024-01-25T00:00:00Z' }
        ]
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeGreaterThan(50); // Higher than base score
    });

    test('should handle empty application', () => {
      const application = {};
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBe(0);
    });

    test('should handle application with only whitespace values', () => {
      const application = createMockApplication({
        job_title: '   ',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        notes: '   ',
        contact_person: '   '
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeLessThan(50); // Low score due to empty/whitespace fields
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very long job titles in duplicate detection', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'Senior Software Engineer with Machine Learning Experience and Cloud Computing Skills',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'Senior Software Engineer with ML Experience and Cloud Skills',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      expect(result.isDuplicate).toBe(true);
    });

    test('should handle special characters in job titles', () => {
      const existingApplications = [
        createMockApplication({
          company_id: '1',
          job_title: 'C++ Developer (Senior)',
          created_at: '2024-01-15T00:00:00Z'
        })
      ];
      
      const newApplication = createMockApplication({
        company_id: '1',
        job_title: 'C++ Developer Senior',
        created_at: '2024-01-20T00:00:00Z'
      });
      
      const result = detectDuplicateApplications(newApplication, existingApplications);
      expect(result.isDuplicate).toBe(true);
    });

    test('should handle applications with very long descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      const application = createMockApplication({
        job_title: 'Software Engineer',
        company_id: '1',
        status: 'applied',
        created_at: '2024-01-15T00:00:00Z',
        job_description: longDescription
      });
      
      const score = calculateDataCompletenessScore(application);
      expect(score).toBeGreaterThan(50); // Should still get bonus for long description
    });

    test('should handle status transitions with null values', () => {
      const application = createMockApplication({
        status: 'applied',
        offer_details: null,
        interview_details: null
      });
      
      const result = validateStatusTransition('applied', 'interview_scheduled', application);
      expect(result.isValid).toBe(false);
    });

    test('should handle timeline entries with invalid dates', () => {
      const application = createMockApplication({
        status: 'interview_scheduled',
        timeline: [
          { action: 'interview_scheduled', created_at: 'invalid-date' }
        ]
      });
      
      const shouldCreate = shouldCreateTimelineEntry('interview_scheduled', application);
      expect(shouldCreate).toBe(false); // Should not create duplicate
    });
  });
}); 