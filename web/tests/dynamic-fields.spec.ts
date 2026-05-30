import { test, expect } from './fixtures';

test.describe('Dynamic Custom Fields Integration & Validation - All Entities', () => {

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    await expect(page.getByRole('heading', { name: /custom fields manager/i })).toBeVisible();
  });

  // ─── Companies ───────────────────────────────────────────────────────────────
  test('Companies: required field validation, save, view, cleanup', async ({ authenticatedPage: page }) => {
    // Select Companies tab if visible
    const companiesTab = page.getByRole('button', { name: /^companies$/i });
    if (await companiesTab.isVisible()) await companiesTab.click();

    // Create required custom field
    await page.getByRole('button', { name: /add field/i }).first().click();
    await expect(page.getByRole('heading', { name: /add custom field/i })).toBeVisible();
    await page.getByPlaceholder('e.g. VAT Registration Number').fill('VAT Code');
    await page.getByPlaceholder('e.g. vat_registration_number').fill('vat_code');
    await page.locator('#field-required').check();
    await page.getByRole('button', { name: /create field/i }).click();
    await expect(page.getByText('VAT Code', { exact: true })).toBeVisible();

    // Navigate to Companies and open create dialog
    await page.goto('/companies');
    await page.getByRole('button', { name: /add company/i }).first().click();
    await expect(page.getByRole('heading', { name: /add new company/i })).toBeVisible();
    await page.getByPlaceholder('Acme Corp').fill('Dynamic Companies Test Corp');

    // Attempt submit without required custom field → validation fires
    await page.getByRole('button', { name: /add company/i }).last().click();
    await expect(page.getByText('VAT Code is required')).toBeVisible();

    // Fill custom field and submit
    await page.locator('input[placeholder="Enter vat code"]').fill('GB123456789');
    await page.getByRole('button', { name: /add company/i }).last().click();

    // Modal should close; record should appear in the list
    await expect(page.getByRole('heading', { name: /add new company/i })).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Dynamic Companies Test Corp').first()).toBeVisible();

    // Open detail view and verify viewer renders the custom field
    await page.getByText('Dynamic Companies Test Corp').first().click();
    await expect(page.getByText('VAT Code', { exact: true })).toBeVisible();
    await expect(page.getByText('GB123456789')).toBeVisible();
    await page.keyboard.press('Escape');

    // Cleanup: delete the field definition
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    const compRow = page.locator('tr', { hasText: 'VAT Code' });
    page.once('dialog', d => d.accept());
    await compRow.locator('button').last().click();
    await expect(page.getByText('VAT Code', { exact: true })).not.toBeVisible();
  });

  // ─── Contacts ────────────────────────────────────────────────────────────────
  test('Contacts: required field validation, save, view, cleanup', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /^contacts$/i }).click();

    // Create required custom field
    await page.getByRole('button', { name: /add field/i }).first().click();
    await expect(page.getByRole('heading', { name: /add custom field/i })).toBeVisible();
    await page.getByPlaceholder('e.g. VAT Registration Number').fill('VIP Status');
    await page.getByPlaceholder('e.g. vat_registration_number').fill('vip_status');
    await page.locator('#field-required').check();
    await page.getByRole('button', { name: /create field/i }).click();
    await expect(page.getByText('VIP Status', { exact: true })).toBeVisible();

    // Navigate to CRM Contacts and open create dialog
    await page.goto('/crm/contacts');
    await expect(page.locator('h2', { hasText: 'CRM' })).toBeVisible();
    await page.getByRole('button', { name: /add contact/i }).first().click();
    await expect(page.getByRole('heading', { name: /add new contact/i })).toBeVisible();
    await page.getByPlaceholder('Full name').fill('Dynamic Contacts Test User');
    await page.getByPlaceholder('Email').fill(`contacts_test_${Date.now()}@example.com`);

    // Attempt submit without required custom field → validation fires
    await page.getByRole('button', { name: /add contact/i }).last().click();
    await expect(page.getByText('VIP Status is required')).toBeVisible();

    // Now fill in the required custom field "VIP Status" and submit cleanly
    await page.locator('input[placeholder="Enter vip status"]').fill('Gold Tier Partner');
    // Wait deterministically: the error must disappear before we submit
    // (onChange now calls setFormErrors({}) so the error clears as soon as the field is typed into)
    await expect(page.getByText('VIP Status is required')).not.toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Modal should close
    await expect(page.getByRole('heading', { name: /add new contact/i })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Dynamic Contacts Test User').first()).toBeVisible();

    // Open detail view and verify viewer renders the custom field
    await page.getByText('Dynamic Contacts Test User').first().click();
    await expect(page.getByText('VIP Status', { exact: true })).toBeVisible();
    await expect(page.getByText('Gold Tier Partner')).toBeVisible();
    await page.keyboard.press('Escape');

    // Cleanup
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    await page.getByRole('button', { name: /^contacts$/i }).click();
    const row = page.locator('tr', { hasText: 'VIP Status' });
    page.once('dialog', d => d.accept());
    await row.locator('button').last().click();
    await expect(page.getByText('VIP Status', { exact: true })).not.toBeVisible();
  });

  // ─── Deals ───────────────────────────────────────────────────────────────────
  test('Deals: required field validation, save, cleanup', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /^deals$/i }).click();

    // Create required custom field
    await page.getByRole('button', { name: /add field/i }).first().click();
    await expect(page.getByRole('heading', { name: /add custom field/i })).toBeVisible();
    await page.getByPlaceholder('e.g. VAT Registration Number').fill('Deal Region');
    await page.getByPlaceholder('e.g. vat_registration_number').fill('deal_region');
    await page.locator('#field-required').check();
    await page.getByRole('button', { name: /create field/i }).click();
    await expect(page.getByText('Deal Region', { exact: true })).toBeVisible();

    // Navigate to CRM Deals and open create dialog
    await page.goto('/crm/deals');
    await expect(page.locator('h2', { hasText: 'CRM' })).toBeVisible();
    await page.getByRole('button', { name: /add deal/i }).first().click();
    await expect(page.getByRole('heading', { name: /add new deal/i })).toBeVisible();
    await page.getByPlaceholder('Deal title').fill('Dynamic Deals Test Case');

    // Select a Contact
    await page.getByText('— Select a contact —').click();
    await page.getByRole('option').first().click();

    // Attempt submit without required custom field → validation fires
    await page.getByRole('button', { name: /add deal/i }).last().click();
    await expect(page.getByText('Deal Region is required')).toBeVisible();

    // Fill custom field and submit
    await page.locator('input[placeholder="Enter deal region"]').fill('APAC-South');
    await page.getByRole('button', { name: /add deal/i }).last().click();

    // Modal should close; record should appear in the list
    await expect(page.getByRole('heading', { name: /add new deal/i })).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Dynamic Deals Test Case').first()).toBeVisible();

    // Cleanup
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    await page.getByRole('button', { name: /^deals$/i }).click();
    const row = page.locator('tr', { hasText: 'Deal Region' });
    page.once('dialog', d => d.accept());
    await row.locator('button').last().click();
    await expect(page.getByText('Deal Region', { exact: true })).not.toBeVisible();
  });

  // ─── Tasks ───────────────────────────────────────────────────────────────────
  test('Tasks: required field validation, save, cleanup', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /^tasks$/i }).click();

    // Create required custom field
    await page.getByRole('button', { name: /add field/i }).first().click();
    await expect(page.getByRole('heading', { name: /add custom field/i })).toBeVisible();
    await page.getByPlaceholder('e.g. VAT Registration Number').fill('Priority Rank');
    await page.getByPlaceholder('e.g. vat_registration_number').fill('priority_rank');
    await page.locator('#field-required').check();
    await page.getByRole('button', { name: /create field/i }).click();
    await expect(page.getByText('Priority Rank', { exact: true })).toBeVisible();

    // Navigate to Tasks and open create dialog
    await page.goto('/tasks');
    await page.getByRole('button', { name: /add task/i }).first().click();
    await expect(page.getByRole('heading', { name: /add new task/i })).toBeVisible();
    await page.getByPlaceholder('Task title').fill('Dynamic Tasks Test Case');

    // Select Contact and Deal
    await page.getByText('Select a contact').click();
    await page.getByRole('option').first().click();
    await page.getByText('Select a deal').click();
    await page.getByRole('option').first().click();

    // Attempt submit without required custom field → validation fires
    await page.getByRole('button', { name: /add task/i }).last().click();
    await expect(page.getByText('Priority Rank is required')).toBeVisible();

    // Fill custom field and submit
    await page.locator('input[placeholder="Enter priority rank"]').fill('Rank Alpha');
    await page.getByRole('button', { name: /add task/i }).last().click();

    // Modal should close; record should appear in the list
    await expect(page.getByRole('heading', { name: /add new task/i })).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Dynamic Tasks Test Case').first()).toBeVisible();

    // Cleanup
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    await page.getByRole('button', { name: /^tasks$/i }).click();
    const row = page.locator('tr', { hasText: 'Priority Rank' });
    page.once('dialog', d => d.accept());
    await row.locator('button').last().click();
    await expect(page.getByText('Priority Rank', { exact: true })).not.toBeVisible();
  });

  // ─── Invoices ────────────────────────────────────────────────────────────────
  test('Invoices: required field validation, save, cleanup', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /^invoices$/i }).click();

    // Create required custom field
    await page.getByRole('button', { name: /add field/i }).first().click();
    await expect(page.getByRole('heading', { name: /add custom field/i })).toBeVisible();
    await page.getByPlaceholder('e.g. VAT Registration Number').fill('Billing Office');
    await page.getByPlaceholder('e.g. vat_registration_number').fill('billing_office');
    await page.locator('#field-required').check();
    await page.getByRole('button', { name: /create field/i }).click();
    await expect(page.getByText('Billing Office', { exact: true })).toBeVisible();

    // Navigate to Invoices and open create dialog
    await page.goto('/invoices');
    await page.getByRole('button', { name: /add invoice/i }).first().click();
    await expect(page.getByRole('heading', { name: /add new invoice/i })).toBeVisible();
    await page.getByPlaceholder('Invoice title').fill('Dynamic Invoices Test Case');

    // Select a Deal
    await page.getByText('— Select a deal —').click();
    await page.getByRole('option').first().click();

    // Attempt submit without required custom field → validation fires
    await page.getByRole('button', { name: /add invoice/i }).last().click();
    await expect(page.getByText('Billing Office is required')).toBeVisible();

    // Fill custom field and submit
    await page.locator('input[placeholder="Enter billing office"]').fill('Branch South');
    await page.getByRole('button', { name: /add invoice/i }).last().click();

    // Modal should close; record should appear in the list
    await expect(page.getByRole('heading', { name: /add new invoice/i })).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Dynamic Invoices Test Case').first()).toBeVisible();

    // Cleanup
    await page.goto('/settings');
    await page.getByRole('button', { name: /custom fields/i }).click();
    await page.getByRole('button', { name: /^invoices$/i }).click();
    const row = page.locator('tr', { hasText: 'Billing Office' });
    page.once('dialog', d => d.accept());
    await row.locator('button').last().click();
    await expect(page.getByText('Billing Office', { exact: true })).not.toBeVisible();
  });
});
