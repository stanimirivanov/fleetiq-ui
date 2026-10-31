import { Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { CommandState } from './useAlertCommand';
export function AlertCommandFeedback<T>(props: {
  readonly state: CommandState<T>;
  readonly replay: () => void;
  readonly reload: () => void;
  readonly reloadLabel?: string;
}) {
  const error = () => {
    const s = props.state;
    return s.kind === 'error' ? s : undefined;
  };
  return (
    <>
      <Show when={props.state.kind === 'pending'}>
        <p role="status">Submitting captured command…</p>
      </Show>
      <Show when={error()}>
        {(e) => (
          <div role="alert">
            <p>{new RequestFailure(e().failure).message}</p>
            <Show
              when={e().uncertain}
              fallback={
                <Show when={e().failure === 'conflict'}>
                  <button type="button" onClick={props.reload}>
                    {props.reloadLabel ?? 'Reload current rule head'}
                  </button>
                </Show>
              }
            >
              <p>
                Outcome is unconfirmed. The captured command is locked; check
                authority and retry exactly. Leaving this scope discards local
                recovery state.
              </p>
              <button type="button" onClick={props.replay}>
                Retry exact command
              </button>
            </Show>
          </div>
        )}
      </Show>
    </>
  );
}
