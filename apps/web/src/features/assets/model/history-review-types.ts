import type { HistoryRequest } from './property-values';
export interface RestoreSelection {
  readonly manifestId: string;
  readonly generation: string;
}
export interface SummaryRequest extends HistoryRequest {
  readonly resolution: string;
}
export interface NumericBucket {
  readonly start: string;
  readonly end: string;
  readonly total: number;
  readonly count: number;
  readonly excluded: number;
  readonly min: string | null;
  readonly max: string | null;
  readonly sum: string;
}
export interface NumericSummary {
  readonly series: string;
  readonly revision: string;
  readonly observedAt: string;
  readonly unit: string | null;
  readonly buckets: readonly NumericBucket[];
  readonly nextAfter: string | null;
  readonly restore: RestoreSelection | undefined;
}
