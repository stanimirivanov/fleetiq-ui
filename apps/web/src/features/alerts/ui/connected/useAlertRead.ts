import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type { AlertReader, ReadOptions } from '../../model/connected-alerts';
import { useAlertContext } from './AlertProvider';

export type AlertReadState<T> =
  | { readonly kind: 'idle' | 'loading' | 'unconfigured' }
  | { readonly kind: 'blocked'; readonly message: string }
  | { readonly kind: 'ready'; readonly value: T }
  | { readonly kind: 'error'; readonly failure: RequestFailureKind };

/** One cancellable read, with stale-result suppression even for non-cooperative adapters. */
export function useAlertRead<R, T>(
  request: Accessor<R | null>,
  execute: (
    reader: AlertReader,
    request: R,
    options: ReadOptions,
  ) => Promise<T>,
) {
  const context = useAlertContext();
  const requestKey = createMemo(() => JSON.stringify(request()));
  const key = requestKey;
  const [stored, setStored] = createSignal<{
    key: ReturnType<typeof key> | null;
    state: AlertReadState<T>;
  }>({ key: null, state: { kind: 'idle' } });
  const [revision, setRevision] = createSignal(0);
  createEffect(
    on(
      () => [context.reader, key(), revision()] as const,
      ([reader, currentKey]) => {
        const currentRequest = request();
        if (currentRequest === null) {
          setStored({ key: currentKey, state: { kind: 'idle' } });
          return;
        }
        if (!reader) {
          setStored({ key: currentKey, state: { kind: 'unconfigured' } });
          return;
        }
        const controller = new AbortController();
        let active = true;
        onCleanup(() => {
          active = false;
          controller.abort();
        });
        setStored({ key: currentKey, state: { kind: 'loading' } });
        const failed = (cause: unknown) => {
          if (!active) return;
          const failure =
            cause instanceof RequestFailure ? cause.kind : 'unavailable';
          setStored({ key: currentKey, state: { kind: 'error', failure } });
          if (failure === 'unauthorized') context.onUnauthorized?.();
        };
        try {
          void execute(reader, currentRequest, {
            signal: controller.signal,
          }).then((value) => {
            if (active)
              setStored({ key: currentKey, state: { kind: 'ready', value } });
          }, failed);
        } catch (cause) {
          failed(cause);
        }
      },
    ),
  );
  // Hide old data synchronously when URL context changes, before the read effect runs.
  const state = createMemo<AlertReadState<T>>(() => {
    if (request() === null) return { kind: 'idle' };
    if (!context.reader) return { kind: 'unconfigured' };
    return stored().key === key() ? stored().state : { kind: 'loading' };
  });
  return { state, retry: () => setRevision((value) => value + 1) };
}
