import type { Page } from '@playwright/test';
/** Actions and locators only; scenarios own the assertions. */
export class ConnectedAlertsPage {
  constructor(readonly page: Page) {}
  get queue() {
    return this.page.getByRole('region', {
      name: 'Alert queue',
      exact: true,
    });
  }
  get detail() {
    return this.page.getByRole('region', {
      name: 'Alert detail',
      exact: true,
    });
  }
  get transitions() {
    return this.page.getByRole('region', {
      name: 'Transition history',
      exact: true,
    });
  }
  get evidence() {
    return this.page.getByRole('region', {
      name: 'Calculator evaluation evidence',
      exact: true,
    });
  }
  get outputs() {
    return this.page.getByRole('region', {
      name: 'Calculator outputs',
      exact: true,
    });
  }
  get filter() {
    return this.page.getByLabel('Phase filter');
  }
  open(search = '?tenant=tenant-a') {
    return this.page.goto(`/alerts${search}`);
  }
  selectRule() {
    return this.queue
      .getByRole('link', { name: 'voltage-high · revision 1' })
      .click();
  }
  inspectLatest() {
    return this.detail
      .getByRole('link', { name: 'Inspect latest transition evidence' })
      .click();
  }
}
