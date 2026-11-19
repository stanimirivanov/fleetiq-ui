import { describe, expect, test } from 'vitest';
import {
  parseCurrentProperty,
  parsePropertyEvidence,
  parsePropertyHistory,
} from './parse-property-evidence';
import { request, wireChange, wireCurrent } from './tests/evidence-fixture';

const query = { ...request, start: '0', end: '3000', limit: 50 };
describe('exact property evidence boundary', () => {
  test('preserves large integers, original attribution and explicit empty pending snapshots', () => {
    const c = parsePropertyEvidence(wireChange(), request);
    expect(c.value.value).toBe('9223372036854775807');
    expect(c.source.outputIndex).toBe(0);
    expect(c.knownAt).toBe('150');
    expect(parseCurrentProperty(wireCurrent(), request).item?.freshness).toBe(
      'fresh',
    );
    expect(
      parseCurrentProperty(
        {
          ...wireCurrent(),
          revision: '0',
          processed_count: '0',
          items: [],
          pending: true,
        },
        request,
      ),
    ).toMatchObject({ item: null, pending: true });
  });
  test('rejects cross-scope data, wrong definition/units, impossible event time and integer overflow', () => {
    for (const patch of [
      { tenant_id: 'tenant-b' },
      { asset_id: 'other' },
      { property_version: 2 },
      { source_unit: 'Cel' },
      { event_at_ms: '1001' },
      { binding_revision: '18446744073709551616' },
      { value: { kind: 'integer', value: '9223372036854775808' } },
      { value: { kind: 'decimal', value: '42.1' } },
    ])
      expect(() =>
        parsePropertyEvidence({ ...wireChange(), ...patch }, request),
      ).toThrow();
    expect(() =>
      parsePropertyEvidence(
        {
          ...wireChange(),
          source: { ...wireChange().source, device_recorded_at_ms: null },
        },
        request,
      ),
    ).toThrow();
  });
  test('rejects contradictory freshness, unsafe counters, excess items and malformed wire payloads', () => {
    for (const patch of [
      { revision: '9223372036854775808' },
      { generation: '0' },
      { processed_count: '0' },
      { evaluated_at_ms: '9223372036854775808' },
      { items: [{ freshness: 'stale', change: wireChange() }] },
      { items: [...wireCurrent().items, ...wireCurrent().items] },
    ])
      expect(() =>
        parseCurrentProperty({ ...wireCurrent(), ...patch }, request),
      ).toThrow();
    expect(() => parseCurrentProperty({}, request)).toThrow();
    expect(
      parseCurrentProperty(
        {
          ...wireCurrent(),
          evaluated_at_ms: '0',
          items: [{ freshness: 'future', change: wireChange() }],
        },
        request,
      ).item?.freshness,
    ).toBe('future');
  });
  test('requires ordered unique bounded history, a half-open window and advancing opaque cursors', () => {
    const c = wireChange();
    const later = {
      ...c,
      interpretation: 'v1.bb',
      event_at_ms: '2000',
      source: { ...c.source, device_recorded_at_ms: '2000', output_index: 1 },
    };
    expect(() =>
      parsePropertyHistory({ changes: [later, c], next_after: null }, query),
    ).toThrow();
    expect(
      parsePropertyHistory({ changes: [c, later], next_after: null }, query)
        .changes,
    ).toHaveLength(2);
    expect(
      parsePropertyHistory({ changes: [c], next_after: null }, query).changes,
    ).toHaveLength(1);
    for (const body of [
      { changes: [c, c], next_after: null },
      { changes: [c], next_after: 'not-a-token' },
      { changes: [], next_after: 'v1.aa' },
    ])
      expect(() => parsePropertyHistory(body, query)).toThrow();
    expect(() =>
      parsePropertyHistory(
        { changes: [c], next_after: 'v1.aa' },
        { ...query, after: 'v1.aa' },
      ),
    ).toThrow();
    expect(() =>
      parsePropertyHistory(
        { changes: [c], next_after: null },
        { ...query, end: '1000' },
      ),
    ).toThrow();
    expect(() =>
      parsePropertyHistory(
        { changes: [c, c], next_after: null },
        { ...query, limit: 1 },
      ),
    ).toThrow();
  });
  test('keeps exact arbitrary-precision decimal strings and quality without last-good substitution', () => {
    const value = '12345678901234567890.12345678901234567890123456789';
    const c = parsePropertyEvidence(
      {
        ...wireChange(),
        value: { kind: 'decimal', value },
        quality: 'invalid',
      },
      { ...request, property: { ...request.property, valueKind: 'decimal' } },
    );
    expect(c.value.value).toBe(value);
    expect(c.quality).toBe('invalid');
  });
});

test('requires exact selected-manifest coverage and rejects misleading hot-only or unavailable continuations', () => {
  const restore = { manifestId: '7', generation: '2' };
  const coverage = {
    hot: 'queried',
    archive: 'unavailable',
    scope: 'selected_manifest_only',
    manifest_id: '7',
    restore_generation: '2',
  };
  const page = {
    changes: [],
    next_after: null,
    coverage,
    restored_row_indices: [],
  };
  expect(
    parsePropertyHistory(page, { ...query, restore }).coverage?.archive,
  ).toBe('unavailable');
  for (const bad of [
    undefined,
    { ...coverage, manifest_id: '8' },
    { ...coverage, restore_generation: '3' },
  ]) {
    expect(() =>
      parsePropertyHistory({ ...page, coverage: bad }, { ...query, restore }),
    ).toThrow();
  }
  expect(() => parsePropertyHistory(page, query)).toThrow();
  expect(() =>
    parsePropertyHistory(page, { ...query, restore, after: 'v1.aa' }),
  ).toThrow();
  expect(() =>
    parsePropertyHistory(
      { ...page, changes: [wireChange()], next_after: 'v1.cc' },
      { ...query, restore },
    ),
  ).toThrow();
});

test('accepts only sorted page-local indices for verified restore membership', () => {
  const selected = { ...query, restore: { manifestId: '7', generation: '2' } };
  const page = {
    changes: [wireChange()],
    next_after: null,
    coverage: {
      hot: 'queried',
      archive: 'restored',
      scope: 'selected_manifest_only',
      manifest_id: '7',
      restore_generation: '2',
    },
  };
  expect(
    parsePropertyHistory({ ...page, restored_row_indices: [0] }, selected)
      .restoredRowIndices,
  ).toEqual([0]);
  expect(() => parsePropertyHistory(page, selected)).toThrow();
  for (const indices of [[1], [-1], [0.5], [0, 0]]) {
    expect(() =>
      parsePropertyHistory(
        { ...page, restored_row_indices: indices },
        selected,
      ),
    ).toThrow();
  }
  expect(() =>
    parsePropertyHistory(
      {
        ...page,
        coverage: { ...page.coverage, archive: 'unavailable' },
        restored_row_indices: [0],
      },
      selected,
    ),
  ).toThrow();
});
