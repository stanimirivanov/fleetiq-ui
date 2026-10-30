import type { Page } from '@playwright/test';
export class AlertRulesPage {
  constructor(readonly page: Page) {}
  get region() {
    return this.page.getByRole('region', {
      name: 'Alert rule configuration',
      exact: true,
    });
  }
  get head() {
    return this.page.getByRole('region', {
      name: 'Rule configuration head',
      exact: true,
    });
  }
  get threshold() {
    return this.page.getByLabel('Exact threshold', { exact: true });
  }
  open() {
    return this.page.goto('/alerts?tenant=tenant-a&configure=voltage-high');
  }
  append() {
    return this.page
      .getByRole('button', { name: 'Append immutable revision' })
      .click();
  }
  activate() {
    return this.page
      .getByRole('button', { name: 'Activate retained revision' })
      .click();
  }
  retry() {
    return this.page
      .getByRole('button', { name: 'Retry exact command' })
      .click();
  }
}
