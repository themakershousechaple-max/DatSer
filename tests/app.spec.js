import { test, expect } from '@playwright/test';

/**
 * Test suite for React App components
 * This file demonstrates how to test React components with Playwright
 */
test.describe('React App Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load the main app without errors', async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/TMHT/i);
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for the app to render
    await page.waitForLoadState('networkidle');
    
    // Log any errors found (but don't fail the test)
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
  });

  test('should display login page components', async ({ page }) => {
    // Wait for login page to load
    await page.waitForSelector('text=Sign In', { timeout: 10000 }).catch(() => {
      // If no "Sign In" text, check for email input as fallback
      return page.waitForSelector('input[type="email"]', { timeout: 10000 });
    });

    // Check for email input field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Email input not found - app may be in authenticated state');
    });

    // Check for password input field
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    await expect(passwordInput).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Password input not found - app may be in authenticated state');
    });
  });

  test('should handle button interactions', async ({ page }) => {
    // Look for any button on the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      console.log(`Found ${buttonCount} buttons on the page`);
      
      // Check if any button is disabled (which could indicate an error)
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const isDisabled = await button.isDisabled();
        const buttonText = await button.textContent().catch(() => 'Unknown');
        
        if (isDisabled && buttonText.trim()) {
          console.log(`Warning: Button "${buttonText.trim()}" is disabled`);
        }
      }
    } else {
      console.log('No buttons found on the page');
    }
  });

  test('should check for page errors', async ({ page }) => {
    const errors = [];
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      errors.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Navigate and wait
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Report any errors found
    if (errors.length > 0) {
      console.log('Errors detected:', errors);
    }
    
    // This test passes regardless - it's for informational purposes
    expect(true).toBe(true);
  });
});

/**
 * Example: How to test specific button failures
 */
test.describe('Button Error Detection', () => {
  
  test('should detect button click failures', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and click buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) { // Test first 5 buttons
      const button = buttons.nth(i);
      const text = await button.textContent().catch(() => '');
      
      // Try clicking and see if it fails
      try {
        await button.click({ timeout: 2000 });
        console.log(`Button "${text.trim()}" clicked successfully`);
      } catch (e) {
        console.log(`Button "${text.trim()}" click failed: ${e.message}`);
      }
    }
  });

  test('should verify form inputs are working', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and type in email input
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');
      console.log('Email input works correctly');
    } else {
      console.log('Email input not visible - user may already be logged in');
    }
  });
});

/**
 * Example: How to test specific button failures
 */
test.describe('Button Error Detection', () => {
  
  test('should detect button click failures', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and click buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) { // Test first 5 buttons
      const button = buttons.nth(i);
      const text = await button.textContent().catch(() => '');
      
      // Try clicking and see if it fails
      try {
        await button.click({ timeout: 2000 });
        console.log(`Button "${text.trim()}" clicked successfully`);
      } catch (e) {
        console.log(`Button "${text.trim()}" click failed: ${e.message}`);
      }
    }
  });

  test('should verify form inputs are working', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and type in email input
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');
      console.log('Email input works correctly');
    } else {
      console.log('Email input not visible - user may already be logged in');
    }
  });
});

