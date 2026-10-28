import type { CurrentProperty, PropertyRequest } from './property-values';
export type PropertyLiveEvent =
  | {
      readonly kind: 'snapshot';
      readonly id: string;
      readonly snapshot: CurrentProperty;
    }
  | {
      readonly kind: 'replace';
      readonly id: string;
      readonly base: string;
      readonly snapshot: CurrentProperty;
    }
  | {
      readonly kind: 'heartbeat';
      readonly generation: string;
      readonly revision: string;
      readonly evaluatedAt: string;
      readonly pending: boolean;
    }
  | { readonly kind: 'resnapshot-required'; readonly reason: string }
  | {
      readonly kind: 'stream-ended';
      readonly reason:
        | 'authentication_required'
        | 'access_denied'
        | 'scope_missing'
        | 'unavailable'
        | 'lease_expired'
        | 'payload_limit';
    };
export interface PropertyLiveOptions {
  readonly signal: AbortSignal;
  readonly cursor?: string;
}
export type SubscribeProperty = (
  request: PropertyRequest,
  receive: (event: PropertyLiveEvent) => void,
  options: PropertyLiveOptions,
) => Promise<void>;
export interface LiveBaseline {
  readonly snapshot: CurrentProperty;
  readonly cursor: string;
}
/** Full replacements may coalesce revisions; only their declared base may advance. */
export function applyPropertyEvent(
  held: LiveBaseline | null,
  event: PropertyLiveEvent,
): LiveBaseline | null {
  if (event.kind === 'snapshot') {
    if (held)
      return event.id === held.cursor &&
        event.snapshot.generation === held.snapshot.generation &&
        event.snapshot.revision === held.snapshot.revision
        ? held
        : null;
    return { snapshot: event.snapshot, cursor: event.id };
  }
  if (event.kind === 'replace') {
    if (!held || event.snapshot.generation !== held.snapshot.generation)
      return null;
    if (
      event.snapshot.revision === held.snapshot.revision &&
      event.id === held.cursor
    )
      return held;
    if (
      event.base !== held.snapshot.revision ||
      BigInt(event.snapshot.revision) <= BigInt(event.base)
    )
      return null;
    return { snapshot: event.snapshot, cursor: event.id };
  }
  if (event.kind === 'heartbeat') {
    if (
      !held ||
      event.generation !== held.snapshot.generation ||
      event.revision !== held.snapshot.revision
    )
      return null;
    const item = held.snapshot.item;
    const age = item
      ? BigInt(event.evaluatedAt) - BigInt(item.change.eventAt)
      : 0n;
    return {
      ...held,
      snapshot: {
        ...held.snapshot,
        evaluatedAt: event.evaluatedAt,
        pending: event.pending,
        item: item
          ? {
              ...item,
              freshness:
                age < 0n ? 'future' : age <= 30000n ? 'fresh' : 'stale',
            }
          : null,
      },
    };
  }
  return null;
}
