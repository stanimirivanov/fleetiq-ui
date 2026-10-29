import { expect, test } from '../fixtures/production-test';
import { MapPage } from '../pages/map.page';
import { ShellPage } from '../pages/shell.page';

test('production map cannot activate sample positions or selected asset evidence', async ({
  page,
}) => {
  const shell = new ShellPage(page);
  const map = new MapPage(page);

  for (const [path, expectedMapHref] of [
    ['/map', '/map'],
    [
      '/map?preview=sample&asset=asset-004&position=recent',
      '/map?asset=asset-004',
    ],
  ] as const) {
    await shell.open(path);
    await expect(map.heading).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Sign-in unavailable' }),
    ).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('Sign-in unavailable');
    await expect(map.assetList).toHaveCount(0);
    await expect(map.siteMap).toHaveCount(0);
    await expect(map.selectedAsset).toHaveCount(0);
    for (const synthetic of [
      'Sample data',
      'Electric locomotive 417',
      'Illustrative position feed',
      'Schematic · not to scale',
    ]) {
      await expect(page.getByText(synthetic, { exact: true })).toHaveCount(0);
    }
    await expect(
      shell.primaryNavigation.getByRole('link', { name: 'Map', exact: true }),
    ).toHaveAttribute('href', expectedMapHref);
  }
});
