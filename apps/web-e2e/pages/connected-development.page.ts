import type { Locator, Page } from '@playwright/test';

/** Locators/actions for the synthetic transport probe, separate from product operator journeys. */
export class ConnectedDevelopmentPage {
  readonly heading: Locator;
  readonly session: Locator;
  readonly stream: Locator;
  readonly hotModule: Locator;
  private readonly document: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Synthetic connected transport',
    });
    this.session = page.getByTestId('session');
    this.stream = page.getByTestId('stream');
    this.hotModule = page.getByTestId('hmr');
    this.document = page.locator('html');
  }

  async open(origin: string) {
    await this.page.goto(origin);
  }
  async bootMarker() {
    return this.document.getAttribute('data-boot');
  }
  async logOut() {
    await this.page.getByRole('button', { name: 'Log out' }).click();
  }
}
