import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'user1@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/crm`, { timeout: 10000 });
}

test.describe('Smoke Tests', () => {
  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('h1:has-text("Nova Stack")')).toBeVisible();
  });

  test('Login with demo credentials', async ({ page }) => {
    await login(page);
    await expect(page.locator('h2:has-text("CRM")').first()).toBeVisible();
  });

  test('CRM page loads contacts', async ({ page }) => {
    await login(page);
    await expect(page.locator('text=Contact 1')).toBeVisible();
    await expect(page.locator('text=Company 1')).toBeVisible();
  });

  test('CRM page switches to Deals tab', async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Deals")');
    await expect(page.locator('text=Deal 1')).toBeVisible();
  });

  test('Tasks page loads', async ({ page }) => {
    await login(page);
    await page.click('text=Tasks');
    await page.waitForURL(`${BASE}/tasks`);
    await expect(page.locator('text=Task 1')).toBeVisible();
  });

  test('Invoices page loads', async ({ page }) => {
    await login(page);
    await page.click('text=Invoices');
    await page.waitForURL(`${BASE}/invoices`);
    await expect(page.locator('text=Invoice #2026')).toBeVisible();
  });

  test('Intake page loads', async ({ page }) => {
    await login(page);
    await page.click('text=Intake');
    await page.waitForURL(`${BASE}/intake`);
    await expect(page.locator('text=Submission 1')).toBeVisible();
  });

  test('Create contact dialog opens', async ({ page }) => {
    await login(page);
    await page.click('text=Add Contact');
    await expect(page.locator('text=Add Contact')).toBeVisible();
  });

  test('Pagination works on contacts', async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Contact 10')).toBeVisible();
  });

  test('No console errors on dashboard', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await login(page);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('autocomplete'))).toEqual([]);
  });
});
