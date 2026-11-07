import { RequestFailure } from '#shared/model';
import { isMillis, validHistory } from './property-evidence';

export type {
  NumericBucket,
  NumericSummary,
  RestoreSelection,
  SummaryRequest,
} from './history-review-types';

import type { SummaryRequest } from './history-review-types';
export function positiveId(s: string): boolean {
  return /^[1-9][0-9]*$/.test(s) && isMillis(s);
}
export function validResolution(
  start: string,
  end: string,
  resolution: string,
): boolean {
  if (!isMillis(start) || !isMillis(end) || !positiveId(resolution))
    return false;
  const width = BigInt(resolution),
    span = BigInt(end) - BigInt(start);
  return (
    span > 0n &&
    span <= 604800000n &&
    BigInt(start) % width === 0n &&
    BigInt(end) % width === 0n &&
    span / width <= 64n
  );
}
export function validSummary(request: SummaryRequest): void {
  validHistory(request);
  if (
    !['integer', 'decimal'].includes(request.property.valueKind) ||
    request.limit > 64 ||
    !validResolution(request.start, request.end, request.resolution)
  )
    throw new RequestFailure('invalid-request');
}
