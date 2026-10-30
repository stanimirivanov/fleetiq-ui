import { Result, Schema } from 'effect';
import { RequestFailure } from '#shared/model';
import {
  AlertDetail,
  AlertPage,
  AlertTransitionPage,
  CalculatorEvaluationEvidence,
  CalculatorOutputPage,
} from '../../../generated/fleetiq-api';
import {
  ALERT_PAGE_SIZE,
  type Alert,
  cursor,
  type DetailRequest,
  decimal,
  type EvidenceRequest,
  type HistoryRequest,
  identifier,
  lifecycle,
  millis,
  type OutputsRequest,
  type QueueRequest,
  type Transition,
} from '../model/connected-alerts';

function invalid(): never {
  throw new RequestFailure('invalid-response');
}
function decode<S extends Schema.ConstraintDecoder<unknown, never>>(
  schema: S,
  input: unknown,
): S['Type'] {
  const r = Schema.decodeUnknownResult(schema)(input);
  if (Result.isFailure(r)) invalid();
  return r.success;
}
function page(items: readonly unknown[], next: string | null, after?: string) {
  if (
    items.length > ALERT_PAGE_SIZE ||
    (next !== null && (!cursor(next) || next === after || items.length === 0))
  )
    invalid();
}
function transition(t: Transition, scope: string) {
  if (
    !lifecycle(t.version) ||
    ![t.event_at_ms, t.recorded_at_ms].every(millis) ||
    !identifier(t.evidence.evaluation_id) ||
    t.evidence.scope_asset_id !== scope
  )
    invalid();
}
function summary(a: Alert) {
  if (
    ![a.rule_id, a.scope_asset_id, a.target_asset_id].every(identifier) ||
    !lifecycle(a.version) ||
    !millis(a.last_event_at_ms) ||
    (a.phase === 'pending' && a.candidate_since_ms === null) ||
    ((a.phase === 'inactive' || a.phase === 'resolved') &&
      a.candidate_since_ms !== null)
  )
    invalid();
  transition(a.latest_transition, a.scope_asset_id);
  if (
    a.latest_transition.version !== a.version ||
    a.latest_transition.phase !== a.phase ||
    BigInt(a.latest_transition.event_at_ms) > BigInt(a.last_event_at_ms) ||
    (a.candidate_since_ms !== null &&
      (!millis(a.candidate_since_ms) ||
        BigInt(a.candidate_since_ms) > BigInt(a.last_event_at_ms)))
  )
    invalid();
}
/** PostgreSQL C collation compares Unicode scalar values, not JS UTF-16 units. */
function order(a: string, b: string): number {
  const x = [...a],
    y = [...b];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const n = (x[i]?.codePointAt(0) ?? 0) - (y[i]?.codePointAt(0) ?? 0);
    if (n) return n;
  }
  return x.length - y.length;
}
export function parseQueue(input: unknown, r: QueueRequest) {
  const w = decode(AlertPage, input);
  page(w.alerts, w.next_after, r.after);
  w.alerts.forEach((a, i) => {
    summary(a);
    if (
      r.phase
        ? a.phase !== r.phase
        : a.phase !== 'pending' && a.phase !== 'firing'
    )
      invalid();
    const p = w.alerts[i - 1];
    if (
      p &&
      (order(p.rule_id, a.rule_id) > 0 ||
        (p.rule_id === a.rule_id && p.rule_revision >= a.rule_revision))
    )
      invalid();
  });
  return w;
}
export function parseDetail(input: unknown, r: DetailRequest) {
  const w = decode(AlertDetail, input),
    a = w.alert,
    d = w.definition;
  summary(a);
  if (
    a.rule_id !== r.rule ||
    a.rule_revision !== r.revision ||
    d.scope !== a.scope_asset_id ||
    d.target !== a.target_asset_id ||
    ![d.calculator, d.version, d.output_property].every(identifier) ||
    (d.threshold_unit !== null && !identifier(d.threshold_unit)) ||
    !decimal(d.threshold) ||
    (a.latest_transition.evidence.output_index !== null &&
      a.latest_transition.evidence.output_index !== d.output_index)
  )
    invalid();
  return w;
}
export function parseHistory(input: unknown, r: HistoryRequest) {
  const w = decode(AlertTransitionPage, input);
  page(w.transitions, w.next_after, r.after);
  w.transitions.forEach((t, i) => {
    transition(t, r.detail.definition.scope);
    const p = w.transitions[i - 1];
    if (
      (p &&
        (BigInt(p.version) >= BigInt(t.version) ||
          BigInt(p.event_at_ms) >= BigInt(t.event_at_ms))) ||
      (t.evidence.output_index !== null &&
        t.evidence.output_index !== r.detail.definition.output_index)
    )
      invalid();
  });
  return w;
}
export function parseEvaluation(input: unknown, r: EvidenceRequest) {
  const w = decode(CalculatorEvaluationEvidence, input),
    e = w.evaluation,
    d = r.detail.definition,
    win = e.window;
  if (
    e.evaluation_id !== r.transition.evidence.evaluation_id ||
    e.scope_asset_id !== d.scope ||
    e.calculator.id !== d.calculator ||
    e.calculator.version !== d.version ||
    ![e.configuration_id, e.input_property.id].every(identifier) ||
    ![...Object.values(win), e.evaluated_at_ms].every(millis) ||
    win.end_at_ms !== r.transition.event_at_ms ||
    e.input_count !== w.inputs.length ||
    (e.outcome !== 'complete' && e.output_count !== 0)
  )
    invalid();
  const start = BigInt(win.start_at_ms),
    end = BigInt(win.end_at_ms),
    final = BigInt(win.finalize_at_ms),
    known = BigInt(win.known_at_ms);
  if (
    start >= end ||
    end - start > 604800000n ||
    final < end ||
    final - end > 604800000n ||
    known < final ||
    BigInt(e.evaluated_at_ms) < known
  )
    invalid();
  const seen = new Set<string>();
  for (const i of w.inputs) {
    if (
      !millis(i.event_at_ms) ||
      BigInt(i.event_at_ms) < start ||
      BigInt(i.event_at_ms) >= end ||
      seen.has(i.evidence_id)
    )
      invalid();
    seen.add(i.evidence_id);
  }
  if (
    r.transition.evidence.output_index !== null &&
    (e.outcome !== 'complete' ||
      r.transition.evidence.output_index >= e.output_count)
  )
    invalid();
  return w;
}
export function parseOutputs(input: unknown, r: OutputsRequest) {
  const w = decode(CalculatorOutputPage, input),
    d = r.detail.definition;
  page(w.outputs, w.next_after, r.after);
  w.outputs.forEach((o, i) => {
    const p = w.outputs[i - 1];
    if (
      o.evaluation_id !== r.transition.evidence.evaluation_id ||
      o.calculator_id !== d.calculator ||
      o.calculator_version !== d.version ||
      !identifier(o.asset_id) ||
      o.property_id !== d.output_property ||
      o.property_version !== d.output_version ||
      o.unit !== d.threshold_unit ||
      !decimal(o.value) ||
      o.output_index >= r.evidence.evaluation.output_count ||
      (p && p.output_index >= o.output_index) ||
      (o.output_index === r.transition.evidence.output_index &&
        o.asset_id !== d.target)
    )
      invalid();
  });
  return w;
}
