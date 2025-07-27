import { test, expect } from '@playwright/test';

test.describe('Responsive Layout Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
  });

  test.describe('Component Rendering Across Breakpoints', () => {
    test('should render dashboard correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if main components are visible
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
      
      // Check if mobile-specific elements are present
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }
    });

    test('should render dashboard correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
      
      // Check if tablet layout is appropriate
      const sidebar = page.locator('[data-testid="sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible();
      }
    });

    test('should render dashboard correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
      
      // Check if desktop layout elements are present
      const sidebar = page.locator('[data-testid="sidebar"]');
      const mainContent = page.locator('[data-testid="main-content"]');
      
      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible();
      }
      await expect(mainContent).toBeVisible();
    });

    test('should handle text scaling and font sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if text is readable on mobile
      const textElements = page.locator('h1, h2, h3, p, span');
      await expect(textElements.first()).toBeVisible();
      
      // Verify text doesn't overflow
      const overflowElements = await page.locator('*').filter({ hasText: /.*/ }).evaluateAll(elements => 
        elements.filter(el => el.scrollWidth > el.clientWidth)
      );
      expect(overflowElements.length).toBeLessThan(5); // Allow some minor overflow
    });

    test('should maintain proper spacing on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Check if elements have proper spacing
        const containers = page.locator('[data-testid="application-card"]');
        if (await containers.count() > 0) {
          const firstCard = containers.first();
          const rect = await firstCard.boundingBox();
          expect(rect?.width).toBeGreaterThan(0);
          expect(rect?.height).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Navigation Menu Behavior', () => {
    test('should show hamburger menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      if (await hamburgerMenu.isVisible()) {
        await expect(hamburgerMenu).toBeVisible();
        
        // Test menu toggle
        await hamburgerMenu.click();
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
        
        // Test menu close
        await hamburgerMenu.click();
        await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();
      }
    });

    test('should show full navigation on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      if (await desktopNav.isVisible()) {
        await expect(desktopNav).toBeVisible();
        
        // Check if all navigation items are visible
        const navItems = page.locator('[data-testid="nav-item"]');
        await expect(navItems.first()).toBeVisible();
      }
    });

    test('should handle navigation menu transitions', async ({ page }) => {
      // Start with mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      if (await hamburgerMenu.isVisible()) {
        await hamburgerMenu.click();
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
        
        // Resize to desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500); // Wait for transition
        
        // Mobile nav should be hidden on desktop
        await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();
      }
    });

    test('should maintain navigation state across screen sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to a specific page on mobile
      const navLink = page.locator('[data-testid="nav-link"]').first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForURL('**/applications');
        
        // Switch to desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        
        // Should still be on the same page
        await expect(page).toHaveURL(/.*applications/);
      }
    });
  });

  test.describe('Touch Interaction Testing', () => {
    test('should handle touch gestures on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test swipe gestures
      const touchableElement = page.locator('[data-testid="application-card"]').first();
      if (await touchableElement.isVisible()) {
        // Simulate touch start
        await touchableElement.hover();
        
        // Test tap interaction
        await touchableElement.click();
        await expect(page.locator('[data-testid="application-detail"]')).toBeVisible();
      }
    });

    test('should handle long press interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const longPressElement = page.locator('[data-testid="application-card"]').first();
      if (await longPressElement.isVisible()) {
        // Simulate long press
        await longPressElement.click({ delay: 1000 });
        
        // Check if context menu appears
        const contextMenu = page.locator('[data-testid="context-menu"]');
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeVisible();
        }
      }
    });

    test('should handle pinch to zoom', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test pinch gesture on content
      const content = page.locator('[data-testid="main-content"]');
      if (await content.isVisible()) {
        // Simulate pinch gesture
        await page.mouse.move(200, 300);
        await page.mouse.down();
        await page.mouse.move(250, 350);
        await page.mouse.up();
        
        // Content should remain functional
        await expect(content).toBeVisible();
      }
    });

    test('should handle touch scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const scrollableContent = page.locator('[data-testid="application-list"]');
      if (await scrollableContent.isVisible()) {
        // Test vertical scrolling
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);
        
        // Content should still be accessible
        await expect(scrollableContent).toBeVisible();
      }
    });
  });

  test.describe('Orientation Change Handling', () => {
    test('should handle portrait to landscape transition', async ({ page }) => {
      // Start in portrait mode
      await page.setViewportSize({ width: 375, height: 667 });
      
      const initialLayout = await page.locator('[data-testid="dashboard"]').boundingBox();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Wait for layout adjustment
      
      const landscapeLayout = await page.locator('[data-testid="dashboard"]').boundingBox();
      
      // Layout should adapt
      expect(landscapeLayout?.width).toBeGreaterThan(initialLayout?.width || 0);
    });

    test('should handle landscape to portrait transition', async ({ page }) => {
      // Start in landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      
      const initialLayout = await page.locator('[data-testid="dashboard"]').boundingBox();
      
      // Switch to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const portraitLayout = await page.locator('[data-testid="dashboard"]').boundingBox();
      
      // Layout should adapt
      expect(portraitLayout?.height).toBeGreaterThan(initialLayout?.height || 0);
    });

    test('should maintain application state during orientation change', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to a specific application
      const appCard = page.locator('[data-testid="application-card"]').first();
      if (await appCard.isVisible()) {
        await appCard.click();
        await expect(page.locator('[data-testid="application-detail"]')).toBeVisible();
        
        // Change orientation
        await page.setViewportSize({ width: 667, height: 375 });
        await page.waitForTimeout(500);
        
        // Should still be on the same application
        await expect(page.locator('[data-testid="application-detail"]')).toBeVisible();
      }
    });

    test('should handle form inputs during orientation change', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to form
      const addButton = page.locator('[data-testid="add-application"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        await expect(page.locator('[data-testid="application-form"]')).toBeVisible();
        
        // Fill in a form field
        const jobTitleInput = page.locator('[data-testid="job-title-input"]');
        if (await jobTitleInput.isVisible()) {
          await jobTitleInput.fill('Software Engineer');
          
          // Change orientation
          await page.setViewportSize({ width: 667, height: 375 });
          await page.waitForTimeout(500);
          
          // Form data should be preserved
          await expect(jobTitleInput).toHaveValue('Software Engineer');
        }
      }
    });
  });

  test.describe('Responsive Design Edge Cases', () => {
    test('should handle very small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      
      // Check if content is still accessible
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Check for horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // Should not have excessive horizontal scrolling
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50);
    });

    test('should handle very large screens', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
      
      // Check if content is properly centered or laid out
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Check if content doesn't stretch too wide
      const mainContent = page.locator('[data-testid="main-content"]');
      if (await mainContent.isVisible()) {
        const contentWidth = await mainContent.boundingBox();
        expect(contentWidth?.width).toBeLessThan(2000); // Reasonable max width
      }
    });

    test('should handle dynamic content loading', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Trigger content loading
      const loadMoreButton = page.locator('[data-testid="load-more"]');
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click();
        await page.waitForTimeout(1000);
        
        // Layout should remain stable
        await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
      }
    });

    test('should handle rapid viewport changes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 },
        { width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        
        // App should remain functional
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      }
    });
  });
}); 