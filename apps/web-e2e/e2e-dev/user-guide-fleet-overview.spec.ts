import { expect, test } from '../fixtures/browser-quality-test';
import { AssetsPage } from '../pages/assets.page';
import { OverviewPage } from '../pages/overview.page';
import { ShellPage } from '../pages/shell.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/** A sample-only discovery journey; every recorded outcome is browser-verified. */
test('explore the sample fleet overview and bounded asset catalogue', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:5173',
    dataMode: 'development-sample',
    order: 20,
    slug: 'fleet-overview',
    summary:
      'Read the synthetic overview, narrow the local sample assets, and traverse bounded catalogue pages without assuming a live tenant connection.',
    title: 'Explore the sample fleet and asset catalogue',
  });

  try {
    const page = guide.page;
    const shell = new ShellPage(page, guide);
    const overview = new OverviewPage(page, guide);
    const assets = new AssetsPage(page, guide);

    await test.step('Recognize the sample overview and its evidence panels', async () => {
      await shell.open();
      await expect(overview.heading).toBeVisible();
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
      await guide.result(overview.metrics, {
        title: 'Start with sample fleet context',
        body: 'These counts and operating indicators are deterministic examples. The Sample data label identifies them as a design preview, not live fleet evidence.',
      });
      await guide.result(overview.map, {
        title: 'Read the illustrative map preview',
        body: 'The overview map provides spatial context for the sample. Its markers are illustrative and are not observed geodetic positions.',
      });
      await guide.result(overview.dataQuality, {
        title: 'Keep evidence quality in view',
        body: 'Review the attention and data-quality panels before interpreting a condition. Missing or stale evidence must not be read as a healthy asset.',
      });
    });

    await test.step('Search and filter the local sample set', async () => {
      await guide.action(
        overview.searchAssets,
        {
          title: 'Find a named sample asset',
          body: 'Search narrows the local preview. The query appears in the URL so the current view can be revisited.',
        },
        async () => overview.searchFor('Power system'),
      );
      await expect(page).toHaveURL(/q=Power/u);
      await expect(overview.assetDiscovery).toContainText('Power system');
      await expect(overview.assetDiscovery).not.toContainText(
        'Primary machine',
      );
      await guide.action(
        overview.conditionFilter,
        {
          title: 'Combine search with condition',
          body: 'The Condition filter applies to this sample set; it is not a server-side fleet query.',
        },
        async () => overview.chooseCondition('nominal'),
      );
      await expect(overview.assetDiscovery).toContainText('Power system');
      await guide.action(
        overview.conditionFilter,
        {
          title: 'Recognize an empty filter result',
          body: 'A filter combination with no matching sample assets shows an explicit empty state instead of inventing a result.',
        },
        async () => overview.chooseCondition('critical'),
      );
      await expect(overview.assetDiscovery.getByRole('status')).toContainText(
        'No sample assets match these filters.',
      );
      await overview.searchFor('');
      await expect(overview.assetDiscovery).toContainText(
        'Diesel locomotive 206',
      );
      await overview.chooseCondition('');
      await guide.action(
        overview.connectivityFilter,
        {
          title: 'Inspect gateway connectivity separately',
          body: 'Connectivity is a separate facet from asset condition and telemetry freshness. This selection is still local sample data.',
        },
        async () => overview.chooseConnectivity('disconnected'),
      );
      await expect(overview.assetDiscovery).toContainText('Monitoring gateway');
      await overview.chooseConnectivity('');
      await guide.action(
        overview.typeFilter,
        {
          title: 'Find the electric-locomotive type',
          body: 'Type narrows the sample identities without assuming any locomotive-specific schema in the product.',
        },
        async () => overview.chooseType('rail.electric-locomotive'),
      );
      await expect(overview.assetDiscovery).toContainText(
        'Electric locomotive 417',
      );
      await expect(overview.assetDiscovery).not.toContainText(
        'Diesel locomotive 206',
      );
      await overview.chooseType('');
    });

    await test.step('Follow bounded catalogue cursors and leave the preview', async () => {
      const catalogueLink = overview.assetDiscovery.getByRole('link', {
        name: 'View all assets',
      });
      await guide.action(
        catalogueLink,
        {
          title: 'Open the sample asset catalogue',
          body: 'The catalogue shows contract-shaped synthetic identities in bounded pages. It does not show a total fleet count.',
        },
        async () => catalogueLink.click(),
      );
      await expect(page).toHaveURL('/assets?preview=sample');
      await expect(assets.samplePreview).toBeVisible();
      await expect(assets.samplePreview).toContainText('Primary machine');
      await guide.result(assets.samplePreview, {
        title: 'Read the first bounded page',
        body: 'Only the first page is displayed. The continuation link follows an opaque exclusive cursor returned by the sample reader.',
      });
      await guide.action(
        assets.nextPageLink,
        {
          title: 'Advance with the returned cursor',
          body: 'Next page changes the shareable URL and shows the next bounded slice; it does not claim a reverse-pagination API.',
        },
        async () => assets.nextPageLink.click(),
      );
      await expect(page).toHaveURL('/assets?preview=sample&after=asset-002');
      await expect(assets.samplePreview).toContainText('Monitoring gateway');
      await expect(assets.firstPageLink).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL('/assets?preview=sample');
      await expect(assets.samplePreview).toContainText('Primary machine');
      await guide.result(assets.samplePreview, {
        title: 'Return through browser history',
        body: 'The URL carries the cursor, so Back returns to the page already visited.',
      });
      await guide.action(
        assets.exitSampleLink,
        {
          title: 'Leave sample mode',
          body: 'Exit sample returns to the connected catalogue entry. This local walkthrough has no sign-in service, so the unavailable sign-in state is explicit. A production build cannot activate this development preview.',
        },
        async () => assets.exitSampleLink.click(),
      );
      await expect(page).toHaveURL('/assets');
      await expect(assets.connectionNotice).toBeVisible();
      await expect(assets.samplePreview).toHaveCount(0);
      await guide.result(assets.connectionNotice, {
        title: 'Recognize unavailable sign-in',
        body: 'This walkthrough has no configured browser sign-in service. The unavailable sign-in message does not mean the fleet is empty; connected identities require an authenticated operator session.',
      });
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});
