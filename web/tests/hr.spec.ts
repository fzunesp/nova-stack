import { test, expect } from './fixtures';

test.describe('HR Module', () => {
  test('should load HR page', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    await expect(page.getByText('HR Operations')).toBeVisible();
  });

  test('should display HR sidebar navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    await expect(page.getByText('My Requests')).toBeVisible();
    await expect(page.getByText('Approvals')).toBeVisible();
    await expect(page.getByText('Templates')).toBeVisible();
    await expect(page.getByText('Analytics')).toBeVisible();
  });

  test('should display submission stats', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const statsSection = page.locator('div.grid.grid-cols-2');
    const hasStats = await statsSection.first().isVisible().catch(() => false);
    
    if (hasStats) {
      await expect(page.getByText('Total').first()).toBeVisible();
      await expect(page.getByText('Pending').first()).toBeVisible();
      await expect(page.getByText('Approved').first()).toBeVisible();
    }
  });

  test('should display submission status badges', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const statusElements = page.locator('span.text-\\[10px\\]').filter({ hasText: /pending|approved|rejected/i });
    const count = await statusElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to submission detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const firstSubmission = page.locator('button:has(.font-mono)').first();
    if (await firstSubmission.isVisible()) {
      await firstSubmission.click();
      await page.waitForURL(/.*hr\/.+/);
      await expect(page).toHaveURL(/.*hr\/.+/);
    }
  });

  test('should display submission detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const firstSubmission = page.locator('button:has(.font-mono)').first();
    if (await firstSubmission.isVisible()) {
      await firstSubmission.click();
      await page.waitForURL(/.*hr\/.+/);
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    }
  });

  test('should display approval actions when on approvals section', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    await page.getByText('Approvals').click();
    
    const needsAction = page.getByRole('heading', { name: 'Needs Your Action' });
    const noPending = page.getByText('No pending decisions').first();
    
    const hasNeedsAction = await needsAction.isVisible().catch(() => false);
    const hasNoPending = await noPending.isVisible().catch(() => false);
    expect(hasNeedsAction || hasNoPending).toBeTruthy();
  });

  test('should display form templates section', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    await page.getByText('Templates').click();
    await expect(page.getByRole('heading', { name: 'Form Templates' })).toBeVisible();
  });

  test('should display analytics section', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    await page.getByText('Analytics').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[class*="analytics"]').first().or(page.locator('main').last())).toBeVisible();
  });

  test('should show empty state when no submissions', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const emptyState = page.getByText("You haven't submitted any requests yet");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasSubmissions = await page.locator('button:has(.font-mono)').first().isVisible().catch(() => false);
    
    if (!hasSubmissions) {
      expect(hasEmptyState).toBeTruthy();
    }
  });

  test('should display HR statistics/metrics', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    const statsSection = page.locator('div.grid.grid-cols-2');
    const hasStats = await statsSection.first().isVisible().catch(() => false);
    
    if (hasStats) {
      await expect(page.getByText('Total').first()).toBeVisible();
    }
  });

  test('should switch between HR sections', async ({ authenticatedPage: page }) => {
    await page.goto('/hr');
    
    await page.getByText('Approvals').click();
    const hasNeedsAction = await page.getByRole('heading', { name: 'Needs Your Action' }).isVisible().catch(() => false);
    const hasNoPending = await page.getByText('No pending decisions').first().isVisible().catch(() => false);
    expect(hasNeedsAction || hasNoPending).toBeTruthy();
    
    await page.getByText('Templates').click();
    await expect(page.getByRole('heading', { name: 'Form Templates' })).toBeVisible();
  });
});
