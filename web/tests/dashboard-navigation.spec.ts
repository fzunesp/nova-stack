import { test, expect } from './fixtures';

async function dismissOverlays(page: any) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.locator('main').click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(300);
}

async function navigateTo(page: any, linkText: string, urlPattern: RegExp) {
  await dismissOverlays(page);
  await page.locator('aside a').filter({ hasText: linkText }).click({ force: true });
  // Client-side navigation - wait for URL to change
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(urlPattern);
}

test.describe('Dashboard & Navigation', () => {
  test('should load dashboard page successfully', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display sidebar with all navigation items', async ({ authenticatedPage: page }) => {
    const navItems = ['Dashboard', 'Companies', 'CRM', 'Tasks', 'Invoices', 'Products', 'Intake', 'HR'];

    for (const item of navItems) {
      const link = page.locator('aside a').filter({ hasText: item });
      await expect(link).toBeVisible();
    }
  });

  test('should navigate to Dashboard page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Dashboard', /.*dashboard/);
  });

  test('should navigate to Companies page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Companies', /.*companies/);
  });

  test('should navigate to CRM page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'CRM', /.*crm/);
  });

  test('should navigate to Tasks page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Tasks', /.*tasks/);
  });

  test('should navigate to Invoices page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Invoices', /.*invoices/);
  });

  test('should navigate to Products page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Products', /.*products/);
  });

  test('should navigate to Intake page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Intake', /.*intake/);
  });

  test('should navigate to HR page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'HR', /.*hr/);
  });

  test('should navigate to Settings page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Settings', /.*settings/);
  });

  test('should navigate to Help page', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Help', /.*help/);
  });

  test('should highlight active navigation item', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'Tasks', /.*tasks/);
    
    const activeLink = page.locator('aside a').filter({ hasText: 'Tasks' });
    const className = await activeLink.getAttribute('class');
    expect(className?.includes('bg-[rgb(var(--ns-accent))]')).toBeTruthy();
  });

  test('should display user info in sidebar', async ({ authenticatedPage: page }) => {
    await expect(page.locator('aside').getByText('System Admin').first()).toBeVisible();
    await expect(page.locator('aside').getByText('admin@nova-stack.local').first()).toBeVisible();
  });

  test('should display NovaStack logo', async ({ authenticatedPage: page }) => {
    await expect(page.locator('aside').getByText('NovaStack').first()).toBeVisible();
  });

  test('should display topbar with page title', async ({ authenticatedPage: page }) => {
    await navigateTo(page, 'CRM', /.*crm/);
    await expect(page.locator('header h1').first()).toBeVisible();
  });

  test('should display search button in topbar', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Search... ⌘K' })).toBeVisible();
  });

  test('should display notifications bell', async ({ authenticatedPage: page }) => {
    await expect(page.locator('header').getByTitle('Notifications')).toBeVisible();
  });

  test('should display quick create button', async ({ authenticatedPage: page }) => {
    await expect(page.locator('header').getByRole('button', { name: /new/i })).toBeVisible();
  });

  test('should open quick create dropdown', async ({ authenticatedPage: page }) => {
    await dismissOverlays(page);
    await page.locator('header').getByRole('button', { name: /new/i }).click({ force: true });
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Create new').first()).toBeVisible();
    await expect(page.locator('text=Company').first()).toBeVisible();
    await expect(page.locator('text=Contact').first()).toBeVisible();
    await expect(page.locator('text=Deal').first()).toBeVisible();
  });

  test('should redirect unknown routes to dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/nonexistent-route');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
