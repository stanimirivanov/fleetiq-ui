import { Schema } from 'effect';
import type { SseEvent } from '#shared/api';
import { RequestFailure } from '#shared/model';
import {
  HistoryMillis,
  ProjectionCounter,
} from '../../../generated/fleetiq-api';
import { isMillis, type PropertyRequest } from '../model/property-evidence';
import type { PropertyLiveEvent } from '../model/property-live';
import { parseCurrentProperty } from './parse-property-evidence';

// The generator models SSE as a wire string. These small envelopes reuse its
// scalar schemas and are checked against the pinned event metadata in tests.
const replacement = Schema.Struct({
  base_revision: ProjectionCounter,
  snapshot: Schema.Unknown,
});
const heartbeat = Schema.Struct({
  generation: ProjectionCounter,
  revision: ProjectionCounter,
  evaluated_at_ms: HistoryMillis,
  pending: Schema.Boolean,
});
const recovery = Schema.Struct({
  reason: Schema.Literals([
    'projection_reset',
    'revision_mismatch',
    'resume_window_exceeded',
    'slow_consumer',
  ]),
});
const ended = Schema.Struct({
  reason: Schema.Literals([
    'authentication_required',
    'access_denied',
    'scope_missing',
    'unavailable',
    'lease_expired',
    'payload_limit',
  ]),
});
export function parsePropertyLive(
  frame: SseEvent,
  request: PropertyRequest,
): PropertyLiveEvent {
  try {
    const value: unknown = JSON.parse(frame.data);
    if (frame.event === 'snapshot' || frame.event === 'replace') {
      const delta =
        frame.event === 'replace'
          ? Schema.decodeUnknownSync(replacement)(value)
          : null;
      const snapshot = parseCurrentProperty(
        delta ? delta.snapshot : value,
        request,
      );
      const match = frame.id?.match(
        /^v1\.[0-9a-f]{64}\.(0|[1-9][0-9]{0,18})\.(0|[1-9][0-9]{0,18})$/,
      );
      if (
        !match ||
        match[1] !== snapshot.generation ||
        match[2] !== snapshot.revision
      )
        throw new RequestFailure('invalid-response');
      if (delta && BigInt(delta.base_revision) > (1n << 63n) - 1n)
        throw new RequestFailure('invalid-response');
      return delta
        ? {
            kind: 'replace',
            id: frame.id ?? '',
            base: delta.base_revision,
            snapshot,
          }
        : { kind: 'snapshot', id: frame.id ?? '', snapshot };
    }
    if (frame.id !== undefined) throw new RequestFailure('invalid-response');
    if (frame.event === 'heartbeat') {
      const h = Schema.decodeUnknownSync(heartbeat)(value);
      if (
        !isMillis(h.evaluated_at_ms) ||
        [h.generation, h.revision].some((n) => BigInt(n) > (1n << 63n) - 1n)
      )
        throw new RequestFailure('invalid-response');
      return {
        kind: 'heartbeat',
        generation: h.generation,
        revision: h.revision,
        evaluatedAt: h.evaluated_at_ms,
        pending: h.pending,
      };
    }
    if (frame.event === 'resnapshot-required')
      return {
        kind: frame.event,
        ...Schema.decodeUnknownSync(recovery)(value),
      };
    if (frame.event === 'stream-ended')
      return { kind: frame.event, ...Schema.decodeUnknownSync(ended)(value) };
  } catch {
    throw new RequestFailure('invalid-response');
  }
  throw new RequestFailure('invalid-response');
}
