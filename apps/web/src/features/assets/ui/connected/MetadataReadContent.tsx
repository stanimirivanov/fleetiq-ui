import { type JSX, Match, Switch } from 'solid-js';
import type { RequestFailureKind } from '#shared/model';
import { metadataButtonClass } from './MetadataPanel';
import type { MetadataReadState } from './useMetadataRead';

const failureCopy: Record<RequestFailureKind, string> = {
  unauthorized: 'Your session has ended. Sign in to continue.',
  forbidden:
    'Access to this tenant is denied. Choose a tenant for which you have permission.',
  'not-found': 'The requested metadata record was not found.',
  'invalid-request': 'The metadata request is invalid. Review the URL context.',
  'invalid-response':
    'The service returned an invalid response. No metadata from that response is shown.',
  conflict: 'The request conflicts with current state',
  unavailable:
    'The metadata service is unavailable. Try again when the connection recovers.',
};

/** Typed failures remain separate from empty metadata and unsupported capabilities. */
export function MetadataReadContent<T>(props: {
  readonly state: MetadataReadState<T>;
  readonly label: string;
  readonly retry: () => void;
  readonly messages?: {
    readonly failures: Readonly<Record<RequestFailureKind, string>>;
    readonly idle: string;
    readonly unconfigured: string;
  };
  readonly children: (value: T) => JSX.Element;
}) {
  const ready = () => {
    const state = props.state;
    return state.kind === 'ready' ? state : undefined;
  };
  const blocked = () => {
    const state = props.state;
    return state.kind === 'blocked' ? state : undefined;
  };
  const failure = () => {
    const state = props.state;
    return state.kind === 'error' ? state : undefined;
  };
  return (
    <Switch>
      <Match when={props.state.kind === 'idle'}>
        <p class="text-xs text-muted">
          {props.messages?.idle ??
            `Choose the required context to review ${props.label}.`}
        </p>
      </Match>
      <Match when={props.state.kind === 'unconfigured'}>
        <p role="status" class="text-sm text-muted">
          {props.messages?.unconfigured ??
            'The metadata connection is not configured.'}
        </p>
      </Match>
      <Match when={props.state.kind === 'loading'}>
        <p role="status" class="text-sm text-muted">
          Loading {props.label}…
        </p>
      </Match>
      <Match when={blocked()}>
        {(state) => (
          <p role="status" class="text-sm text-muted">
            {state().message}
          </p>
        )}
      </Match>
      <Match when={failure()}>
        {(error) => (
          <div role="alert" class="grid gap-3 text-sm">
            <p>{(props.messages?.failures ?? failureCopy)[error().failure]}</p>
            <Switch>
              <Match when={error().failure === 'unauthorized'}>
                <a
                  class="text-accent underline"
                  href="/api/v1/auth/login"
                  rel="external noreferrer"
                >
                  Sign in to FleetIQ
                </a>
              </Match>
              <Match
                when={
                  error().failure === 'unavailable' ||
                  error().failure === 'invalid-response'
                }
              >
                <button
                  type="button"
                  class={metadataButtonClass}
                  onClick={props.retry}
                >
                  Retry {props.label}
                </button>
              </Match>
            </Switch>
          </div>
        )}
      </Match>
      <Match when={ready()}>{(value) => props.children(value().value)}</Match>
    </Switch>
  );
}
