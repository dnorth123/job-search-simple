import { createMockApplication } from '../utils/testHelpers';

// Mock analytics calculation functions
const calculateSuccessRate = (applications: any[]) => {
  if (applications.length === 0) return 0;
  
  const successful = applications.filter(app => 
    ['accepted', 'offer_received', 'hired'].includes(app.status)
  ).length;
  
  return (successful / applications.length) * 100;
};

const calculateAverageResponseTime = (applications: any[]) => {
  const applicationsWithTimeline = applications.filter(app => 
    app.timeline && app.timeline.length > 0
  );
  
  if (applicationsWithTimeline.length === 0) return 0;
  
  const responseTimes = applicationsWithTimeline.map(app => {
    const firstResponse = app.timeline.find((entry: any) => 
      ['interview_scheduled', 'response_received', 'follow_up'].includes(entry.action)
    );
    
    if (!firstResponse) return null;
    
    const applicationDate = new Date(app.created_at);
    const responseDate = new Date(firstResponse.created_at);
    return (responseDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24); // days
  }).filter(time => time !== null);
  
  if (responseTimes.length === 0) return 0;
  
  return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
};

const calculateFunnelMetrics = (applications: any[]) => {
  const total = applications.length;
  const applied = applications.filter(app => app.status !== 'draft').length;
  const interviewed = applications.filter(app => 
    ['interview_scheduled', 'interview_completed', 'follow_up'].includes(app.status)
  ).length;
  const offered = applications.filter(app => 
    ['offer_received', 'accepted', 'hired'].includes(app.status)
  ).length;
  const hired = applications.filter(app => app.status === 'hired').length;
  
  return {
    total,
    applied,
    interviewed,
    offered,
    hired,
    appliedRate: total > 0 ? (applied / total) * 100 : 0,
    interviewRate: applied > 0 ? (interviewed / applied) * 100 : 0,
    offerRate: interviewed > 0 ? (offered / interviewed) * 100 : 0,
    hireRate: offered > 0 ? (hired / offered) * 100 : 0,
    overallSuccessRate: total > 0 ? (hired / total) * 100 : 0
  };
};

const calculateTrendAnalysis = (applications: any[], period: 'monthly' | 'quarterly' = 'monthly') => {
  const periods: { [key: string]: any[] } = {};
  
  applications.forEach(app => {
    const appDate = new Date(app.created_at);
    let periodKey: string;
    
    if (period === 'monthly') {
      periodKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const quarter = Math.floor(appDate.getMonth() / 3) + 1;
      periodKey = `${appDate.getFullYear()}-Q${quarter}`;
    }
    
    if (!periods[periodKey]) {
      periods[periodKey] = [];
    }
    periods[periodKey].push(app);
  });
  
  return Object.entries(periods).map(([period, apps]) => ({
    period,
    count: apps.length,
    successRate: calculateSuccessRate(apps),
    avgResponseTime: calculateAverageResponseTime(apps)
  })).sort((a, b) => a.period.localeCompare(b.period));
};

describe('Application Analytics Tests', () => {
  describe('Success Rate Calculations', () => {
    test('should calculate success rate with successful applications', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'interview_scheduled' }),
        createMockApplication({ status: 'accepted' }),
        createMockApplication({ status: 'hired' }),
        createMockApplication({ status: 'rejected' })
      ];
      
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(40); // 2 successful out of 5 total
    });

    test('should return 0 for empty applications array', () => {
      const successRate = calculateSuccessRate([]);
      expect(successRate).toBe(0);
    });

    test('should return 0 when no successful applications', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'rejected' }),
        createMockApplication({ status: 'withdrawn' })
      ];
      
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(0);
    });

    test('should return 100 when all applications are successful', () => {
      const applications = [
        createMockApplication({ status: 'accepted' }),
        createMockApplication({ status: 'hired' }),
        createMockApplication({ status: 'offer_received' })
      ];
      
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(100);
    });

    test('should handle edge case with single application', () => {
      const applications = [createMockApplication({ status: 'hired' })];
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(100);
    });

    test('should handle mixed status types', () => {
      const applications = [
        createMockApplication({ status: 'draft' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'interview_scheduled' }),
        createMockApplication({ status: 'interview_completed' }),
        createMockApplication({ status: 'follow_up' }),
        createMockApplication({ status: 'offer_received' }),
        createMockApplication({ status: 'accepted' }),
        createMockApplication({ status: 'hired' }),
        createMockApplication({ status: 'rejected' }),
        createMockApplication({ status: 'withdrawn' })
      ];
      
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(30); // 3 successful out of 10 total
    });
  });

  describe('Timeline Analysis and Response Time', () => {
    test('should calculate average response time correctly', () => {
      const baseDate = new Date('2024-01-01');
      const applications = [
        createMockApplication({
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'interview_scheduled',
              created_at: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days later
            }
          ]
        }),
        createMockApplication({
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'response_received',
              created_at: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days later
            }
          ]
        })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(5); // (7 + 3) / 2 = 5 days
    });

    test('should return 0 for applications without timeline', () => {
      const applications = [
        createMockApplication({ timeline: [] }),
        createMockApplication({ timeline: null })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(0);
    });

    test('should handle applications with no response timeline entries', () => {
      const applications = [
        createMockApplication({
          timeline: [
            { action: 'application_submitted', created_at: '2024-01-01T00:00:00Z' }
          ]
        })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(0);
    });

    test('should handle edge case with immediate response', () => {
      const baseDate = new Date('2024-01-01T12:00:00Z');
      const applications = [
        createMockApplication({
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'interview_scheduled',
              created_at: baseDate.toISOString() // Same time
            }
          ]
        })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(0); // 0 days difference
    });

    test('should handle very long response times', () => {
      const baseDate = new Date('2024-01-01');
      const applications = [
        createMockApplication({
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'interview_scheduled',
              created_at: new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year later
            }
          ]
        })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(365);
    });
  });

  describe('Application Funnel Metrics', () => {
    test('should calculate complete funnel metrics', () => {
      const applications = [
        createMockApplication({ status: 'draft' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'interview_scheduled' }),
        createMockApplication({ status: 'interview_completed' }),
        createMockApplication({ status: 'follow_up' }),
        createMockApplication({ status: 'offer_received' }),
        createMockApplication({ status: 'accepted' }),
        createMockApplication({ status: 'hired' }),
        createMockApplication({ status: 'rejected' }),
        createMockApplication({ status: 'withdrawn' })
      ];
      
      const metrics = calculateFunnelMetrics(applications);
      
      expect(metrics.total).toBe(10);
      expect(metrics.applied).toBe(9); // All except draft
      expect(metrics.interviewed).toBe(3); // interview_scheduled, interview_completed, follow_up
      expect(metrics.offered).toBe(3); // offer_received, accepted, hired
      expect(metrics.hired).toBe(1);
      expect(metrics.appliedRate).toBe(90); // 9/10 * 100
      expect(metrics.interviewRate).toBeCloseTo(33.33, 1); // 3/9 * 100
      expect(metrics.offerRate).toBe(100); // 3/3 * 100
      expect(metrics.hireRate).toBeCloseTo(33.33, 1); // 1/3 * 100
      expect(metrics.overallSuccessRate).toBe(10); // 1/10 * 100
    });

    test('should handle empty applications array', () => {
      const metrics = calculateFunnelMetrics([]);
      
      expect(metrics.total).toBe(0);
      expect(metrics.applied).toBe(0);
      expect(metrics.interviewed).toBe(0);
      expect(metrics.offered).toBe(0);
      expect(metrics.hired).toBe(0);
      expect(metrics.appliedRate).toBe(0);
      expect(metrics.interviewRate).toBe(0);
      expect(metrics.offerRate).toBe(0);
      expect(metrics.hireRate).toBe(0);
      expect(metrics.overallSuccessRate).toBe(0);
    });

    test('should handle zero division edge cases', () => {
      const applications = [
        createMockApplication({ status: 'draft' })
      ];
      
      const metrics = calculateFunnelMetrics(applications);
      
      expect(metrics.interviewRate).toBe(0); // 0 interviewed / 0 applied
      expect(metrics.offerRate).toBe(0); // 0 offered / 0 interviewed
      expect(metrics.hireRate).toBe(0); // 0 hired / 0 offered
    });

    test('should handle perfect funnel scenario', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'interview_scheduled' }),
        createMockApplication({ status: 'offer_received' }),
        createMockApplication({ status: 'hired' })
      ];
      
      const metrics = calculateFunnelMetrics(applications);
      
      expect(metrics.appliedRate).toBe(100); // 4/4
      expect(metrics.interviewRate).toBe(25); // 1/4
      expect(metrics.offerRate).toBe(100); // 1/1
      expect(metrics.hireRate).toBe(100); // 1/1
      expect(metrics.overallSuccessRate).toBe(25); // 1/4
    });
  });

  describe('Trend Analysis', () => {
    test('should calculate monthly trends correctly', () => {
      const applications = [
        createMockApplication({ 
          created_at: '2024-01-15T00:00:00Z',
          status: 'hired'
        }),
        createMockApplication({ 
          created_at: '2024-01-20T00:00:00Z',
          status: 'rejected'
        }),
        createMockApplication({ 
          created_at: '2024-02-10T00:00:00Z',
          status: 'hired'
        }),
        createMockApplication({ 
          created_at: '2024-02-15T00:00:00Z',
          status: 'applied'
        })
      ];
      
      const trends = calculateTrendAnalysis(applications, 'monthly');
      
      expect(trends).toHaveLength(2);
      expect(trends[0].period).toBe('2024-01');
      expect(trends[0].count).toBe(2);
      expect(trends[0].successRate).toBe(50); // 1 hired out of 2
      expect(trends[1].period).toBe('2024-02');
      expect(trends[1].count).toBe(2);
      expect(trends[1].successRate).toBe(50); // 1 hired out of 2
    });

    test('should calculate quarterly trends correctly', () => {
      const applications = [
        createMockApplication({ 
          created_at: '2024-01-15T00:00:00Z',
          status: 'hired'
        }),
        createMockApplication({ 
          created_at: '2024-02-20T00:00:00Z',
          status: 'rejected'
        }),
        createMockApplication({ 
          created_at: '2024-04-10T00:00:00Z',
          status: 'hired'
        })
      ];
      
      const trends = calculateTrendAnalysis(applications, 'quarterly');
      
      expect(trends).toHaveLength(2);
      expect(trends[0].period).toBe('2024-Q1');
      expect(trends[0].count).toBe(2);
      expect(trends[0].successRate).toBe(50);
      expect(trends[1].period).toBe('2024-Q2');
      expect(trends[1].count).toBe(1);
      expect(trends[1].successRate).toBe(100);
    });

    test('should handle empty applications for trend analysis', () => {
      const trends = calculateTrendAnalysis([], 'monthly');
      expect(trends).toHaveLength(0);
    });

    test('should handle single application trend', () => {
      const applications = [
        createMockApplication({ 
          created_at: '2024-01-15T00:00:00Z',
          status: 'hired'
        })
      ];
      
      const trends = calculateTrendAnalysis(applications, 'monthly');
      
      expect(trends).toHaveLength(1);
      expect(trends[0].period).toBe('2024-01');
      expect(trends[0].count).toBe(1);
      expect(trends[0].successRate).toBe(100);
    });

    test('should handle applications spanning multiple years', () => {
      const applications = [
        createMockApplication({ 
          created_at: '2023-12-15T00:00:00Z',
          status: 'hired'
        }),
        createMockApplication({ 
          created_at: '2024-01-20T00:00:00Z',
          status: 'rejected'
        }),
        createMockApplication({ 
          created_at: '2024-12-10T00:00:00Z',
          status: 'hired'
        })
      ];
      
      const trends = calculateTrendAnalysis(applications, 'monthly');
      
      expect(trends).toHaveLength(3);
      expect(trends[0].period).toBe('2023-12');
      expect(trends[1].period).toBe('2024-01');
      expect(trends[2].period).toBe('2024-12');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle applications with invalid dates', () => {
      const applications = [
        createMockApplication({ 
          created_at: 'invalid-date',
          status: 'applied'
        }),
        createMockApplication({ 
          created_at: '2024-01-15T00:00:00Z',
          status: 'hired'
        })
      ];
      
      // Should not throw error and should handle gracefully
      expect(() => calculateTrendAnalysis(applications, 'monthly')).not.toThrow();
    });

    test('should handle applications with malformed timeline data', () => {
      const applications = [
        createMockApplication({
          timeline: [
            { action: 'interview_scheduled', created_at: 'invalid-date' },
            { action: 'response_received', created_at: '2024-01-15T00:00:00Z' }
          ]
        })
      ];
      
      const avgResponseTime = calculateAverageResponseTime(applications);
      expect(avgResponseTime).toBe(0); // Should handle invalid date gracefully
    });

    test('should handle very large datasets', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          created_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
          status: i % 10 === 0 ? 'hired' : 'applied'
        })
      );
      
      const successRate = calculateSuccessRate(applications);
      expect(successRate).toBe(10); // 1000 hired out of 10000
      
      const metrics = calculateFunnelMetrics(applications);
      expect(metrics.total).toBe(10000);
      expect(metrics.hired).toBe(1000);
    });

    test('should handle applications with future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const applications = [
        createMockApplication({
          created_at: futureDate.toISOString(),
          status: 'applied'
        })
      ];
      
      const trends = calculateTrendAnalysis(applications, 'monthly');
      expect(trends).toHaveLength(1);
      expect(trends[0].count).toBe(1);
    });
  });
}); 