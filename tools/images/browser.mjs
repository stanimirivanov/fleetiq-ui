/** Real packaged bootstrap/CSP smoke; no recording, storage reuse, or real identity. */
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { EdgePage } from './fixtures/edge-page.mjs';
export async function qualifyBrowser(baseURL) {
  const origin = new URL(baseURL);
  assert.equal(origin.hostname, '127.0.0.1');
  assert.equal(origin.protocol, 'http:');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      baseURL: origin.origin,
      colorScheme: 'light',
      serviceWorkers: 'block',
    });
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin.origin
        ? route.continue()
        : route.abort('blockedbyclient'),
    );
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', () => failures.push('page-error'));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /content security policy|refused to execute|unsafe-eval/iu.test(
          message.text(),
        )
      )
        failures.push('csp-error');
    });
    const view = new EdgePage(page);
    await view.open();
    await expect(view.themeButton).toBeVisible();
    await expect(page).toHaveTitle('Fleet overview · FleetIQ');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await view.toggleTheme();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await view.open('/tenants/tenant-a/assets/asset-1');
    await expect(view.themeButton).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    assert.deepEqual(failures, [], 'Packaged browser bootstrap/CSP failed.');
    await context.close();
    return { checks: 4, passed: true };
  } finally {
    await browser.close();
  }
}
