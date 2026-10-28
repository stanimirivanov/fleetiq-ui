import type { Page } from '@playwright/test';
export class ConnectedMapPage {
  readonly summary;
  readonly list;
  readonly evidence;
  readonly canvas;
  readonly filter;
  readonly mapStatus;
  constructor(readonly page: Page) {
    this.summary = page.getByRole('region', { name: 'Fleet snapshot summary' });
    this.list = page.getByRole('region', { name: 'Loaded fleet page' });
    this.evidence = page.getByRole('complementary', {
      name: 'Selected location evidence',
    });
    this.canvas = page.getByTestId('geodetic-canvas');
    this.filter = page.getByRole('searchbox', { name: 'Filter loaded page' });
    this.mapStatus = page
      .getByRole('status')
      .filter({ hasText: 'Geodetic map' });
  }
  async open() {
    await this.page.goto(
      '/map?tenant=tenant-a&latitude_property=position.latitude&latitude_version=1&longitude_property=position.longitude&longitude_version=1&encoding=e7',
    );
    await this.summary.waitFor();
  }
  async rendererReady() {
    await this.mapStatus.waitFor();
    await this.canvas.locator('canvas').waitFor();
  }
  asset(name: string) {
    return this.list.getByRole('button', { name: new RegExp(name) });
  }
  async leave() {
    await this.page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Assets', exact: true })
      .click();
    await this.canvas.waitFor({ state: 'detached' });
  }
  async returnToMap() {
    await this.page.goBack();
    await this.summary.waitFor();
    await this.rendererReady();
  }
}
