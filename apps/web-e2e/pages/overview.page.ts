import type { Locator, Page } from '@playwright/test';
import {
  documentResult,
  type GuideNarrator,
} from '../user-guide/guide-narrator';

/** Overview content and semantic sections, separate from the application shell. */
export class OverviewPage {
  readonly heading: Locator;
  readonly connectionNotice: Locator;
  readonly metrics: Locator;
  readonly map: Locator;
  readonly assetDiscovery: Locator;
  readonly attentionQueue: Locator;
  readonly dataQuality: Locator;
  readonly energyAndUtilization: Locator;
  readonly searchAssets: Locator;
  readonly conditionFilter: Locator;
  readonly typeFilter: Locator;
  readonly connectivityFilter: Locator;

  constructor(
    page: Page,
    private readonly narrator?: GuideNarrator,
  ) {
    this.heading = page.getByRole('heading', {
      level: 1,
      name: 'Fleet overview',
    });
    this.connectionNotice = page.getByRole('region', {
      name: 'Sign-in unavailable',
    });
    this.metrics = page.getByRole('region', { name: 'Fleet metrics' });
    this.map = page.getByRole('region', { name: 'Fleet map' });
    this.assetDiscovery = page.getByRole('region', {
      name: 'Asset discovery',
    });
    this.attentionQueue = page.getByRole('region', {
      name: 'Attention queue',
    });
    this.dataQuality = page.getByRole('region', { name: 'Data quality' });
    this.energyAndUtilization = page.getByRole('region', {
      name: 'Energy and utilization',
    });
    this.searchAssets = this.assetDiscovery.getByRole('searchbox', {
      name: 'Search assets',
    });
    this.typeFilter = this.assetDiscovery.getByRole('combobox', {
      name: 'Type',
    });
    this.conditionFilter = this.assetDiscovery.getByRole('combobox', {
      name: 'Condition',
    });
    this.connectivityFilter = this.assetDiscovery.getByRole('combobox', {
      name: 'Connectivity',
    });
  }

  async searchFor(asset: string): Promise<void> {
    await this.searchAssets.fill(asset);
  }

  async chooseType(value: string): Promise<void> {
    await this.typeFilter.selectOption(value);
  }

  async chooseCondition(value: string): Promise<void> {
    await this.conditionFilter.selectOption(value);
  }

  async chooseConnectivity(value: string): Promise<void> {
    await this.connectivityFilter.selectOption(value);
  }

  async document(): Promise<void> {
    await documentResult(this.narrator, this.connectionNotice, {
      title: 'Know when fleet evidence is unavailable',
      body: 'The overview requires an operator session before showing authorized inventory and evidence. Sign-in failures do not create sample counts, locations or alerts.',
    });
  }
}
