import { expect, test } from 'vitest';
import { supportedProperty, validBinding } from './binding-authoring';

const draft = {
  source: {
    device_asset_id: 'gateway-1',
    endpoint_id: 'can-primary',
    signal_id: 'battery.voltage',
  },
  target: {
    asset_id: 'asset-a',
    property: { id: 'battery.voltage', version: 3 },
  },
  effective_interval: { start_ms: -100, end_ms: 200 },
};
test('binding identity preserves full revisions, exact tuples and half-open intervals', () => {
  expect(validBinding('binding-a', '18446744073709551615', draft)).toBe(true);
  for (const rev of ['0', '01', '18446744073709551616'])
    expect(validBinding('binding-a', rev, draft)).toBe(false);
  expect(
    validBinding('binding-a', '1', {
      ...draft,
      source: { ...draft.source, signal_id: 'bad signal' },
    }),
  ).toBe(false);
  expect(
    validBinding('binding-a', '1', {
      ...draft,
      effective_interval: { start_ms: 10, end_ms: 10 },
    }),
  ).toBe(false);
  expect(
    validBinding('binding-a', '1', {
      ...draft,
      effective_interval: { start_ms: 10, end_ms: null },
    }),
  ).toBe(true);
});
test('target compatibility requires exact property membership, never a name or newer alias', () => {
  const properties = [{ id: 'battery.voltage', version: 3 }];
  expect(supportedProperty(properties, draft.target.property)).toBe(true);
  expect(
    supportedProperty(properties, { id: 'battery.voltage', version: 4 }),
  ).toBe(false);
  expect(
    supportedProperty(properties, { id: 'other.voltage', version: 3 }),
  ).toBe(false);
  expect(supportedProperty([], draft.target.property)).toBe(false);
});
