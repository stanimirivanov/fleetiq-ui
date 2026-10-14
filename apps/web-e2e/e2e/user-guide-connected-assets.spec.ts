import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('choose a tenant, discover bounded assets and inspect pinned metadata', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 12,
      slug: 'connected-asset-discovery',
      title: 'Find assets and read their identity and definitions',
      summary:
        'Select a tenant, filter a bounded catalogue page, follow cursors, preserve browser history and inspect exact asset and property definitions.',
    },
    {},
    async (guide, api) => {
      const metadata = new ConnectedMetadataPage(guide.page, guide);

      await test.step('Choose a tenant explicitly', async () => {
        await guide.page.goto('/assets');
        await expect(metadata.tenantId).toBeVisible();
        expect(
          api.requests.filter((request) =>
            request.path.startsWith('/api/v1/tenants/'),
          ),
        ).toHaveLength(0);
        await guide.result(metadata.tenantId, {
          title: 'Start with the tenant supplied by your administrator',
          body: 'This contract does not enumerate tenants. Enter a known tenant ID; the server still decides whether the operator may read it.',
        });
        await metadata.chooseTenant('tenant-a');
        await expect(metadata.catalogue).toBeVisible();
        await expect(metadata.asset('Primary machine')).toBeVisible();
        await guide.result(metadata.catalogue, {
          title: 'A bounded identity catalogue',
          body: 'These synthetic identities are valid contract fixtures. The page does not report fleet-wide totals, physical condition, device connectivity or live positions.',
        });
      });
      await test.step('Filter only the loaded page', async () => {
        await metadata.filterCatalogue('Primary');
        await expect(metadata.asset('Primary machine')).toBeVisible();
        await expect(metadata.asset('Main assembly')).toHaveCount(0);
        await expect(guide.page).toHaveURL(/q=Primary/u);
        await guide.result(metadata.catalogue, {
          title: 'Search is scoped to the current page',
          body: 'The URL remembers this local filter. An absent row here is not proof that the asset is absent from the tenant.',
        });
        await metadata.filterCatalogue('');
        await metadata.filterType('generic.machine');
        await expect(guide.page).toHaveURL(/type=generic.machine/u);
        await expect(metadata.asset('Primary machine')).toBeVisible();
        // Both first-page fixtures pin this type; type filtering must retain both.
        await expect(metadata.asset('Main assembly')).toBeVisible();
      });
      await test.step('Inspect identity without inventing measurements', async () => {
        await metadata.inspect('Primary machine');
        await expect(metadata.identity).toContainText('SN-100');
        await expect(metadata.pinnedType).toContainText('generic.machine');
        await guide.result(metadata.identity, {
          title: 'Separate internal and external identity',
          body: 'The internal asset ID and the typed serial identifier describe the registered asset. Neither is an observed condition or a telemetry value.',
        });
        await metadata.showPropertyDefinition('thermal.temperature', 1);
        await expect(metadata.pinnedType).toContainText('Air temperature');
        await guide.result(metadata.pinnedType, {
          title: 'Read an exact property definition',
          body: 'The selected type pins property versions. The temperature definition explains a value kind and unit, but does not supply an air-temperature observation.',
        });
        await expect(metadata.unavailableOperations).toBeVisible();
        await guide.result(metadata.unavailableOperations, {
          title: 'Unavailable operational evidence stays unavailable',
          body: 'Positions, condition, freshness, alerts and timeline history have no production read model in this contract. Missing evidence is not zero or healthy.',
        });
      });
      await test.step('Preserve filters and follow server cursors', async () => {
        await guide.page.goBack();
        await expect(metadata.typeFilter).toHaveValue('generic.machine');
        await guide.result(metadata.typeFilter, {
          title: 'Browser Back restores the review context',
          body: 'Return to the filtered catalogue without losing the URL-backed selection. Clear the type filter before browsing other types on this page.',
        });
        await metadata.filterType('');
        await metadata.nextCataloguePage();
        await expect(metadata.asset('Power system')).toBeVisible();
        await expect(metadata.asset('Primary machine')).toHaveCount(0);
        await expect(guide.page).toHaveURL(/after=assembly-a/u);
        await guide.page.reload();
        await expect(metadata.asset('Power system')).toBeVisible();
        await guide.result(metadata.catalogue, {
          title: 'A cursor can be revisited through the URL',
          body: 'Reload preserves the tenant and forward cursor. Separate requests do not imply a whole-catalogue transactional snapshot.',
        });
        await metadata.inspect('Power system');
        await expect(metadata.identity).toContainText('power-system-1');
        await metadata.showPropertyDefinition('electrical.voltage', 3);
        await expect(metadata.pinnedType).toContainText('Supply voltage');
        await guide.result(metadata.pinnedType, {
          title: 'The inspected type is version-pinned',
          body: 'This power-system definition points to electrical.voltage version 3. Its unit is not a reported voltage reading.',
        });
        await guide.page.goBack();
        await expect(metadata.catalogue).toBeVisible();
        await metadata.firstCataloguePage();
        await expect(guide.page).not.toHaveURL(/after=/u);
        await expect(metadata.asset('Primary machine')).toBeVisible();
        expect(
          api.requests
            .filter((request) => request.path.endsWith('/assets'))
            .every((request) => {
              const query = new URLSearchParams(request.search);
              return !query.has('q') && !query.has('type');
            }),
        ).toBe(true);
        await expect(
          guide.page.getByText('Sample data', { exact: true }),
        ).toHaveCount(0);
      });
    },
  );
});
