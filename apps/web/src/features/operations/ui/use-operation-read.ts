import { createEffect, createSignal, onCleanup } from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';

type Read<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; value: T }
  | { kind: 'error'; failure: RequestFailureKind };

export function operationFailure(error: unknown): RequestFailureKind {
  return error instanceof RequestFailure ? error.kind : 'unavailable';
}

/** One read lifetime per mounted scope, with refresh replacing the old observation. */
export function useOperationRead<T>(
  read: (signal: AbortSignal) => Promise<T>,
  onUnauthorized: () => void,
) {
  const [state, setState] = createSignal<Read<T>>({ kind: 'loading' });
  const [revision, revise] = createSignal(0);
  createEffect(() => {
    revision();
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    void read(controller.signal).then(
      (value) => {
        if (!controller.signal.aborted)
          setState(() => ({ kind: 'ready', value }));
      },
      (error) => {
        if (controller.signal.aborted) return;
        const failure = operationFailure(error);
        setState({ kind: 'error', failure });
        if (failure === 'unauthorized') onUnauthorized();
      },
    );
  });
  return {
    state,
    refresh: () => {
      setState({ kind: 'loading' });
      revise((value) => value + 1);
    },
  };
}
