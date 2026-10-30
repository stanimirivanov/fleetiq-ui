export interface Definition {
  readonly kind: 'numeric-threshold-v1';
  readonly calculator: string;
  readonly version: string;
  readonly scope: string;
  readonly target: string;
  readonly output_property: string;
  readonly output_version: number;
  readonly output_index: number;
  readonly comparison: 'gt' | 'gte' | 'lt' | 'lte';
  readonly threshold: string;
  readonly threshold_unit: string | null;
  readonly hold_ms: number;
  readonly resolution: 'resolve_on_false';
  readonly resolve_after_ms: number;
}
