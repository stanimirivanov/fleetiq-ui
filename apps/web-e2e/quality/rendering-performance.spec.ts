import {
  sourceIdentity,
  writeQualityEvidence,
} from '../../../tools/quality/evidence.mjs';
import {
  assessPerformance,
  qualityPolicy,
  repositoryRoot,
} from '../../../tools/quality/policy.mjs';
import { measurementTest } from '../fixtures/measurement-test';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect } from '../fixtures/production-test';
import { installPropertyLiveApi } from '../fixtures/property-live-api';
import { installTelemetryApi } from '../fixtures/telemetry-api';
import { BrowserQualityPage } from '../pages/browser-quality.page';
import { PropertyLivePage } from '../pages/property-live.page';

const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const;
for (const viewport of viewports) {
  measurementTest.describe(`resource workload ${viewport.name}`, () => {
    measurementTest(
      `bounded production rendering envelope ${viewport.name}`,
      async ({ page, browser }, testInfo) => {
        const source = sourceIdentity(repositoryRoot);
        await page.setViewportSize(viewport);
        await installMetadataApi(page, {
          catalogueSize: qualityPolicy.performance.catalogueRecords,
        });
        const view = new BrowserQualityPage(page);
        const session = await page.context().newCDPSession(page);
        await session.send('Performance.enable');
        try {
          await view.open();
          await expect(
            view.metadata.catalogue.getByRole('listitem'),
          ).toHaveCount(qualityPolicy.performance.pageSize);
          for (
            let index = 0;
            index < qualityPolicy.performance.warmups;
            index++
          ) {
            await view.filter();
            await view.registryRoundTrip();
          }
          // Preserve warm caches for latency; GC belongs to the separate retention phase.
          const samples = [];
          for (
            let index = 0;
            index < qualityPolicy.performance.samples;
            index++
          ) {
            const filterMs = await view.filter();
            samples.push({ ...(await view.registryRoundTrip()), filterMs });
          }
          const before = await view.resources(session);
          for (
            let index = 0;
            index < qualityPolicy.performance.samples;
            index++
          ) {
            await view.filter();
            await view.registryRoundTrip();
          }
          const after = await view.resources(session);
          const resources = {
            heapBefore: before.heap,
            heapAfter: after.heap,
            nodesBefore: before.nodes,
            nodesAfter: after.nodes,
          };
          const observations = {
            viewport: viewport.name,
            browser: browser.version(),
            workload: qualityPolicy.performance,
            samples,
            resources,
          };
          const file = writeQualityEvidence(
            repositoryRoot,
            'performance',
            source,
            observations,
          );
          await testInfo.attach('bounded-rendering-measurements', {
            path: file,
            contentType: 'application/json',
          });
          assessPerformance(samples, resources);
        } finally {
          await session.detach();
        }
      },
    );
  });
}

for (const viewport of viewports) {
  measurementTest(
    `bounded live burst and disposal ${viewport.name}`,
    async ({ page, browser }, testInfo) => {
      const source = sourceIdentity(repositoryRoot);
      await page.setViewportSize(viewport);
      await installMetadataApi(page);
      await installTelemetryApi(page);
      await installPropertyLiveApi(page, 200);
      const view = new BrowserQualityPage(page),
        live = new PropertyLivePage(page);
      const session = await page.context().newCDPSession(page);
      await session.send('Performance.enable');
      const roundTrip = async () => {
        const start = performance.now();
        await live.open();
        await expect(
          live.delivery.getByRole('button', { name: 'Start live updates' }),
        ).toBeVisible();
        const opened = performance.now();
        await live.start();
        await expect(live.delivery).toContainText('revision 209');
        await expect(live.delivery.getByText(/Committed reading/)).toHaveCount(
          1,
        );
        const delivered = performance.now();
        await live.stop();
        await live.leave();
        await expect(view.metadata.catalogue).toBeVisible();
        return {
          openMs: opened - start,
          deliveryMs: delivered - opened,
          leaveMs: performance.now() - delivered,
        };
      };
      try {
        for (let i = 0; i < qualityPolicy.performance.warmups; i++)
          await roundTrip();
        const before = await view.resources(session);
        const samples = [];
        for (let i = 0; i < qualityPolicy.performance.samples; i++)
          samples.push(await roundTrip());
        const after = await view.resources(session);
        const resources = {
          heapBefore: before.heap,
          heapAfter: after.heap,
          nodesBefore: before.nodes,
          nodesAfter: after.nodes,
        };
        const file = writeQualityEvidence(
          repositoryRoot,
          'live-performance',
          source,
          {
            viewport: viewport.name,
            browser: browser.version(),
            workload: {
              replacements: 200,
              warmups: qualityPolicy.performance.warmups,
              samples: qualityPolicy.performance.samples,
            },
            samples,
            resources,
          },
        );
        await testInfo.attach('bounded-live-delivery-measurements', {
          path: file,
          contentType: 'application/json',
        });
        assessPerformance(
          samples.map((sample) => ({
            navigationMs: Math.max(sample.openMs, sample.leaveMs),
            filterMs: sample.deliveryMs,
          })),
          resources,
        );
      } finally {
        await session.detach();
      }
    },
  );
}
