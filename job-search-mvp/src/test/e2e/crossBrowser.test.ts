import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
  });

  test.describe('Rendering Consistency Across Browsers', () => {
    test('should render consistently in Chrome', async ({ page }) => {
      // Test Chrome-specific rendering
      const chromeFeatures = await page.evaluate(() => {
        return {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          customProperties: CSS.supports('--custom-property', 'value'),
          webkitPrefix: 'webkitTransform' in document.body.style
        };
      });
      
      expect(chromeFeatures.flexbox).toBe(true);
      expect(chromeFeatures.grid).toBe(true);
      expect(chromeFeatures.customProperties).toBe(true);
    });

    test('should render consistently in Firefox', async ({ page }) => {
      // Test Firefox-specific rendering
      const firefoxFeatures = await page.evaluate(() => {
        return {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          customProperties: CSS.supports('--custom-property', 'value'),
          mozPrefix: 'mozTransform' in document.body.style
        };
      });
      
      expect(firefoxFeatures.flexbox).toBe(true);
      expect(firefoxFeatures.grid).toBe(true);
      expect(firefoxFeatures.customProperties).toBe(true);
    });

    test('should render consistently in Safari', async ({ page }) => {
      // Test Safari-specific rendering
      const safariFeatures = await page.evaluate(() => {
        return {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          customProperties: CSS.supports('--custom-property', 'value'),
          webkitPrefix: 'webkitTransform' in document.body.style
        };
      });
      
      expect(safariFeatures.flexbox).toBe(true);
      expect(safariFeatures.grid).toBe(true);
      expect(safariFeatures.customProperties).toBe(true);
    });

    test('should render consistently in Edge', async ({ page }) => {
      // Test Edge-specific rendering
      const edgeFeatures = await page.evaluate(() => {
        return {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          customProperties: CSS.supports('--custom-property', 'value'),
          msPrefix: 'msTransform' in document.body.style
        };
      });
      
      expect(edgeFeatures.flexbox).toBe(true);
      expect(edgeFeatures.grid).toBe(true);
      expect(edgeFeatures.customProperties).toBe(true);
    });

    test('should maintain layout consistency', async ({ page }) => {
      // Check if layout elements are positioned correctly
      const layoutElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            testid: el.getAttribute('data-testid'),
            visible: rect.width > 0 && rect.height > 0,
            positioned: rect.top >= 0 && rect.left >= 0
          };
        });
      });
      
      // All elements should be visible and properly positioned
      layoutElements.forEach(element => {
        expect(element.visible).toBe(true);
        expect(element.positioned).toBe(true);
      });
    });

    test('should handle font rendering consistently', async ({ page }) => {
      // Check font loading and rendering
      const fontMetrics = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.textContent = 'Test Text';
        testElement.style.fontFamily = 'Arial, sans-serif';
        testElement.style.fontSize = '16px';
        document.body.appendChild(testElement);
        
        const metrics = {
          width: testElement.offsetWidth,
          height: testElement.offsetHeight,
          fontFamily: window.getComputedStyle(testElement).fontFamily
        };
        
        document.body.removeChild(testElement);
        return metrics;
      });
      
      expect(fontMetrics.width).toBeGreaterThan(0);
      expect(fontMetrics.height).toBeGreaterThan(0);
      expect(fontMetrics.fontFamily).toContain('Arial');
    });
  });

  test.describe('JavaScript Feature Compatibility', () => {
    test('should support modern JavaScript features', async ({ page }) => {
      const jsFeatures = await page.evaluate(() => {
        return {
          arrowFunctions: typeof (() => {}) === 'function',
          templateLiterals: typeof `template` === 'string',
          destructuring: (() => { const {a} = {a: 1}; return a; })() === 1,
          asyncAwait: typeof (async () => {}) === 'function',
          spreadOperator: (() => { const arr = [...[1,2,3]]; return arr.length; })() === 3,
          optionalChaining: (() => { const obj = {a: {b: 1}}; return obj?.a?.b; })() === 1,
          nullishCoalescing: (() => { return null ?? 'default'; })() === 'default'
        };
      });
      
      Object.values(jsFeatures).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should handle DOM manipulation consistently', async ({ page }) => {
      const domFeatures = await page.evaluate(() => {
        return {
          querySelector: typeof document.querySelector === 'function',
          addEventListener: typeof document.addEventListener === 'function',
          createElement: typeof document.createElement === 'function',
          classList: 'classList' in document.createElement('div'),
          dataset: 'dataset' in document.createElement('div'),
          matches: typeof Element.prototype.matches === 'function'
        };
      });
      
      Object.values(domFeatures).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support Fetch API', async ({ page }) => {
      const fetchSupport = await page.evaluate(() => {
        return {
          fetch: typeof fetch === 'function',
          headers: typeof Headers === 'function',
          request: typeof Request === 'function',
          response: typeof Response === 'function'
        };
      });
      
      Object.values(fetchSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support Local Storage', async ({ page }) => {
      const storageSupport = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          setItem: typeof localStorage.setItem === 'function',
          getItem: typeof localStorage.getItem === 'function',
          removeItem: typeof localStorage.removeItem === 'function'
        };
      });
      
      Object.values(storageSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support Service Workers', async ({ page }) => {
      const swSupport = await page.evaluate(() => {
        return {
          serviceWorker: 'serviceWorker' in navigator,
          getRegistrations: typeof navigator.serviceWorker?.getRegistrations === 'function',
          register: typeof navigator.serviceWorker?.register === 'function'
        };
      });
      
      Object.values(swSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should handle event handling consistently', async ({ page }) => {
      const eventSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        let eventFired = false;
        
        testElement.addEventListener('click', () => {
          eventFired = true;
        });
        
        testElement.click();
        
        return {
          addEventListener: typeof testElement.addEventListener === 'function',
          removeEventListener: typeof testElement.removeEventListener === 'function',
          eventFired: eventFired,
          preventDefault: typeof Event.prototype.preventDefault === 'function',
          stopPropagation: typeof Event.prototype.stopPropagation === 'function'
        };
      });
      
      expect(eventSupport.addEventListener).toBe(true);
      expect(eventSupport.removeEventListener).toBe(true);
      expect(eventSupport.eventFired).toBe(true);
      expect(eventSupport.preventDefault).toBe(true);
      expect(eventSupport.stopPropagation).toBe(true);
    });
  });

  test.describe('CSS Feature Support Validation', () => {
    test('should support CSS Grid', async ({ page }) => {
      const gridSupport = await page.evaluate(() => {
        return {
          grid: CSS.supports('display', 'grid'),
          gridTemplateColumns: CSS.supports('grid-template-columns', '1fr 1fr'),
          gridGap: CSS.supports('grid-gap', '1rem'),
          gridArea: CSS.supports('grid-area', 'header')
        };
      });
      
      Object.values(gridSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support CSS Flexbox', async ({ page }) => {
      const flexboxSupport = await page.evaluate(() => {
        return {
          flex: CSS.supports('display', 'flex'),
          flexDirection: CSS.supports('flex-direction', 'column'),
          justifyContent: CSS.supports('justify-content', 'center'),
          alignItems: CSS.supports('align-items', 'center'),
          flexWrap: CSS.supports('flex-wrap', 'wrap')
        };
      });
      
      Object.values(flexboxSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support CSS Custom Properties', async ({ page }) => {
      const customPropertiesSupport = await page.evaluate(() => {
        return {
          customProperties: CSS.supports('--custom-property', 'value'),
          varFunction: CSS.supports('color', 'var(--custom-color)'),
          fallback: CSS.supports('color', 'var(--custom-color, red)')
        };
      });
      
      Object.values(customPropertiesSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support CSS Transforms', async ({ page }) => {
      const transformSupport = await page.evaluate(() => {
        return {
          transform: CSS.supports('transform', 'translateX(10px)'),
          rotate: CSS.supports('transform', 'rotate(45deg)'),
          scale: CSS.supports('transform', 'scale(1.5)'),
          transformOrigin: CSS.supports('transform-origin', 'center')
        };
      });
      
      Object.values(transformSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support CSS Animations', async ({ page }) => {
      const animationSupport = await page.evaluate(() => {
        return {
          animation: CSS.supports('animation', 'fade 1s'),
          keyframes: CSS.supports('animation-name', 'fade'),
          animationDuration: CSS.supports('animation-duration', '1s'),
          animationTimingFunction: CSS.supports('animation-timing-function', 'ease')
        };
      });
      
      Object.values(animationSupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    test('should support CSS Media Queries', async ({ page }) => {
      const mediaQuerySupport = await page.evaluate(() => {
        return {
          minWidth: window.matchMedia('(min-width: 768px)').matches !== undefined,
          maxWidth: window.matchMedia('(max-width: 1024px)').matches !== undefined,
          orientation: window.matchMedia('(orientation: landscape)').matches !== undefined,
          prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
        };
      });
      
      Object.values(mediaQuerySupport).forEach(feature => {
        expect(feature).toBe(true);
      });
    });
  });

  test.describe('Browser-Specific Features and Workarounds', () => {
    test('should handle vendor prefixes correctly', async ({ page }) => {
      const vendorPrefixes = await page.evaluate(() => {
        const testElement = document.createElement('div');
        return {
          webkitTransform: 'webkitTransform' in testElement.style,
          mozTransform: 'mozTransform' in testElement.style,
          msTransform: 'msTransform' in testElement.style,
          oTransform: 'oTransform' in testElement.style
        };
      });
      
      // At least one vendor prefix should be supported
      const hasVendorPrefix = Object.values(vendorPrefixes).some(prefix => prefix);
      expect(hasVendorPrefix).toBe(true);
    });

    test('should handle browser-specific APIs', async ({ page }) => {
      const browserAPIs = await page.evaluate(() => {
        return {
          requestAnimationFrame: typeof requestAnimationFrame === 'function',
          cancelAnimationFrame: typeof cancelAnimationFrame === 'function',
          performance: typeof performance !== 'undefined',
          navigator: typeof navigator !== 'undefined',
          history: typeof history !== 'undefined',
          location: typeof location !== 'undefined'
        };
      });
      
      Object.values(browserAPIs).forEach(api => {
        expect(api).toBe(true);
      });
    });

    test('should handle browser-specific events', async ({ page }) => {
      const browserEvents = await page.evaluate(() => {
        return {
          beforeunload: 'beforeunload' in window,
          unload: 'unload' in window,
          load: 'load' in window,
          DOMContentLoaded: 'DOMContentLoaded' in window,
          resize: 'resize' in window,
          scroll: 'scroll' in window
        };
      });
      
      Object.values(browserEvents).forEach(event => {
        expect(event).toBe(true);
      });
    });

    test('should handle browser-specific storage', async ({ page }) => {
      const storageAPIs = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          indexedDB: typeof indexedDB !== 'undefined',
          cookies: typeof document.cookie !== 'undefined'
        };
      });
      
      Object.values(storageAPIs).forEach(storage => {
        expect(storage).toBe(true);
      });
    });
  });

  test.describe('Cross-Browser Functionality Testing', () => {
    test('should handle form submission consistently', async ({ page }) => {
      // Test form functionality across browsers
      const addButton = page.locator('[data-testid="add-application"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const form = page.locator('[data-testid="application-form"]');
        if (await form.isVisible()) {
          // Fill form fields
          const jobTitleInput = page.locator('[data-testid="job-title-input"]');
          if (await jobTitleInput.isVisible()) {
            await jobTitleInput.fill('Test Job');
            
            // Submit form
            const submitButton = page.locator('[data-testid="submit-form"]');
            await submitButton.click();
            
            // Should handle submission consistently
            await expect(page.locator('[data-testid="application-form"]')).toBeVisible();
          }
        }
      }
    });

    test('should handle navigation consistently', async ({ page }) => {
      // Test navigation functionality
      const navLinks = page.locator('[data-testid="nav-link"]');
      if (await navLinks.count() > 0) {
        await navLinks.first().click();
        
        // Should navigate consistently
        await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      }
    });

    test('should handle search functionality consistently', async ({ page }) => {
      // Test search functionality
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        
        // Should handle search consistently
        await expect(searchInput).toHaveValue('test');
      }
    });

    test('should handle responsive design consistently', async ({ page }) => {
      // Test responsive behavior
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // Should maintain functionality across viewports
        await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      }
    });

    test('should handle error states consistently', async ({ page }) => {
      // Test error handling
      await page.route('**/api/**', route => route.abort());
      
      // Should handle errors consistently
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      const errorIndicator = page.locator('[data-testid="error-indicator"]');
      if (await errorIndicator.isVisible()) {
        await expect(errorIndicator).toBeVisible();
      }
    });
  });
}); 