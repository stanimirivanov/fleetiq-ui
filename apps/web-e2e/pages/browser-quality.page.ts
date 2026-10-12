import type { CDPSession, Page } from '@playwright/test';
import { ConnectedMetadataPage } from './connected-metadata.page';
/** Actions/readiness live here; thresholds and assertions remain in the scenario. */
export class BrowserQualityPage {
  readonly metadata: ConnectedMetadataPage;
  constructor(readonly page: Page) {
    this.metadata = new ConnectedMetadataPage(page);
  }
  async open(): Promise<void> {
    await this.page.goto(
      '/assets?tenant=tenant-a&asset=power-system-1&effective_at_ms=1500&known_at_ms=2500&device_asset_id=gateway-1&endpoint_id=can-primary&signal_id=bus.voltage',
    );
    await this.metadata.catalogue.first().waitFor();
    await this.metadata.asset('Primary machine').waitFor();
  }
  async settled(): Promise<void> {
    await this.page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }
  async filter(): Promise<number> {
    const start = await this.page.evaluate(() => performance.now());
    await this.metadata.filter.fill('Primary');
    await this.metadata.asset('Primary machine').waitFor();
    await this.settled();
    const end = await this.page.evaluate(() => performance.now());
    await this.metadata.filter.fill('');
    await this.metadata.asset('Monitoring gateway').waitFor();
    return end - start;
  }
  async registryRoundTrip(): Promise<{
    registryMs: number;
    catalogueMs: number;
    navigationMs: number;
  }> {
    const start = await this.page.evaluate(() => performance.now());
    await this.metadata.registryMappingLink.click();
    await this.metadata.relationships
      .getByText('physical.contains', { exact: false })
      .first()
      .waitFor();
    await this.metadata.targetBindings
      .getByText('binding-1', { exact: false })
      .first()
      .waitFor();
    await this.metadata.sourceBindings
      .getByText('binding-1', { exact: false })
      .first()
      .waitFor();
    await this.settled();
    const entered = await this.page.evaluate(() => performance.now());
    await this.page.goBack();
    await this.metadata.asset('Primary machine').waitFor();
    await this.settled();
    const returned = await this.page.evaluate(() => performance.now());
    return {
      registryMs: entered - start,
      catalogueMs: returned - entered,
      navigationMs: Math.max(entered - start, returned - entered),
    };
  }
  async resources(
    session: CDPSession,
  ): Promise<{ heap: number; nodes: number }> {
    // Chromium sweeps detached DOM after renderer tasks. Use identical fixed
    // render/collection rounds at both boundaries; never retry until a cap passes.
    for (let round = 0; round < 3; round++) {
      await this.settled();
      await session.send('HeapProfiler.collectGarbage');
    }
    const result = await session.send('Performance.getMetrics');
    const metrics = new Map<string, number>(
      result.metrics.map((entry: { name: string; value: number }) => [
        entry.name,
        entry.value,
      ]),
    );
    const heap = metrics.get('JSHeapUsedSize'),
      nodes = metrics.get('Nodes');
    if (!heap || !nodes)
      throw new Error('Required Chromium resource metrics unavailable');
    return { heap, nodes };
  }
}
