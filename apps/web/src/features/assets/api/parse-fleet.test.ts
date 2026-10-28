import { expect, test } from 'vitest';
import { parseFleet } from './parse-fleet';
import {
  firstFleetAsset,
  fleetRequest,
  fleetWire,
  observedFleetWire,
} from './tests/fleet-fixture';

test('published missing position and synthetic exact coherent observed evidence decode without guessing', () => {
  expect(parseFleet(fleetWire(), fleetRequest).assets[0]?.location.status).toBe(
    'missing',
  );
  const p = parseFleet(observedFleetWire(), fleetRequest);
  expect(p.assets[0]?.location).toMatchObject({
    status: 'observed',
    point: { latitude: '51.5', longitude: '-0.12' },
  });
});
test('rejects contradictory mappings, counts, pages and projection counters', () => {
  const w = fleetWire();
  for (const bad of [
    { ...w, mapping: { ...w.mapping, encoding: 'degrees' } },
    { ...w, summary: { ...w.summary, assets: '0' } },
    { ...w, next_after: 'asset-a' },
    { ...w, assets: [w.assets[0], w.assets[0]] },
    { ...w, generation: '-1' },
    { ...w, evaluated_at_ms: '9223372036854775808' },
  ])
    expect(() => parseFleet(bad, fleetRequest)).toThrow(
      'The server response is invalid',
    );
  expect(() => parseFleet(w, { ...fleetRequest, after: 'asset-a' })).toThrow();
});
test('rejects cross-tenant, changed-axis, incoherent and low-quality evidence', () => {
  for (const patch of [
    { tenant_id: 'tenant-b' },
    { asset_id: 'other' },
    { property_id: 'different' },
    { quality: 'invalid' },
    { event_time_basis: 'received_at' },
    { source_unit: 'deg' },
    { event_at_ms: '2000' },
  ]) {
    const w = observedFleetWire();
    firstFleetAsset(w.assets).location.point.latitude_change = {
      ...firstFleetAsset(w.assets).location.point.latitude_change,
      ...patch,
    } as (typeof w.assets)[0]['location']['point']['latitude_change'];
    expect(() => parseFleet(w, fleetRequest)).toThrow(
      'The server response is invalid',
    );
  }
  for (const patch of [
    { message_id: 'other' },
    { output_index: 1 },
    { signal_id: 'position.longitude' },
    { device_asset_id: 'other' },
    { protocol_package_version: 'different' },
  ]) {
    const w = observedFleetWire(),
      c = firstFleetAsset(w.assets).location.point.latitude_change;
    c.source = { ...c.source, ...patch };
    expect(() => parseFleet(w, fleetRequest)).toThrow(
      'The server response is invalid',
    );
  }
});
test('rejects forged coordinates, freshness and aggregate quality independently of numeric wire shape', () => {
  for (const patch of [
    { latitude: '90.0000000000000000001' },
    { longitude: '180.0000000000000001' },
    { latitude: '51.5000000000000000001' },
    { freshness: 'stale' },
    { quality: 'uncertain' },
  ]) {
    const w = observedFleetWire();
    Object.assign(firstFleetAsset(w.assets).location.point, patch);
    expect(() => parseFleet(w, fleetRequest)).toThrow(
      'The server response is invalid',
    );
  }
});
