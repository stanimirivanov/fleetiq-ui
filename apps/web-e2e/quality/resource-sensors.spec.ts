import {
  assessPerformance,
  qualityPolicy,
  requireNoPageErrors,
} from '../../../tools/quality/policy.mjs';
import { measurementTest } from '../fixtures/measurement-test';
import { expect } from '../fixtures/production-test';
import { auditAccessibility as audit } from '../pages/accessibility-audit';
import { BrowserQualityPage } from '../pages/browser-quality.page';

measurementTest.describe('measurement sensor controls', () => {
  measurementTest(
    'real browser negative controls reject errors, inaccessible controls, slowdown and retained DOM',
    async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      let errors = 0;
      page.on('pageerror', () => {
        errors += 1;
      });
      try {
        await page.setContent(
          '<main><h1>Sensor qualification</h1><button></button></main>',
        );
        expect(
          (await audit(page)).some((rule) => rule.id === 'button-name'),
        ).toBe(true);
        await page.evaluate(() =>
          setTimeout(() => {
            throw new Error('synthetic-private-error-marker');
          }, 0),
        );
        await expect.poll(() => errors).toBe(1);
        expect(() => requireNoPageErrors(errors)).toThrow(/redacted/);
        const limits = qualityPolicy.performance;
        const slow = await page.evaluate(async (delay) => {
          const start = performance.now();
          await new Promise((resolve) => setTimeout(resolve, delay));
          return performance.now() - start;
        }, limits.navigationMs + 100);
        const samples = Array.from({ length: limits.samples }, () => ({
          navigationMs: 1,
          filterMs: 1,
        }));
        samples[0] = { navigationMs: slow, filterMs: 1 };
        expect(() =>
          assessPerformance(samples, {
            heapBefore: 1,
            heapAfter: 1,
            nodesBefore: 1,
            nodesAfter: 1,
          }),
        ).toThrow(/interaction/);
        const session = await page.context().newCDPSession(page);
        await session.send('Performance.enable');
        const view = new BrowserQualityPage(page);
        const before = await view.resources(session);
        await page.evaluate((count) => {
          for (let n = 0; n < count; n++)
            document.body.append(document.createElement('div'));
        }, limits.nodeGrowth + 100);
        const after = await view.resources(session);
        expect(() =>
          assessPerformance(
            Array.from({ length: limits.samples }, () => ({
              navigationMs: 1,
              filterMs: 1,
            })),
            {
              heapBefore: before.heap,
              heapAfter: after.heap,
              nodesBefore: before.nodes,
              nodesAfter: after.nodes,
            },
          ),
        ).toThrow(/resource growth/);
        // Real retained detached nodes must survive GC and still breach the node cap.
        await page.evaluate((count) => {
          for (const node of document.querySelectorAll('body > div'))
            node.remove();
          const retained = window as typeof window & {
            qualityRetainedNodes?: Element[];
          };
          retained.qualityRetainedNodes = Array.from({ length: count }, () =>
            document.createElement('section'),
          );
        }, limits.nodeGrowth + 100);
        const detached = await view.resources(session);
        expect(detached.nodes - before.nodes).toBeGreaterThan(
          limits.nodeGrowth,
        );
        const fastSamples = Array.from({ length: limits.samples }, () => ({
          navigationMs: 1,
          filterMs: 1,
        }));
        expect(() =>
          assessPerformance(fastSamples, {
            heapBefore: before.heap,
            heapAfter: detached.heap,
            nodesBefore: before.nodes,
            nodesAfter: detached.nodes,
          }),
        ).toThrow(/resource growth/);
        await page.evaluate(() => {
          delete (
            window as typeof window & { qualityRetainedNodes?: Element[] }
          ).qualityRetainedNodes;
        });
        const reclaimed = await view.resources(session);
        expect(() =>
          assessPerformance(fastSamples, {
            heapBefore: before.heap,
            heapAfter: reclaimed.heap,
            nodesBefore: before.nodes,
            nodesAfter: reclaimed.nodes,
          }),
        ).not.toThrow();

        // A reachable numeric array also remains visible to the independent heap cap.
        await page.evaluate((bytes) => {
          (
            window as typeof window & { qualityRetainedHeap?: number[] }
          ).qualityRetainedHeap = new Array(Math.ceil(bytes / 2)).fill(0);
        }, limits.heapGrowthBytes);
        const retainedHeap = await view.resources(session);
        expect(retainedHeap.heap - reclaimed.heap).toBeGreaterThan(
          limits.heapGrowthBytes,
        );
        expect(() =>
          assessPerformance(fastSamples, {
            heapBefore: reclaimed.heap,
            heapAfter: retainedHeap.heap,
            nodesBefore: reclaimed.nodes,
            nodesAfter: retainedHeap.nodes,
          }),
        ).toThrow(/resource growth/);
        await page.evaluate(() => {
          delete (window as typeof window & { qualityRetainedHeap?: number[] })
            .qualityRetainedHeap;
        });

        // A new worker must fail the main-renderer profile without being terminated.
        const workerReady = page.waitForEvent('worker');
        await page.evaluate(() => {
          (
            window as typeof window & { qualityProbeWorker?: Worker }
          ).qualityProbeWorker = new Worker(
            URL.createObjectURL(
              new Blob(['self.onmessage = () => {}'], {
                type: 'text/javascript',
              }),
            ),
          );
        });
        const worker = await workerReady;
        await expect(view.resources(session)).rejects.toThrow(/worker-free/);
        expect(await worker.evaluate(() => 1)).toBe(1);
        await page.evaluate(() => {
          const retained = window as typeof window & {
            qualityProbeWorker?: Worker;
          };
          retained.qualityProbeWorker?.terminate();
          delete retained.qualityProbeWorker;
        });

        // Missing launch instrumentation is a failure, never a zero-valued sample.
        const unconfigured = await browser.browserType().launch({ args: [] });
        try {
          const unconfiguredPage = await unconfigured.newPage();
          await unconfiguredPage.setContent(
            '<main>GC prerequisite probe</main>',
          );
          const unconfiguredSession = await unconfiguredPage
            .context()
            .newCDPSession(unconfiguredPage);
          try {
            await expect(
              new BrowserQualityPage(unconfiguredPage).resources(
                unconfiguredSession,
              ),
            ).rejects.toThrow(/asynchronous browser GC unavailable/);
          } finally {
            await unconfiguredSession.detach();
          }
        } finally {
          await unconfigured.close();
        }
        await session.detach();
      } finally {
        await context.close();
      }
    },
  );
});
