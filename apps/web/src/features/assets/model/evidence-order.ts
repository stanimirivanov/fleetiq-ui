import type { PropertyEvidence } from './property-evidence';

/** PostgreSQL C collation compares UTF-8/codepoint order, not locale/UTF-16 order. */
function textOrder(a: string, b: string): number {
  const x = Array.from(a),
    y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const n = (x[i]?.codePointAt(0) ?? 0) - (y[i]?.codePointAt(0) ?? 0);
    if (n) return n;
  }
  return x.length - y.length;
}
export function evidenceOrder(
  a: PropertyEvidence,
  b: PropertyEvidence,
): number {
  const numeric = (x: string, y: string) =>
    BigInt(x) < BigInt(y) ? -1 : BigInt(x) > BigInt(y) ? 1 : 0;
  return (
    numeric(a.eventAt, b.eventAt) ||
    textOrder(a.source.messageId, b.source.messageId) ||
    textOrder(a.source.packageId, b.source.packageId) ||
    textOrder(a.source.packageVersion, b.source.packageVersion) ||
    a.source.outputIndex - b.source.outputIndex ||
    textOrder(a.bindingId, b.bindingId) ||
    numeric(a.bindingRevision, b.bindingRevision) ||
    textOrder(a.eventTimeBasis, b.eventTimeBasis)
  );
}
