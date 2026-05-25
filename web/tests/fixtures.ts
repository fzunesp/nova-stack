import { test as base, expect, type Page } from '@playwright/test';

// Test user credentials (app users, NOT PocketBase superuser)
export const TEST_USERS = {
  admin: {
    email: 'admin@nova-stack.local',
    password: 'password123',
    role: 'admin',
  },
  hr: {
    email: 'sarah.hr@nova-stack.local',
    password: 'password123',
    role: 'hr',
  },
  user: {
    email: 'mark.sales@nova-stack.local',
    password: 'password123',
    role: 'user',
  },
} as const;

// Base test with authentication fixture
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // CRITICAL: Set localStorage flag BEFORE any page loads so FirstRunSetupWizard never renders
    await page.addInitScript(() => {
      // Intercept localStorage.setItem to capture the user ID, then set all flags
      const origSet = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key: string, value: string) {
        origSet(key, value);
        if (key === 'pb_auth') {
          try {
            const auth = JSON.parse(value);
            if (auth.record?.id) {
              origSet(`novastack_first_run_completed_${auth.record.id}`, 'true');
            }
          } catch {}
        }
      };
      // Pre-set a catch-all flag
      origSet('novastack_first_run_completed_all', 'true');
    });

    // Login
    await page.goto('/login');
    await page.getByLabel('Email address').fill(TEST_USERS.admin.email);
    await page.getByLabel('Password').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(500);
    
    // Final safety: remove wizard from DOM if it somehow rendered
    await page.evaluate(() => {
      const wizards = document.querySelectorAll('div.fixed.inset-0.z-50');
      wizards.forEach(w => w.remove());
      // Also set the flag with actual user ID from pb auth
      try {
        const pbAuth = JSON.parse(localStorage.getItem('pb_auth') || '{}');
        if (pbAuth.record?.id) {
          localStorage.setItem(`novastack_first_run_completed_${pbAuth.record.id}`, 'true');
        }
      } catch {}
    });
    
    await use(page);
  },
});

export { expect };
