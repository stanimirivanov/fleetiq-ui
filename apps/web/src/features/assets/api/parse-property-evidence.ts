import { Result, Schema } from 'effect';
import { RequestFailure } from '#shared/model';
import {
  CurrentPropertySnapshot,
  PropertyHistoryChange,
  PropertyHistoryPage,
} from '../../../generated/fleetiq-api';
import { isValidAssetIdentifier } from '../model/asset-catalogue';
import { evidenceOrder } from '../model/evidence-order';
import {
  type CurrentProperty,
  type HistoryRequest,
  isMillis,
  isToken,
  type PropertyEvidence,
  type PropertyHistory,
  type PropertyRequest,
} from '../model/property-evidence';

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
function counter(s: string, positive = false): boolean {
  return (
    s.length <= 20 &&
    /^(0|[1-9][0-9]*)$/.test(s) &&
    BigInt(s) >= (positive ? 1n : 0n) &&
    BigInt(s) <= (positive ? (1n << 64n) - 1n : (1n << 63n) - 1n)
  );
}
export function parsePropertyEvidence(
  input: unknown,
  request: PropertyRequest,
): PropertyEvidence {
  const w = decode(PropertyHistoryChange, input),
    s = w.source;
  if (
    w.tenant_id !== request.tenantId ||
    w.asset_id !== request.assetId ||
    w.property_id !== request.property.id ||
    w.property_version !== request.property.version ||
    w.value.kind !== request.property.valueKind ||
    w.source_unit !== request.property.canonicalUnit ||
    !isToken(w.interpretation) ||
    !counter(w.binding_revision, true)
  )
    invalid();
  if (
    ![
      w.tenant_id,
      w.asset_id,
      w.property_id,
      w.binding_id,
      s.message_id,
      s.protocol_package_id,
      s.protocol_package_version,
      s.device_asset_id,
      s.endpoint_id,
      s.signal_id,
    ].every(isValidAssetIdentifier)
  )
    invalid();
  if (
    ![
      w.event_at_ms,
      w.first_resolution_effective_at_ms,
      w.first_resolution_known_at_ms,
      s.received_at_ms,
    ].every(isMillis) ||
    (s.device_recorded_at_ms !== null && !isMillis(s.device_recorded_at_ms))
  )
    invalid();
  if (
    w.event_at_ms !==
    (w.event_time_basis === 'received_at'
      ? s.received_at_ms
      : s.device_recorded_at_ms)
  )
    invalid();
  if (w.value.kind === 'integer' && !isMillis(w.value.value)) invalid();
  return {
    interpretation: w.interpretation,
    tenantId: w.tenant_id,
    assetId: w.asset_id,
    propertyId: w.property_id,
    propertyVersion: w.property_version,
    bindingId: w.binding_id,
    bindingRevision: w.binding_revision,
    eventTimeBasis: w.event_time_basis,
    eventAt: w.event_at_ms,
    effectiveAt: w.first_resolution_effective_at_ms,
    knownAt: w.first_resolution_known_at_ms,
    value: w.value,
    unit: w.source_unit,
    quality: w.quality,
    source: {
      messageId: s.message_id,
      packageId: s.protocol_package_id,
      packageVersion: s.protocol_package_version,
      outputIndex: s.output_index,
      deviceId: s.device_asset_id,
      endpointId: s.endpoint_id,
      signalId: s.signal_id,
      recordedAt: s.device_recorded_at_ms,
      receivedAt: s.received_at_ms,
    },
  };
}
export function parseCurrentProperty(
  input: unknown,
  request: PropertyRequest,
): CurrentProperty {
  const w = decode(CurrentPropertySnapshot, input);
  if (
    ![w.generation, w.revision, w.processed_count].every((s) => counter(s)) ||
    !isMillis(w.evaluated_at_ms) ||
    w.items.length > 1
  )
    invalid();
  const first = w.items[0],
    change = first ? parsePropertyEvidence(first.change, request) : null;
  if (change && first) {
    if (w.generation === '0' || w.revision === '0' || w.processed_count === '0')
      invalid();
    const age = BigInt(w.evaluated_at_ms) - BigInt(change.eventAt),
      expected = age < 0n ? 'future' : age <= 30000n ? 'fresh' : 'stale';
    if (first.freshness !== expected) invalid();
  }
  if (
    w.generation === '0' &&
    (w.revision !== '0' || w.processed_count !== '0' || w.pending)
  )
    invalid();
  return {
    generation: w.generation,
    revision: w.revision,
    processedCount: w.processed_count,
    pending: w.pending,
    evaluatedAt: w.evaluated_at_ms,
    item: change && first ? { freshness: first.freshness, change } : null,
  };
}
export function parsePropertyHistory(
  input: unknown,
  request: HistoryRequest,
): PropertyHistory {
  const w = decode(PropertyHistoryPage, input);
  if (
    w.changes.length > request.limit ||
    (w.next_after !== null &&
      (!isToken(w.next_after) ||
        w.next_after === request.after ||
        w.changes.length === 0))
  )
    invalid();
  const changes = w.changes.map((c) => parsePropertyEvidence(c, request)),
    seen = new Set<string>();
  let previous: PropertyEvidence | undefined;
  changes.forEach((c) => {
    if (
      BigInt(c.eventAt) < BigInt(request.start) ||
      BigInt(c.eventAt) >= BigInt(request.end) ||
      seen.has(c.interpretation) ||
      (previous !== undefined && evidenceOrder(previous, c) >= 0)
    )
      invalid();
    seen.add(c.interpretation);
    previous = c;
  });
  return { changes, nextAfter: w.next_after };
}
