import { expect, test } from '../fixtures/browser-quality-test';
import { MapPage } from '../pages/map.page';
import { ShellPage } from '../pages/shell.page';

test('sample map keeps list, marker, selected evidence, and browser history in sync', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 940 });
  const shell = new ShellPage(page);
  const map = new MapPage(page);

  await shell.open();
  const mapLink = shell.primaryNavigation.getByRole('link', {
    name: 'Map',
    exact: true,
  });
  await expect(mapLink).toHaveAttribute('href', '/map?preview=sample');
  await mapLink.click();
  await expect(page).toHaveURL('/map?preview=sample');
  await expect(map.heading).toBeVisible();
  // Vite transforms the route's lazy sample module on first navigation.
  await expect(map.assetList).toBeVisible({ timeout: 20_000 });
  for (const panel of [map.assetList, map.siteMap, map.selectedAsset]) {
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Sample data', { exact: true })).toBeVisible();
  }
  expect((await map.assetList.boundingBox())?.x ?? -1).toBeLessThan(
    (await map.siteMap.boundingBox())?.x ?? -1,
  );
  expect((await map.siteMap.boundingBox())?.x ?? -1).toBeLessThan(
    (await map.selectedAsset.boundingBox())?.x ?? -1,
  );
  const listBounds = await map.assetList.boundingBox();
  const mapBounds = await map.siteMap.boundingBox();
  expect(listBounds?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(
    (mapBounds?.height ?? 0) + 160,
  );
  expect(
    await map.assetList
      .getByRole('list', { name: 'Sample map assets' })
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
  await expect(map.siteMap).toContainText('Schematic · not to scale');
  await expect(map.listAsset('Primary machine')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    map.selectedAsset.getByText('Telemetry freshness').locator('..'),
  ).toContainText('Current');
  await expect(
    map.selectedAsset
      .getByText('Position evidence', { exact: true })
      .locator('..'),
  ).toContainText('Last known');

  await map.selectFromList('Electric locomotive 417');
  await expect(page).toHaveURL(/asset=asset-004/u);
  await expect(map.marker('Electric locomotive 417')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(map.selectedAsset).toContainText('Electric locomotive 417');
  await expect(map.selectedAsset).toContainText('Observed');
  await expect(map.selectedAsset).toContainText('Received');
  await expect(map.selectedAsset).toContainText('Quality');
  await expect(map.selectedAsset).toContainText('Illustrative position feed');

  await map.selectMarker('Diesel locomotive 206');
  await expect(page).toHaveURL(/asset=asset-005/u);
  await expect(map.listAsset('Diesel locomotive 206')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    map.selectedAsset.getByText('Telemetry freshness').locator('..'),
  ).toContainText('Stale');
  await expect(
    map.selectedAsset
      .getByText('Position evidence', { exact: true })
      .locator('..'),
  ).toContainText('Recent');

  await page.goBack();
  await expect(page).toHaveURL(/asset=asset-004/u);
  await expect(map.selectedAsset).toContainText('Electric locomotive 417');
  await page.goForward();
  await expect(page).toHaveURL(/asset=asset-005/u);
  await page.reload();
  await expect(map.marker('Diesel locomotive 206')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await map.showTable();
  await expect(map.assetList.getByRole('table')).toBeVisible();
  await expect(map.assetList.getByRole('table')).toContainText(
    'Refrigerated trailer 11',
  );
  await map.selectFromList('Refrigerated trailer 11');
  await expect(page).toHaveURL(/asset=asset-008/u);
  await expect(map.selectedAsset).toContainText('No position');
  await expect(map.marker('Refrigerated trailer 11')).toHaveCount(0);
  await expect(
    map.selectedAsset.getByRole('link', { name: 'Open asset inspector' }),
  ).toHaveAttribute('href', '/assets/asset-008?preview=sample');

  await page.setViewportSize({ width: 1024, height: 768 });
  const laptopList = await map.assetList.boundingBox();
  const laptopMap = await map.siteMap.boundingBox();
  expect(laptopList?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(
    (laptopMap?.height ?? 0) + 160,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('sample map facets are URL-backed and preserve missing-position parity', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const map = new MapPage(page);
  await map.openSample();

  await map.searchAssets.fill('Electric locomotive');
  await expect(page).toHaveURL(/q=Electric/u);
  await expect(map.assetList).toContainText('Electric locomotive 417');
  await expect(map.assetList).not.toContainText('Diesel locomotive 206');
  await map.searchAssets.fill('');

  await map.typeFilter.selectOption('rail.electric-locomotive');
  await expect(page).toHaveURL(/type=rail.electric-locomotive/u);
  await expect(map.assetList).toContainText('Electric locomotive 417');
  await map.conditionFilter.selectOption('critical');
  await expect(page).toHaveURL(/condition=critical/u);
  await expect(map.assetList.getByRole('status')).toContainText(
    'No sample assets match these filters.',
  );
  await expect(map.selectedAsset).toContainText(
    'No positioned asset is available',
  );
  await page.goBack();
  await expect(map.conditionFilter).toHaveValue('');
  await expect(map.assetList).toContainText('Electric locomotive 417');
  await page.goForward();
  await expect(map.conditionFilter).toHaveValue('critical');
  await expect(map.assetList.getByRole('status')).toContainText(
    'No sample assets match these filters.',
  );
  await map.conditionFilter.selectOption('');
  await map.typeFilter.selectOption('');

  await map.siteFilter.selectOption('South service hub');
  await expect(page).toHaveURL(/site=South/u);
  await expect(map.assetList).toContainText('Service truck 22');
  await map.siteFilter.selectOption('');
  await map.connectionFilter.selectOption('disconnected');
  await expect(page).toHaveURL(/connectivity=disconnected/u);
  await expect(map.assetList).toContainText('Monitoring gateway');
  await map.connectionFilter.selectOption('');

  await map.positionFilter.selectOption('unavailable');
  await expect(page).toHaveURL(/position=unavailable/u);
  await expect(map.assetList).toContainText('Refrigerated trailer 11');
  await expect(
    map.siteMap.getByRole('button', { name: /^Select /u }),
  ).toHaveCount(0);
  await expect(map.siteMap).toContainText(
    '0 of 1 filtered sample assets have a position.',
  );
  await page.reload();
  await expect(map.positionFilter).toHaveValue('unavailable');
  await expect(map.assetList).toContainText('Refrigerated trailer 11');
});

test('narrow map switches list and canvas without losing selection or dark-theme context', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shell = new ShellPage(page);
  const map = new MapPage(page);
  await map.openSample();

  await expect(map.assetList).toBeVisible();
  await expect(map.siteMap).toBeHidden();
  await map.selectFromList('Primary machine');
  await expect(page).toHaveURL(/asset=asset-001/u);
  await expect(map.selectedAsset).toContainText('Primary machine');

  await map.showMapAtNarrowWidth();
  await expect(map.siteMap).toBeVisible();
  await expect(map.assetList).toBeHidden();
  await expect(map.marker('Primary machine')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await map.selectMarker('Electric locomotive 417');
  await expect(page).toHaveURL(/asset=asset-004/u);
  await expect(map.selectedAsset).toContainText('Electric locomotive 417');
  await map.showListAtNarrowWidth();
  await expect(map.listAsset('Electric locomotive 417')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(map.assetList).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
