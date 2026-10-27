import { createUniqueId, type JSX, Match, Show, Switch } from 'solid-js';
import type { CommandState } from './useDeviceCommand';
import type { ReadState } from './useDeviceRead';
export const inputClass =
  'w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-foreground focus:outline-2 focus:outline-accent';
export const buttonClass =
  'rounded-md border border-outline bg-canvas px-3 py-2 text-sm font-medium text-foreground hover:border-accent disabled:opacity-50';
export function DeviceField(props: {
  label: string;
  children: (id: string) => JSX.Element;
}) {
  const id = createUniqueId();
  return (
    <label for={id} class="grid min-w-0 gap-1 text-xs font-medium text-muted">
      {props.label}
      {props.children(id)}
    </label>
  );
}
export function DevicePanel(props: { title: string; children: JSX.Element }) {
  return (
    <section
      aria-label={props.title}
      class="min-w-0 rounded-xl border border-outline bg-surface p-4"
    >
      <h2 class="mb-3 text-sm font-semibold">{props.title}</h2>
      {props.children}
    </section>
  );
}
export function ReadNotice<T>(props: {
  state: ReadState<T>;
  retry: () => void;
  missing?: string;
}) {
  return (
    <Switch>
      <Match when={props.state.kind === 'loading'}>
        <p role="status" class="text-sm text-muted">
          Loading evidence…
        </p>
      </Match>
      <Match when={props.state.kind === 'error'}>
        <Show when={props.state.kind === 'error' ? props.state : undefined}>
          {(s) => (
            <div class="grid gap-2">
              <p
                role={s().failure === 'not-found' ? 'status' : 'alert'}
                class="text-sm text-muted"
              >
                {s().failure === 'not-found'
                  ? (props.missing ?? 'No record found.')
                  : s().failure === 'forbidden'
                    ? 'Access denied. This action needs its own tenant grant.'
                    : s().failure === 'invalid-response'
                      ? 'Invalid server evidence. Nothing from this response is displayed.'
                      : s().failure === 'conflict'
                        ? 'Configuration conflict. Refresh and review current evidence.'
                        : 'Evidence unavailable. Check access or retry.'}
              </p>
              <button type="button" class={buttonClass} onClick={props.retry}>
                Refresh evidence
              </button>
            </div>
          )}
        </Show>
      </Match>
    </Switch>
  );
}
export function CommandNotice<T>(props: {
  state: CommandState<T>;
  retry: () => void;
  success?: string;
  enabled?: boolean;
}) {
  return (
    <Switch>
      <Match when={props.state.kind === 'pending'}>
        <p role="status" class="text-sm text-muted">
          Submitting command…
        </p>
      </Match>
      <Match when={props.state.kind === 'success'}>
        <p role="status" class="text-sm text-status-nominal">
          {props.success ?? 'Command acknowledged. Review refreshed evidence.'}
        </p>
      </Match>
      <Match when={props.state.kind === 'error'}>
        <Show when={props.state.kind === 'error' ? props.state : undefined}>
          {(s) => (
            <div class="grid gap-2">
              <p role="alert" class="text-sm text-status-critical">
                {s().uncertain
                  ? 'Outcome unconfirmed. The server may have accepted this command. Keep the same identity and complete content; retry only this exact request.'
                  : s().failure === 'conflict'
                    ? 'Conflict: content, revision or package prerequisites differ. Refresh current evidence before editing.'
                    : s().failure === 'forbidden'
                      ? 'Command denied. Refresh tenant permissions.'
                      : s().failure === 'not-found'
                        ? 'A required asset or definition is missing.'
                        : 'Invalid command or unavailable access. Review the fields and current permissions.'}
              </p>
              <Show when={s().uncertain}>
                <button
                  type="button"
                  class={buttonClass}
                  onClick={props.retry}
                  disabled={props.enabled === false}
                >
                  Retry exact request
                </button>
              </Show>
            </div>
          )}
        </Show>
      </Match>
    </Switch>
  );
}
