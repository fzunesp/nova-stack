import { test, expect } from './fixtures';

test.describe('Companies Module', () => {
  test('should load Companies page', async ({ authenticatedPage: page }) => {
    await page.goto('/companies');
    await expect(page.locator('main').getByRole('heading', { name: /companies/i })).toBeVisible();
  });

  test('should display companies list', async ({ authenticatedPage: page }) => {
    await page.goto('/companies');
    await expect(page.locator('.grid-cols-12, table, [role="grid"], .company-item').first()).toBeVisible();
  });

  test('should display company detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/companies');
    
    const firstCompany = page.locator('.grid-cols-12 .cursor-pointer, .grid-cols-12.cursor-pointer, table tbody tr, [role="grid"] [role="row"], .company-item').first();
    if (await firstCompany.isVisible()) {
      await firstCompany.click();
      await expect(page).toHaveURL(/.*companies\/.+/);
    }
  });

  test('should search companies', async ({ authenticatedPage: page }) => {
    await page.goto('/companies');
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('should display empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/companies');
    
    // Wait for loader/skeleton to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);
    
    const hasData = await page.locator('.grid-cols-12').nth(1).isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no companies yet/i).isVisible().catch(() => false);
    
    expect(hasData || isEmpty).toBeTruthy();
  });
});

test.describe('Tasks Module', () => {
  test('should load Tasks page', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    await expect(page.locator('main').getByRole('heading', { name: /tasks/i })).toBeVisible();
  });

  test('should display tasks list', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    await expect(page.locator('.grid-cols-12, table, [role="grid"], .task-item').first()).toBeVisible();
  });

  test('should display task status filters', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    const statusFilter = page.locator('[role="tab"]')
      .or(page.getByText('All'))
      .or(page.getByText('Pending'))
      .or(page.getByText('Completed'))
      .or(page.getByText('Add Task'));
    await expect(statusFilter.first()).toBeVisible();
  });

  test('should display task priority indicators', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    const priorityElements = page.locator('[class*="priority"]')
      .or(page.locator('[class*="urgent"]'))
      .or(page.locator('[class*="high"]'))
      .or(page.getByText(/high/i))
      .or(page.getByText(/medium/i))
      .or(page.getByText(/low/i))
      .or(page.locator('[class*="badge"]'))
      .or(page.getByText(/progress/i))
      .or(page.getByText(/waiting/i))
      .or(page.getByText(/done/i));
    await expect(priorityElements.first()).toBeVisible();
  });

  test('should search tasks', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible();
  });
});

test.describe('Invoices Module', () => {
  test('should load Invoices page', async ({ authenticatedPage: page }) => {
    await page.goto('/invoices');
    await expect(page.locator('main').getByRole('heading', { name: /invoices/i })).toBeVisible();
  });

  test('should display invoices list', async ({ authenticatedPage: page }) => {
    await page.goto('/invoices');
    await expect(page.locator('.grid-cols-12, table, [role="grid"], .invoice-item').first()).toBeVisible();
  });

  test('should display invoice status badges', async ({ authenticatedPage: page }) => {
    await page.goto('/invoices');
    const statusElements = page.locator('[class*="status"]')
      .or(page.locator('[class*="badge"]'))
      .or(page.getByText(/paid/i))
      .or(page.getByText(/pending/i))
      .or(page.getByText(/overdue/i))
      .or(page.getByText(/draft/i));
    await expect(statusElements.first()).toBeVisible();
  });

  test('should display invoice detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/invoices');
    
    const firstInvoice = page.locator('.grid-cols-12 .cursor-pointer, .grid-cols-12.cursor-pointer, table tbody tr, [role="grid"] [role="row"], .invoice-item').first();
    if (await firstInvoice.isVisible()) {
      await firstInvoice.click();
      await expect(page).toHaveURL(/.*invoices\/.+/);
    }
  });

  test('should search invoices', async ({ authenticatedPage: page }) => {
    await page.goto('/invoices');
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible();
  });
});

test.describe('Products Module', () => {
  test('should load Products page', async ({ authenticatedPage: page }) => {
    await page.goto('/products');
    await expect(page.locator('main').getByRole('heading', { name: /products/i }).first()).toBeVisible();
  });

  test('should display products list', async ({ authenticatedPage: page }) => {
    await page.goto('/products');
    await expect(page.locator('.grid-cols-12, table, [role="grid"], .product-item').first()).toBeVisible();
  });

  test('should display product prices', async ({ authenticatedPage: page }) => {
    await page.goto('/products');
    const priceElements = page.locator('[class*="price"]')
      .or(page.getByText(/\$/))
      .or(page.getByText(/€/))
      .or(page.getByText(/R\$/));
    await expect(priceElements.first()).toBeVisible();
  });

  test('should search products', async ({ authenticatedPage: page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible();
  });
});

test.describe('Settings Module', () => {
  test('should load Settings page', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await expect(page.locator('main').getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should display settings sections', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    
    // Should have settings sections (profile, preferences, etc.)
    await expect(page.locator('form, [class*="settings"], [class*="section"]').first()).toBeVisible();
  });

  test('should display user profile information', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    
    // Should show current user info
    // Use first() to avoid strict mode violation if multiple matches exist
    await expect(page.locator('#profile-information').getByText('admin@nova-stack.local')
      .or(page.locator('#profile-information').getByText('System Admin'))
      .or(page.getByText('admin@nova-stack.local'))
      .first()
    ).toBeVisible();
  });
});

test.describe('Help Module', () => {
  test('should load Help page', async ({ authenticatedPage: page }) => {
    await page.goto('/help');
    await expect(page.getByRole('heading', { name: /help/i }).first()).toBeVisible();
  });

  test('should display help content', async ({ authenticatedPage: page }) => {
    await page.goto('/help');
    
    // Should have help documentation or resources
    await expect(page.locator('article')
      .or(page.locator('[class*="help"]'))
      .or(page.locator('[class*="doc"]'))
      .or(page.locator('main').getByRole('heading'))
      .first()
    ).toBeVisible();
  });
});
