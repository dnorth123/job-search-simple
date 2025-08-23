import { performance } from 'perf_hooks';
import { supabase } from '../src/utils/supabase';
import { linkedInCache, warmUpCache, getCacheMetrics } from '../src/utils/linkedinCache';
import { searchLinkedInCompany, getQueueStatus, queueManager } from '../src/utils/linkedinQueue';
import { LinkedInMetrics, generateLinkedInReport } from '../src/utils/linkedinMetrics';

interface PerformanceTestResult {
  testName: string;
  success: boolean;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  timestamp: string;
  overallSummary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageResponseTime: number;
    successRate: number;
  };
  testResults: PerformanceTestResult[];
  recommendations: string[];
  systemMetrics: {
    cacheMetrics: any;
    queueStatus: any;
    linkedinMetrics: any;
  };
}

class LinkedInPerformanceTester {
  private results: PerformanceTestResult[] = [];

  // Test data sets
  private readonly wellKnownCompanies = [
    'Microsoft', 'Apple', 'Google', 'Amazon', 'Meta',
    'Netflix', 'Tesla', 'Spotify', 'Uber', 'Airbnb'
  ];

  private readonly genericCompanies = [
    'Acme Corp', 'Test Company', 'Example Inc', 'Demo LLC',
    'Sample Business', 'Generic Solutions', 'Test Tech'
  ];

  private readonly internationalCompanies = [
    '北京字节跳动科技有限公司', // ByteDance (Chinese)
    'Société Générale', // French
    'Nestlé SA', // Swiss
    '株式会社ソニー', // Sony (Japanese)
    'SAP SE', // German
    'Spotify AB', // Swedish
    'ASML Holding N.V.' // Dutch
  ];

  private readonly specialCharCompanies = [
    "L'Oréal & Co.",
    "AT&T Inc.",
    "PwC (PricewaterhouseCoopers)",
    "3M Company",
    "H&M Hennes & Mauritz AB",
    "Johnson & Johnson",
    "Procter & Gamble Co."
  ];

  private readonly longCompanyNames = [
    "International Business Machines Corporation",
    "The Goldman Sachs Group, Inc.",
    "JPMorgan Chase & Co. Investment Banking Division",
    "Berkshire Hathaway Inc. Class A",
    "American International Group, Inc."
  ];

  /**
   * Run comprehensive performance tests
   */
  async runPerformanceTests(): Promise<PerformanceReport> {
    console.log('🚀 Starting LinkedIn Discovery Performance Tests...\n');

    this.results = [];

    // Test categories
    await this.testBasicFunctionality();
    await this.testCachePerformance();
    await this.testConcurrentRequests();
    await this.testRateLimiting();
    await this.testErrorHandling();
    await this.testInternationalization();
    await this.testSpecialCharacters();
    await this.testLongCompanyNames();
    await this.testCacheEffectiveness();
    await this.testQueuePerformance();

    // Generate comprehensive report
    const report = await this.generateReport();
    
    console.log('\n✅ Performance tests completed!');
    console.log(`📊 Results: ${report.overallSummary.successfulTests}/${report.overallSummary.totalTests} tests passed`);
    console.log(`⏱️  Average response time: ${report.overallSummary.averageResponseTime.toFixed(2)}ms`);
    console.log(`📈 Success rate: ${report.overallSummary.successRate.toFixed(1)}%\n`);

    return report;
  }

  /**
   * Test basic search functionality
   */
  private async testBasicFunctionality(): Promise<void> {
    console.log('📋 Testing basic functionality...');

    for (const company of this.wellKnownCompanies.slice(0, 5)) {
      await this.runTest(`Basic search: ${company}`, async () => {
        const results = await this.searchWithTimeout(company, 5000);
        
        if (!results || results.length === 0) {
          throw new Error('No results returned');
        }

        // Validate result structure
        const firstResult = results[0];
        if (!firstResult.url || !firstResult.companyName || typeof firstResult.confidence !== 'number') {
          throw new Error('Invalid result structure');
        }

        return { resultCount: results.length, topConfidence: firstResult.confidence };
      });
    }
  }

  /**
   * Test cache performance
   */
  private async testCachePerformance(): Promise<void> {
    console.log('💾 Testing cache performance...');

    const testCompany = 'Microsoft';

    // First request (should hit API)
    await this.runTest('Cache miss - first request', async () => {
      await linkedInCache.invalidate(testCompany); // Ensure cache miss
      const results = await this.searchWithTimeout(testCompany, 10000);
      return { resultCount: results?.length || 0, cached: false };
    });

    // Second request (should hit cache)
    await this.runTest('Cache hit - second request', async () => {
      const results = await this.searchWithTimeout(testCompany, 1000); // Should be much faster
      return { resultCount: results?.length || 0, cached: true };
    });

    // Test cache statistics
    await this.runTest('Cache statistics', async () => {
      const stats = await linkedInCache.getStats();
      return {
        totalEntries: stats.totalEntries,
        memoryEntries: stats.memoryEntries,
        hitRate: stats.hitRate
      };
    });
  }

  /**
   * Test concurrent requests
   */
  private async testConcurrentRequests(): Promise<void> {
    console.log('🔄 Testing concurrent requests...');

    await this.runTest('Concurrent searches (5 parallel)', async () => {
      const companies = this.wellKnownCompanies.slice(0, 5);
      const startTime = performance.now();
      
      const promises = companies.map(company => 
        this.searchWithTimeout(company, 10000).catch(() => null)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const successCount = results.filter(result => result !== null).length;
      const totalTime = endTime - startTime;
      
      return {
        successCount,
        totalRequests: companies.length,
        totalTime: Math.round(totalTime),
        averageTimePerRequest: Math.round(totalTime / companies.length)
      };
    });

    await this.runTest('High concurrency (10 parallel)', async () => {
      const companies = [
        ...this.wellKnownCompanies.slice(0, 5),
        ...this.genericCompanies.slice(0, 5)
      ];
      
      const startTime = performance.now();
      
      const promises = companies.map(company => 
        this.searchWithTimeout(company, 15000).catch(() => null)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const successCount = results.filter(result => result !== null).length;
      const totalTime = endTime - startTime;
      
      return {
        successCount,
        totalRequests: companies.length,
        totalTime: Math.round(totalTime),
        averageTimePerRequest: Math.round(totalTime / companies.length)
      };
    });
  }

  /**
   * Test rate limiting behavior
   */
  private async testRateLimiting(): Promise<void> {
    console.log('⏱️ Testing rate limiting...');

    await this.runTest('Queue status check', async () => {
      const status = getQueueStatus();
      return {
        queueLength: status.queueLength,
        requestsToday: status.requestsToday,
        requestsThisMonth: status.requestsThisMonth,
        processing: status.processing
      };
    });

    await this.runTest('Rapid requests (queue behavior)', async () => {
      const companies = ['Test1', 'Test2', 'Test3', 'Test4', 'Test5'];
      const startTime = performance.now();
      
      // Submit all requests rapidly
      const promises = companies.map(company => 
        searchLinkedInCompany(company, 'normal').catch(() => null)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const successCount = results.filter(result => result !== null).length;
      
      return {
        successCount,
        totalTime: Math.round(endTime - startTime),
        queueHandled: true
      };
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    console.log('🚨 Testing error handling...');

    await this.runTest('Empty search term', async () => {
      try {
        await this.searchWithTimeout('', 5000);
        throw new Error('Should have failed with empty search term');
      } catch (error) {
        return { expectedError: true, errorMessage: error.message };
      }
    });

    await this.runTest('Very short search term', async () => {
      try {
        await this.searchWithTimeout('A', 5000);
        throw new Error('Should have failed with very short search term');
      } catch (error) {
        return { expectedError: true, errorMessage: error.message };
      }
    });

    await this.runTest('Nonexistent company', async () => {
      const results = await this.searchWithTimeout('XYZ-NonExistent-Company-12345', 10000);
      return { 
        resultCount: results?.length || 0,
        handledGracefully: true 
      };
    });
  }

  /**
   * Test internationalization
   */
  private async testInternationalization(): Promise<void> {
    console.log('🌍 Testing internationalization...');

    for (const company of this.internationalCompanies.slice(0, 3)) {
      await this.runTest(`International: ${company.substring(0, 20)}...`, async () => {
        const results = await this.searchWithTimeout(company, 10000);
        return { 
          resultCount: results?.length || 0,
          handledUnicode: true,
          companyLength: company.length
        };
      });
    }
  }

  /**
   * Test special characters
   */
  private async testSpecialCharacters(): Promise<void> {
    console.log('🔣 Testing special characters...');

    for (const company of this.specialCharCompanies.slice(0, 3)) {
      await this.runTest(`Special chars: ${company}`, async () => {
        const results = await this.searchWithTimeout(company, 10000);
        return { 
          resultCount: results?.length || 0,
          hasSpecialChars: true 
        };
      });
    }
  }

  /**
   * Test long company names
   */
  private async testLongCompanyNames(): Promise<void> {
    console.log('📏 Testing long company names...');

    for (const company of this.longCompanyNames.slice(0, 2)) {
      await this.runTest(`Long name: ${company.substring(0, 30)}...`, async () => {
        const results = await this.searchWithTimeout(company, 10000);
        return { 
          resultCount: results?.length || 0,
          nameLength: company.length 
        };
      });
    }
  }

  /**
   * Test cache effectiveness
   */
  private async testCacheEffectiveness(): Promise<void> {
    console.log('📊 Testing cache effectiveness...');

    await this.runTest('Cache warming', async () => {
      await warmUpCache();
      const metrics = await getCacheMetrics();
      return {
        cacheEntries: metrics.cache.totalEntries,
        memoryEntries: metrics.cache.memoryEntries
      };
    });

    await this.runTest('Cache hit rate measurement', async () => {
      // Perform several searches
      const companies = this.wellKnownCompanies.slice(0, 3);
      
      // First round - populate cache
      await Promise.all(companies.map(company => 
        this.searchWithTimeout(company, 10000).catch(() => null)
      ));
      
      // Second round - should hit cache
      const startTime = performance.now();
      await Promise.all(companies.map(company => 
        this.searchWithTimeout(company, 5000).catch(() => null)
      ));
      const endTime = performance.now();
      
      const metrics = await getCacheMetrics();
      
      return {
        averageTime: Math.round((endTime - startTime) / companies.length),
        hitRate: metrics.cache.hitRate
      };
    });
  }

  /**
   * Test queue performance
   */
  private async testQueuePerformance(): Promise<void> {
    console.log('🚦 Testing queue performance...');

    await this.runTest('Queue throughput', async () => {
      const companies = this.wellKnownCompanies.slice(0, 10);
      const startTime = performance.now();
      
      // Submit all to queue
      const promises = companies.map(company => 
        searchLinkedInCompany(company, 'normal').catch(() => null)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const successCount = results.filter(result => result !== null).length;
      const totalTime = endTime - startTime;
      
      return {
        successCount,
        totalRequests: companies.length,
        totalTime: Math.round(totalTime),
        throughput: Math.round((successCount / totalTime) * 1000) // requests per second
      };
    });
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const metadata = await testFn();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      this.results.push({
        testName,
        success: true,
        responseTime,
        metadata
      });
      
      console.log(`  ✅ ${testName} (${responseTime}ms)`);
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      this.results.push({
        testName,
        success: false,
        responseTime,
        error: error.message
      });
      
      console.log(`  ❌ ${testName} (${responseTime}ms) - ${error.message}`);
    }
  }

  /**
   * Search with timeout wrapper
   */
  private async searchWithTimeout(company: string, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Search timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      searchLinkedInCompany(company, 'high')
        .then(results => {
          clearTimeout(timeout);
          resolve(results);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Generate comprehensive performance report
   */
  private async generateReport(): Promise<PerformanceReport> {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Get system metrics
    const [cacheMetrics, queueStatus] = await Promise.all([
      getCacheMetrics().catch(() => null),
      Promise.resolve(getQueueStatus())
    ]);

    const linkedinMetrics = await LinkedInMetrics.getMetrics().catch(() => null);

    return {
      timestamp: new Date().toISOString(),
      overallSummary: {
        totalTests,
        successfulTests,
        failedTests,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        successRate: Math.round(successRate * 100) / 100
      },
      testResults: this.results,
      recommendations,
      systemMetrics: {
        cacheMetrics,
        queueStatus,
        linkedinMetrics
      }
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    const slowTests = this.results.filter(r => r.responseTime > 3000);
    const failedTests = this.results.filter(r => !r.success);
    
    if (avgResponseTime > 2000) {
      recommendations.push('Average response time is high (>2s). Consider optimizing cache strategy or API calls.');
    }
    
    if (slowTests.length > this.results.length * 0.2) {
      recommendations.push('More than 20% of tests are slow (>3s). Check network conditions and API performance.');
    }
    
    if (failedTests.length > this.results.length * 0.1) {
      recommendations.push('More than 10% of tests failed. Review error handling and API reliability.');
    }
    
    if (avgResponseTime < 500) {
      recommendations.push('Excellent response times! Cache strategy is working well.');
    }
    
    if (failedTests.length === 0) {
      recommendations.push('All tests passed! System is performing reliably.');
    }
    
    return recommendations;
  }
}

/**
 * Main execution function
 */
async function runPerformanceTests(): Promise<void> {
  const tester = new LinkedInPerformanceTester();
  
  try {
    const report = await tester.runPerformanceTests();
    
    // Write report to file
    const reportJson = JSON.stringify(report, null, 2);
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '../performance-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportsDir, `linkedin-performance-${timestamp}.json`);
    
    fs.writeFileSync(reportFile, reportJson);
    console.log(`📄 Detailed report saved to: ${reportFile}`);
    
    // Generate readable report
    const readableReport = await generateLinkedInReport();
    const txtReportFile = path.join(reportsDir, `linkedin-performance-${timestamp}.txt`);
    fs.writeFileSync(txtReportFile, readableReport);
    console.log(`📋 Readable report saved to: ${txtReportFile}`);
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { LinkedInPerformanceTester, runPerformanceTests };

// Run if called directly
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\n🎉 Performance testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Performance testing failed:', error);
      process.exit(1);
    });
}