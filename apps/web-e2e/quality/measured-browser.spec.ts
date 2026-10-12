import AxeBuilder from '@axe-core/playwright';
import {
  sourceIdentity,
  writeQualityEvidence,
} from '../../../tools/quality/evidence.mjs';
import {
  assessPerformance,
  qualityPolicy,
  repositoryRoot,
  requireNoPageErrors,
} from '../../../tools/quality/policy.mjs';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, type Page, test } from '../fixtures/production-test';
import { BrowserQualityPage } from '../pages/browser-quality.page';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { ShellPage } from '../pages/shell.page';

const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
] as const;
async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations.map((rule) => ({
    id: rule.id,
    count: rule.nodes.length,
  }));
}
for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    test(`rendered production accessibility ${viewport.name} ${theme}`, async ({
      page,
    }) => {
      const source = sourceIdentity(repositoryRoot);
      await page.setViewportSize(viewport);
      await installMetadataApi(page);
      const metadata = new ConnectedMetadataPage(page);
      const shell = new ShellPage(page);
      await metadata.openCatalogue('&effective_at_ms=1500&known_at_ms=2500');
      await expect(metadata.catalogue).toBeVisible();
      if (theme === 'dark') await shell.cycleTheme();
      const observations = [];
      for (const screen of ['catalogue', 'inspector', 'registry'] as const) {
        if (screen === 'inspector') {
          await metadata.inspect('Primary machine');
          await expect(metadata.identity).toContainText('SN-100');
        }
        if (screen === 'registry') {
          await metadata.openRegistry();
          await expect(metadata.targetBindings).toContainText('binding-1');
        }
        const violations = await audit(page);
        observations.push({ screen, violations });
        writeQualityEvidence(repositoryRoot, 'accessibility', source, {
          viewport: viewport.name,
          theme,
          observations,
        });
        expect(
          violations,
          'Rendered accessibility rule IDs; DOM is redacted',
        ).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      writeQualityEvidence(repositoryRoot, 'accessibility', source, {
        viewport: viewport.name,
        theme,
        observations,
      });
    });
  }
  test(`bounded production rendering envelope ${viewport.name}`, async ({
    page,
    browser,
  }, testInfo) => {
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
      await expect(view.metadata.catalogue.getByRole('listitem')).toHaveCount(
        qualityPolicy.performance.pageSize,
      );
      for (let index = 0; index < qualityPolicy.performance.warmups; index++) {
        await view.filter();
        await view.registryRoundTrip();
      }
      const before = await view.resources(session);
      const samples = [];
      for (let index = 0; index < qualityPolicy.performance.samples; index++) {
        const filterMs = await view.filter();
        samples.push({ ...(await view.registryRoundTrip()), filterMs });
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
  });
}
test('real browser negative controls reject errors, inaccessible controls, slowdown and retained DOM', async ({
  browser,
}) => {
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
    expect((await audit(page)).some((rule) => rule.id === 'button-name')).toBe(
      true,
    );
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
    await session.detach();
  } finally {
    await context.close();
  }
});

test('rendered signed-out and denied-access states remain accessible', async ({
  page,
}) => {
  const source = sourceIdentity(repositoryRoot);
  await page.setViewportSize({ width: 390, height: 844 });
  const api = await installMetadataApi(page, {
    sessionStatus: 401,
    catalogueStatus: 403,
  });
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue('&effective_at_ms=1500&known_at_ms=2500');
  await expect(
    page.getByRole('heading', { name: 'Sign in to FleetIQ' }),
  ).toBeVisible();
  const signedOut = await audit(page);
  writeQualityEvidence(repositoryRoot, 'accessibility', source, {
    viewport: 'narrow',
    theme: 'light',
    observations: [{ screen: 'signed-out', violations: signedOut }],
  });
  expect(signedOut).toEqual([]);
  api.setSessionStatus(200);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'Access to this tenant is denied',
  );
  const forbidden = await audit(page);
  writeQualityEvidence(repositoryRoot, 'accessibility', source, {
    viewport: 'narrow',
    theme: 'light',
    observations: [{ screen: 'forbidden', violations: forbidden }],
  });
  expect(forbidden).toEqual([]);
});
