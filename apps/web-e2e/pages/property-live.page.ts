import type { Locator, Page } from '@playwright/test';
import { PropertyEvidencePage } from './property-evidence.page';
export class PropertyLivePage extends PropertyEvidencePage {
  readonly delivery: Locator;
  constructor(private readonly browserPage: Page) {
    super(browserPage);
    this.delivery = browserPage.getByRole('region', {
      name: 'Live property delivery',
    });
  }
  async start() {
    await this.delivery
      .getByRole('button', { name: 'Start live updates' })
      .click();
  }
  async stop() {
    await this.delivery
      .getByRole('button', { name: 'Stop live updates' })
      .click();
  }
  async leave() {
    await this.browserPage.goto('/assets?tenant=tenant-a');
  }
}
