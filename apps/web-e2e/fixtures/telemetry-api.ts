import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import {
  CurrentPropertySnapshot,
  PropertyHistoryChange,
  PropertyHistoryPage,
} from '../../web/src/generated/fleetiq-api';
/** Synthetic contract-valid telemetry; installed after the metadata fixture.
 * Does not decode product cursors, contact a provider or claim a live backend.
 */
export async function installTelemetryApi(page: Page) {
  let status = 200;
  let pending = true;
  let empty = false;
  const requests: string[] = [];
  await page.route(
    '**/api/v1/tenants/*/assets/*/properties/*/versions/*/**',
    async (route) => {
      const url = new URL(route.request().url()),
        parts = url.pathname.split('/').filter(Boolean);
      const action = parts[10];
      if (!['current', 'history', 'interpretations'].includes(action ?? ''))
        return route.fallback();
      requests.push(`${url.pathname}${url.search}`);
      const reply = (body: unknown) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'cache-control': 'no-store' },
          body: JSON.stringify(body),
        });
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
      const property = parts[7] ?? '',
        version = Number(parts[9]),
        thermal = property === 'thermal.temperature';
      const change = (index: number) => ({
        tenant_id: parts[3],
        asset_id: parts[5],
        property_id: property,
        property_version: version,
        binding_id: `binding-${property}`,
        binding_revision: '10',
        interpretation: index === 0 ? 'v1.aa' : 'v1.bb',
        event_time_basis: 'device_recorded',
        event_at_ms: String(1000 + index * 1000),
        first_resolution_effective_at_ms: '1000',
        first_resolution_known_at_ms: '2500',
        value: {
          kind: 'decimal',
          value: thermal
            ? index
              ? '32.7'
              : '32.1'
            : index
              ? '9007199254740993.000000002'
              : '9007199254740993.000000001',
        },
        source_unit: thermal ? 'Cel' : 'V',
        quality: index ? 'uncertain' : 'good',
        source: {
          message_id: `message-${index}`,
          protocol_package_id: 'vendor.protocol',
          protocol_package_version: '1',
          output_index: index,
          device_asset_id: 'gateway-1',
          endpoint_id: 'can-primary',
          signal_id: property,
          device_recorded_at_ms: String(1000 + index * 1000),
          received_at_ms: '3000',
        },
      });
      if (action === 'current')
        return reply(
          Schema.decodeUnknownSync(CurrentPropertySnapshot)({
            generation: '2',
            revision: '12',
            processed_count: '100',
            pending,
            evaluated_at_ms: '40000',
            stale_after_ms: 30000,
            items: empty ? [] : [{ freshness: 'stale', change: change(0) }],
          }),
        );
      if (action === 'interpretations') {
        const token = parts[11];
        return reply(
          Schema.decodeUnknownSync(PropertyHistoryChange)(
            change(token === 'v1.bb' ? 1 : 0),
          ),
        );
      }
      const first = !url.searchParams.has('after'),
        start = BigInt(url.searchParams.get('start_at_ms') ?? '0'),
        end = BigInt(url.searchParams.get('end_at_ms') ?? '0');
      const c = change(first ? 0 : 1),
        inside =
          !empty &&
          BigInt(c.event_at_ms) >= start &&
          BigInt(c.event_at_ms) < end;
      return reply(
        Schema.decodeUnknownSync(PropertyHistoryPage)({
          changes: inside ? [c] : [],
          next_after: inside && first ? 'v1.cc' : null,
        }),
      );
    },
  );
  return {
    requests,
    setStatus(value: 200 | 401 | 403 | 500) {
      status = value;
    },
    setPending(value: boolean) {
      pending = value;
    },
    setEmpty(value: boolean) {
      empty = value;
    },
  };
}
