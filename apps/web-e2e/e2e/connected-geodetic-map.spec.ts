import { BrowserRequestAudit } from '../fixtures/browser-request-audit';
import { installFleetApi } from '../fixtures/fleet-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedMapPage } from '../pages/connected-map.page';

// Software rendering is test-only; production never changes browser GPU policy.
test.use({
  launchOptions: {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
});
test('connected geographic map keeps list, filters, URL selection and evidence coherent', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1680, height: 960 });
  await installMetadataApi(page);
  const api = await installFleetApi(page);
  const audit = new BrowserRequestAudit(page, baseURL ?? '');
  const map = new ConnectedMapPage(page);
  try {
    await map.open();
    await map.rendererReady();
    await expect(map.asset('Positioned equipment')).toBeVisible();
    await expect(map.asset('Unlocated equipment')).toBeVisible();
    await map.asset('Positioned equipment').click();
    await expect(page).toHaveURL(/asset=asset-a/);
    await expect(map.evidence).toContainText('51.5, -0.12');
    await expect(map.evidence).toContainText('position-packet');
    await map.filter.fill('Unlocated');
    await expect(map.asset('Positioned equipment')).toHaveCount(0);
    await expect(
      page.getByRole('status').filter({ hasText: 'selected asset is outside' }),
    ).toBeVisible();
    await map.asset('Unlocated equipment').click();
    await expect(map.evidence).toContainText(
      'No usable coordinate pair: missing',
    );
    await map.filter.fill('');
    await expect(map.asset('Positioned equipment')).toBeVisible();
    expect(api.requests).toHaveLength(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Asset list', exact: true }).click();
    await expect(map.list).toBeVisible();
    await map.asset('Positioned equipment').click();
    await page
      .getByRole('button', { name: 'Geographic map', exact: true })
      .click();
    await expect(map.canvas).toBeVisible();
    api.deny();
    await page.getByRole('button', { name: 'Refresh snapshot' }).click();
    await expect(
      page.getByRole('region', { name: 'Fleet snapshot unavailable' }),
    ).toBeVisible();
    await expect(map.canvas).toHaveCount(0);
    expect(await audit.result()).toEqual([]);
  } finally {
    audit.dispose();
  }
});
test('unconfigured map does not download SDK or worker and refuses guessed mapping', async ({
  page,
}) => {
  await installMetadataApi(page);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/map?tenant=tenant-a');
  await expect(
    page.getByRole('region', { name: 'Choose coordinate properties' }),
  ).toBeVisible();
  expect(
    requests.some(
      (r) => r.includes('maplibre-adapter') || r.includes('maplibre-gl-worker'),
    ),
  ).toBe(false);
  await page.goto('/map?tenant=tenant-a&latitude_property=position.latitude');
  await expect(
    page.getByRole('region', { name: 'Invalid map scope' }),
  ).toBeVisible();
});

test('invalid deployment style cannot fetch external tiles and preserves the evidence list', async ({
  page,
  baseURL,
}) => {
  await installMetadataApi(page);
  const api = await installFleetApi(page);
  api.externalStyle();
  const audit = new BrowserRequestAudit(page, baseURL ?? '');
  const map = new ConnectedMapPage(page);
  try {
    await map.open();
    await expect(
      page.getByRole('status').filter({ hasText: 'Basemap unavailable' }),
    ).toBeVisible();
    await map.asset('Positioned equipment').click();
    await expect(map.evidence).toContainText('51.5, -0.12');
    expect(await audit.result()).toEqual([]);
  } finally {
    audit.dispose();
  }
});
test('a browser without WebGL retains accessible list selection without fabricated geometry', async ({
  page,
}) => {
  await installMetadataApi(page);
  await installFleetApi(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith('webgl')) return null;
      return Reflect.apply(original, this, args);
    } as typeof original;
  });
  const map = new ConnectedMapPage(page);
  await map.open();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Geographic rendering unavailable' }),
  ).toBeVisible();
  await map.asset('Unlocated equipment').click();
  await expect(map.evidence).toContainText('No usable coordinate pair');
});
