import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type { AssetReadOptions } from '../../model/asset-catalogue';
import type { MetadataReader } from '../../model/metadata';
import { useMetadataReader } from './MetadataReaderProvider';

export type MetadataReadState<T> =
  | { readonly kind: 'idle' | 'loading' | 'unconfigured' }
  | { readonly kind: 'blocked'; readonly message: string }
  | { readonly kind: 'ready'; readonly value: T }
  | { readonly kind: 'error'; readonly failure: RequestFailureKind };

/** One cancellable read, with stale-result suppression even for non-cooperative adapters. */
export function useMetadataRead<R, T>(
  request: Accessor<R | null>,
  execute: (
    reader: MetadataReader,
    request: R,
    options: AssetReadOptions,
  ) => Promise<T>,
) {
  const context = useMetadataReader();
  const requestKey = createMemo(() => JSON.stringify(request()));
  // Access evidence is an opaque lifetime token, never serialized into request scope.
  const key = createMemo(() => ({
    request: requestKey(),
    access: context.accessRevision?.(),
  }));
  const [stored, setStored] = createSignal<{
    key: ReturnType<typeof key> | null;
    state: MetadataReadState<T>;
  }>({ key: null, state: { kind: 'idle' } });
  const [revision, setRevision] = createSignal(0);
  createEffect(
    on(
      () =>
        [context.reader, key(), revision(), context.accessBlock?.()] as const,
      ([reader, currentKey, _revision, blocked]) => {
        const currentRequest = request();
        if (currentRequest === null) {
          setStored({ key: currentKey, state: { kind: 'idle' } });
          return;
        }
        if (!reader) {
          setStored({ key: currentKey, state: { kind: 'unconfigured' } });
          return;
        }
        if (blocked) {
          setStored({
            key: currentKey,
            state: { kind: 'blocked', message: blocked },
          });
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
  const state = createMemo<MetadataReadState<T>>(() => {
    if (request() === null) return { kind: 'idle' };
    if (!context.reader) return { kind: 'unconfigured' };
    const blocked = context.accessBlock?.();
    if (blocked) return { kind: 'blocked', message: blocked };
    return stored().key === key() ? stored().state : { kind: 'loading' };
  });
  return { state, retry: () => setRevision((value) => value + 1) };
}
