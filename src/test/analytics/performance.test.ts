import { createMockApplication } from '../utils/testHelpers';

// Mock performance testing functions
const measureRenderingPerformance = (applications: any[], renderFunction: Function): {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
} => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const result = renderFunction(applications);
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  return {
    renderTime: endTime - startTime,
    memoryUsage: endMemory - startMemory,
    componentCount: result?.length || 0
  };
};

const measureSearchPerformance = (
  applications: any[], 
  searchTerm: string,
  searchFunction: Function
): {
  searchTime: number;
  resultCount: number;
  accuracy: number;
} => {
  const startTime = performance.now();
  
  const results = searchFunction(applications, searchTerm);
  
  const endTime = performance.now();
  
  // Calculate accuracy based on expected results
  const expectedResults = applications.filter(app => 
    app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const accuracy = expectedResults.length > 0 ? 
    (results.filter((r: any) => expectedResults.includes(r)).length / expectedResults.length) * 100 : 100;
  
  return {
    searchTime: endTime - startTime,
    resultCount: results.length,
    accuracy
  };
};

const measureFilterPerformance = (
  applications: any[], 
  filters: any,
  filterFunction: Function
): {
  filterTime: number;
  resultCount: number;
  memoryUsage: number;
} => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const results = filterFunction(applications, filters);
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  return {
    filterTime: endTime - startTime,
    resultCount: results.length,
    memoryUsage: endMemory - startMemory
  };
};

const measureDatabaseQueryPerformance = (
  queryFunction: Function,
  queryParams: any
): {
  queryTime: number;
  resultCount: number;
  memoryUsage: number;
  cacheHitRate?: number;
} => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const results = queryFunction(queryParams);
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  return {
    queryTime: endTime - startTime,
    resultCount: results?.length || 0,
    memoryUsage: endMemory - startMemory
  };
};

const measureMemoryUsage = (testFunction: Function): {
  initialMemory: number;
  peakMemory: number;
  finalMemory: number;
  memoryLeak: boolean;
} => {
  const initialMemory = process.memoryUsage().heapUsed;
  let peakMemory = initialMemory;
  
  // Run garbage collection before test
  if (global.gc) {
    global.gc();
  }
  
  const result = testFunction();
  
  const finalMemory = process.memoryUsage().heapUsed;
  
  // Check for memory leaks (final memory should be close to initial)
  const memoryLeak = (finalMemory - initialMemory) > (initialMemory * 0.1); // 10% threshold
  
  return {
    initialMemory,
    peakMemory,
    finalMemory,
    memoryLeak
  };
};

// Mock render function for testing
const mockRenderApplications = (applications: any[]) => {
  return applications.map(app => ({
    id: app.id,
    jobTitle: app.job_title,
    companyName: app.company_name,
    status: app.status
  }));
};

// Mock search function
const mockSearchApplications = (applications: any[], searchTerm: string) => {
  return applications.filter(app => 
    app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Mock filter function
const mockFilterApplications = (applications: any[], filters: any) => {
  let filtered = [...applications];
  
  if (filters.status) {
    filtered = filtered.filter(app => filters.status.includes(app.status));
  }
  
  if (filters.company) {
    filtered = filtered.filter(app => filters.company.includes(app.company_id));
  }
  
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    filtered = filtered.filter(app => {
      const appDate = new Date(app.created_at);
      return appDate >= startDate && appDate <= endDate;
    });
  }
  
  return filtered;
};

// Mock database query function
const mockDatabaseQuery = (params: any) => {
  // Simulate database query with delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = Array.from({ length: params.limit || 100 }, (_, i) => 
        createMockApplication({ id: `app-${i}` })
      );
      resolve(results);
    }, params.delay || 10);
  });
};

describe('Performance Testing', () => {
  describe('Large Dataset Rendering Performance', () => {
    test('should render 1000 applications within acceptable time', () => {
      const applications = Array.from({ length: 1000 }, (_, i) => 
        createMockApplication({ id: `app-${i}` })
      );
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(100); // Should render in under 100ms
      expect(performance.componentCount).toBe(1000);
      expect(performance.memoryUsage).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    test('should render 10000 applications within acceptable time', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({ id: `app-${i}` })
      );
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(500); // Should render in under 500ms
      expect(performance.componentCount).toBe(10000);
      expect(performance.memoryUsage).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    });

    test('should handle rendering with complex data structures', () => {
      const applications = Array.from({ length: 1000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          timeline: Array.from({ length: 10 }, (_, j) => ({
            action: `action-${j}`,
            created_at: new Date().toISOString(),
            notes: `Note ${j} for application ${i}`
          })),
          notes: 'A'.repeat(1000), // Long notes
          job_description: 'B'.repeat(2000) // Long description
        })
      );
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(1000); // Should render in under 1 second
      expect(performance.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    test('should handle rendering with empty dataset', () => {
      const performance = measureRenderingPerformance([], mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(10); // Should be very fast
      expect(performance.componentCount).toBe(0);
      expect(performance.memoryUsage).toBeLessThan(1024 * 1024); // Less than 1MB
    });

    test('should handle rendering with single application', () => {
      const applications = [createMockApplication({ id: 'single-app' })];
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(10); // Should be very fast
      expect(performance.componentCount).toBe(1);
    });
  });

  describe('Search and Filter Operation Speed', () => {
    test('should search through 10000 applications quickly', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: `Software Engineer ${i % 100}`,
          company_name: `Company ${i % 50}`
        })
      );
      
      const performance = measureSearchPerformance(applications, 'Engineer', mockSearchApplications);
      
      expect(performance.searchTime).toBeLessThan(50); // Should search in under 50ms
      expect(performance.accuracy).toBeGreaterThan(95); // Should be highly accurate
    });

    test('should handle complex search terms efficiently', () => {
      const applications = Array.from({ length: 5000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: `Senior Software Engineer with Machine Learning Experience ${i}`,
          company_name: `Tech Company ${i % 100}`,
          notes: `This is a detailed note about the application ${i}`
        })
      );
      
      const performance = measureSearchPerformance(
        applications, 
        'Senior Software Engineer Machine Learning', 
        mockSearchApplications
      );
      
      expect(performance.searchTime).toBeLessThan(100); // Should search in under 100ms
      expect(performance.accuracy).toBeGreaterThan(90);
    });

    test('should filter applications efficiently', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          status: i % 2 === 0 ? 'applied' : 'hired',
          company_id: `company-${i % 10}`,
          created_at: new Date(2024, 0, 1 + (i % 365)).toISOString()
        })
      );
      
      const filters = {
        status: ['applied', 'hired'],
        company: ['company-1', 'company-2'],
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T00:00:00Z'
        }
      };
      
      const performance = measureFilterPerformance(applications, filters, mockFilterApplications);
      
      expect(performance.filterTime).toBeLessThan(50); // Should filter in under 50ms
      expect(performance.resultCount).toBeGreaterThan(0);
      expect(performance.memoryUsage).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    test('should handle empty search results efficiently', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: `Engineer ${i}`
        })
      );
      
      const performance = measureSearchPerformance(applications, 'nonexistent', mockSearchApplications);
      
      expect(performance.searchTime).toBeLessThan(50); // Should be fast even with no results
      expect(performance.resultCount).toBe(0);
      expect(performance.accuracy).toBe(100); // Perfect accuracy for no results
    });

    test('should handle case-insensitive search efficiently', () => {
      const applications = Array.from({ length: 5000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: `Software ENGINEER ${i}`,
          company_name: `TECH Company ${i}`
        })
      );
      
      const performance = measureSearchPerformance(applications, 'engineer', mockSearchApplications);
      
      expect(performance.searchTime).toBeLessThan(50);
      expect(performance.accuracy).toBeGreaterThan(95);
    });
  });

  describe('Database Query Optimization Validation', () => {
    test('should execute simple queries quickly', async () => {
      const performance = await measureDatabaseQueryPerformance(mockDatabaseQuery, {
        limit: 100,
        delay: 10
      });
      
      expect(performance.queryTime).toBeLessThan(100); // Should query in under 100ms
      expect(performance.resultCount).toBe(100);
      expect(performance.memoryUsage).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    test('should handle large result sets efficiently', async () => {
      const performance = await measureDatabaseQueryPerformance(mockDatabaseQuery, {
        limit: 10000,
        delay: 50
      });
      
      expect(performance.queryTime).toBeLessThan(200); // Should query in under 200ms
      expect(performance.resultCount).toBe(10000);
      expect(performance.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    test('should handle complex queries with multiple parameters', async () => {
      const performance = await measureDatabaseQueryPerformance(mockDatabaseQuery, {
        limit: 1000,
        delay: 20,
        filters: {
          status: ['applied', 'hired'],
          dateRange: { start: '2024-01-01', end: '2024-12-31' },
          company: ['company-1', 'company-2']
        },
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      expect(performance.queryTime).toBeLessThan(150); // Should query in under 150ms
      expect(performance.resultCount).toBe(1000);
    });

    test('should handle pagination efficiently', async () => {
      const performance = await measureDatabaseQueryPerformance(mockDatabaseQuery, {
        limit: 50,
        offset: 1000,
        delay: 5
      });
      
      expect(performance.queryTime).toBeLessThan(50); // Should be fast with pagination
      expect(performance.resultCount).toBe(50);
    });

    test('should handle concurrent queries', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: 10 }, () => 
        measureDatabaseQueryPerformance(mockDatabaseQuery, { limit: 100, delay: 10 })
      );
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      expect(totalTime).toBeLessThan(500); // Should handle concurrent queries efficiently
      results.forEach(result => {
        expect(result.queryTime).toBeLessThan(100);
        expect(result.resultCount).toBe(100);
      });
    });
  });

  describe('Memory Usage and Cleanup Testing', () => {
    test('should not leak memory during repeated operations', () => {
      const memoryTest = () => {
        const applications = Array.from({ length: 1000 }, (_, i) => 
          createMockApplication({ id: `app-${i}` })
        );
        
        // Perform multiple operations
        for (let i = 0; i < 10; i++) {
          mockRenderApplications(applications);
          mockSearchApplications(applications, 'Engineer');
          mockFilterApplications(applications, { status: ['applied'] });
        }
        
        return applications.length;
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
      expect(memoryUsage.finalMemory - memoryUsage.initialMemory).toBeLessThan(
        memoryUsage.initialMemory * 0.05 // Less than 5% increase
      );
    });

    test('should handle large object cleanup', () => {
      const memoryTest = () => {
        // Create large objects
        const largeApplications = Array.from({ length: 10000 }, (_, i) => 
          createMockApplication({
            id: `app-${i}`,
            job_description: 'A'.repeat(10000), // 10KB per application
            notes: 'B'.repeat(5000), // 5KB per application
            timeline: Array.from({ length: 50 }, (_, j) => ({
              action: `action-${j}`,
              created_at: new Date().toISOString(),
              notes: 'C'.repeat(1000) // 1KB per timeline entry
            }))
          })
        );
        
        // Process and then clear
        const results = mockRenderApplications(largeApplications);
        largeApplications.length = 0; // Clear array
        
        return results.length;
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
    });

    test('should handle string operations efficiently', () => {
      const memoryTest = () => {
        const applications = Array.from({ length: 1000 }, (_, i) => 
          createMockApplication({
            id: `app-${i}`,
            job_title: `Software Engineer ${i}`.repeat(100), // Large strings
            company_name: `Company ${i}`.repeat(50)
          })
        );
        
        // Perform string operations
        const processed = applications.map(app => ({
          ...app,
          job_title: app.job_title.toUpperCase(),
          company_name: app.company_name.toLowerCase()
        }));
        
        return processed.length;
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
    });

    test('should handle array operations efficiently', () => {
      const memoryTest = () => {
        const applications = Array.from({ length: 10000 }, (_, i) => 
          createMockApplication({ id: `app-${i}` })
        );
        
        // Perform array operations
        const filtered = applications.filter(app => app.id.includes('1'));
        const mapped = applications.map(app => ({ ...app, processed: true }));
        const sorted = applications.sort((a, b) => a.id.localeCompare(b.id));
        
        return filtered.length + mapped.length + sorted.length;
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
    });

    test('should handle event listener cleanup', () => {
      const memoryTest = () => {
        const listeners: Array<() => void> = [];
        
        // Create event listeners
        for (let i = 0; i < 1000; i++) {
          const listener = () => console.log(`Event ${i}`);
          listeners.push(listener);
        }
        
        // Simulate cleanup
        listeners.length = 0;
        
        return listeners.length;
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle extremely large datasets gracefully', () => {
      const applications = Array.from({ length: 100000 }, (_, i) => 
        createMockApplication({ id: `app-${i}` })
      );
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(5000); // Should render in under 5 seconds
      expect(performance.memoryUsage).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });

    test('should handle applications with very long text fields', () => {
      const applications = Array.from({ length: 1000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: 'A'.repeat(10000), // 10KB title
          job_description: 'B'.repeat(100000), // 100KB description
          notes: 'C'.repeat(50000) // 50KB notes
        })
      );
      
      const performance = measureRenderingPerformance(applications, mockRenderApplications);
      
      expect(performance.renderTime).toBeLessThan(2000); // Should render in under 2 seconds
      expect(performance.memoryUsage).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    });

    test('should handle search with special characters efficiently', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: `C++ Developer ${i}`,
          company_name: `Tech Corp. ${i}`,
          notes: `Special chars: !@#$%^&*() ${i}`
        })
      );
      
      const performance = measureSearchPerformance(applications, 'C++', mockSearchApplications);
      
      expect(performance.searchTime).toBeLessThan(100);
      expect(performance.accuracy).toBeGreaterThan(90);
    });

    test('should handle concurrent memory-intensive operations', () => {
      const memoryTest = () => {
        const promises = Array.from({ length: 5 }, () => {
          return new Promise(resolve => {
            const applications = Array.from({ length: 2000 }, (_, i) => 
              createMockApplication({ id: `app-${i}` })
            );
            
            const results = mockRenderApplications(applications);
            resolve(results.length);
          });
        });
        
        return Promise.all(promises);
      };
      
      const memoryUsage = measureMemoryUsage(memoryTest);
      
      expect(memoryUsage.memoryLeak).toBe(false);
    });

    test('should handle applications with null/undefined values efficiently', () => {
      const applications = Array.from({ length: 10000 }, (_, i) => 
        createMockApplication({
          id: `app-${i}`,
          job_title: i % 2 === 0 ? null : `Engineer ${i}`,
          company_name: i % 3 === 0 ? undefined : `Company ${i}`,
          notes: i % 4 === 0 ? '' : `Notes ${i}`
        })
      );
      
      const performance = measureSearchPerformance(applications, 'Engineer', mockSearchApplications);
      
      expect(performance.searchTime).toBeLessThan(100);
      expect(performance.accuracy).toBeGreaterThan(90);
    });
  });
}); 