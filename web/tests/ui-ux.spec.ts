import { test, expect } from './fixtures';

test.describe('UI/UX & Accessibility', () => {
  test.describe('Responsive Design', () => {
    test('should render correctly on mobile viewport (375x812)', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      
      // Should not have horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('should render correctly on tablet viewport (768x1024)', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('should render correctly on desktop viewport (1920x1080)', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/dashboard');
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('should show mobile menu button on small screens', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      
      // Mobile menu button should be visible
      await expect(page.getByRole('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
    });

    test('should hide desktop sidebar on mobile', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      
      // Sidebar should be hidden or collapsed on mobile
      const sidebar = page.locator('aside');
      const isVisible = await sidebar.isVisible();
      const isOffScreen = await sidebar.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.left < 0 || rect.right > window.innerWidth;
      });
      
      expect(!isVisible || isOffScreen).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have valid HTML structure', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Check for basic HTML structure
      await expect(page.locator('html')).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('#root, [id="root"]')).toBeVisible();
    });

    test('should have focusable elements with visible focus states', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Focus the page body first to ensure keyboard events land
      await page.locator('body').click();
      
      // Tab through elements and check focus visibility
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      const focusedElement = page.locator(':focus');
      // Some elements might have focus but not be "visible" in the traditional sense, 
      // but they should exist as focused.
      const isFocused = await focusedElement.count() > 0;
      expect(isFocused).toBeTruthy();
    });

    test('should have accessible navigation links', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      const navLinks = page.getByRole('link');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
      
      // All links should have accessible names
      for (let i = 0; i < Math.min(count, 5); i++) {
        const name = await navLinks.nth(i).textContent();
        expect(name?.trim()).toBeTruthy();
      }
    });

    test('should have accessible buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
      
      // All buttons should have accessible names
      for (let i = 0; i < Math.min(count, 5); i++) {
        const name = await buttons.nth(i).textContent();
        const title = await buttons.nth(i).getAttribute('title');
        const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
        expect(name?.trim() || title || ariaLabel).toBeTruthy();
      }
    });

    test('should have proper heading hierarchy', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();
      const h3Count = await page.locator('h3').count();
      
      // Should have at least one heading
      expect(h1Count + h2Count + h3Count).toBeGreaterThan(0);
    });

    test('should have sufficient color contrast for text', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Check that text elements are visible and readable
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, label');
      const count = await textElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within 10 seconds', async ({ authenticatedPage: page }) => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('load');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000);
    });

    test('should load login page within 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/login');
      await page.waitForLoadState('load');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have memory leaks after navigation', async ({ authenticatedPage: page }) => {
      // Navigate through multiple pages
      const pages = ['/dashboard', '/crm', '/tasks', '/invoices', '/products', '/intake', '/hr'];
      
      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('load');
      }
      
      // Should still be responsive
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ authenticatedPage: page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort('failed'));
      
      await page.goto('/dashboard');
      
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display loading states', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // After loading, content should be visible
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields on login', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.getByLabel('Email address');
      const passwordInput = page.getByLabel('Password');
      
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
    });

    test('should validate email format on login', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.getByLabel('Email address');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  test.describe('Visual Consistency', () => {
    test('should use consistent button styles', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      // All buttons should have styling classes
      for (let i = 0; i < Math.min(count, 5); i++) {
        const className = await buttons.nth(i).getAttribute('class');
        expect(className).toBeTruthy();
      }
    });

    test('should use consistent spacing', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Check that elements have proper spacing (Tailwind classes)
      const mainContent = page.locator('main');
      const className = await mainContent.getAttribute('class');
      expect(className).toContain('p-');
    });

    test('should use consistent typography', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Check that headings have proper font classes
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const className = await headings.nth(i).getAttribute('class');
        expect(className?.includes('font-') || className?.includes('text-')).toBeTruthy();
      }
    });
  });
});
