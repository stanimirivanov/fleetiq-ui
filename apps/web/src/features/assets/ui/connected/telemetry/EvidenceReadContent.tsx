import { type JSX, Match, Switch } from 'solid-js';
import type { RequestFailureKind } from '#shared/model';
import { metadataButtonClass } from '../MetadataPanel';
import type { MetadataReadState } from '../useMetadataRead';

const copy: Record<RequestFailureKind, string> = {
  unauthorized: 'Your session has ended. Sign in again to read telemetry.',
  forbidden:
    'Telemetry access denied. telemetry.read is independent of metadata.read.',
  'not-found':
    'The requested installed property or interpretation was not found.',
  'invalid-request':
    'The telemetry request is invalid. Check its exact property and window.',
  'invalid-response':
    'The telemetry response is invalid. No evidence from that response is shown.',
  unavailable:
    'The telemetry service is unavailable. No sample values are substituted.',
  conflict: 'The telemetry request conflicts with current state.',
};
export function EvidenceReadContent<T>(props: {
  readonly state: MetadataReadState<T>;
  readonly label: string;
  readonly retry: () => void;
  readonly children: (value: T) => JSX.Element;
}) {
  const ready = () => {
    const s = props.state;
    return s.kind === 'ready' ? s : undefined;
  };
  const error = () => {
    const s = props.state;
    return s.kind === 'error' ? s : undefined;
  };
  const blocked = () => {
    const s = props.state;
    return s.kind === 'blocked' ? s : undefined;
  };
  return (
    <Switch>
      <Match when={props.state.kind === 'idle'}>
        <p class="text-xs text-muted">
          Select a declared property to read {props.label}.
        </p>
      </Match>
      <Match when={props.state.kind === 'unconfigured'}>
        <p role="status" class="text-xs text-muted">
          Telemetry reader is not configured.
        </p>
      </Match>
      <Match when={props.state.kind === 'loading'}>
        <p role="status" class="text-xs text-muted">
          Loading {props.label}…
        </p>
      </Match>
      <Match when={blocked()}>
        {(s) => (
          <p role="alert" class="text-xs text-status-warning">
            {s().message}
          </p>
        )}
      </Match>
      <Match when={error()}>
        {(s) => (
          <div role="alert" class="grid gap-2 text-xs">
            <p>{copy[s().failure]}</p>
            <button
              type="button"
              class={metadataButtonClass}
              onClick={props.retry}
            >
              Retry {props.label}
            </button>
          </div>
        )}
      </Match>
      <Match when={ready()}>{(s) => props.children(s().value)}</Match>
    </Switch>
  );
}
