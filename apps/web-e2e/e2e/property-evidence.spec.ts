import { readFile } from 'node:fs/promises';
import { installExportApi } from '../fixtures/export-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { installRestoreApi } from '../fixtures/restore-api';
import { installTelemetryApi } from '../fixtures/telemetry-api';
import { PropertyEvidencePage } from '../pages/property-evidence.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('inspect committed values, original provenance and bounded hot history', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 16,
      slug: 'connected-property-evidence',
      title: 'Inspect property readings, provenance and hot history',
      summary:
        'Choose declared properties, distinguish quality/age/lag, inspect immutable attribution, browse bounded history and recover from empty or denied evidence.',
    },
    {
      tenants: [
        { tenant_id: 'tenant-a', actions: ['metadata.read', 'telemetry.read'] },
      ],
    },
    async (guide) => {
      const api = await installTelemetryApi(guide.page),
        inspector = new PropertyEvidencePage(guide.page, guide);
      await inspector.open();
      await expect(inspector.readings).toContainText('32.1');
      await expect(inspector.readings).toContainText('At evaluation: stale');
      await expect(inspector.readings).toContainText('work is pending');
      await guide.result(inspector.readings, {
        title: 'Read committed evidence honestly',
        body: 'These are controlled contract fixtures, not live devices. The value retains its exact unit and source quality. Age is classified at the displayed evaluation instant; pending means committed tenant projection work, not asset condition or connectivity.',
      });
      await inspector.choose('electrical.voltage', 3);
      await expect(inspector.readings).toContainText(
        '9007199254740993.000000001',
      );
      await expect(guide.page).toHaveURL(/property=electrical\.voltage/u);
      await guide.result(inspector.readings, {
        title: 'Retain precision and exact definitions',
        body: 'Large integer and decimal values remain strings. No floating-point conversion or implicit unit conversion changes the evidence. The selected definition version is part of the request.',
      });
      await inspector.inspectReading();
      await expect(inspector.provenance).toContainText(
        'binding-electrical.voltage',
      );
      await expect(inspector.provenance).toContainText('revision 10');
      await expect(inspector.provenance).toContainText('device_recorded');
      await guide.result(inspector.provenance, {
        title: 'Trace the immutable interpretation',
        body: 'The source device, endpoint, signal, decoder package, message and output explain this value. First effective/knowledge cutoffs belong to the original interpretation and are separate from current graph review.',
      });
      await inspector.nextPage();
      await expect(inspector.history).toContainText(
        '9007199254740993.000000002',
      );
      await expect(guide.page).toHaveURL(/history_after=v1\.cc/u);
      await expect(inspector.provenance).toHaveCount(0);
      await inspector.inspectHistory();
      await expect(inspector.provenance).toContainText('uncertain');
      await guide.result(inspector.history, {
        title: 'Keep exact tables alongside visualization',
        body: 'The table preserves every value and quality on this bounded page. Numeric charts use exact normalization when supported; nonnumeric, single-point and extreme-scale data retains the table without a misleading chart.',
      });
      await inspector.applyWindow('0', '1');
      await expect(inspector.history).toContainText(
        'No stored interpretations',
      );
      await expect(guide.page).not.toHaveURL(/history_after=/);
      await guide.result(inspector.history, {
        title: 'An empty window is not a disconnected source',
        body: 'This window contains no stored interpretations. It says nothing about unresolved or upstream observations, physical health or completeness of the source inventory.',
      });
      api.setStatus(403);
      await inspector.refreshReading();
      await expect(inspector.readings).toContainText('Telemetry access denied');
      await expect(inspector.readings).not.toContainText(
        '9007199254740993.000000001',
      );
      await guide.result(inspector.readings, {
        title: 'Separate permissions and recover explicitly',
        body: 'metadata.read does not grant telemetry.read. Denied/error results remove prior evidence and never substitute sample data. Refresh after access recovery; resumable live delivery is a later capability.',
      });
    },
  );
});
test('property evidence retains URL history and narrow dark layout without inventing empty success', async ({
  page,
}) => {
  await installMetadataApi(page);
  const api = await installTelemetryApi(page),
    inspector = new PropertyEvidencePage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await inspector.open();
  await expect(inspector.readings).toContainText('32.1');
  await inspector.choose('electrical.voltage', 3);
  await expect(inspector.readings).toContainText('9007199254740993.000000001');
  await page.goBack();
  await expect(inspector.readings).toContainText('32.1');
  await page.reload();
  await expect(inspector.readings).toContainText('32.1');
  api.setEmpty(true);
  await inspector.refreshReading();
  await expect(inspector.readings).toContainText('No materialized value');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  api.setStatus(500);
  await inspector.refreshReading();
  await expect(inspector.readings).toContainText(
    'telemetry service is unavailable',
  );
  await expect(inspector.readings).not.toContainText('No materialized value');
});

test('review selected archive coverage and exact numeric summaries without claiming completeness', async ({
  page,
}) => {
  await installMetadataApi(page);
  const api = await installTelemetryApi(page),
    inspector = new PropertyEvidencePage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await inspector.open();
  await inspector.choose('electrical.voltage', 3);
  api.setEmpty(true);
  api.setArchive('unavailable');
  await inspector.review('', '7', '2');
  await expect(inspector.history).toContainText(
    'Archive coverage: unavailable',
  );
  await expect(inspector.history).toContainText(
    'not complete interval coverage',
  );
  await page.reload();
  await expect(inspector.history).toContainText('Manifest 7, generation 2');
  api.setEmpty(false);
  await inspector.review('1000');
  await expect(inspector.history).toContainText(
    'Summary publication 7, revision 2',
  );
  await expect(inspector.history).toContainText(
    'derived buckets, not raw interpretations',
  );
  await expect(inspector.history).toContainText(
    '9007199254740993.000000001 / 1',
  );
  await expect(inspector.history).toContainText('Undefined (no good samples)');
  await expect(page).toHaveURL(/history_resolution=1000/u);
  await expect(page).not.toHaveURL(/history_manifest=/u);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(api.requests.some((url) => url.includes('/summaries?'))).toBe(true);
  await inspector.choose('thermal.temperature', 1);
  await expect(page).not.toHaveURL(
    /history_resolution=|history_manifest=|history_after=/u,
  );
  await expect(inspector.history).toContainText('Hot-only evidence');
});

test('retry, download and cancel a bounded export through the authorized history scope', async ({
  page,
}) => {
  await installMetadataApi(page, {
    tenants: [
      {
        tenant_id: 'tenant-a',
        actions: ['metadata.read', 'telemetry.read', 'operations.manage'],
      },
    ],
  });
  await installTelemetryApi(page);
  const api = await installExportApi(page);
  const inspector = new PropertyEvidencePage(page);
  await inspector.open();
  await inspector.choose('electrical.voltage', 3);
  await inspector.exportAction('Request export');
  await expect(inspector.exports).toContainText('Export outcome is uncertain');
  await inspector.exportAction('Retry exact export request');
  await expect(inspector.exports).toContainText('Export ready');
  const download = await inspector.downloadExport();
  expect(download.suggestedFilename()).toBe('fleetiq-export-7.parquet');
  expect(await readFile(await download.path())).toEqual(api.bytes);
  const submissions = api.requests.filter(
    (request) => request.method === 'PUT',
  );
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toEqual(submissions[0]);
  expect(submissions[0]).toMatchObject({
    csrf: '1',
    body: {
      asset_id: 'asset-1',
      property_id: 'electrical.voltage',
      property_version: 3,
      start_at_ms: '0',
      end_at_ms: '3000',
    },
  });
  await inspector.exportAction('Cancel export');
  await expect(inspector.exports).toContainText('Export cancelled');
  api.deny();
  await inspector.exportAction('Refresh export status');
  await expect(inspector.exports).toContainText('Export access denied');
  await expect(inspector.exports).not.toContainText('Export cancelled');
});

test('request a restore, retry the same expectation and review the exact ready generation', async ({
  page,
}) => {
  await installMetadataApi(page, {
    tenants: [
      {
        tenant_id: 'tenant-a',
        actions: ['metadata.read', 'telemetry.read', 'operations.manage'],
      },
    ],
  });
  const api = await installTelemetryApi(page);
  api.setArchive('restored');
  const requests = await installRestoreApi(page);
  const inspector = new PropertyEvidencePage(page);
  await inspector.open();
  await inspector.choose('electrical.voltage', 3);
  await inspector.requestRestore('7');
  await expect(inspector.restore).toContainText('Restore outcome is uncertain');
  await inspector.restoreAction('Retry exact restore request');
  await expect(inspector.restore).toContainText('Restore pending');
  await inspector.restoreAction('Refresh restore status');
  await expect(inspector.restore).toContainText('Restore ready');
  await inspector.restoreAction('Review restored history');
  await expect(page).toHaveURL(/history_manifest=7/u);
  await expect(page).toHaveURL(/history_generation=1/u);
  await expect(inspector.history).toContainText('Archive coverage: restored');
  const root = '/api/v1/tenants/tenant-a/restores/manifests/7';
  const command = {
    method: 'PUT',
    path: `${root}/requests/0`,
    csrf: '1',
    body: null,
  };
  expect(requests).toEqual([
    command,
    command,
    {
      method: 'GET',
      path: `${root}/generations/1`,
      csrf: undefined,
      body: null,
    },
  ]);
});
