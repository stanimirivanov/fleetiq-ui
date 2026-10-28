import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import {
  type PropertyLiveState,
  runPropertyLive,
} from '../../../api/property-live-session';
import type { PropertyRequest } from '../../../model/property-evidence';
import { useMetadataReader } from '../MetadataReaderProvider';
/** Keyed lifetime hides old evidence synchronously and rejects late callbacks. */
export function usePropertyLive(request: Accessor<PropertyRequest | null>) {
  const context = useMetadataReader();
  const [enabled, setEnabled] = createSignal(false),
    [revision, setRevision] = createSignal(0);
  const key = createMemo(() => ({
    scope: JSON.stringify(request()),
    access: context.accessRevision?.(),
    reader: context.reader,
  }));
  const [denied, setDenied] = createSignal<{
    key: ReturnType<typeof key>;
    failure: 'unauthorized' | 'forbidden' | 'not-found';
  }>();
  const blocked = () =>
    Boolean(context.accessBlock?.()) || denied()?.key === key();
  const [stored, setStored] = createSignal<{
    key: ReturnType<typeof key>;
    state: PropertyLiveState;
  }>();
  createEffect(
    on(
      () => [key(), enabled(), revision(), context.accessBlock?.()] as const,
      ([owner, active, _revision, blocked]) => {
        const query = request(),
          subscribe = context.reader?.telemetry?.subscribe;
        if (!query || !subscribe || !active || blocked) return;
        const controller = new AbortController();
        onCleanup(() => controller.abort());
        void runPropertyLive(subscribe, query, controller.signal, (state) => {
          if (controller.signal.aborted) return;
          if (
            state.failure === 'unauthorized' ||
            state.failure === 'forbidden' ||
            state.failure === 'not-found'
          )
            setDenied({ key: owner, failure: state.failure });
          if (state.kind === 'live') setDenied(undefined);
          setStored({ key: owner, state });
          if (state.failure === 'unauthorized') context.onUnauthorized?.();
        });
      },
    ),
  );
  const state = createMemo<PropertyLiveState | null>(() => {
    if (!enabled())
      return blocked()
        ? {
            kind: 'stopped',
            snapshot: null,
            failure: denied()?.failure ?? 'forbidden',
          }
        : null;
    if (context.accessBlock?.())
      return { kind: 'stopped', snapshot: null, failure: 'forbidden' };
    return stored()?.key === key()
      ? (stored()?.state ?? null)
      : { kind: 'connecting', snapshot: null };
  });
  return {
    blocked,
    available: () => Boolean(context.reader?.telemetry?.subscribe),
    enabled,
    state,
    start: () => {
      setRevision((n) => n + 1);
      setEnabled(true);
    },
    stop: () => {
      setEnabled(false);
      setStored(undefined);
    },
  };
}
