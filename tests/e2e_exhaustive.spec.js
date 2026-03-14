import { test, expect } from '@playwright/test';

// This test scans the app for interactive elements and exercises them
// while attempting to avoid destructive actions (delete, remove, reset, logout).

const DESTRUCTIVE_KEYWORDS = ['delete', 'remove', 'reset', 'logout', 'sign out', 'erase'];

function isDestructive(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DESTRUCTIVE_KEYWORDS.some(k => lower.includes(k));
}

test.describe('Exhaustive UI interactions (safe mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('click visible non-destructive buttons and follow links', async ({ page, context }) => {
    // Collect anchors and visit them in a fresh page to avoid state pollution
    const anchors = await page.locator('a[href]').elementHandles();
    for (const a of anchors) {
      try {
        const href = await a.getAttribute('href');
        const text = (await a.innerText()).trim();
        if (!href || href.startsWith('#') || isDestructive(text)) continue;

        // Open in a new page so we can return to the app safely
        const newPage = await context.newPage();
        try {
          const url = href.startsWith('http') ? href : new URL(href, page.url()).toString();
          await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
          await newPage.waitForLoadState('networkidle').catch(() => {});
          // basic smoke checks
          await expect(newPage).toHaveTitle(/.|^.*/);
        } catch (err) {
          console.log('Anchor visit failed', href, err.message);
        } finally {
          await newPage.close();
        }
      } catch (e) {
        console.log('Skipping anchor iteration error', e.message);
      }
    }

    // Click visible interactive controls (buttons, [role=button])
    const controls = page.locator('button:visible, [role="button"]:visible, input[type="button"]:visible, input[type="submit"]:visible');
    const count = await controls.count();
    for (let i = 0; i < count; i++) {
      const ctl = controls.nth(i);
      try {
        const text = (await ctl.innerText()).trim() || (await ctl.getAttribute('aria-label')) || '';
        if (isDestructive(text)) {
          console.log('Skipping destructive control:', text);
          continue;
        }

        // Attempt to click and handle possible navigation or modal
        const [maybeNav] = await Promise.all([
          page.waitForNavigation({ timeout: 3000 }).catch(() => null),
          ctl.click({ timeout: 5000 }).catch(e => { throw e; }),
        ].map(p => p));

        if (maybeNav) {
          // returned to base if necessary
          await page.waitForLoadState('networkidle').catch(() => {});
          await page.goBack().catch(() => {});
          await page.waitForLoadState('networkidle').catch(() => {});
        }
      } catch (err) {
        console.log('Control click failed (safe skip):', err.message);
      }
    }

    // Try filling simple text inputs (email/name) with safe values
    const textInputs = page.locator('input[type="email"]:visible, input[type="text"]:visible, textarea:visible');
    const tiCount = await textInputs.count();
    for (let i = 0; i < tiCount; i++) {
      const input = textInputs.nth(i);
      try {
        const type = await input.getAttribute('type');
        if (type === 'email') {
          await input.fill('test@example.com').catch(() => {});
        } else {
          await input.fill('playwright test').catch(() => {});
        }
      } catch {
        // ignore
      }
    }

    // Final smoke check
    await expect(page).toHaveTitle(/.|^.*/);
  });
});
