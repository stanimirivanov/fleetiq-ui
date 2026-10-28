import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
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
