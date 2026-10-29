import type { Page } from '@playwright/test';
/** Exact source, supported target and revision actions without scenario assertions. */
export class BindingAuthoringPage {
  constructor(readonly page: Page) {}
  form = () =>
    this.page.getByRole('region', { name: 'Signal binding authoring' });
  source = () =>
    this.form().getByRole('region', { name: 'Binding source discovery' });
  target = () =>
    this.form().getByRole('region', { name: 'Binding target property' });
  async open() {
    await this.page.goto(
      '/assets/registry/review?tenant=tenant-a&effective_at_ms=1500&known_at_ms=2500',
    );
  }
  async chooseSource(observed = true) {
    await this.source()
      .getByLabel('Binding source device ID', { exact: true })
      .fill('gateway-1');
    await this.source()
      .getByRole('button', { name: 'Load registered endpoints' })
      .click();
    await this.source()
      .getByLabel('Registered source endpoint', { exact: true })
      .selectOption('can-primary');
    if (observed) {
      await this.source()
        .getByRole('button', { name: 'Inspect observed signals' })
        .click();
      await this.source()
        .getByRole('button', {
          name: 'can-primary / bus.voltage · decoder custom.protocol@1',
          exact: true,
        })
        .click();
    } else
      await this.source()
        .getByLabel('Binding source signal ID', { exact: true })
        .fill('bus.voltage');
  }
  async chooseTarget(property = 'electrical.voltage v3') {
    await this.target()
      .getByLabel('Binding target asset ID', { exact: true })
      .fill('power-system-1');
    await this.target()
      .getByRole('button', { name: 'Load target property versions' })
      .click();
    await this.target()
      .getByLabel('Exact supported target property', { exact: true })
      .selectOption({ label: property });
  }
  async draft(revision = '1', end = '') {
    await this.form()
      .getByLabel('Binding ID', { exact: true })
      .fill('authored-binding');
    await this.form()
      .getByLabel('Exact binding revision (decimal u64)', { exact: true })
      .fill(revision);
    await this.form()
      .getByLabel('Binding effective start (Unix ms, inclusive)', {
        exact: true,
      })
      .fill('1000');
    await this.form()
      .getByLabel('Binding effective end (Unix ms, exclusive; blank is open)', {
        exact: true,
      })
      .fill(end);
  }
  async submit() {
    await this.form()
      .getByRole('button', {
        name: 'Submit signal binding revision',
        exact: true,
      })
      .click();
  }
  async prepare() {
    await this.form()
      .getByRole('button', { name: 'Prepare another command' })
      .click();
  }
  async exact(revision: string) {
    const region = this.page.getByRole('region', {
      name: 'Immutable binding revision',
      exact: true,
    });
    await region
      .getByLabel('Immutable binding ID', { exact: true })
      .fill('authored-binding');
    await region
      .getByLabel('Immutable binding revision', { exact: true })
      .fill(revision);
    await region
      .getByRole('button', {
        name: 'Review immutable binding revision',
        exact: true,
      })
      .click();
  }
}
