import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../flowmatica-landing/Qwen/images');

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

  for (const p of pages) {
    console.log(`\nCapturing: ${p.label} (${p.url})`);
    try {
      await page.goto(`${BASE_URL}${p.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      // Extra wait for React rendering
      await page.waitForTimeout(2000);

      const outputPath = path.join(OUTPUT_DIR, p.file);
      await page.screenshot({
        path: outputPath,
        fullPage: true,
      });
      console.log(`  Saved: ${outputPath}`);
    } catch (err) {
      console.error(`  ERROR capturing ${p.label}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! All screenshots captured.');
}

capture().catch(console.error);
