import { createMockApplication, createMockCompany } from '../utils/testHelpers';

// Mock data aggregation functions
const calculateCompanyStats = (applications: any[], companies: any[]) => {
  const companyStats: { [key: string]: any } = {};
  
  applications.forEach(app => {
    const companyId = app.company_id;
    if (!companyStats[companyId]) {
      const company = companies.find(c => c.id === companyId);
      companyStats[companyId] = {
        companyName: company?.name || 'Unknown Company',
        totalApplications: 0,
        successfulApplications: 0,
        averageResponseTime: 0,
        lastApplicationDate: null,
        statusBreakdown: {}
      };
    }
    
    companyStats[companyId].totalApplications++;
    
    if (['accepted', 'offer_received', 'hired'].includes(app.status)) {
      companyStats[companyId].successfulApplications++;
    }
    
    if (!companyStats[companyId].statusBreakdown[app.status]) {
      companyStats[companyId].statusBreakdown[app.status] = 0;
    }
    companyStats[companyId].statusBreakdown[app.status]++;
    
    const appDate = new Date(app.created_at);
    if (!companyStats[companyId].lastApplicationDate || 
        appDate > new Date(companyStats[companyId].lastApplicationDate)) {
      companyStats[companyId].lastApplicationDate = app.created_at;
    }
  });
  
  // Calculate success rates
  Object.values(companyStats).forEach((stats: any) => {
    stats.successRate = stats.totalApplications > 0 ? 
      (stats.successfulApplications / stats.totalApplications) * 100 : 0;
  });
  
  return companyStats;
};

const calculateUserPerformanceMetrics = (applications: any[], userId: string) => {
  const userApplications = applications.filter(app => app.user_id === userId);
  
  if (userApplications.length === 0) {
    return {
      totalApplications: 0,
      successRate: 0,
      averageResponseTime: 0,
      applicationsThisMonth: 0,
      applicationsThisYear: 0,
      topCompanies: [],
      statusDistribution: {}
    };
  }
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const applicationsThisMonth = userApplications.filter(app => {
    const appDate = new Date(app.created_at);
    return appDate.getMonth() === thisMonth && appDate.getFullYear() === thisYear;
  }).length;
  
  const applicationsThisYear = userApplications.filter(app => {
    const appDate = new Date(app.created_at);
    return appDate.getFullYear() === thisYear;
  }).length;
  
  const successful = userApplications.filter(app => 
    ['accepted', 'offer_received', 'hired'].includes(app.status)
  ).length;
  
  const successRate = (successful / userApplications.length) * 100;
  
  // Calculate average response time
  const applicationsWithTimeline = userApplications.filter(app => 
    app.timeline && app.timeline.length > 0
  );
  
  let averageResponseTime = 0;
  if (applicationsWithTimeline.length > 0) {
    const responseTimes = applicationsWithTimeline.map(app => {
      const firstResponse = app.timeline.find((entry: any) => 
        ['interview_scheduled', 'response_received', 'follow_up'].includes(entry.action)
      );
      
      if (!firstResponse) return null;
      
      const applicationDate = new Date(app.created_at);
      const responseDate = new Date(firstResponse.created_at);
      return (responseDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24);
    }).filter(time => time !== null);
    
    if (responseTimes.length > 0) {
      averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
  }
  
  // Calculate top companies
  const companyCounts: { [key: string]: number } = {};
  userApplications.forEach(app => {
    const companyId = app.company_id;
    companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
  });
  
  const topCompanies = Object.entries(companyCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([companyId, count]) => ({ companyId, count }));
  
  // Calculate status distribution
  const statusDistribution: { [key: string]: number } = {};
  userApplications.forEach(app => {
    statusDistribution[app.status] = (statusDistribution[app.status] || 0) + 1;
  });
  
  return {
    totalApplications: userApplications.length,
    successRate,
    averageResponseTime,
    applicationsThisMonth,
    applicationsThisYear,
    topCompanies,
    statusDistribution
  };
};

const filterAndSearchApplications = (
  applications: any[], 
  filters: {
    status?: string[];
    company?: string[];
    dateRange?: { start: string; end: string };
    searchTerm?: string;
  }
) => {
  let filtered = [...applications];
  
  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(app => filters.status!.includes(app.status));
  }
  
  // Company filter
  if (filters.company && filters.company.length > 0) {
    filtered = filtered.filter(app => filters.company!.includes(app.company_id));
  }
  
  // Date range filter
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    filtered = filtered.filter(app => {
      const appDate = new Date(app.created_at);
      return appDate >= startDate && appDate <= endDate;
    });
  }
  
  // Search term filter
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(app => 
      app.job_title?.toLowerCase().includes(searchLower) ||
      app.company_name?.toLowerCase().includes(searchLower) ||
      app.notes?.toLowerCase().includes(searchLower)
    );
  }
  
  return filtered;
};

const exportApplicationData = (
  applications: any[], 
  format: 'csv' | 'json' | 'excel' = 'csv',
  includeFields: string[] = ['id', 'job_title', 'company_name', 'status', 'created_at']
) => {
  if (applications.length === 0) {
    return format === 'json' ? '[]' : '';
  }
  
  const filteredData = applications.map(app => {
    const exportRecord: any = {};
    includeFields.forEach(field => {
      if (app[field] !== undefined) {
        exportRecord[field] = app[field];
      }
    });
    return exportRecord;
  });
  
  switch (format) {
    case 'json':
      return JSON.stringify(filteredData, null, 2);
    
    case 'csv':
      if (filteredData.length === 0) return '';
      
      const headers = includeFields.join(',');
      const rows = filteredData.map(record => 
        includeFields.map(field => {
          const value = record[field];
          // Escape commas and quotes for CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      );
      
      return [headers, ...rows].join('\n');
    
    case 'excel':
      // Mock Excel format - in real implementation would use a library like xlsx
      return `Excel format with ${filteredData.length} records`;
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

describe('Data Aggregation Tests', () => {
  describe('Company-Level Application Statistics', () => {
    test('should calculate company stats correctly', () => {
      const companies = [
        createMockCompany({ id: '1', name: 'Tech Corp' }),
        createMockCompany({ id: '2', name: 'Startup Inc' })
      ];
      
      const applications = [
        createMockApplication({ company_id: '1', status: 'applied' }),
        createMockApplication({ company_id: '1', status: 'hired' }),
        createMockApplication({ company_id: '2', status: 'rejected' }),
        createMockApplication({ company_id: '1', status: 'accepted' })
      ];
      
      const stats = calculateCompanyStats(applications, companies);
      
      expect(stats['1'].companyName).toBe('Tech Corp');
      expect(stats['1'].totalApplications).toBe(3);
      expect(stats['1'].successfulApplications).toBe(2);
      expect(stats['1'].successRate).toBeCloseTo(66.67, 1);
      expect(stats['2'].companyName).toBe('Startup Inc');
      expect(stats['2'].totalApplications).toBe(1);
      expect(stats['2'].successfulApplications).toBe(0);
      expect(stats['2'].successRate).toBe(0);
    });

    test('should handle companies with no applications', () => {
      const companies = [createMockCompany({ id: '1', name: 'Tech Corp' })];
      const applications: any[] = [];
      
      const stats = calculateCompanyStats(applications, companies);
      expect(stats).toEqual({});
    });

    test('should handle unknown company IDs', () => {
      const companies = [createMockCompany({ id: '1', name: 'Tech Corp' })];
      const applications = [
        createMockApplication({ company_id: 'unknown', status: 'applied' })
      ];
      
      const stats = calculateCompanyStats(applications, companies);
      expect(stats['unknown'].companyName).toBe('Unknown Company');
    });

    test('should calculate status breakdown correctly', () => {
      const companies = [createMockCompany({ id: '1', name: 'Tech Corp' })];
      const applications = [
        createMockApplication({ company_id: '1', status: 'applied' }),
        createMockApplication({ company_id: '1', status: 'applied' }),
        createMockApplication({ company_id: '1', status: 'hired' }),
        createMockApplication({ company_id: '1', status: 'rejected' })
      ];
      
      const stats = calculateCompanyStats(applications, companies);
      
      expect(stats['1'].statusBreakdown.applied).toBe(2);
      expect(stats['1'].statusBreakdown.hired).toBe(1);
      expect(stats['1'].statusBreakdown.rejected).toBe(1);
    });

    test('should handle large number of applications per company', () => {
      const companies = [createMockCompany({ id: '1', name: 'Tech Corp' })];
      const applications = Array.from({ length: 1000 }, (_, i) => 
        createMockApplication({ 
          company_id: '1', 
          status: i % 10 === 0 ? 'hired' : 'applied' 
        })
      );
      
      const stats = calculateCompanyStats(applications, companies);
      
      expect(stats['1'].totalApplications).toBe(1000);
      expect(stats['1'].successfulApplications).toBe(100);
      expect(stats['1'].successRate).toBe(10);
    });
  });

  describe('User Performance Metrics', () => {
    test('should calculate user performance metrics correctly', () => {
      const userId = 'user123';
      const applications = [
        createMockApplication({ user_id: userId, status: 'applied' }),
        createMockApplication({ user_id: userId, status: 'hired' }),
        createMockApplication({ user_id: userId, status: 'rejected' }),
        createMockApplication({ user_id: 'other-user', status: 'hired' })
      ];
      
      const metrics = calculateUserPerformanceMetrics(applications, userId);
      
      expect(metrics.totalApplications).toBe(3);
      expect(metrics.successRate).toBeCloseTo(33.33, 1);
      expect(metrics.statusDistribution.applied).toBe(1);
      expect(metrics.statusDistribution.hired).toBe(1);
      expect(metrics.statusDistribution.rejected).toBe(1);
    });

    test('should handle user with no applications', () => {
      const applications = [
        createMockApplication({ user_id: 'other-user', status: 'hired' })
      ];
      
      const metrics = calculateUserPerformanceMetrics(applications, 'user123');
      
      expect(metrics.totalApplications).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.applicationsThisMonth).toBe(0);
      expect(metrics.applicationsThisYear).toBe(0);
      expect(metrics.topCompanies).toEqual([]);
      expect(metrics.statusDistribution).toEqual({});
    });

    test('should calculate top companies correctly', () => {
      const userId = 'user123';
      const applications = [
        createMockApplication({ user_id: userId, company_id: '1' }),
        createMockApplication({ user_id: userId, company_id: '1' }),
        createMockApplication({ user_id: userId, company_id: '2' }),
        createMockApplication({ user_id: userId, company_id: '3' }),
        createMockApplication({ user_id: userId, company_id: '3' }),
        createMockApplication({ user_id: userId, company_id: '3' })
      ];
      
      const metrics = calculateUserPerformanceMetrics(applications, userId);
      
      expect(metrics.topCompanies).toHaveLength(3);
      expect(metrics.topCompanies[0].companyId).toBe('3');
      expect(metrics.topCompanies[0].count).toBe(3);
      expect(metrics.topCompanies[1].companyId).toBe('1');
      expect(metrics.topCompanies[1].count).toBe(2);
      expect(metrics.topCompanies[2].companyId).toBe('2');
      expect(metrics.topCompanies[2].count).toBe(1);
    });

    test('should handle applications with timeline for response time', () => {
      const userId = 'user123';
      const baseDate = new Date('2024-01-01');
      const applications = [
        createMockApplication({
          user_id: userId,
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'interview_scheduled',
              created_at: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }),
        createMockApplication({
          user_id: userId,
          created_at: baseDate.toISOString(),
          timeline: [
            {
              action: 'response_received',
              created_at: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
      ];
      
      const metrics = calculateUserPerformanceMetrics(applications, userId);
      
      expect(metrics.averageResponseTime).toBe(5); // (7 + 3) / 2 = 5 days
    });
  });

  describe('Filter and Search Result Accuracy', () => {
    test('should filter by status correctly', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'hired' }),
        createMockApplication({ status: 'rejected' }),
        createMockApplication({ status: 'applied' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        status: ['applied', 'hired']
      });
      
      expect(filtered).toHaveLength(3);
      expect(filtered.every(app => ['applied', 'hired'].includes(app.status))).toBe(true);
    });

    test('should filter by company correctly', () => {
      const applications = [
        createMockApplication({ company_id: '1' }),
        createMockApplication({ company_id: '2' }),
        createMockApplication({ company_id: '1' }),
        createMockApplication({ company_id: '3' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        company: ['1', '2']
      });
      
      expect(filtered).toHaveLength(3);
      expect(filtered.every(app => ['1', '2'].includes(app.company_id))).toBe(true);
    });

    test('should filter by date range correctly', () => {
      const applications = [
        createMockApplication({ created_at: '2024-01-15T00:00:00Z' }),
        createMockApplication({ created_at: '2024-02-15T00:00:00Z' }),
        createMockApplication({ created_at: '2024-03-15T00:00:00Z' }),
        createMockApplication({ created_at: '2024-04-15T00:00:00Z' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        dateRange: { start: '2024-02-01T00:00:00Z', end: '2024-03-31T00:00:00Z' }
      });
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(app => {
        const appDate = new Date(app.created_at);
        return appDate >= new Date('2024-02-01T00:00:00Z') && 
               appDate <= new Date('2024-03-31T00:00:00Z');
      })).toBe(true);
    });

    test('should search by job title correctly', () => {
      const applications = [
        createMockApplication({ job_title: 'Software Engineer' }),
        createMockApplication({ job_title: 'Product Manager' }),
        createMockApplication({ job_title: 'Senior Software Engineer' }),
        createMockApplication({ job_title: 'Designer' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        searchTerm: 'Software'
      });
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(app => 
        app.job_title.toLowerCase().includes('software')
      )).toBe(true);
    });

    test('should handle case-insensitive search', () => {
      const applications = [
        createMockApplication({ job_title: 'Software Engineer' }),
        createMockApplication({ job_title: 'SOFTWARE DEVELOPER' }),
        createMockApplication({ job_title: 'Product Manager' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        searchTerm: 'software'
      });
      
      expect(filtered).toHaveLength(2);
    });

    test('should handle multiple filters combined', () => {
      const applications = [
        createMockApplication({ 
          status: 'applied', 
          company_id: '1', 
          job_title: 'Engineer',
          created_at: '2024-02-15T00:00:00Z'
        }),
        createMockApplication({ 
          status: 'hired', 
          company_id: '1', 
          job_title: 'Manager',
          created_at: '2024-02-15T00:00:00Z'
        }),
        createMockApplication({ 
          status: 'applied', 
          company_id: '2', 
          job_title: 'Engineer',
          created_at: '2024-02-15T00:00:00Z'
        })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        status: ['applied'],
        company: ['1'],
        searchTerm: 'Engineer',
        dateRange: { start: '2024-02-01T00:00:00Z', end: '2024-02-28T00:00:00Z' }
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('applied');
      expect(filtered[0].company_id).toBe('1');
      expect(filtered[0].job_title).toBe('Engineer');
    });

    test('should handle empty filter criteria', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'hired' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {});
      
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Export Functionality and Data Formatting', () => {
    test('should export to CSV format correctly', () => {
      const applications = [
        createMockApplication({ 
          id: '1', 
          job_title: 'Software Engineer', 
          company_name: 'Tech Corp',
          status: 'applied',
          created_at: '2024-01-15T00:00:00Z'
        }),
        createMockApplication({ 
          id: '2', 
          job_title: 'Product Manager', 
          company_name: 'Startup Inc',
          status: 'hired',
          created_at: '2024-02-15T00:00:00Z'
        })
      ];
      
      const csv = exportApplicationData(applications, 'csv');
      
      expect(csv).toContain('id,job_title,company_name,status,created_at');
      expect(csv).toContain('1,Software Engineer,Tech Corp,applied,2024-01-15T00:00:00Z');
      expect(csv).toContain('2,Product Manager,Startup Inc,hired,2024-02-15T00:00:00Z');
    });

    test('should export to JSON format correctly', () => {
      const applications = [
        createMockApplication({ 
          id: '1', 
          job_title: 'Software Engineer',
          status: 'applied'
        })
      ];
      
      const json = exportApplicationData(applications, 'json');
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('1');
      expect(parsed[0].job_title).toBe('Software Engineer');
      expect(parsed[0].status).toBe('applied');
    });

    test('should handle CSV escaping correctly', () => {
      const applications = [
        createMockApplication({ 
          job_title: 'Software Engineer, Senior',
          company_name: 'Tech Corp, Inc.',
          notes: 'This is a "quoted" note'
        })
      ];
      
      const csv = exportApplicationData(applications, 'csv');
      
      expect(csv).toContain('"Software Engineer, Senior"');
      expect(csv).toContain('"Tech Corp, Inc."');
      expect(csv).toContain('"This is a ""quoted"" note"');
    });

    test('should handle custom field selection', () => {
      const applications = [
        createMockApplication({ 
          id: '1', 
          job_title: 'Engineer',
          status: 'applied',
          salary_range: '100k-150k'
        })
      ];
      
      const csv = exportApplicationData(applications, 'csv', ['id', 'job_title', 'salary_range']);
      
      expect(csv).toContain('id,job_title,salary_range');
      expect(csv).toContain('1,Engineer,100k-150k');
      expect(csv).not.toContain('status');
    });

    test('should handle empty applications array', () => {
      const csv = exportApplicationData([], 'csv');
      expect(csv).toBe('');
      
      const json = exportApplicationData([], 'json');
      expect(json).toBe('[]');
    });

    test('should handle missing fields gracefully', () => {
      const applications = [
        createMockApplication({ 
          id: '1', 
          job_title: 'Engineer'
          // missing status and created_at
        })
      ];
      
      const csv = exportApplicationData(applications, 'csv');
      
      expect(csv).toContain('id,job_title,company_name,status,created_at');
      expect(csv).toContain('1,Engineer,,,');
    });

    test('should throw error for unsupported export format', () => {
      const applications = [createMockApplication({})];
      
      expect(() => {
        exportApplicationData(applications, 'unsupported' as any);
      }).toThrow('Unsupported export format: unsupported');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very large datasets for filtering', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          status: i % 2 === 0 ? 'applied' : 'hired',
          company_id: `company-${i % 10}`
        })
      );
      
      const filtered = filterAndSearchApplications(applications, {
        status: ['applied']
      });
      
      expect(filtered).toHaveLength(5000);
      expect(filtered.every(app => app.status === 'applied')).toBe(true);
    });

    test('should handle applications with null/undefined values', () => {
      const applications = [
        createMockApplication({ job_title: null, company_name: undefined }),
        createMockApplication({ job_title: 'Engineer', company_name: 'Tech Corp' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        searchTerm: 'Engineer'
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].job_title).toBe('Engineer');
    });

    test('should handle invalid date ranges', () => {
      const applications = [
        createMockApplication({ created_at: '2024-01-15T00:00:00Z' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        dateRange: { start: 'invalid-date', end: '2024-12-31T00:00:00Z' }
      });
      
      // Should handle gracefully without throwing
      expect(() => filterAndSearchApplications(applications, {
        dateRange: { start: 'invalid-date', end: '2024-12-31T00:00:00Z' }
      })).not.toThrow();
    });

    test('should handle special characters in search terms', () => {
      const applications = [
        createMockApplication({ job_title: 'C++ Developer' }),
        createMockApplication({ job_title: 'React.js Developer' }),
        createMockApplication({ job_title: 'Python Developer' })
      ];
      
      const filtered = filterAndSearchApplications(applications, {
        searchTerm: 'C++'
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].job_title).toBe('C++ Developer');
    });
  });
}); 