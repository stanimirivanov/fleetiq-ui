import {
  assessPerformance,
  qualityPolicy,
} from '../../../tools/quality/policy.mjs';
import { measurementTest as test } from '../fixtures/measurement-test';
import { installOverviewApi } from '../fixtures/overview-api';
import { expect } from '../fixtures/production-test';
import { BrowserQualityPage } from '../pages/browser-quality.page';
import { FleetOverviewPage } from '../pages/fleet-overview.page';

for (const viewport of [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const) {
  test(`bounded overview inventory ${viewport.name}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    const api = await installOverviewApi(page, { inventorySize: 200 }),
      overview = new FleetOverviewPage(page),
      resources = new BrowserQualityPage(page),
      session = await page.context().newCDPSession(page);
    const downloads: string[] = [];
    page.on('request', (r) => {
      if (
        r.url().includes('maplibre-adapter') ||
        r.url().includes('maplibre-gl-worker')
      )
        downloads.push('map-runtime');
    });
    await session.send('Performance.enable');
    try {
      await overview.open();
      await expect(overview.discovery.getByRole('row')).toHaveCount(51);
      await expect(overview.metric('Registered assets')).toContainText('200');
      const cycle = async () => {
        const filterMs = await overview.filterRoundTrip();
        await overview.asset('Positioned equipment').click();
        const navigationMs = await overview.roundTrip();
        await expect(overview.asset('Positioned equipment')).toBeVisible();
        return { navigationMs, filterMs };
      };
      for (let i = 0; i < qualityPolicy.performance.warmups; i++) await cycle();
      const samples = [];
      for (let i = 0; i < qualityPolicy.performance.samples; i++)
        samples.push(await cycle());
      const before = await resources.resources(session);
      const count = api.fleet.requests.length;
      for (let i = 0; i < qualityPolicy.performance.samples; i++) await cycle();
      const after = await resources.resources(session);
      expect(api.fleet.requests.length - count).toBe(
        qualityPolicy.performance.samples * 2,
      );
      expect(downloads).toEqual([]);
      const measurement = {
        heapBefore: before.heap,
        heapAfter: after.heap,
        nodesBefore: before.nodes,
        nodesAfter: after.nodes,
      };
      await info.attach('bounded-overview-measurements', {
        contentType: 'application/json',
        body: JSON.stringify({
          inventory: 200,
          pageSize: 50,
          samples,
          resources: measurement,
        }),
      });
      assessPerformance(samples, measurement);
    } finally {
      await session.detach();
    }
  });
}
