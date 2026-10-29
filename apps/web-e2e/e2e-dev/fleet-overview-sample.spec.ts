import { expect, test } from '../fixtures/browser-quality-test';
import { AssetsPage } from '../pages/assets.page';
import { OverviewPage } from '../pages/overview.page';
import { ShellPage } from '../pages/shell.page';

test('development overview discloses every sample panel and supports local discovery', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const shell = new ShellPage(page);
  const overview = new OverviewPage(page);
  const assets = new AssetsPage(page);

  await shell.open('/?preview=sample');
  await expect(overview.heading).toBeVisible();
  await expect(shell.assetsLink).toHaveAttribute(
    'href',
    '/assets?preview=sample',
  );
  await expect(page.getByRole('banner')).toContainText('Sample data');
  for (const panel of [
    overview.metrics,
    overview.map,
    overview.assetDiscovery,
    overview.attentionQueue,
    overview.dataQuality,
    overview.energyAndUtilization,
  ]) {
    await expect(panel).toBeVisible();
    await expect(
      panel.getByText('Sample data', { exact: true }).first(),
    ).toBeVisible();
  }
  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    overview.map.getByText('Sample data', { exact: true }),
  ).toBeVisible();
  await expect(overview.assetDiscovery).toBeVisible();

  expect((await overview.map.boundingBox())?.x ?? -1).toBeLessThan(
    (await overview.attentionQueue.boundingBox())?.x ?? -1,
  );
  await expect(overview.metrics).toContainText('Reporting assets');
  await expect(overview.assetDiscovery).toContainText('Primary machine');
  await expect(overview.assetDiscovery).toContainText('Power system');
  await expect(overview.assetDiscovery).toContainText('Connection');
  await expect(overview.assetDiscovery).toContainText('Freshness');

  await overview.searchFor('Power system');
  await expect(overview.searchAssets).toBeFocused();
  await expect(page).toHaveURL(/q=Power/u);
  await expect(overview.assetDiscovery).toContainText('Power system');
  await expect(overview.assetDiscovery).not.toContainText('Primary machine');
  await overview.chooseCondition('nominal');
  await expect(overview.assetDiscovery).toContainText('Power system');

  await overview.chooseCondition('critical');
  await expect(overview.assetDiscovery.getByRole('status')).toContainText(
    'No sample assets match these filters.',
  );
  await overview.searchFor('');
  await expect(overview.assetDiscovery).toContainText('Diesel locomotive 206');
  await expect(overview.assetDiscovery).not.toContainText('Power system');

  await overview.chooseCondition('');
  await overview.chooseConnectivity('disconnected');
  await expect(overview.assetDiscovery).toContainText('Monitoring gateway');
  await expect(overview.assetDiscovery).not.toContainText('Primary machine');
  await page.reload();
  await expect(overview.connectivityFilter).toHaveValue('disconnected');
  await expect(overview.assetDiscovery).toContainText('Monitoring gateway');

  await overview.chooseConnectivity('');
  await overview.chooseType('rail.electric-locomotive');
  await expect(overview.assetDiscovery).toContainText(
    'Electric locomotive 417',
  );
  await expect(overview.assetDiscovery).not.toContainText(
    'Diesel locomotive 206',
  );

  await overview.assetDiscovery
    .getByRole('link', { name: 'View all assets' })
    .click();
  await expect(page).toHaveURL('/assets?preview=sample');
  await expect(assets.samplePreview).toBeVisible();
});

test('sample overview preserves a usable stacked layout at narrow width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shell = new ShellPage(page);
  const overview = new OverviewPage(page);
  await shell.open('/?preview=sample');

  await expect(overview.heading).toBeVisible();
  await expect(overview.map).toBeVisible();
  await expect(overview.assetDiscovery).toBeVisible();
  await expect(overview.attentionQueue).toBeVisible();
  expect(
    (await overview.attentionQueue.boundingBox())?.y ?? -1,
  ).toBeGreaterThan((await overview.assetDiscovery.boundingBox())?.y ?? -1);
  await overview.searchFor('Primary machine');
  await expect(overview.assetDiscovery).toContainText('Primary machine');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
