import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type {
  CurrentProperty,
  PropertyRequest,
} from '../model/property-evidence';
import {
  applyPropertyEvent,
  type LiveBaseline,
  type PropertyLiveEvent,
  type SubscribeProperty,
} from '../model/property-live';
export interface PropertyLiveState {
  readonly kind:
    | 'connecting'
    | 'live'
    | 'reconnecting'
    | 'resnapshot'
    | 'stopped';
  readonly snapshot: CurrentProperty | null;
  readonly failure?: RequestFailureKind;
}
/** A finite reconnect budget is shared by gaps, transport errors and lease renewal. */
export async function runPropertyLive(
  subscribe: SubscribeProperty,
  request: PropertyRequest,
  signal: AbortSignal,
  publish: (state: PropertyLiveState) => void,
  wait = delay,
): Promise<void> {
  let held: LiveBaseline | null = null;
  const baseline = (): LiveBaseline | null => held;
  for (let attempt = 0; attempt < 6 && !signal.aborted; attempt++) {
    let control: Extract<
      PropertyLiveEvent,
      { kind: 'stream-ended' | 'resnapshot-required' }
    > | null = null;
    let mismatch = false;
    const emit = (
      kind: PropertyLiveState['kind'],
      failure?: RequestFailureKind,
    ) => {
      if (!signal.aborted)
        publish({
          kind,
          snapshot: held?.snapshot ?? null,
          ...(failure ? { failure } : {}),
        });
    };
    emit(attempt ? 'reconnecting' : 'connecting');
    try {
      await subscribe(
        request,
        (event) => {
          if (signal.aborted || control || mismatch) return;
          if (
            event.kind === 'stream-ended' ||
            event.kind === 'resnapshot-required'
          ) {
            control = event;
            return;
          }
          const next = applyPropertyEvent(held, event);
          if (!next) {
            mismatch = true;
            throw new RequestFailure('invalid-response');
          }
          held = next;
          emit('live');
        },
        { signal, ...(baseline() ? { cursor: baseline()?.cursor } : {}) },
      );
    } catch (cause) {
      if (signal.aborted) return;
      if (
        !mismatch &&
        !control &&
        cause instanceof RequestFailure &&
        cause.kind !== 'unavailable'
      ) {
        held = null;
        emit('stopped', cause.kind);
        return;
      }
    }
    if (signal.aborted) return;
    // Callback assignment is intentionally observed after the awaited subscription.
    const end = control as Extract<
      PropertyLiveEvent,
      { kind: 'stream-ended' | 'resnapshot-required' }
    > | null;
    if (mismatch || end?.kind === 'resnapshot-required') {
      held = null;
      emit('resnapshot');
    }
    if (end?.kind === 'stream-ended') {
      const failures: Partial<Record<string, RequestFailureKind>> = {
        authentication_required: 'unauthorized',
        access_denied: 'forbidden',
        scope_missing: 'not-found',
        payload_limit: 'invalid-response',
      };
      const failure = failures[end.reason];
      if (failure) {
        held = null;
        emit('stopped', failure);
        return;
      }
    }
    if (attempt === 5) {
      emit('stopped', 'unavailable');
      return;
    }
    try {
      await wait(
        Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250),
        signal,
      );
    } catch {
      if (!signal.aborted) {
        held = null;
        emit('stopped', 'unavailable');
      }
      return;
    }
  }
}
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
