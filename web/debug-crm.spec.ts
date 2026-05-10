import { test } from '@playwright/test';

const BASE = 'http://localhost:5173';

test('Screenshot CRM after login', async ({ page }) => {
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.message }));
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'user1@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(`${BASE}/crm`, { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'crm-after-login.png', fullPage: true });
  
  console.log('Console logs:', JSON.stringify(consoleLogs, null, 2));
  console.log('Current URL:', page.url());
});
