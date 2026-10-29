import { installOverviewApi } from '../fixtures/overview-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedMapPage } from '../pages/connected-map.page';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { FleetOverviewPage } from '../pages/fleet-overview.page';

test('overview reads server aggregates, filters a bounded page and preserves map/inspector/history scope', async ({
  page,
}) => {
  const api = await installOverviewApi(page, {
      inventorySize: 200,
      pending: true,
    }),
    overview = new FleetOverviewPage(page);
  const loaded: string[] = [];
  page.on('request', (r) => loaded.push(r.url()));
  await overview.openUnconfigured();
  expect(api.fleet.requests).toHaveLength(0);
  await overview.configure();
  await expect(overview.metric('Registered assets')).toContainText('200');
  await expect(overview.discovery.getByRole('row')).toHaveCount(51);
  await expect(overview.snapshot).toContainText('Projection catching up');
  await expect(overview.snapshot).toContainText('Snapshot ageing');
  await expect(overview.coverage).toContainText('Loaded page · 50 assets');
  expect(
    loaded.some(
      (u) => u.includes('maplibre-adapter') || u.includes('maplibre-gl-worker'),
    ),
  ).toBe(false);
  await overview.asset('Positioned equipment').click();
  await expect(overview.location).toContainText('51.5, -0.12');
  await overview.filter.fill('Unlocated');
  await expect(overview.asset('Positioned equipment')).toHaveCount(0);
  await expect(overview.metric('Registered assets')).toContainText('200');
  await expect(overview.coverage).toContainText('Loaded page · 50 assets');
  expect(api.fleet.requests).toHaveLength(1);
  await overview.filter.fill('');
  await overview.next();
  await expect(overview.asset('Positioned equipment')).toHaveCount(0);
  await expect(overview.metric('Registered assets')).toContainText('200');
  await page.goBack();
  await expect(overview.asset('Positioned equipment')).toBeVisible();
  await overview.asset('Positioned equipment').click();
  await overview.mapLink.click();
  const map = new ConnectedMapPage(page);
  await expect(map.list).toBeVisible();
  await expect(map.evidence).toContainText('51.5, -0.12');
  await overview.returnFromMap();
  await expect(overview.location).toContainText('51.5, -0.12');
  await overview.discovery
    .getByRole('link', { name: 'Inspect Positioned equipment' })
    .click();
  const metadata = new ConnectedMetadataPage(page);
  await expect(metadata.identity).toContainText('asset-a');
  await page.goBack();
  await expect(overview.asset('Positioned equipment')).toBeVisible();
  api.fleet.deny();
  await overview.refresh();
  await expect(
    page.getByRole('region', { name: 'Overview snapshot unavailable' }),
  ).toBeVisible();
  await expect(overview.metrics).toHaveCount(0);
  api.fleet.recover();
  await overview.retry();
  await expect(overview.metric('Registered assets')).toContainText('200');
});
test('empty overview and invalid scope remain explicit without a map worker', async ({
  page,
}) => {
  const api = await installOverviewApi(page, { inventorySize: 0 });
  const overview = new FleetOverviewPage(page);
  await overview.open();
  await expect(
    page.getByRole('status').filter({ hasText: 'no registered assets' }),
  ).toBeVisible();
  await expect(overview.metric('Registered assets')).toContainText('0');
  await page.goto('/?tenant=tenant-a&latitude_property=lat');
  await expect(
    page.getByRole('region', { name: 'Invalid overview scope' }),
  ).toBeVisible();
  expect(api.fleet.requests).toHaveLength(1);
});
