/** Read-only alert contracts. Decimal values, clocks and lifecycle counters stay exact. */
export type Phase = 'inactive' | 'pending' | 'firing' | 'resolved';
export interface EvaluationRef {
  readonly evaluation_id: string;
  readonly scope_asset_id: string;
  readonly output_index: number | null;
}
export interface Transition {
  readonly version: string;
  readonly phase: Phase;
  readonly event_at_ms: string;
  readonly recorded_at_ms: string;
  readonly activation_generation: number;
  readonly evidence: EvaluationRef;
}
export interface Alert {
  readonly rule_id: string;
  readonly rule_revision: number;
  readonly scope_asset_id: string;
  readonly target_asset_id: string;
  readonly version: string;
  readonly phase: Phase;
  readonly selected: boolean;
  readonly candidate_since_ms: string | null;
  readonly last_event_at_ms: string;
  readonly latest_transition: Transition;
}
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
export interface Detail {
  readonly alert: Alert;
  readonly definition: Definition;
}
export interface AlertPage {
  readonly alerts: readonly Alert[];
  readonly next_after: string | null;
}
export interface TransitionPage {
  readonly transitions: readonly Transition[];
  readonly next_after: string | null;
}
export interface Evaluation {
  readonly evaluation: {
    readonly evaluation_id: string;
    readonly scope_asset_id: string;
    readonly calculator: {
      readonly id: string;
      readonly version: string;
      readonly implementation: string;
    };
    readonly configuration_id: string;
    readonly input_property: { readonly id: string; readonly version: number };
    readonly window: {
      readonly start_at_ms: string;
      readonly end_at_ms: string;
      readonly finalize_at_ms: string;
      readonly known_at_ms: string;
    };
    readonly evaluated_at_ms: string;
    readonly outcome:
      | 'complete'
      | 'insufficient'
      | 'incompatible_input'
      | 'invalid_output'
      | 'resource_limit';
    readonly minimum_samples: number;
    readonly input_count: number;
    readonly output_count: number;
  };
  readonly inputs: readonly {
    readonly evidence_id: string;
    readonly event_at_ms: string;
  }[];
}
export interface Output {
  readonly evaluation_id: string;
  readonly calculator_id: string;
  readonly calculator_version: string;
  readonly output_index: number;
  readonly asset_id: string;
  readonly property_id: string;
  readonly property_version: number;
  readonly kind: 'decimal';
  readonly value: string;
  readonly unit: string | null;
}
export interface OutputPage {
  readonly outputs: readonly Output[];
  readonly next_after: string | null;
}
export interface QueueRequest {
  readonly tenant: string;
  readonly phase?: Phase;
  readonly after?: string;
}
export interface DetailRequest {
  readonly tenant: string;
  readonly rule: string;
  readonly revision: number;
}
export interface HistoryRequest extends DetailRequest {
  readonly detail: Detail;
  readonly after?: string;
}
export interface EvidenceRequest {
  readonly tenant: string;
  readonly detail: Detail;
  readonly transition: Transition;
}
export interface OutputsRequest extends EvidenceRequest {
  readonly evidence: Evaluation;
  readonly after?: string;
}
export interface ReadOptions {
  readonly signal?: AbortSignal;
}
export interface AlertReader {
  queue(request: QueueRequest, options?: ReadOptions): Promise<AlertPage>;
  detail(request: DetailRequest, options?: ReadOptions): Promise<Detail>;
  history(
    request: HistoryRequest,
    options?: ReadOptions,
  ): Promise<TransitionPage>;
  evaluation(
    request: EvidenceRequest,
    options?: ReadOptions,
  ): Promise<Evaluation>;
  outputs(request: OutputsRequest, options?: ReadOptions): Promise<OutputPage>;
}
export const ALERT_PAGE_SIZE = 20;
export const phases: readonly Phase[] = [
  'inactive',
  'pending',
  'firing',
  'resolved',
];
export function identifier(value: string): boolean {
  return (
    value.length > 0 &&
    [...value].length <= 128 &&
    value.trim() === value &&
    !/[\p{Cc}\p{Cs}]/u.test(value) &&
    value !== '.' &&
    value !== '..'
  );
}
export function millis(value: string): boolean {
  return (
    /^(0|-?[1-9][0-9]{0,18})$/.test(value) &&
    BigInt(value) >= -(1n << 63n) &&
    BigInt(value) < 1n << 63n
  );
}
export function lifecycle(value: string): boolean {
  return /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) < 1n << 63n;
}
export function cursor(value: string): boolean {
  return value.length <= 8192 && /^v1\.(?:[0-9a-f]{2})+$/.test(value);
}
export function revision(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 4294967295;
}
export const decimal = (value: string): boolean =>
  /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(value);
