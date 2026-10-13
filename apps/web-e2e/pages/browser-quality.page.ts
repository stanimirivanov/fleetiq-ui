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
    // This profile measures the main renderer; worker heaps need their own lane.
    const targets = await session.send('Target.getTargets');
    if (
      targets.targetInfos.some((target: { type: string }) =>
        ['worker', 'shared_worker', 'service_worker'].includes(target.type),
      )
    )
      throw new Error('Resource measurement requires a worker-free browser.');
    // Async last-resort V8 GC uses an empty native stack and releases incidental
    // engine caches. Fixed rounds allow finalizers; no threshold-driven retries.
    for (let round = 0; round < 3; round++) {
      await this.settled();
      const collected = await session.send('Runtime.evaluate', {
        expression: `(async () => {
          if (typeof gc !== 'function') return false;
          const pending = gc({ type: 'major', execution: 'async', flavor: 'last-resort' });
          if (!(pending instanceof Promise)) return false;
          await pending;
          return true;
        })()`,
        awaitPromise: true,
        returnByValue: true,
      });
      if (collected.exceptionDetails || collected.result?.value !== true)
        throw new Error('Required asynchronous browser GC unavailable.');
    }
    const result = await session.send('Performance.getMetrics');
    const metrics = new Map<string, number>(
      result.metrics.map((entry: { name: string; value: number }) => [
        entry.name,
        entry.value,
      ]),
    );
    const heap = metrics.get('JSHeapUsedSize');
    const dom = await session.send('Memory.getDOMCounters');
    const nodes = dom.nodes;

    if (
      !Number.isFinite(heap) ||
      !heap ||
      heap <= 0 ||
      !Number.isSafeInteger(nodes) ||
      nodes <= 0
    )
      throw new Error('Required Chromium resource metrics unavailable');
    return { heap, nodes };
  }
}
