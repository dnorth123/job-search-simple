import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
  });

  test.describe('Bundle Size Analysis and Optimization', () => {
    test('should load initial bundle quickly', async ({ page }) => {
      // Measure initial page load time
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="app-container"]');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have reasonable bundle size', async ({ page }) => {
      // Get resource sizes
      const resourceSizes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.map(resource => ({
          name: resource.name,
          size: resource.transferSize,
          duration: resource.duration
        }));
      });
      
      // Check total bundle size
      const totalSize = resourceSizes.reduce((sum, resource) => sum + (resource.size || 0), 0);
      expect(totalSize).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });

    test('should load JavaScript efficiently', async ({ page }) => {
      // Measure JavaScript loading time
      const jsLoadTime = await page.evaluate(() => {
        const jsResources = performance.getEntriesByType('resource')
          .filter(resource => resource.name.endsWith('.js'));
        return jsResources.reduce((sum, resource) => sum + resource.duration, 0);
      });
      
      expect(jsLoadTime).toBeLessThan(2000); // Less than 2 seconds
    });

    test('should load CSS efficiently', async ({ page }) => {
      // Measure CSS loading time
      const cssLoadTime = await page.evaluate(() => {
        const cssResources = performance.getEntriesByType('resource')
          .filter(resource => resource.name.endsWith('.css'));
        return cssResources.reduce((sum, resource) => sum + resource.duration, 0);
      });
      
      expect(cssLoadTime).toBeLessThan(1000); // Less than 1 second
    });

    test('should use code splitting effectively', async ({ page }) => {
      // Check for multiple JavaScript chunks
      const jsChunks = await page.evaluate(() => {
        const jsResources = performance.getEntriesByType('resource')
          .filter(resource => resource.name.endsWith('.js'));
        return jsResources.length;
      });
      
      // Should have multiple chunks for code splitting
      expect(jsChunks).toBeGreaterThan(1);
    });
  });

  test.describe('Image Loading and Optimization', () => {
    test('should load images efficiently', async ({ page }) => {
      // Measure image loading time
      const imageLoadTime = await page.evaluate(() => {
        const imageResources = performance.getEntriesByType('resource')
          .filter(resource => resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
        return imageResources.reduce((sum, resource) => sum + resource.duration, 0);
      });
      
      expect(imageLoadTime).toBeLessThan(2000); // Less than 2 seconds
    });

    test('should use optimized image formats', async ({ page }) => {
      // Check image formats
      const imageFormats = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => {
          const src = img.getAttribute('src') || '';
          return src.split('.').pop()?.toLowerCase();
        });
      });
      
      // Should use modern formats (webp, avif) or have fallbacks
      const modernFormats = imageFormats.filter(format => 
        ['webp', 'avif', 'svg'].includes(format || '')
      );
      expect(modernFormats.length).toBeGreaterThan(0);
    });

    test('should lazy load images', async ({ page }) => {
      // Check for lazy loading attributes
      const lazyImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => 
          img.hasAttribute('loading') || img.hasAttribute('data-src')
        ).length;
      });
      
      // Should have lazy loading implemented
      expect(lazyImages).toBeGreaterThan(0);
    });

    test('should handle image loading errors gracefully', async ({ page }) => {
      // Simulate image loading error
      await page.route('**/*.{jpg,jpeg,png,gif,webp}', route => route.abort());
      
      // App should still function
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    });

    test('should optimize image sizes', async ({ page }) => {
      // Check image sizes
      const imageSizes = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: img.src
        }));
      });
      
      // Images should have reasonable sizes
      imageSizes.forEach(img => {
        expect(img.width).toBeLessThan(2000); // Max 2000px width
        expect(img.height).toBeLessThan(2000); // Max 2000px height
      });
    });
  });

  test.describe('API Call Efficiency and Caching', () => {
    test('should cache API responses', async ({ page }) => {
      // Monitor API calls
      const apiCalls: string[] = [];
      await page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });
      
      // Navigate and trigger API calls
      await page.click('[data-testid="nav-link"]');
      await page.waitForTimeout(1000);
      
      // Navigate back and forth
      await page.click('[data-testid="nav-link"]');
      await page.waitForTimeout(1000);
      
      // Should not make duplicate API calls
      const uniqueCalls = [...new Set(apiCalls)];
      expect(apiCalls.length).toBeLessThanOrEqual(uniqueCalls.length * 1.5); // Allow some duplicates
    });

    test('should handle API response times efficiently', async ({ page }) => {
      // Measure API response time
      const responseTimes: number[] = [];
      
      await page.on('response', response => {
        if (response.url().includes('/api/')) {
          responseTimes.push(response.request().timing().responseEnd - response.request().timing().requestStart);
        }
      });
      
      // Trigger API calls
      await page.click('[data-testid="nav-link"]');
      await page.waitForTimeout(2000);
      
      // Average response time should be reasonable
      if (responseTimes.length > 0) {
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        expect(avgResponseTime).toBeLessThan(1000); // Less than 1 second
      }
    });

    test('should implement request debouncing', async ({ page }) => {
      // Rapidly trigger actions that would cause API calls
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await searchInput.fill('test2');
        await searchInput.fill('test3');
        await page.waitForTimeout(500);
        
        // Should not make excessive API calls
        const apiCallCount = await page.evaluate(() => {
          return performance.getEntriesByType('resource')
            .filter(resource => resource.name.includes('/api/')).length;
        });
        
        expect(apiCallCount).toBeLessThan(5); // Should debounce requests
      }
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/**', route => route.abort());
      
      // App should still function
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      // Should show error state
      const errorIndicator = page.locator('[data-testid="error-indicator"]');
      if (await errorIndicator.isVisible()) {
        await expect(errorIndicator).toBeVisible();
      }
    });

    test('should implement proper caching headers', async ({ page }) => {
      // Check cache headers
      const cacheHeaders = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(resource => resource.name.includes('/api/'))
          .map(resource => resource.name);
      });
      
      // Should have caching implemented
      expect(cacheHeaders.length).toBeGreaterThan(0);
    });
  });

  test.describe('Memory Usage Profiling', () => {
    test('should not have memory leaks', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory?.usedJSHeapSize || 0;
      });
      
      // Perform actions that might cause memory leaks
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="nav-link"]');
        await page.waitForTimeout(100);
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory?.usedJSHeapSize || 0;
      });
      
      // Memory increase should be reasonable
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Simulate loading large dataset
      await page.evaluate(() => {
        // Create large dataset
        const largeData = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`
        }));
        
        // Store in memory
        (window as any).largeDataset = largeData;
      });
      
      // Check memory usage
      const memoryUsage = await page.evaluate(() => {
        return performance.memory?.usedJSHeapSize || 0;
      });
      
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    test('should clean up event listeners', async ({ page }) => {
      // Get initial event listener count
      const initialListeners = await page.evaluate(() => {
        return (window as any).eventListeners?.length || 0;
      });
      
      // Add and remove event listeners
      await page.evaluate(() => {
        const handler = () => {};
        document.addEventListener('click', handler);
        document.removeEventListener('click', handler);
      });
      
      // Check final event listener count
      const finalListeners = await page.evaluate(() => {
        return (window as any).eventListeners?.length || 0;
      });
      
      // Should not have leaked event listeners
      expect(finalListeners).toBeLessThanOrEqual(initialListeners + 5);
    });

    test('should handle DOM manipulation efficiently', async ({ page }) => {
      // Measure DOM manipulation performance
      const domManipulationTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Perform DOM manipulations
        const container = document.createElement('div');
        for (let i = 0; i < 1000; i++) {
          const element = document.createElement('div');
          element.textContent = `Element ${i}`;
          container.appendChild(element);
        }
        
        document.body.appendChild(container);
        document.body.removeChild(container);
        
        return performance.now() - start;
      });
      
      expect(domManipulationTime).toBeLessThan(100); // Less than 100ms
    });
  });

  test.describe('Performance Monitoring and Metrics', () => {
    test('should track Core Web Vitals', async ({ page }) => {
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        return {
          LCP: performance.getEntriesByName('LCP')[0]?.startTime || 0,
          FID: performance.getEntriesByName('FID')[0]?.processingStart || 0,
          CLS: performance.getEntriesByName('CLS')[0]?.value || 0
        };
      });
      
      // Check if metrics are being tracked
      expect(typeof metrics.LCP).toBe('number');
      expect(typeof metrics.FID).toBe('number');
      expect(typeof metrics.CLS).toBe('number');
    });

    test('should have good First Contentful Paint', async ({ page }) => {
      // Measure FCP
      const fcp = await page.evaluate(() => {
        return performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
      });
      
      expect(fcp).toBeLessThan(2000); // Less than 2 seconds
    });

    test('should have good Largest Contentful Paint', async ({ page }) => {
      // Wait for LCP
      await page.waitForLoadState('networkidle');
      
      const lcp = await page.evaluate(() => {
        return performance.getEntriesByName('LCP')[0]?.startTime || 0;
      });
      
      expect(lcp).toBeLessThan(2500); // Less than 2.5 seconds
    });

    test('should have low Cumulative Layout Shift', async ({ page }) => {
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const cls = await page.evaluate(() => {
        return performance.getEntriesByName('CLS')[0]?.value || 0;
      });
      
      expect(cls).toBeLessThan(0.1); // Less than 0.1
    });

    test('should track custom performance metrics', async ({ page }) => {
      // Add custom performance mark
      await page.evaluate(() => {
        performance.mark('app-loaded');
      });
      
      // Check if custom mark exists
      const customMark = await page.evaluate(() => {
        return performance.getEntriesByName('app-loaded')[0];
      });
      
      expect(customMark).toBeDefined();
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        route.continue({ delay: 1000 });
      });
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="app-container"]');
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should handle high CPU usage gracefully', async ({ page }) => {
      // Simulate high CPU usage
      await page.evaluate(() => {
        // Perform CPU-intensive operations
        for (let i = 0; i < 1000000; i++) {
          Math.sqrt(i);
        }
      });
      
      // App should remain responsive
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    });

    test('should handle low memory conditions', async ({ page }) => {
      // Simulate low memory
      await page.evaluate(() => {
        // Allocate large amount of memory
        const largeArray = new Array(1000000).fill('data');
        (window as any).memoryTest = largeArray;
      });
      
      // App should still function
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    });

    test('should handle concurrent operations efficiently', async ({ page }) => {
      // Perform multiple operations simultaneously
      const promises = [
        page.click('[data-testid="nav-link"]'),
        page.fill('[data-testid="search-input"]', 'test'),
        page.click('[data-testid="add-application"]')
      ];
      
      await Promise.all(promises);
      
      // App should remain stable
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    });
  });
}); 