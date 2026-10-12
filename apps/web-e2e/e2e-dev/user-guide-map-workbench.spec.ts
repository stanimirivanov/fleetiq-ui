import { expect, test } from '../fixtures/browser-quality-test';
import { MapPage } from '../pages/map.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/**
 * Guide narration is recorded only after the same assertions pass in ordinary
 * development E2E mode. Every location and asset in this chapter is synthetic.
 */
test('find an asset and assess position evidence on the sample map', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  test.setTimeout(120_000);
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:5173',
    dataMode: 'development-sample',
    order: 30,
    slug: 'map-workbench',
    title: 'Explore the sample fleet map',
    summary:
      'Use the synthetic list and schematic map, filter assets, compare position evidence, and retain missing-position assets in the workflow.',
  });

  try {
    const map = new MapPage(guide.page, guide);

    await test.step('Open the labelled synthetic map workspace', async () => {
      await map.openSample();
      await expect(map.heading).toBeVisible();
      await expect(guide.page.getByRole('banner')).toContainText('Sample data');
      for (const panel of [map.assetList, map.siteMap, map.selectedAsset]) {
        await expect(panel).toBeVisible();
        await expect(
          panel.getByText('Sample data', { exact: true }),
        ).toBeVisible();
      }
      await expect(map.assetList).toContainText('Primary machine');
      await expect(map.siteMap).toContainText('Schematic · not to scale');
      await map.documentList();
      await map.documentCanvas();
    });

    await test.step('Search the shared list and map by asset identity', async () => {
      await map.searchFor('locomotive');
      await expect(guide.page).toHaveURL(/q=locomotive/u);
      await expect(map.listAsset('Electric locomotive 417')).toBeVisible();
      await expect(map.listAsset('Diesel locomotive 206')).toBeVisible();
      await expect(map.listAsset('Primary machine')).toHaveCount(0);
      await expect(map.marker('Electric locomotive 417')).toBeVisible();
      await expect(map.marker('Diesel locomotive 206')).toBeVisible();
    });

    await test.step('Select a locomotive from the list and read its evidence', async () => {
      await map.selectFromList('Electric locomotive 417');
      await expect(guide.page).toHaveURL(/asset=asset-004/u);
      await expect(map.listAsset('Electric locomotive 417')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(map.marker('Electric locomotive 417')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(map.selectedAsset).toContainText('Electric locomotive 417');
      for (const label of ['Observed', 'Received', 'Source', 'Quality']) {
        await expect(map.selectedAsset).toContainText(label);
      }
      await expect(map.selectedAsset).toContainText(
        'Illustrative position feed',
      );
      await map.documentSelectedEvidence();
    });

    await test.step('Select on the canvas and distinguish freshness from position', async () => {
      await map.selectMarker('Diesel locomotive 206');
      await expect(guide.page).toHaveURL(/asset=asset-005/u);
      await expect(map.listAsset('Diesel locomotive 206')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(map.selectedAsset).toContainText('Diesel locomotive 206');
      await expect(
        map.selectedAsset.getByText('Telemetry freshness').locator('..'),
      ).toContainText('Stale');
      await expect(
        map.selectedAsset
          .getByText('Position evidence', { exact: true })
          .locator('..'),
      ).toContainText('Recent');
      await guide.result(map.selectedAsset, {
        title: 'Separate stale telemetry from recent position',
        body: 'In this synthetic snapshot, the diesel locomotive has stale telemetry even though its position evidence is recent. Review each status separately.',
      });
    });

    await test.step('Restore URL-backed selection with browser history', async () => {
      await guide.page.goBack();
      await expect(guide.page).toHaveURL(/asset=asset-004/u);
      await expect(map.selectedAsset).toContainText('Electric locomotive 417');
      await guide.page.goForward();
      await expect(guide.page).toHaveURL(/asset=asset-005/u);
      await expect(map.marker('Diesel locomotive 206')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await guide.page.reload();
      await expect(map.selectedAsset).toContainText('Diesel locomotive 206');
      await guide.result(map.selectedAsset, {
        title: 'Return to the same selected sample asset',
        body: 'The synthetic map selection is kept in the URL. Back, forward, and reload restore the selected identity and its displayed evidence.',
      });
    });

    await test.step('Find assets without position evidence', async () => {
      await map.clearSearch();
      await map.choosePositionEvidence('unavailable');
      await expect(guide.page).toHaveURL(/position=unavailable/u);
      await expect(map.assetList).toContainText('Refrigerated trailer 11');
      await expect(
        map.siteMap.getByRole('button', { name: /^Select /u }),
      ).toHaveCount(0);
      await expect(map.siteMap).toContainText(
        '0 of 1 filtered sample assets have a position.',
      );
      await guide.result(map.siteMap, {
        title: 'No marker means no sample position',
        body: 'The synthetic trailer remains in the filtered list, but the schematic canvas has no marker because this snapshot contains no position for it.',
      });
    });

    await test.step('Use the table to inspect a position-unavailable asset', async () => {
      await map.showTable();
      await expect(map.assetList.getByRole('table')).toBeVisible();
      await expect(map.assetList.getByRole('table')).toContainText(
        'Refrigerated trailer 11',
      );
      await map.selectFromList('Refrigerated trailer 11');
      await expect(guide.page).toHaveURL(/asset=asset-008/u);
      await expect(map.selectedAsset).toContainText('No position');
      await expect(map.marker('Refrigerated trailer 11')).toHaveCount(0);
      await expect(
        map.selectedAsset.getByRole('link', { name: 'Open asset inspector' }),
      ).toHaveAttribute('href', '/assets/asset-008?preview=sample');
      await guide.result(map.selectedAsset, {
        title: 'Inspect without inventing a location',
        body: 'This synthetic trailer has no position, yet its identity and inspector link remain available. FleetIQ does not place it at a guessed coordinate.',
      });
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});
