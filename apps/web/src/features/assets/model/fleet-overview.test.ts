import { expect, test } from 'vitest';
import { parseFleet } from '../api/parse-fleet';
import { fleetRequest, observedFleetWire } from '../api/tests/fleet-fixture';
import {
  coverageRatio,
  overviewAge,
  overviewCount,
  overviewMetrics,
  pageLocationCoverage,
} from './fleet-overview';

test('overview preserves exact global counters and labels coverage without reporting/health inference', () => {
  expect(overviewCount('9007199254740993')).toBe('9,007,199,254,740,993');
  expect(coverageRatio('9007199254740992', '9007199254740993')).toEqual({
    label: '99.9%',
    width: 99.9,
  });
  expect(coverageRatio('0', '0')).toBeNull();
  expect(coverageRatio('0', '12')).toEqual({ label: '0.0%', width: 0 });
  expect(
    overviewMetrics({
      assets: '1000',
      mapped: '900',
      devices: '8',
      withProperties: '700',
    }).map((m) => m.value),
  ).toEqual(['1000', '8', '900', '700']);
});
test('location categories cover only the received page and preserve independent uncertain quality', () => {
  const page = parseFleet(observedFleetWire(), fleetRequest),
    a = page.assets[0];
  if (a?.location.status !== 'observed')
    throw new Error('Expected observed fixture');
  const rows = [
    a,
    {
      ...a,
      id: 'b',
      location: {
        status: 'observed' as const,
        point: {
          ...a.location.point,
          freshness: 'stale' as const,
          quality: 'uncertain' as const,
        },
      },
    },
    {
      ...a,
      id: 'c',
      location: {
        status: 'observed' as const,
        point: { ...a.location.point, freshness: 'future' as const },
      },
    },
    { ...a, id: 'd', location: { status: 'missing' as const } },
  ];
  expect(pageLocationCoverage(rows)).toEqual({
    loaded: 4,
    fresh: 1,
    stale: 1,
    future: 1,
    uncertain: 1,
    unlocated: 1,
    observed: 3,
  });
});
test('browser age is advisory, bounded at 30 seconds, and never rounds i64 time', () => {
  expect(overviewAge('1000', 31000)).toBe('recent');
  expect(overviewAge('1000', 31001)).toBe('aged');
  expect(overviewAge('32000', 1000)).toBe('clock-ahead');
  expect(overviewAge('9223372036854775807', 1000)).toBe('clock-ahead');
  expect(overviewAge('1000', Number.NaN)).toBe('unknown');
});
