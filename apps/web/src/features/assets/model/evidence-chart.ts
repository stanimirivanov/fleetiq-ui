import type { PropertyEvidence } from './property-evidence';

/** Bound decimal expansion for drawing only; exact table values are never changed. */
function decimal(value: string): { coefficient: bigint; scale: number } | null {
  if (value.length > 256) return null;
  const m = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/.exec(value);
  if (!m || (m[4]?.length ?? 0) > 4) return null;
  const exponent = Number(m[4] ?? 0),
    fraction = m[3] ?? '';
  const scale = fraction.length - exponent;
  if (Math.abs(scale) > 256) return null;
  return { coefficient: BigInt(`${m[1]}${m[2]}${fraction}`), scale };
}
/** BigInt normalization converts only bounded pixel coordinates to Number.
 * No telemetry value or timestamp passes through floating-point conversion.
 */
export function evidenceChart(
  changes: readonly PropertyEvidence[],
): string | null {
  if (
    changes.length < 2 ||
    changes.length > 100 ||
    changes.some(
      (c) => c.value.kind !== 'integer' && c.value.kind !== 'decimal',
    )
  )
    return null;
  const values = changes.map((c) => decimal(String(c.value.value)));
  if (values.some((v) => v === null)) return null;
  const safe = values.filter((v) => v !== null),
    scale = Math.max(...safe.map((v) => v.scale));
  const ys = safe.map((v) => v.coefficient * 10n ** BigInt(scale - v.scale));
  const min = ys.reduce((a, b) => (a < b ? a : b)),
    max = ys.reduce((a, b) => (a > b ? a : b));
  const xs = changes.map((c) => BigInt(c.eventAt)),
    first = xs[0] ?? 0n,
    last = xs.at(-1) ?? first;
  return ys
    .map(
      (y, i) =>
        `${last === first ? 500 : Number((((xs[i] ?? first) - first) * 1000n) / (last - first))},${max === min ? 100 : 180 - Number(((y - min) * 160n) / (max - min))}`,
    )
    .join(' ');
}
