import { installFleetApi } from '../fixtures/fleet-api';
import { installOverviewDetails } from '../fixtures/overview-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedMapPage } from '../pages/connected-map.page';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { FleetOverviewPage } from '../pages/fleet-overview.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('review fleet inventory, bounded evidence and connected operational navigation', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 17,
      slug: 'connected-fleet-overview',
      title: 'Review inventory and evidence from the fleet overview',
      summary:
        'Configure exact coordinate scope, distinguish full inventory from page evidence, inspect pending and aged snapshots, navigate map and asset detail, and recover from denied reads.',
    },
    {},
    async (guide) => {
      const fleet = await installFleetApi(guide.page, {
        inventorySize: 200,
        pending: true,
      });
      await installOverviewDetails(guide.page, fleet);
      const overview = new FleetOverviewPage(guide.page);
      await test.step('Choose a tenant and an explicit coordinate mapping', async () => {
        await overview.openUnconfigured();
        await expect(
          guide.page.getByRole('region', { name: 'Configure fleet overview' }),
        ).toBeVisible();
        expect(fleet.requests).toHaveLength(0);
        await guide.action(
          guide.page.getByRole('main'),
          {
            title: 'Configure the overview scope',
            body: 'Select a tenant, then enter the installed latitude/longitude property IDs and exact versions. This fixture uses position.latitude and position.longitude v1 with E7 unitless integer encoding. FleetIQ never guesses coordinate roles.',
          },
          async () => overview.configure(),
        );
        await expect(overview.metric('Registered assets')).toContainText('200');
      });
      await test.step('Separate full inventory, page evidence and processing status', async () => {
        await guide.result(overview.metrics, {
          title: 'Read authoritative whole-tenant counts',
          body: 'The server reports 200 registered assets for this tenant. Communication-device, coordinate-mapped and current-property categories overlap; none is a health or online indicator. The loaded page contains at most 50 rows.',
        });
        await expect(overview.snapshot).toContainText('Projection catching up');
        await guide.result(overview.snapshot, {
          title: 'Recognize incomplete processing and review age',
          body: 'Pending work means evidence coverage may still change. Snapshot ageing compares server evaluation with this browser clock; it does not change source freshness or mean a device is offline. This recorded scenario uses a deliberately old synthetic evaluation instant.',
        });
        await guide.result(overview.coverage, {
          title: 'Keep coverage scopes separate',
          body: 'Whole-tenant installed-property and current-property coverage use server counts. Fresh, stale, future, uncertain and unlocated positions below them describe only this loaded page. Uncertain quality overlaps freshness; unavailable analytics panels do not invent alerts or utilization.',
        });
      });
      await test.step('Select and filter loaded identities', async () => {
        await guide.action(
          overview.asset('Positioned equipment'),
          {
            title: 'Review observed coordinates',
            body: 'Selecting an asset keeps the identity in the URL and shows its exact coordinate evidence. Geographic preview is opt-in; the overview loads no renderer or worker by default.',
          },
          async () => overview.asset('Positioned equipment').click(),
        );
        await expect(overview.location).toContainText('51.5, -0.12');
        await overview.filter.fill('Unlocated');
        await expect(overview.asset('Positioned equipment')).toHaveCount(0);
        await expect(overview.metric('Registered assets')).toContainText('200');
        await guide.result(overview.discovery, {
          title: 'Search is limited to loaded rows',
          body: 'Filtering hides unmatched rows without changing the 200-asset inventory or page coverage. An absent result is not proof that an asset is absent from the tenant.',
        });
        await overview.filter.fill('');
      });
      await test.step('Follow a bounded cursor and browser history', async () => {
        await overview.next();
        await expect(overview.metric('Registered assets')).toContainText('200');
        await guide.result(overview.discovery, {
          title: 'A new page is another current snapshot',
          body: 'Next follows the exclusive server cursor. Totals still describe the full tenant. Pages are not accumulated into a frozen whole-fleet snapshot. First page or browser Back returns to the earlier URL scope.',
        });
        await guide.page.goBack();
        await expect(overview.asset('Positioned equipment')).toBeVisible();
      });
      await test.step('Continue to the map and inspector with the same scope', async () => {
        await overview.asset('Positioned equipment').click();
        await overview.mapLink.click();
        const map = new ConnectedMapPage(guide.page);
        await expect(map.list).toBeVisible();
        await expect(map.evidence).toContainText('51.5, -0.12');
        await guide.result(map.evidence, {
          title: 'Follow coordinate provenance',
          body: 'The map retains tenant, exact mapping, bounded page, filter and selected identity. The evidence panel identifies the original message, decoder, device, endpoint and source signals without substituting unrelated last values.',
        });
        await overview.returnFromMap();
        await overview.discovery
          .getByRole('link', { name: 'Inspect Positioned equipment' })
          .click();
        const metadata = new ConnectedMetadataPage(guide.page);
        await expect(metadata.identity).toContainText('asset-a');
        await guide.result(metadata.identity, {
          title: 'Inspect the registered asset',
          body: 'The inspector uses the selected identity and pinned definitions. Its current-reading, history and provenance requests remain independently authorized. Browser Back returns to the overview URL.',
        });
        await guide.page.goBack();
        await expect(overview.metrics).toBeVisible();
      });
      await test.step('Recover from denied snapshot reads', async () => {
        fleet.deny();
        await overview.refresh();
        const problem = guide.page.getByRole('region', {
          name: 'Overview snapshot unavailable',
        });
        await expect(problem).toBeVisible();
        await expect(overview.metrics).toHaveCount(0);
        await guide.result(problem, {
          title: 'Denied reads hide previous evidence',
          body: 'A failed refresh removes the previous snapshot, rather than keeping old private counts or showing an empty fleet. Confirm access before retrying. This contract fixture now restores the authorized response.',
        });
        fleet.recover();
        await overview.retry();
        await expect(overview.metric('Registered assets')).toContainText('200');
        await guide.result(overview.metrics, {
          title: 'Resume from a validated snapshot',
          body: 'Retry obtains a new authorized snapshot. This guide uses synthetic contract responses; it does not qualify a deployed identity provider, live trackers or a persistent installation.',
        });
      });
    },
  );
});
