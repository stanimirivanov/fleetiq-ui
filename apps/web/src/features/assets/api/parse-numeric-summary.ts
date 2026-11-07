import { Result, Schema } from 'effect';
import { RequestFailure } from '#shared/model';
import { NumericSummaryPage } from '../../../generated/fleetiq-api';
import {
  type NumericSummary,
  positiveId,
  type SummaryRequest,
  validSummary,
} from '../model/history-review';
import { isMillis, isToken } from '../model/property-evidence';

function invalid(): never {
  throw new RequestFailure('invalid-response');
}
const numeric = (s: string) =>
  s.length <= 2048 &&
  s !== '-0' &&
  /^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$/.test(s);
function exact(s: string, scale: number): bigint {
  const [whole = '', fraction = ''] = s.split('.');
  return BigInt(whole + fraction.padEnd(scale, '0'));
}
function bounded(
  min: string,
  max: string,
  sum: string,
  count: number,
): boolean {
  const scale = Math.max(
    ...[min, max, sum].map((s) => s.split('.')[1]?.length ?? 0),
  );
  const a = exact(min, scale),
    b = exact(max, scale),
    total = exact(sum, scale);
  return count === 1
    ? a === b && total === a
    : a <= b &&
        total >= a * BigInt(count - 1) + b &&
        total <= b * BigInt(count - 1) + a;
}
export function parseNumericSummary(
  input: unknown,
  request: SummaryRequest,
): NumericSummary {
  validSummary(request);
  const decoded = Schema.decodeUnknownResult(NumericSummaryPage)(input);
  if (Result.isFailure(decoded)) invalid();
  const w = decoded.success;
  if (
    w.representation !== 'numeric_summary' ||
    w.algorithm !== 'numeric-fixed-v1' ||
    !positiveId(w.series_id) ||
    !positiveId(w.revision) ||
    !isMillis(w.observed_at_ms) ||
    w.start_at_ms !== request.start ||
    w.end_at_ms !== request.end ||
    w.resolution_ms !== request.resolution ||
    w.kind !== request.property.valueKind ||
    w.unit !== request.property.canonicalUnit ||
    w.buckets.length > request.limit
  )
    invalid();
  const coverage = w.coverage;
  if (
    request.restore
      ? coverage.scope !== 'hot_and_selected_manifest_snapshot' ||
        coverage.manifest_id !== request.restore.manifestId ||
        coverage.restore_generation !== request.restore.generation
      : coverage.scope !== 'hot_snapshot' ||
        coverage.manifest_id !== null ||
        coverage.restore_generation !== null
  )
    invalid();
  let end: bigint | undefined,
    total = 0;
  const buckets = w.buckets.map((b) => {
    if (!isMillis(b.start_ms) || !isMillis(b.end_ms)) invalid();
    const start = BigInt(b.start_ms),
      finish = BigInt(b.end_ms),
      width = BigInt(request.resolution);
    if (
      start < BigInt(request.start) ||
      finish > BigInt(request.end) ||
      finish - start !== width ||
      start % width !== 0n ||
      (end !== undefined && start !== end) ||
      b.count + b.excluded !== b.total ||
      ![
        b.sum,
        ...(b.min === null ? [] : [b.min]),
        ...(b.max === null ? [] : [b.max]),
      ].every((s) => numeric(s) && (w.kind !== 'integer' || !s.includes('.')))
    )
      invalid();
    if (
      b.count === 0
        ? b.min !== null || b.max !== null || b.sum !== '0'
        : b.min === null ||
          b.max === null ||
          !bounded(b.min, b.max, b.sum, b.count)
    )
      invalid();
    end = finish;
    total += b.total;
    return {
      start: b.start_ms,
      end: b.end_ms,
      total: b.total,
      count: b.count,
      excluded: b.excluded,
      min: b.min,
      max: b.max,
      sum: b.sum,
    };
  });
  const first = buckets[0];
  if (
    !first ||
    buckets.length !==
      Math.min(
        request.limit,
        Number(
          (BigInt(request.end) - BigInt(first.start)) /
            BigInt(request.resolution),
        ),
      ) ||
    total > 100 ||
    (!request.after
      ? first.start !== request.start
      : BigInt(first.start) <= BigInt(request.start)) ||
    (end === BigInt(request.end)) !== (w.next_after === null) ||
    (w.next_after !== null &&
      (!isToken(w.next_after) || w.next_after === request.after))
  )
    invalid();
  return {
    series: w.series_id,
    revision: w.revision,
    observedAt: w.observed_at_ms,
    unit: w.unit,
    buckets,
    nextAfter: w.next_after,
    restore: request.restore,
  };
}
