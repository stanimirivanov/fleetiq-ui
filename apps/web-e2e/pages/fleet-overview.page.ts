import type { Page } from '@playwright/test';
export const overviewScope =
  'tenant=tenant-a&latitude_property=position.latitude&latitude_version=1&longitude_property=position.longitude&longitude_version=1&encoding=e7';
export class FleetOverviewPage {
  readonly metrics;
  readonly discovery;
  readonly coverage;
  readonly snapshot;
  readonly location;
  readonly filter;
  readonly tenant;
  readonly mapLink;
  readonly preview;
  constructor(readonly page: Page) {
    this.metrics = page.getByRole('region', { name: 'Fleet metrics' });
    this.discovery = page.getByRole('region', {
      name: 'Asset discovery',
      exact: true,
    });
    this.coverage = page.getByRole('region', { name: 'Evidence coverage' });
    this.snapshot = page.getByRole('region', {
      name: 'Overview snapshot status',
    });
    this.location = page.getByRole('region', {
      name: 'Fleet location context',
    });
    this.filter = page.getByRole('searchbox', { name: 'Filter loaded assets' });
    this.tenant = page.getByRole('combobox', { name: 'Permitted tenant' });
    this.mapLink = page.getByRole('link', { name: 'Open map workbench' });
    this.preview = page.getByTestId('geodetic-canvas');
  }
  async open(suffix = '') {
    await this.page.goto(`/?${overviewScope}${suffix}`);
    await this.metrics.waitFor();
  }
  async openUnconfigured() {
    await this.page.goto('/');
    await this.tenant.waitFor();
  }
  async configure() {
    await this.tenant.selectOption('tenant-a');
    await this.page
      .getByRole('textbox', { name: 'Latitude property' })
      .fill('position.latitude');
    await this.page
      .getByRole('textbox', { name: 'Longitude property' })
      .fill('position.longitude');
    await this.page
      .getByRole('combobox', { name: 'Encoding' })
      .selectOption('e7');
    await this.page
      .getByRole('button', { name: 'Apply mapping', exact: true })
      .click();
    await this.metrics.waitFor();
  }
  asset(name: string) {
    return this.discovery.getByRole('button', { name, exact: true });
  }
  metric(label: string) {
    return this.metrics.getByRole('article', { name: label, exact: true });
  }
  async next() {
    await this.page.getByRole('button', { name: 'Next asset page' }).click();
    await this.page.waitForURL((url) => url.searchParams.has('fleet_after'));
    await this.metrics.waitFor();
  }
  async first() {
    await this.page.getByRole('button', { name: 'First asset page' }).click();
    await this.page.waitForURL((url) => !url.searchParams.has('fleet_after'));
    await this.metrics.waitFor();
  }
  async refresh() {
    await this.page.getByRole('button', { name: 'Refresh overview' }).click();
  }
  async retry() {
    await this.page.getByRole('button', { name: 'Retry overview' }).click();
    await this.metrics.waitFor();
  }
  async returnFromMap() {
    await this.page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Overview', exact: true })
      .click();
    await this.metrics.waitFor();
  }
  async roundTrip() {
    const start = Date.now();
    await this.next();
    const entered = Date.now();
    await this.first();
    return Math.max(entered - start, Date.now() - entered);
  }
  async filterRoundTrip() {
    const start = Date.now();
    await this.filter.fill('Fixture');
    await this.filter.fill('');
    await this.asset('Positioned equipment').waitFor();
    return Date.now() - start;
  }
}
