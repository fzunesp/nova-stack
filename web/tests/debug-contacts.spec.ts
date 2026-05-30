import { test, expect } from './fixtures';

test('Debug Contacts custom fields', async ({ authenticatedPage: page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // Navigate to CRM Contacts
  await page.goto('/crm/contacts');
  await page.getByRole('button', { name: /add contact/i }).first().click();
  
  await page.getByPlaceholder('Full name').fill('No Custom Field Contact ' + Date.now());
  await page.getByPlaceholder('Email').fill('no-cf' + Date.now() + '@example.com');

  // Submit
  const submitButton = page.getByRole('button', { name: /add contact/i }).last();
  await submitButton.click();

  // Wait for modal to close or error to appear
  await page.waitForTimeout(3000);
  
  const isModalVisible = await page.getByRole('heading', { name: /add new contact/i }).isVisible();
  console.log('Modal visible after 3s (No CF):', isModalVisible);
  
  if (isModalVisible) {
    const apiError = await page.locator('#create-contact-api-error').textContent().catch(() => 'No API error found');
    console.log('API Error in UI (No CF):', apiError);
  } else {
    console.log('Contact created successfully without custom fields!');
  }

  // Now create a NEW custom field
  await page.goto('/settings');
  await page.getByRole('button', { name: /custom fields/i }).click();
  await page.getByRole('button', { name: /^contacts$/i }).click();

  await page.getByRole('button', { name: /add field/i }).first().click();
  await page.getByPlaceholder('e.g. VAT Registration Number').fill('New Test Field');
  await page.getByPlaceholder('e.g. vat_registration_number').fill('new_test_field');
  await page.locator('#field-required').check();
  await page.getByRole('button', { name: /create field/i }).click();
  await expect(page.getByText('New Test Field', { exact: true })).toBeVisible();

  // Try creating contact with the new custom field
  await page.goto('/crm/contacts');
  await page.getByRole('button', { name: /add contact/i }).first().click();
  
  await page.getByPlaceholder('Full name').fill('New CF Contact ' + Date.now());
  await page.getByPlaceholder('Email').fill('new-cf' + Date.now() + '@example.com');

  // Fill custom field
  await page.locator('input[placeholder="Enter new test field"]').fill('Field Value');
  
  // Submit
  await page.getByRole('button', { name: /add contact/i }).last().click();

  // Wait for modal to close or error to appear
  await page.waitForTimeout(3000);
  
  const isModalStillVisible = await page.getByRole('heading', { name: /add new contact/i }).isVisible();
  console.log('Modal visible after 3s (New CF):', isModalStillVisible);
  
  if (isModalStillVisible) {
    const apiError = await page.locator('#create-contact-api-error').textContent().catch(() => 'No API error found');
    console.log('API Error in UI (New CF):', apiError);
  } else {
    console.log('Contact created successfully with NEW custom field!');
  }
});
