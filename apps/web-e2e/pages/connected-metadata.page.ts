import type { Locator, Page } from '@playwright/test';
import {
  type GuideNarrator,
  performDocumentedAction,
} from '../user-guide/guide-narrator';

/** Connected metadata actions; scenarios own assertions and optional guide results. */
export class ConnectedMetadataPage {
  readonly tenantId: Locator;
  readonly openTenant: Locator;
  readonly catalogue: Locator;
  readonly filter: Locator;
  readonly typeFilter: Locator;
  readonly cataloguePages: Locator;
  readonly identity: Locator;
  readonly pinnedType: Locator;
  readonly relationships: Locator;
  readonly targetBindings: Locator;
  readonly sourceBindings: Locator;
  readonly registryMappingLink: Locator;
  readonly effectiveAt: Locator;
  readonly knownAt: Locator;
  readonly applyTimes: Locator;
  readonly unavailableOperations: Locator;
  readonly retryCatalogue: Locator;

  constructor(
    private readonly page: Page,
    private readonly narrator?: GuideNarrator,
  ) {
    this.tenantId = page.getByLabel('Tenant ID', { exact: true });
    this.openTenant = page.getByRole('button', {
      name: 'Open tenant',
      exact: true,
    });
    this.catalogue = page.getByRole('list', {
      name: 'Connected assets',
      exact: true,
    });
    this.filter = page.getByRole('searchbox', {
      name: 'Filter assets',
      exact: true,
    });
    this.typeFilter = page.getByRole('combobox', {
      name: 'Asset type',
      exact: true,
    });
    this.cataloguePages = page.getByRole('navigation', {
      name: 'Asset catalogue pages',
      exact: true,
    });
    this.identity = page.getByRole('region', {
      name: 'Asset identity',
      exact: true,
    });
    this.pinnedType = page.getByRole('region', {
      name: 'Pinned asset type',
      exact: true,
    });
    this.relationships = page.getByRole('region', {
      name: 'Directed relationships',
      exact: true,
    });
    this.targetBindings = page.getByRole('region', {
      name: 'Target signal bindings',
      exact: true,
    });
    this.sourceBindings = page.getByRole('region', {
      name: 'Source binding candidates',
      exact: true,
    });
    this.registryMappingLink = page.getByRole('link', {
      name: 'Review registry mapping',
      exact: true,
    });
    this.effectiveAt = page.getByLabel('Effective at (Unix ms)', {
      exact: true,
    });
    this.knownAt = page.getByLabel('Known at (Unix ms)', { exact: true });
    this.applyTimes = page.getByRole('button', {
      name: 'Apply review times',
      exact: true,
    });
    this.unavailableOperations = page.getByRole('region', {
      name: 'Operational evidence',
      exact: true,
    });
    this.retryCatalogue = page.getByRole('button', {
      name: 'Retry asset catalogue',
      exact: true,
    });
  }

  async openCatalogue(search = ''): Promise<void> {
    await this.page.goto(`/assets?tenant=tenant-a${search}`);
  }
  async openRegistry(search = ''): Promise<void> {
    await this.page.goto(
      `/assets/registry/review?tenant=tenant-a&after=assembly-a&asset=power-system-1&effective_at_ms=1500&known_at_ms=2500${search}`,
    );
  }
  asset(name: string): Locator {
    return this.catalogue.getByRole('link', {
      name: `Inspect ${name}`,
      exact: true,
    });
  }
  async chooseTenant(id: string): Promise<void> {
    await this.action(
      this.tenantId,
      'Choose an authorized tenant',
      'Enter the tenant supplied by your administrator. Selecting an ID does not grant access.',
      async () => {
        await this.tenantId.fill(id);
        await this.openTenant.click();
      },
    );
  }
  async filterCatalogue(value: string): Promise<void> {
    await this.action(
      this.filter,
      value ? 'Filter the loaded asset page' : 'Clear the page filter',
      'Search applies only to the loaded page. It is stored in the URL and is not a fleet-wide search.',
      () => this.filter.fill(value),
    );
  }
  async filterType(value: string): Promise<void> {
    await this.action(
      this.typeFilter,
      value ? 'Filter by a type on this page' : 'Show every type on this page',
      'Type filtering is local to the current bounded page; it does not calculate a fleet total.',
      async () => {
        await this.typeFilter.selectOption(value);
      },
    );
  }
  async showPropertyDefinition(id: string, version: number): Promise<void> {
    const target = this.pinnedType.getByText(`Property ${id} v${version}`, {
      exact: true,
    });
    await this.action(
      target,
      'Read the pinned property definition',
      'Expand the exact property version to understand its name, value kind and unit. This is a definition, not an observed reading.',
      () => target.click(),
    );
  }
  async inspect(name: string): Promise<void> {
    await this.action(
      this.asset(name),
      'Inspect the selected asset',
      'Open asset identity and its exact type version. External identifiers do not replace the internal asset ID.',
      () => this.asset(name).click(),
    );
  }
  async selectRegistryAsset(name: string): Promise<void> {
    const target = this.page.getByRole('button', {
      name: `Select ${name}`,
      exact: true,
    });
    await this.action(
      target,
      'Select an asset for metadata review',
      'Selection scopes the relationship and target-binding pages; it does not load an entire fleet graph.',
      () => target.click(),
    );
  }
  async nextCataloguePage(): Promise<void> {
    const target = this.cataloguePages.getByRole('link', {
      name: 'Next page',
      exact: true,
    });
    await this.action(
      target,
      'Follow the next catalogue cursor',
      'Load the next bounded page using the server cursor. This does not imply a fleet total or a transactional snapshot across pages.',
      () => target.click(),
    );
  }
  async firstCataloguePage(): Promise<void> {
    const target = this.cataloguePages.getByRole('link', {
      name: 'First page',
      exact: true,
    });
    await this.action(
      target,
      'Return to the first catalogue page',
      'Clear the forward cursor to restart the catalogue without inventing reverse-pagination semantics.',
      () => target.click(),
    );
  }
  async reviewMapping(): Promise<void> {
    await this.action(
      this.registryMappingLink,
      'Open the registry and mapping review',
      'Review directed relationships and exact device-to-property attribution using explicit effective and known times.',
      () => this.registryMappingLink.click(),
    );
  }
  async reviewSource(signal: string): Promise<void> {
    const target = this.page.getByRole('button', {
      name: `Review source ${signal}`,
      exact: true,
    });
    await this.action(
      target,
      'Trace the exact source signal',
      'A source is the device asset, endpoint and signal together. Review its candidate bindings rather than assuming the tracker is the monitored asset.',
      () => target.click(),
    );
  }
  paging(kind: 'Relationship' | 'Target binding' | 'Source binding'): Locator {
    return this.page.getByRole('navigation', {
      name: `${kind} pages`,
      exact: true,
    });
  }
  async nextSnapshotPage(
    kind: 'relationship' | 'target binding' | 'source binding',
  ): Promise<void> {
    const target = this.page.getByRole('link', {
      name: `Next ${kind} page`,
      exact: true,
    });
    await this.action(
      target,
      `Read the next ${kind} page`,
      'This cursor belongs to this resource and these cutoffs. Other snapshot panels keep independent cursors.',
      () => target.click(),
    );
  }
  async applyReviewTimes(effective: string, known: string): Promise<void> {
    await this.action(
      this.effectiveAt,
      'Set explicit effective and known cutoffs',
      'Effective time asks when a mapping applies; known time asks what had been recorded. Both use Unix milliseconds. Changing them resets snapshot cursors.',
      async () => {
        await this.effectiveAt.fill(effective);
        await this.knownAt.fill(known);
        await this.applyTimes.click();
      },
    );
  }
  async chooseSource(
    device: string,
    endpoint: string,
    signal: string,
  ): Promise<void> {
    const deviceInput = this.sourceBindings.getByLabel(
      'Source device asset ID',
      { exact: true },
    );
    await this.action(
      deviceInput,
      'Review an explicitly identified source',
      'Enter a complete device, endpoint and signal tuple. This lookup is not device or sensor discovery.',
      async () => {
        await deviceInput.fill(device);
        await this.sourceBindings
          .getByLabel('Source endpoint ID', { exact: true })
          .fill(endpoint);
        await this.sourceBindings
          .getByLabel('Source signal ID', { exact: true })
          .fill(signal);
        await this.sourceBindings
          .getByRole('button', { name: 'Review exact source', exact: true })
          .click();
      },
    );
  }
  private async action(
    target: Locator,
    title: string,
    body: string,
    perform: () => Promise<void>,
  ): Promise<void> {
    await performDocumentedAction(
      this.narrator,
      target,
      { title, body },
      perform,
    );
  }
}
