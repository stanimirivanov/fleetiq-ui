import { type JSX, Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { AlertReadState } from './useAlertRead';
export function AlertReadPanel<T>(props: {
  readonly label: string;
  readonly state: AlertReadState<T>;
  readonly retry: () => void;
  readonly children: (value: T) => JSX.Element;
}) {
  const value = () => {
    const s = props.state;
    return s.kind === 'ready' ? { value: s.value } : undefined;
  };
  const message = () => {
    const s = props.state;
    return s.kind === 'error'
      ? new RequestFailure(s.failure).message
      : s.kind === 'unconfigured'
        ? 'Alert reader is not configured'
        : 'Loading…';
  };
  return (
    <section
      aria-label={props.label}
      class="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h2 class="font-semibold">{props.label}</h2>
      <Show
        when={value()}
        fallback={
          <Show when={props.state.kind !== 'idle'}>
            <p role={props.state.kind === 'error' ? 'alert' : 'status'}>
              {message()}
            </p>
            <Show when={props.state.kind === 'error'}>
              <button
                type="button"
                class="text-accent underline"
                onClick={props.retry}
              >
                Retry {props.label.toLowerCase()}
              </button>
            </Show>
          </Show>
        }
      >
        {(v) => props.children(v().value)}
      </Show>
    </section>
  );
}
