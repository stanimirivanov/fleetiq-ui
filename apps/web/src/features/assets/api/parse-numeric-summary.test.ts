import { expect, test } from 'vitest';
import { parseNumericSummary } from './parse-numeric-summary';
import { request } from './tests/evidence-fixture';

const selection = {
  ...request,
  property: { ...request.property, valueKind: 'decimal' as const },
  start: '0',
  end: '1000',
  limit: 50,
  resolution: '1000',
};
const wire = {
  representation: 'numeric_summary',
  algorithm: 'numeric-fixed-v1',
  series_id: '1',
  revision: '2',
  observed_at_ms: '2000',
  start_at_ms: '0',
  end_at_ms: '1000',
  resolution_ms: '1000',
  kind: 'decimal',
  unit: 'volt',
  coverage: {
    scope: 'hot_snapshot',
    manifest_id: null,
    restore_generation: null,
  },
  buckets: [
    {
      start_ms: '0',
      end_ms: '1000',
      total: 1,
      count: 1,
      excluded: 0,
      min: '9007199254740993.000000001',
      max: '9007199254740993.000000001',
      sum: '9007199254740993.000000001',
    },
  ],
  next_after: null,
};
test('summary values and publication identities remain exact', () => {
  const parsed = parseNumericSummary(wire, selection);
  expect(parsed.buckets[0]?.sum).toBe('9007199254740993.000000001');
  expect(parsed.revision).toBe('2');
});
test('malformed geometry, arithmetic and coverage fail closed', () => {
  for (const patch of [
    { resolution_ms: '500' },
    { unit: 'ampere' },
    { kind: 'integer' },
    { next_after: 'v1.aa' },
    {
      coverage: {
        scope: 'hot_and_selected_manifest_snapshot',
        manifest_id: '1',
        restore_generation: '1',
      },
    },
    { buckets: [{ ...wire.buckets[0], count: 0 }] },
    { buckets: [{ ...wire.buckets[0], end_ms: '999' }] },
    { buckets: [{ ...wire.buckets[0], sum: '0' }] },
  ])
    expect(() =>
      parseNumericSummary({ ...wire, ...patch }, selection),
    ).toThrow();
});

test('extrema and sum must be attainable by the good sample count', () => {
  for (const [count, min, max, sum] of [
    [1, '0', '10', '5'],
    [2, '0', '10', '5'],
    [3, '0', '10', '1'],
  ] as const)
    expect(() =>
      parseNumericSummary(
        {
          ...wire,
          buckets: [{ ...wire.buckets[0], count, total: count, min, max, sum }],
        },
        selection,
      ),
    ).toThrow();
  expect(
    parseNumericSummary(
      {
        ...wire,
        buckets: [
          {
            ...wire.buckets[0],
            count: 3,
            total: 3,
            min: '-2.5',
            max: '1.1',
            sum: '-1.4',
          },
        ],
      },
      selection,
    ).buckets[0]?.sum,
  ).toBe('-1.4');
});

test('a summary continuation cannot hide unreturned buckets on a short page', () => {
  expect(() =>
    parseNumericSummary(
      { ...wire, end_at_ms: '3000', next_after: 'v1.aa' },
      { ...selection, end: '3000' },
    ),
  ).toThrow();
});
