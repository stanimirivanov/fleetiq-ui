import { createEffect, createSignal, onCleanup } from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type { Options } from '../model/devices';
import { useDevices } from './DeviceProvider';
export type CommandState<T> =
  | { kind: 'idle' | 'pending' }
  | { kind: 'success'; value: T }
  | { kind: 'error'; failure: RequestFailureKind; uncertain: boolean };
/** Never retries automatically. An ambiguous result preserves the exact frozen command. */
export function useDeviceCommand<R, T>(
  execute: (request: R, options: Options) => Promise<T>,
  succeeded?: (value: T) => void,
  enabled: () => boolean = () => true,
) {
  const context = useDevices();
  const [state, setState] = createSignal<CommandState<T>>({ kind: 'idle' });
  let generation = 0;
  let active = true,
    controller: AbortController | undefined,
    captured: R | undefined;
  onCleanup(() => {
    active = false;
    generation += 1;
    controller?.abort();
  });
  const uncertain = () => {
    const s = state();
    return s.kind === 'error' && s.uncertain;
  };
  const submit = (request: R) => {
    if (!active || !enabled() || state().kind === 'pending' || uncertain())
      return;
    captured = structuredClone(request);
    void perform();
  };
  const perform = async () => {
    if (
      !active ||
      !enabled() ||
      captured === undefined ||
      state().kind === 'pending'
    )
      return;
    const current = ++generation;
    controller = new AbortController();
    setState({ kind: 'pending' });
    try {
      const value = await execute(captured, { signal: controller.signal });
      if (active && current === generation) {
        setState({ kind: 'success', value });
        succeeded?.(value);
      }
    } catch (error) {
      if (!active || current !== generation) return;
      const failure =
        error instanceof RequestFailure ? error.kind : 'unavailable';
      setState({
        kind: 'error',
        failure,
        uncertain: failure === 'unavailable' || failure === 'invalid-response',
      });
      if (failure === 'unauthorized') context.onUnauthorized();
    }
  };
  createEffect(() => {
    if (!enabled() && state().kind === 'pending') {
      generation += 1;
      controller?.abort();
      setState({ kind: 'error', failure: 'unavailable', uncertain: true });
    }
  });
  return {
    state,
    submit,
    retry: () => {
      if (uncertain()) void perform();
    },
    locked: () => state().kind === 'pending' || uncertain(),
  };
}
