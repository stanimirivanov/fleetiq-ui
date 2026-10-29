import type { Page } from '@playwright/test';
/** Locators and complete operator actions; assertions belong to scenarios. */
export class RegistryCommissioningPage {
  constructor(readonly page: Page) {}
  readonly asset = () =>
    this.page.getByRole('region', { name: 'Asset creation' });
  readonly relationship = () =>
    this.page.getByRole('region', { name: 'Relationship commissioning' });
  async open() {
    await this.page.goto(
      '/assets/registry/review?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500',
    );
  }
  async assetDraft(id = 'commissioned-a') {
    await this.asset()
      .getByLabel('New internal asset ID', { exact: true })
      .fill(id);
    await this.asset()
      .getByLabel('New asset display name', { exact: true })
      .fill('Commissioned equipment');
    await this.asset()
      .getByLabel('Exact asset type version', { exact: true })
      .selectOption({ label: 'Equipment · equipment v2' });
  }
  async relationshipDraft(revision = '1', end = '') {
    const form = this.relationship();
    await form
      .getByLabel('Relationship ID', { exact: true })
      .fill('commissioned-edge');
    await form
      .getByLabel('Exact revision (decimal u64)', { exact: true })
      .fill(revision);
    await form
      .getByLabel('Exact relationship type version', { exact: true })
      .selectOption({ label: 'Contains · physical.contains v10' });
    await form
      .getByLabel('Source asset ID', { exact: true })
      .fill('commissioned-a');
    await form.getByLabel('Target asset ID', { exact: true }).fill('gateway-1');
    await form
      .getByLabel('Effective start (Unix ms, inclusive)', { exact: true })
      .fill('1000');
    await form
      .getByLabel('Effective end (Unix ms, exclusive; blank is open)', {
        exact: true,
      })
      .fill(end);
  }
  async submitAsset() {
    await this.asset()
      .getByRole('button', { name: 'Submit asset registration', exact: true })
      .click();
  }
  async submitRelationship() {
    await this.relationship()
      .getByRole('button', {
        name: 'Submit relationship revision',
        exact: true,
      })
      .click();
  }
}
