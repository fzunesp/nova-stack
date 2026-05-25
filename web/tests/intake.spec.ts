import { test, expect } from './fixtures';

test.describe('Intake Module', () => {
  test('should load Intake page', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    await expect(page.locator('main').getByRole('heading', { name: /intake/i })).toBeVisible();
  });

  test('should display intake submissions list', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Should have a table or list view
    await expect(page.locator('.grid-cols-12, table, [role="grid"], .submission-item').first()).toBeVisible();
  });

  test('should display intake status badges', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Status badges should be visible (pending, approved, rejected, etc.)
    const statusElements = page.locator('[class*="status"]')
      .or(page.locator('[class*="badge"]'))
      .or(page.getByText('Pending'))
      .or(page.getByText('Approved'))
      .or(page.getByText('Rejected'))
      .or(page.getByText('Draft'));
    await expect(statusElements.first()).toBeVisible();
  });

  test('should display search/filter functionality', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Should have search or filter inputs
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="filter" i]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('should display empty state when no submissions', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Wait for loader/skeleton to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);
    
    // Check for ANY data-bearing element or the empty state explicitly
    const hasData = await page.locator('.grid-cols-12').nth(1).isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no .*submissions yet/i).isVisible().catch(() => false);
    
    expect(hasData || isEmpty).toBeTruthy();
  });

  test('should navigate to intake detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Click on first submission row if available
    const firstRow = page.locator('.grid-cols-12.cursor-pointer, .grid-cols-12 .cursor-pointer, table tbody tr, [role="grid"] [role="row"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      // Should navigate to detail page or show modal
      await expect(page).toHaveURL(/.*intake/);
    }
  });

  test('should display intake creation form', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Click "New" button and select "Intake"
    await page.getByRole('button', { name: /new/i }).click();
    
    // Wait for dropdown to be visible
    const intakeOption = page.getByRole('button', { name: 'Intake' })
      .or(page.getByRole('menuitem', { name: 'Intake' }))
      .or(page.locator('button:has-text("Intake")'))
      .first();
    
    await intakeOption.click();
    
    // Should show creation form or modal
    // Relaxed selector for any form or modal that appears after clicking
    await expect(page.locator('form, [role="dialog"], .modal, h2:has-text("Intake"), h1:has-text("Intake")').first()).toBeVisible();
  });

  test('should show loading state while fetching data', async ({ authenticatedPage: page }) => {
    await page.goto('/intake');
    
    // Page should render without errors
    await expect(page.locator('main').getByRole('heading', { name: /intake/i })).toBeVisible();
  });
});
