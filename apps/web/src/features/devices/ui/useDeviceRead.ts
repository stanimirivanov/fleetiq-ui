import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type { Options } from '../model/devices';
import { useDevices } from './DeviceProvider';
export type ReadState<T> =
  | { readonly kind: 'idle' | 'loading' }
  | { readonly kind: 'ready'; readonly value: T }
  | { readonly kind: 'error'; readonly failure: RequestFailureKind };
/** Scope is compared before exposing state and again before accepting a completion. */
export function useDeviceRead<R, T>(
  request: Accessor<R | null>,
  execute: (r: R, o: Options) => Promise<T>,
) {
  const context = useDevices(),
    [revision, refresh] = createSignal(0);
  const key = createMemo(() => JSON.stringify(request()));
  const [stored, setStored] = createSignal<{
    key: string;
    state: ReadState<T>;
  }>({ key: '', state: { kind: 'idle' } });
  createEffect(
    on(
      () => [key(), revision()] as const,
      ([current]) => {
        const r = request();
        if (r === null) return;
        const controller = new AbortController();
        let active = true;
        onCleanup(() => {
          active = false;
          controller.abort();
        });
        setStored({ key: current, state: { kind: 'loading' } });
        const failure = (error: unknown) => {
          if (!active) return;
          const kind =
            error instanceof RequestFailure ? error.kind : 'unavailable';
          setStored({ key: current, state: { kind: 'error', failure: kind } });
          if (kind === 'unauthorized') context.onUnauthorized();
        };
        try {
          void execute(r, { signal: controller.signal }).then((value) => {
            if (active)
              setStored({ key: current, state: { kind: 'ready', value } });
          }, failure);
        } catch (e) {
          failure(e);
        }
      },
    ),
  );
  return {
    state: createMemo<ReadState<T>>(() =>
      request() === null
        ? { kind: 'idle' }
        : stored().key === key()
          ? stored().state
          : { kind: 'loading' },
    ),
    refresh: () => refresh((v) => v + 1),
  };
}
