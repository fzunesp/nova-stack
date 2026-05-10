import { test } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'user1@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/crm`, { timeout: 10000 });
}

test('Screenshot all pages', async ({ page }) => {
  await login(page);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'page-crm.png', fullPage: true });

  await page.click('text=Tasks');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'page-tasks.png', fullPage: true });

  await page.click('text=Invoices');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'page-invoices.png', fullPage: true });

  await page.click('text=Intake');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'page-intake.png', fullPage: true });
});
