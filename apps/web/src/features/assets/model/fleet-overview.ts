import type { FleetAsset, FleetPage } from './fleet';
/** Coverage of the received page, never a fleet-wide position/health aggregate. */
export function pageLocationCoverage(assets: readonly FleetAsset[]) {
  let fresh = 0,
    stale = 0,
    future = 0,
    uncertain = 0,
    unlocated = 0;
  for (const a of assets) {
    if (a.location.status !== 'observed') {
      unlocated++;
      continue;
    }
    const p = a.location.point;
    if (p.freshness === 'fresh') fresh++;
    else if (p.freshness === 'stale') stale++;
    else future++;
    if (p.quality === 'uncertain') uncertain++;
  }
  return {
    loaded: assets.length,
    fresh,
    stale,
    future,
    uncertain,
    unlocated,
    observed: assets.length - unlocated,
  };
}
/** One-decimal percentage and a bounded CSS width without converting full counters. */
export function coverageRatio(
  part: string,
  total: string,
): { label: string; width: number } | null {
  const p = BigInt(part),
    t = BigInt(total);
  if (t === 0n) return null;
  const tenths = (p * 1000n) / t;
  return {
    label: `${tenths / 10n}.${tenths % 10n}%`,
    width: Number(tenths) / 10,
  };
}
export function overviewCount(value: string): string {
  return new Intl.NumberFormat('en-GB').format(BigInt(value));
}
/** Advisory browser-clock age; source freshness stays fixed at server evaluation. */
export function overviewAge(
  evaluated: string,
  now: number,
): 'recent' | 'aged' | 'clock-ahead' | 'unknown' {
  if (!Number.isSafeInteger(now)) return 'unknown';
  const age = BigInt(now) - BigInt(evaluated);
  return age < -30000n ? 'clock-ahead' : age > 30000n ? 'aged' : 'recent';
}
export function overviewMetrics(summary: FleetPage['summary']) {
  return [
    {
      label: 'Registered assets',
      value: summary.assets,
      detail: 'Whole tenant · inventory',
    },
    {
      label: 'Communication devices',
      value: summary.devices,
      detail: 'Registered device assets',
    },
    {
      label: 'Coordinate-mapped assets',
      value: summary.mapped,
      detail: 'Both selected property versions installed',
    },
    {
      label: 'Assets with current properties',
      value: summary.withProperties,
      detail: 'Any projected property · not online status',
    },
  ] as const;
}
