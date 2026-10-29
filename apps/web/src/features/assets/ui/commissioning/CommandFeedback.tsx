import { Show } from 'solid-js';
import type { RegistryCommandState } from './useRegistryCommand';
export function CommandFeedback(props: {
  state: RegistryCommandState;
  replay: () => void;
  prepare: () => void;
}) {
  const error = () => {
    const s = props.state;
    return s.kind === 'error' ? s : undefined;
  };
  const receipt = () => {
    const s = props.state;
    return s.kind === 'success' ? s.receipt : undefined;
  };
  return (
    <div aria-live="polite" class="grid gap-2 text-xs">
      <Show when={props.state.kind === 'pending'}>
        <p role="status">Submitting exact command…</p>
      </Show>
      <Show when={error()}>
        {(e) => (
          <div role="alert" class="grid gap-2">
            <p>
              {e().uncertain
                ? 'Outcome unknown. The server may have committed. Review authoritative evidence before replaying the same frozen identity and content.'
                : e().failure === 'conflict'
                  ? 'Conflict. Review the current identity or relationship head; no overwrite or automatic revision increment occurred.'
                  : `Command rejected: ${e().failure}. Review access and references before resubmitting.`}
            </p>
            <Show when={e().uncertain}>
              <button
                type="button"
                class="fi-action-button"
                onClick={props.replay}
              >
                Retry exact command
              </button>
            </Show>
          </div>
        )}
      </Show>
      <Show when={receipt()}>
        {(r) => (
          <p role="status" class="break-all">
            Committed: {r().outcome} · {r().id ?? 'asset registration'}{' '}
            {r().revision ? `revision ${r().revision}` : ''} · actor {r().actor}{' '}
            · recorded {r().recordedAt} ms. Registry review requested from the
            server at the receipt cutoffs.
          </p>
        )}
      </Show>
      <Show when={receipt()}>
        <button type="button" class="fi-action-button" onClick={props.prepare}>
          Prepare another command
        </button>
      </Show>
    </div>
  );
}
