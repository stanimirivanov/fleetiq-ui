import {
  assessPerformance,
  qualityPolicy,
} from '../../../tools/quality/policy.mjs';
import { installFleetApi } from '../fixtures/fleet-api';
import { measurementTest as test } from '../fixtures/measurement-test';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect } from '../fixtures/production-test';
import { BrowserQualityPage } from '../pages/browser-quality.page';
import { ConnectedMapPage } from '../pages/connected-map.page';
import {
  mapWorkerCount,
  mapWorkerHeap,
  requireMapMeasurementIsolation,
} from '../pages/map-resources';

test('real geographic renderer releases workers, WebGL canvas and protected evidence across bounded route cycles', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1680, height: 960 });
  await installMetadataApi(page);
  await installFleetApi(page);
  const map = new ConnectedMapPage(page),
    resources = new BrowserQualityPage(page),
    session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  try {
    // Establish one document and exercise the identical complete SPA workload
    // during warmup. Reloading here would discard the caches we intend to warm.
    await map.open();
    await map.rendererReady();
    await map.leave();
    await expect.poll(() => mapWorkerCount(session)).toBe(0);
    const cycle = async () => {
      const started = Date.now();
      await map.returnToMap();
      const navigationMs = Date.now() - started;
      const filterStarted = Date.now();
      await map.filter.fill('Unlocated');
      await expect(map.asset('Positioned equipment')).toHaveCount(0);
      await map.filter.fill('');
      await expect(map.asset('Positioned equipment')).toBeVisible();
      const filterMs = Date.now() - filterStarted;
      await expect.poll(() => mapWorkerCount(session)).toBe(1);
      const workerHeap = await mapWorkerHeap(session);
      await map.asset('Positioned equipment').click();
      await expect(map.evidence).toContainText('51.5, -0.12');
      await map.leave();
      await expect.poll(() => mapWorkerCount(session)).toBe(0);
      await expect(page.getByTestId('geodetic-canvas')).toHaveCount(0);
      return { navigationMs, filterMs, workerHeap };
    };
    for (let i = 0; i < qualityPolicy.performance.warmups; i++) await cycle();
    await requireMapMeasurementIsolation(page);
    const before = await resources.resources(session),
      samples: { navigationMs: number; filterMs: number }[] = [],
      workerHeaps: number[] = [];
    for (let i = 0; i < qualityPolicy.performance.samples; i++) {
      const sample = await cycle();
      samples.push({
        navigationMs: sample.navigationMs,
        filterMs: sample.filterMs,
      });
      workerHeaps.push(sample.workerHeap);
    }
    await requireMapMeasurementIsolation(page);
    const after = await resources.resources(session),
      measurement = {
        heapBefore: before.heap,
        heapAfter: after.heap,
        nodesBefore: before.nodes,
        nodesAfter: after.nodes,
      };
    await info.attach('bounded-geographic-measurements', {
      contentType: 'application/json',
      body: JSON.stringify({ samples, resources: measurement, workerHeaps }),
    });
    assessPerformance(samples, measurement);
    expect(workerHeaps).toHaveLength(qualityPolicy.performance.samples);
  } finally {
    await session.detach();
  }
});
