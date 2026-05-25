import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../flowmatica-landing/Qwen/images');
const BASE_URL = 'http://localhost:5173';

const pages = [
  { url: '/companies', file: 'companies-page.png', label: 'Companies Hub' },
  { url: '/crm', file: 'crm-contacts.png', label: 'CRM Contacts' },
  { url: '/crm/deals', file: 'crm-deals.png', label: 'CRM Deals / Kanban' },
  { url: '/invoices', file: 'invoices-page.png', label: 'Invoices' },
  { url: '/hr', file: 'hr-page.png', label: 'HR Operations' },
];

async function capture() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Check if we're already logged in (redirected away from login)
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    console.log('Already logged in, skipping login form.');
  } else {
    // Fill login form
    await page.fill('input[type="email"]', 'admin@novastack.local');
    await page.fill('input[type="password"]', 'novastack123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('Login submitted.');
  }

  // Handle First-Run Setup Wizard if it appears
  console.log('Checking for setup wizard...');
  await page.waitForTimeout(2000);

  // Check if setup wizard is visible by looking for its elements
  const wizardVisible = await page.locator('text=Setup Your Workspace').isVisible().catch(() => false)
    || await page.locator('text=Company Name').isVisible().catch(() => false)
    || await page.locator('text=Welcome to NovaStack').isVisible().catch(() => false);

  if (wizardVisible) {
    console.log('Setup wizard detected, completing it...');
    // Try to fill company name and skip through
    try {
      const companyInput = page.locator('input[placeholder*="company" i], input[name*="company" i]').first();
      if (await companyInput.isVisible({ timeout: 3000 })) {
        await companyInput.fill('Demo Company');
      }
      // Click next/continue/submit buttons
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Complete")').first();
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
      // Try second step if exists
      const nextBtn2 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Complete")').first();
      if (await nextBtn2.isVisible({ timeout: 3000 })) {
        await nextBtn2.click();
        await page.waitForTimeout(1000);
      }
      // Try third step
      const nextBtn3 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Complete"), button:has-text("Get Started")').first();
      if (await nextBtn3.isVisible({ timeout: 3000 })) {
        await nextBtn3.click();
        await page.waitForTimeout(2000);
      }
      console.log('Wizard completed.');
    } catch (e) {
      console.log('Could not auto-complete wizard, proceeding anyway.');
    }
  } else {
    console.log('No setup wizard detected.');
  }

  // Navigate to dashboard first to ensure we're fully loaded
  console.log('Navigating to dashboard...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Capture each page
  for (const p of pages) {
    console.log(`\nCapturing: ${p.label} (${p.url})`);
    try {
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const outputPath = path.join(OUTPUT_DIR, p.file);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`  Saved: ${outputPath}`);
    } catch (err) {
      console.error(`  ERROR capturing ${p.label}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! All screenshots captured.');
}

capture().catch(console.error);
