import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import { FleetSnapshot } from '../../web/src/generated/fleetiq-api';
/** Synthetic bounded page with one exact observed pair and one unlocated asset. */
export async function installFleetApi(page: Page) {
  let status = 200,
    externalStyle = false;
  const requests: string[] = [];
  await page.route('**/api/v1/tenants/*/fleet?*', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    if (status !== 200)
      return route.fulfill({
        status,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Unavailable',
          status,
        }),
      });
    const axis = (
      name: 'latitude' | 'longitude',
      index: number,
      value: string,
    ) => ({
      tenant_id: 'tenant-a',
      asset_id: 'asset-a',
      property_id: `position.${name}`,
      property_version: 1,
      binding_id: `binding-${name}`,
      binding_revision: '1',
      interpretation: index === 0 ? 'v1.aa' : 'v1.bb',
      event_time_basis: 'device_recorded',
      event_at_ms: '1000',
      first_resolution_effective_at_ms: '1000',
      first_resolution_known_at_ms: '2000',
      value: { kind: 'integer', value },
      source_unit: null,
      quality: 'good',
      source: {
        message_id: 'position-packet',
        protocol_package_id: 'vendor.protocol',
        protocol_package_version: '1',
        output_index: index,
        device_asset_id: 'gateway-1',
        endpoint_id: 'gps',
        signal_id: name,
        device_recorded_at_ms: '1000',
        received_at_ms: '1500',
      },
    });
    const body = Schema.decodeUnknownSync(FleetSnapshot)({
      generation: '1',
      revision: '1',
      pending: false,
      evaluated_at_ms: '2000',
      stale_after_ms: 30000,
      mapping: {
        latitude: { id: 'position.latitude', version: 1 },
        longitude: { id: 'position.longitude', version: 1 },
        encoding: 'e7',
      },
      mapping_supported: true,
      summary: {
        assets: '2',
        communication_devices: '0',
        mapped_assets: '2',
        assets_with_current_properties: '1',
      },
      assets: [
        {
          asset_id: 'asset-a',
          display_name: 'Positioned equipment',
          asset_type: { id: 'equipment', version: 1 },
          location: {
            status: 'observed',
            point: {
              latitude: '51.5',
              longitude: '-0.12',
              quality: 'good',
              freshness: 'fresh',
              latitude_change: axis('latitude', 0, '515000000'),
              longitude_change: axis('longitude', 1, '-1200000'),
            },
          },
        },
        {
          asset_id: 'asset-b',
          display_name: 'Unlocated equipment',
          asset_type: { id: 'equipment', version: 1 },
          location: { status: 'missing' },
        },
      ],
      next_after: null,
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify(body),
    });
  });
  await page.route('**/maps/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('style.json'))
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          version: 8,
          sources: {
            base: {
              type: 'raster',
              tiles: [
                externalStyle
                  ? 'https://unowned.invalid/tile.png'
                  : `${url.origin}/maps/fixture/{z}/{x}/{y}.png`,
              ],
              tileSize: 256,
              attribution: 'Synthetic qualification basemap',
            },
          },
          layers: [{ id: 'base', type: 'raster', source: 'base' }],
        }),
      });
    return route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
  });
  return {
    requests,
    deny: () => {
      status = 403;
    },
    externalStyle: () => {
      externalStyle = true;
    },
  };
}
