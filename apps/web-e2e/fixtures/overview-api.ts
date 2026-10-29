import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import {
  Asset,
  AssetTypeDefinition,
  CurrentPropertySnapshot,
  PropertyDefinition,
  PropertyHistoryPage,
} from '../../web/src/generated/fleetiq-api';
import { installFleetApi } from './fleet-api';
import { installMetadataApi } from './metadata-api';
/** Keep overview/inspector identities and coordinate definitions coherent across mocked reads. */
export async function installOverviewApi(
  page: Page,
  options: Parameters<typeof installFleetApi>[1] = {},
) {
  const metadata = await installMetadataApi(page),
    fleet = await installFleetApi(page, options);
  await installOverviewDetails(page, fleet);
  return { metadata, fleet };
}
/** Reuse the same coordinate identities in the production guide's owned mock context. */
export async function installOverviewDetails(
  page: Page,
  fleet: Awaited<ReturnType<typeof installFleetApi>>,
) {
  const reply = (body: unknown) => ({
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify(body),
  });
  await page.route(
    /\/api\/v1\/tenants\/tenant-a\/assets\/asset-[ab](?:\?.*)?$/u,
    (route) => {
      const id = new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill(
        reply(
          Schema.decodeUnknownSync(Asset)({
            id,
            tenant_id: 'tenant-a',
            name:
              id === 'asset-a' ? 'Positioned equipment' : 'Unlocated equipment',
            asset_type: { id: 'equipment', version: 1 },
            external_identifiers: [],
          }),
        ),
      );
    },
  );
  await page.route(
    '**/api/v1/tenants/tenant-a/asset-types/equipment/versions/1',
    (route) =>
      route.fulfill(
        reply(
          Schema.decodeUnknownSync(AssetTypeDefinition)({
            id: 'equipment',
            version: 1,
            name: 'Equipment',
            supported_properties: [
              { id: 'position.latitude', version: 1 },
              { id: 'position.longitude', version: 1 },
            ],
          }),
        ),
      ),
  );
  await page.route(
    /\/api\/v1\/tenants\/tenant-a\/properties\/position\.(latitude|longitude)\/versions\/1$/u,
    (route) => {
      const id = new URL(route.request().url()).pathname.split('/').at(-3);
      return route.fulfill(
        reply(
          Schema.decodeUnknownSync(PropertyDefinition)({
            id,
            version: 1,
            name: id,
            value_kind: 'integer',
            canonical_unit: null,
          }),
        ),
      );
    },
  );
  await page.route(
    /\/api\/v1\/tenants\/tenant-a\/assets\/asset-[ab]\/properties\/position\.(latitude|longitude)\/versions\/1\/(current|history)(?:\?.*)?$/u,
    (route) => {
      const u = new URL(route.request().url()),
        parts = u.pathname.split('/'),
        id = parts[6],
        property = parts[8],
        snapshot = fleet.latest(),
        asset = snapshot?.assets.find((a) => a.asset_id === id),
        point =
          asset?.location.status === 'observed' ? asset.location.point : null,
        change =
          property === 'position.latitude'
            ? point?.latitude_change
            : point?.longitude_change;
      if (parts.at(-1) === 'history')
        return route.fulfill(
          reply(
            Schema.decodeUnknownSync(PropertyHistoryPage)({
              changes: change ? [change] : [],
              next_after: null,
            }),
          ),
        );
      return route.fulfill(
        reply(
          Schema.decodeUnknownSync(CurrentPropertySnapshot)({
            generation: '1',
            revision: '1',
            processed_count: '2',
            pending: false,
            evaluated_at_ms: '2000',
            stale_after_ms: 30000,
            items: change ? [{ freshness: 'fresh', change }] : [],
          }),
        ),
      );
    },
  );
}
