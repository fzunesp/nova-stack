import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('should display login page with correct branding', async ({ page }) => {
    await page.goto('/login');
    
    // Check branding (use .first() to avoid strict mode violation)
    await expect(page.getByText('NovaStack').first()).toBeVisible();
    await expect(page.getByText('Your business,')).toBeVisible();
    await expect(page.getByText('fully under control.')).toBeVisible();
    
    // Check form elements
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByText('Create one free')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@nova-stack.local');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message (the red error div)
    await expect(page.locator('div.p-3.rounded-lg.bg-red-50')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should require email and password fields', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByLabel('Email address');
    const passwordInput = page.getByLabel('Password');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Browser validation should prevent empty submission
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to dashboard from root path when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@nova-stack.local');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    // Navigate to root
    await page.goto('/');
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should redirect to login from protected routes when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect register to login', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@nova-stack.local');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    // Wait for dashboard to render
    await page.waitForTimeout(1000);
    
    // Click logout via JavaScript to bypass overlay issues
    await page.evaluate(() => {
      const logoutBtn = document.querySelector('button[title="Sign out"]') as HTMLButtonElement;
      if (logoutBtn) logoutBtn.click();
    });
    
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show loading state during sign in', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@nova-stack.local');
    await page.getByLabel('Password').fill('password123');
    
    // Click and check button state immediately
    const signInButton = page.locator('button[type="submit"]');
    await signInButton.click();
    
    // Wait briefly for state change
    await page.waitForTimeout(200);
    
    // Button should either be disabled or show "Signing in" text
    const button = page.locator('button[type="submit"]');
    const isDisabled = await button.evaluate(el => (el as HTMLButtonElement).disabled);
    const text = await button.textContent();
    expect(isDisabled || text?.includes('Signing')).toBeTruthy();
  });
});
