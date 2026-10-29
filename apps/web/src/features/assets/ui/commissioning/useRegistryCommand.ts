import { createSignal, onCleanup } from 'solid-js';
import { RequestFailure, type RequestFailureKind } from '#shared/model';
import type { AssetReadOptions } from '../../model/asset-catalogue';
import type { CommandReceipt } from '../../model/commissioning';
import { useMetadataReader } from '../connected/MetadataReaderProvider';
export type RegistryCommandState =
  | { kind: 'idle' | 'pending' }
  | { kind: 'success'; receipt: CommandReceipt }
  | { kind: 'error'; failure: RequestFailureKind; uncertain: boolean };
/** Own a single immutable command. Only explicit exact replay is allowed after ambiguous completion. */
export function useRegistryCommand<R>(
  execute: (request: R, options: AssetReadOptions) => Promise<CommandReceipt>,
  committed: (receipt: CommandReceipt, request: R) => void,
) {
  const context = useMetadataReader();
  const [state, setState] = createSignal<RegistryCommandState>({
    kind: 'idle',
  });
  let active = true,
    generation = 0,
    controller: AbortController | undefined,
    captured: R | undefined;
  onCleanup(() => {
    active = false;
    generation++;
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
  const perform = async () => {
    if (!active || captured === undefined || state().kind === 'pending') return;
    const current = ++generation;
    controller = new AbortController();
    setState({ kind: 'pending' });
    try {
      const receipt = await execute(captured, { signal: controller.signal });
      if (active && current === generation) {
        setState({ kind: 'success', receipt });
        committed(receipt, captured);
      }
    } catch (error) {
      if (!active || current !== generation) return;
      const failure =
        error instanceof RequestFailure ? error.kind : 'unavailable';
      if (failure === 'unauthorized') context.onUnauthorized?.();
      setState({
        kind: 'error',
        failure,
        uncertain: ['unavailable', 'invalid-response'].includes(failure),
      });
    }
  };
  return {
    state,
    locked,
    submit: (request: R) => {
      if (!active || locked()) return;
      captured = structuredClone(request);
      void perform();
    },
    prepare: () => {
      if (state().kind === 'success') {
        captured = undefined;
        setState({ kind: 'idle' });
      }
    },
    replay: () => {
      const s = state();
      if (s.kind === 'error' && s.uncertain) void perform();
    },
  };
}
