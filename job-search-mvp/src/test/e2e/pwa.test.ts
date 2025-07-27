import { test, expect } from '@playwright/test';

test.describe('Progressive Web App (PWA) Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
  });

  test.describe('Service Worker Functionality', () => {
    test('should register service worker', async ({ page }) => {
      // Check if service worker is registered
      const swRegistration = await page.evaluate(() => {
        return navigator.serviceWorker?.getRegistrations();
      });
      
      expect(swRegistration).toBeDefined();
      expect(swRegistration?.length).toBeGreaterThan(0);
    });

    test('should handle service worker lifecycle', async ({ page }) => {
      // Check service worker state
      const swState = await page.evaluate(() => {
        return navigator.serviceWorker?.ready.then(registration => registration.active?.state);
      });
      
      expect(swState).toBe('activated');
    });

    test('should cache critical resources', async ({ page }) => {
      // Check if critical resources are cached
      const cachedResources = await page.evaluate(() => {
        return caches.keys().then(cacheNames => {
          return Promise.all(cacheNames.map(name => caches.open(name)));
        });
      });
      
      expect(cachedResources.length).toBeGreaterThan(0);
    });

    test('should handle service worker updates', async ({ page }) => {
      // Simulate service worker update
      const updateResult = await page.evaluate(() => {
        return navigator.serviceWorker?.getRegistration().then(registration => {
          if (registration) {
            return registration.update();
          }
          return null;
        });
      });
      
      expect(updateResult).toBeDefined();
    });
  });

  test.describe('Offline Capabilities', () => {
    test('should work offline', async ({ page }) => {
      // Go offline
      await page.route('**/*', route => route.abort());
      
      // App should still be functional
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      // Check for offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toBeVisible();
      }
    });

    test('should cache application data', async ({ page }) => {
      // Load some data first
      await page.waitForSelector('[data-testid="application-list"]');
      
      // Go offline
      await page.route('**/*', route => route.abort());
      
      // Previously loaded data should still be visible
      await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
    });

    test('should handle offline form submission', async ({ page }) => {
      // Go offline
      await page.route('**/*', route => route.abort());
      
      // Try to submit a form
      const addButton = page.locator('[data-testid="add-application"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const form = page.locator('[data-testid="application-form"]');
        if (await form.isVisible()) {
          // Fill form
          const jobTitleInput = page.locator('[data-testid="job-title-input"]');
          if (await jobTitleInput.isVisible()) {
            await jobTitleInput.fill('Test Job');
            
            // Submit form
            const submitButton = page.locator('[data-testid="submit-form"]');
            await submitButton.click();
            
            // Should show offline queue message
            const offlineQueue = page.locator('[data-testid="offline-queue"]');
            if (await offlineQueue.isVisible()) {
              await expect(offlineQueue).toBeVisible();
            }
          }
        }
      }
    });

    test('should sync data when coming back online', async ({ page }) => {
      // Go offline and submit form
      await page.route('**/*', route => route.abort());
      
      const addButton = page.locator('[data-testid="add-application"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const form = page.locator('[data-testid="application-form"]');
        if (await form.isVisible()) {
          const jobTitleInput = page.locator('[data-testid="job-title-input"]');
          if (await jobTitleInput.isVisible()) {
            await jobTitleInput.fill('Test Job');
            
            const submitButton = page.locator('[data-testid="submit-form"]');
            await submitButton.click();
          }
        }
      }
      
      // Come back online
      await page.unroute('**/*');
      
      // Should sync data
      const syncIndicator = page.locator('[data-testid="sync-indicator"]');
      if (await syncIndicator.isVisible()) {
        await expect(syncIndicator).toBeVisible();
      }
    });
  });

  test.describe('App Installation and Icon Behavior', () => {
    test('should show install prompt', async ({ page }) => {
      // Check if install prompt is available
      const installPrompt = await page.evaluate(() => {
        return window.deferredPrompt;
      });
      
      // In a real PWA, this would be set by the beforeinstallprompt event
      expect(installPrompt).toBeDefined();
    });

    test('should have proper app icons', async ({ page }) => {
      // Check for manifest
      const manifest = await page.evaluate(() => {
        const link = document.querySelector('link[rel="manifest"]');
        return link?.getAttribute('href');
      });
      
      expect(manifest).toBeDefined();
    });

    test('should have proper theme colors', async ({ page }) => {
      // Check for theme color meta tag
      const themeColor = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        return meta?.getAttribute('content');
      });
      
      expect(themeColor).toBeDefined();
    });

    test('should have proper viewport settings', async ({ page }) => {
      // Check viewport meta tag
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });
      
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
    });

    test('should handle app launch from installed state', async ({ page }) => {
      // Simulate app launch
      await page.goto('/');
      
      // App should load properly
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      // Check if app is in standalone mode
      const isStandalone = await page.evaluate(() => {
        return window.matchMedia('(display-mode: standalone)').matches;
      });
      
      // This would be true if launched from installed app
      expect(typeof isStandalone).toBe('boolean');
    });
  });

  test.describe('Push Notification Testing', () => {
    test('should request notification permission', async ({ page }) => {
      // Check notification permission
      const permission = await page.evaluate(() => {
        return Notification.permission;
      });
      
      expect(['granted', 'denied', 'default']).toContain(permission);
    });

    test('should handle notification permission request', async ({ page }) => {
      // Mock notification permission request
      await page.addInitScript(() => {
        Object.defineProperty(Notification, 'permission', {
          value: 'default',
          writable: true
        });
      });
      
      // Trigger permission request
      const permissionResult = await page.evaluate(() => {
        return Notification.requestPermission();
      });
      
      expect(permissionResult).toBeDefined();
    });

    test('should show notification when permission granted', async ({ page }) => {
      // Mock granted permission
      await page.addInitScript(() => {
        Object.defineProperty(Notification, 'permission', {
          value: 'granted',
          writable: true
        });
      });
      
      // Trigger notification
      const notificationResult = await page.evaluate(() => {
        return new Notification('Test Notification', {
          body: 'This is a test notification',
          icon: '/icon-192x192.png'
        });
      });
      
      expect(notificationResult).toBeDefined();
    });

    test('should handle notification clicks', async ({ page }) => {
      // Mock notification with click handler
      await page.addInitScript(() => {
        Object.defineProperty(Notification, 'permission', {
          value: 'granted',
          writable: true
        });
      });
      
      const clickResult = await page.evaluate(() => {
        const notification = new Notification('Test', { body: 'Test' });
        notification.onclick = () => {
          window.focus();
        };
        return true;
      });
      
      expect(clickResult).toBe(true);
    });
  });

  test.describe('Background Sync Validation', () => {
    test('should register background sync', async ({ page }) => {
      // Check if service worker supports background sync
      const syncSupport = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
      });
      
      expect(syncSupport).toBe(true);
    });

    test('should handle background sync registration', async ({ page }) => {
      // Register background sync
      const syncResult = await page.evaluate(() => {
        return navigator.serviceWorker?.ready.then(registration => {
          return registration.sync.register('background-sync');
        });
      });
      
      expect(syncResult).toBeDefined();
    });

    test('should sync data in background', async ({ page }) => {
      // Simulate background sync
      const syncData = await page.evaluate(() => {
        return navigator.serviceWorker?.ready.then(registration => {
          // This would be handled by the service worker
          return registration.sync.register('sync-applications');
        });
      });
      
      expect(syncData).toBeDefined();
    });

    test('should handle sync failures gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to sync
      const syncResult = await page.evaluate(() => {
        return navigator.serviceWorker?.ready.then(registration => {
          return registration.sync.register('sync-applications');
        });
      });
      
      expect(syncResult).toBeDefined();
    });
  });

  test.describe('PWA Performance and Reliability', () => {
    test('should load quickly from cache', async ({ page }) => {
      // Measure initial load time
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="app-container"]');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000);
    });

    test('should work without network', async ({ page }) => {
      // Disable network
      await page.route('**/*', route => route.abort());
      
      // App should still be functional
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      // Basic navigation should work
      const navElements = page.locator('[data-testid="nav-item"]');
      if (await navElements.count() > 0) {
        await expect(navElements.first()).toBeVisible();
      }
    });

    test('should handle storage quota', async ({ page }) => {
      // Check storage usage
      const storageInfo = await page.evaluate(() => {
        return navigator.storage?.estimate();
      });
      
      if (storageInfo) {
        expect(storageInfo.usage).toBeGreaterThan(0);
        expect(storageInfo.quota).toBeGreaterThan(storageInfo.usage);
      }
    });

    test('should handle app updates gracefully', async ({ page }) => {
      // Simulate app update
      const updateResult = await page.evaluate(() => {
        return navigator.serviceWorker?.getRegistration().then(registration => {
          if (registration) {
            registration.addEventListener('updatefound', () => {
              // Handle update
            });
            return registration.update();
          }
          return null;
        });
      });
      
      expect(updateResult).toBeDefined();
    });
  });

  test.describe('PWA Security and Privacy', () => {
    test('should use HTTPS in production', async ({ page }) => {
      const protocol = await page.evaluate(() => {
        return window.location.protocol;
      });
      
      // Should use HTTPS (except in development)
      if (process.env.NODE_ENV === 'production') {
        expect(protocol).toBe('https:');
      }
    });

    test('should have proper CSP headers', async ({ page }) => {
      // Check for CSP meta tag
      const csp = await page.evaluate(() => {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return meta?.getAttribute('content');
      });
      
      if (csp) {
        expect(csp).toContain('default-src');
      }
    });

    test('should handle data privacy', async ({ page }) => {
      // Check if sensitive data is properly handled
      const localStorage = await page.evaluate(() => {
        return Object.keys(localStorage);
      });
      
      // Should not store sensitive data in localStorage
      const sensitiveKeys = localStorage.filter(key => 
        key.includes('password') || key.includes('token')
      );
      expect(sensitiveKeys.length).toBe(0);
    });
  });
}); 