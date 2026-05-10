import { test } from '@playwright/test';

const BASE = 'http://localhost:5173';

test('Debug tasks network', async ({ page }) => {
  const networkLogs = [];
  page.on('request', req => {
    if (req.url().includes('8090')) {
      networkLogs.push({ type: 'request', url: req.url(), method: req.method(), headers: req.headers() });
    }
  });
  page.on('response', res => {
    if (res.url().includes('8090')) {
      networkLogs.push({ type: 'response', url: res.url(), status: res.status() });
    }
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'user1@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/crm`, { timeout: 10000 });
  
  await page.click('text=Tasks');
  await page.waitForTimeout(3000);
  
  console.log('Network logs:', JSON.stringify(networkLogs, null, 2));
});
