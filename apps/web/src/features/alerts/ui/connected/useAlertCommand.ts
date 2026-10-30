import { createSignal, onCleanup } from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import { useAlertContext } from './AlertProvider';
export type CommandState<T> =
  | { kind: 'idle' | 'pending' }
  | { kind: 'success'; receipt: T }
  | { kind: 'error'; failure: RequestFailureKind; uncertain: boolean };
/** Freeze one intent until confirmed. Even a denied replay cannot erase prior uncertainty. */
export function useAlertCommand<R, T>(
  execute: (r: R, o: { signal: AbortSignal }) => Promise<T>,
  committed: (receipt: T) => void,
) {
  const context = useAlertContext(),
    [state, setState] = createSignal<CommandState<T>>({ kind: 'idle' });
  let active = true,
    captured: R | undefined,
    controller: AbortController | undefined,
    uncertain = false;
  onCleanup(() => {
    active = false;
    controller?.abort();
  });
  const locked = () => {
    const s = state();
    return (
      s.kind === 'pending' ||
      s.kind === 'success' ||
      (s.kind === 'error' && s.uncertain)
    );
  };
  async function perform() {
    if (!active || captured === undefined || state().kind === 'pending') return;
    controller = new AbortController();
    setState({ kind: 'pending' });
    try {
      const receipt = await execute(captured, { signal: controller.signal });
      if (active) {
        setState({ kind: 'success', receipt });
        committed(receipt);
      }
    } catch (e) {
      if (!active) return;
      const failure = e instanceof RequestFailure ? e.kind : 'unavailable';
      uncertain ||= failure === 'unavailable' || failure === 'invalid-response';
      setState({ kind: 'error', failure, uncertain });
      if (failure === 'unauthorized') context.onUnauthorized?.();
    }
  }
  return {
    state,
    locked,
    submit: (r: R) => {
      if (!active || locked()) return;
      captured = structuredClone(r);
      void perform();
    },
    replay: () => {
      const s = state();
      if (s.kind === 'error' && s.uncertain) void perform();
    },
  };
}
