import type { Page } from '@playwright/test';
import {
  documentResult,
  type GuideNarrator,
  performDocumentedAction,
} from '../user-guide/guide-narrator';
/** Locators and cohesive actions only; scenarios own assertions and prerequisites. */
export class DevicesPage {
  constructor(
    readonly page: Page,
    private readonly narrator?: GuideNarrator,
  ) {}
  get registration() {
    return this.page.getByRole('region', {
      name: '1. Register asset',
      exact: true,
    });
  }
  get communication() {
    return this.page.getByRole('region', {
      name: '2. Communication capability',
      exact: true,
    });
  }
  get protocol() {
    return this.page.getByRole('region', {
      name: '3. Pinned protocol route',
      exact: true,
    });
  }
  get diagnostics() {
    return this.page.getByRole('region', {
      name: 'Ingestion evidence',
      exact: true,
    });
  }
  async open() {
    await this.page.goto('/devices?tenant=tenant-a');
  }
  async registerAsset() {
    await this.registration
      .getByLabel('Internal asset ID', { exact: true })
      .fill('gateway-new');
    await this.registration
      .getByLabel('Asset display name')
      .fill('Monitoring gateway');
    await this.registration
      .getByLabel('Published type on this page')
      .selectOption('0');
    await this.registration
      .getByRole('button', { name: 'Add external identifier' })
      .click();
    await this.registration.getByLabel('Identifier 1 kind').fill('imei');
    await this.registration
      .getByLabel('Identifier 1 value')
      .fill('123456789012345');
    await performDocumentedAction(
      this.narrator,
      this.registration,
      {
        title: 'Register the tracker as an asset',
        body: 'Choose an exact published type and a stable internal ID. External identifiers such as IMEI remain separate, scoped identifiers and do not authenticate a tracker. Creation is independent from communication registration.',
      },
      () =>
        this.registration
          .getByRole('button', { name: 'Register asset', exact: true })
          .click(),
    );
  }
  async registerCapability() {
    await this.communication
      .getByRole('button', { name: 'Add endpoint' })
      .click();
    await this.communication
      .getByLabel('Endpoint 1 id', { exact: true })
      .fill('can-primary');
    await this.communication
      .getByLabel('Endpoint 1 kind', { exact: true })
      .fill('can');
    await this.communication
      .getByLabel('Endpoint 1 name', { exact: true })
      .fill('Primary CAN bus');
    await performDocumentedAction(
      this.narrator,
      this.communication,
      {
        title: 'Declare the communication source boundary',
        body: 'Register ordered endpoints on the existing asset. Endpoint IDs are unique within the device. This create-only command does not overwrite an existing declaration or activate a decoder; after an unconfirmed outcome retry only the unchanged request.',
      },
      () =>
        this.communication
          .getByRole('button', { name: 'Register communication capability' })
          .click(),
    );
  }
  async checkRelease() {
    await this.protocol
      .getByLabel('Exact package ID', { exact: true })
      .fill('teltonika.avl');
    await this.protocol
      .getByLabel('Exact package version', { exact: true })
      .fill('1');
    await performDocumentedAction(
      this.narrator,
      this.protocol,
      {
        title: 'Verify an exact stored protocol release',
        body: 'Enter the immutable package ID and version and select the protocol world. Stored artifact identity does not prove current admission. The assignment command rechecks eligibility on the backend.',
      },
      () =>
        this.protocol
          .getByRole('button', { name: 'Check stored release' })
          .click(),
    );
  }
  async assign() {
    await performDocumentedAction(
      this.narrator,
      this.protocol,
      {
        title: 'Assign with the current route revision',
        body: 'Use the configured listener channel. Initial creation expects revision zero; changes compare the last observed revision. Conflicts require current evidence review. The UI re-reads the route because a retry acknowledgement may refer to an older generation.',
      },
      () =>
        this.protocol
          .getByRole('button', { name: 'Assign pinned release' })
          .click(),
    );
  }
  async refreshDiagnostics() {
    await this.diagnostics
      .getByRole('button', { name: 'Refresh diagnostics' })
      .click();
  }
  async explainEvidence() {
    await documentResult(this.narrator, this.diagnostics, {
      title: 'Read processing and sample coverage separately from liveness',
      body: 'This synthetic contract journey shows decoded, queued, leased, expired and poisoned evidence. A lease does not prove worker liveness; an empty traffic list does not prove failure. Coverage flags disclose omitted frames and output positions. Observed endpoint/signal tuples are sampled source evidence, not physical equipment inventory or semantic attribution.',
    });
  }
  async retire() {
    await performDocumentedAction(
      this.narrator,
      this.protocol,
      {
        title: 'Retire the route explicitly',
        body: 'Retirement submits an explicit null selection with the current revision. It does not delete the asset, endpoints, accepted receipts or historical package provenance. Inspect the refreshed head to confirm configuration.',
      },
      () => this.protocol.getByRole('button', { name: 'Retire route' }).click(),
    );
  }
}
