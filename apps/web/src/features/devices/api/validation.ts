import { RequestFailure } from '#shared/model';
import type { Diagnostics, Receipt, Route, Scope } from '../model/devices';
import { validText } from '../model/devices';

const invalid = (): never => {
  throw new RequestFailure('invalid-response');
};
const time = (v: number) => Number.isSafeInteger(v);
export function checkReceipt(value: Receipt): Receipt {
  if (
    !validText(value.registered_by) ||
    !time(value.recorded_at_ms) ||
    value.recorded_at_ms < 0
  )
    invalid();
  return value;
}
export function checkRoute(value: Route, scope: Scope): Route {
  if (
    value.device_asset_id !== scope.device ||
    value.channel_id !== scope.channel ||
    !validText(value.actor_id) ||
    !time(value.recorded_at_ms) ||
    value.recorded_at_ms < 0 ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    value.revision > 4294967295 ||
    (value.selection === null
      ? value.policy_version !== null
      : !Number.isSafeInteger(value.policy_version) ||
        value.policy_version === null ||
        value.policy_version < 1)
  )
    invalid();
  return value;
}
export function checkDiagnostics(value: Diagnostics): Diagnostics {
  const c = value.coverage;
  if (
    !time(value.observed_at_ms) ||
    c.frame_limit !== 64 ||
    c.output_limit_per_frame !== 64 ||
    c.source_limit !== 128 ||
    value.frames.length > 64 ||
    value.sources.length > 128
  )
    invalid();
  if (
    (c.frames_truncated && value.frames.length !== 64) ||
    (c.sources_truncated && value.sources.length !== 128) ||
    c.observations_truncated !==
      value.frames.some(
        (f) => f.observation_count !== null && f.observation_count > 64,
      )
  )
    invalid();
  const messages = new Set<string>(),
    sources = new Set<string>();
  for (const f of value.frames) {
    if (
      !validText(f.message_id) ||
      !validText(f.package_id) ||
      !validText(f.package_version) ||
      !time(f.received_at_ms) ||
      messages.has(f.message_id) ||
      (f.observation_count !== null &&
        (!Number.isSafeInteger(f.observation_count) ||
          f.observation_count < 0 ||
          f.observation_count > 4294967296)) ||
      (f.processing === 'decoded' && f.observation_count === null)
    )
      invalid();
    messages.add(f.message_id);
  }
  for (const source of value.sources) {
    const key = JSON.stringify([
      source.package_id,
      source.package_version,
      source.endpoint_id,
      source.signal_id,
    ]);
    if (Object.values(source).some((v) => !validText(v)) || sources.has(key))
      invalid();
    sources.add(key);
  }
  return value;
}
