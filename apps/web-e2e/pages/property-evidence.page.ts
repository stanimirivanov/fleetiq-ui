import type { Locator, Page } from '@playwright/test';
import {
  type GuideNarrator,
  performDocumentedAction,
} from '../user-guide/guide-narrator';
/** Page objects own stable accessible locators/actions; scenarios own assertions. */
export class PropertyEvidencePage {
  readonly readings: Locator;
  readonly history: Locator;
  readonly provenance: Locator;
  readonly property: Locator;
  constructor(
    private readonly page: Page,
    private readonly narrator?: GuideNarrator,
  ) {
    this.readings = page.getByRole('region', { name: 'Property readings' });
    this.history = page.getByRole('region', { name: 'Hot property history' });
    this.provenance = page.getByRole('region', {
      name: 'Interpretation provenance',
    });
    this.property = page.getByLabel('Property and definition version');
  }
  async open() {
    await this.page.goto(
      '/assets/asset-1?tenant=tenant-a&effective_at_ms=3000&known_at_ms=3000&history_start=0&history_end=3000',
    );
  }
  async choose(id: string, version: number) {
    await performDocumentedAction(
      this.narrator,
      this.property,
      {
        title: 'Choose an exact declared property',
        body: 'Select the property and immutable definition version. The URL retains this scope; current state is independent of the metadata review cutoffs. Only the selected property is read.',
      },
      () =>
        this.property
          .selectOption(JSON.stringify([id, version]))
          .then(() => {}),
    );
  }
  async inspectReading() {
    const target = this.readings.getByRole('button', {
      name: 'Inspect reading provenance',
    });
    await performDocumentedAction(
      this.narrator,
      target,
      {
        title: 'Inspect original reading provenance',
        body: 'Read the original binding revision, source message/output, decoder and selected time basis. Corrections add interpretations; this evidence is not rebound to current metadata.',
      },
      () => target.click(),
    );
  }
  async nextPage() {
    const target = this.history.getByRole('button', {
      name: 'Next history page',
    });
    await performDocumentedAction(
      this.narrator,
      target,
      {
        title: 'Continue bounded hot history',
        body: 'Follow the opaque cursor inside the same exact property and event window. Pages contain at most fifty stored interpretations and do not share one database snapshot.',
      },
      () => target.click(),
    );
  }
  async firstPage() {
    await this.history
      .getByRole('button', { name: 'First history page' })
      .click();
  }
  async inspectHistory() {
    await this.history
      .getByRole('button', { name: 'Inspect history interpretation 1' })
      .click();
  }
  async applyWindow(start: string, end: string) {
    await this.page
      .getByLabel('History start (Unix ms, inclusive)')
      .fill(start);
    await this.page.getByLabel('History end (Unix ms, exclusive)').fill(end);
    const target = this.history.getByRole('button', {
      name: 'Apply history window',
    });
    await performDocumentedAction(
      this.narrator,
      target,
      {
        title: 'Choose an explicit event-time window',
        body: 'Use an increasing half-open window of at most seven days. Applying it clears the page cursor and selected interpretation; older late appends require restarting the window.',
      },
      () => target.click(),
    );
  }
  async refreshReading() {
    await this.readings
      .getByRole('button', { name: 'Refresh reading' })
      .click();
  }
}
