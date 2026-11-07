import { Show } from 'solid-js';
import { metadataButtonClass } from '../MetadataPanel';

export function HistoryAction(props: {
  readonly label: string;
  readonly busy: boolean;
  readonly run: () => void;
}) {
  return (
    <button
      type="button"
      class={metadataButtonClass}
      disabled={props.busy}
      onClick={props.run}
    >
      {props.label}
    </button>
  );
}

export function HistoryJobFeedback(props: {
  readonly busy: boolean;
  readonly message: string;
}) {
  return (
    <>
      <Show when={props.message}>
        <p role="alert" class="text-xs">
          {props.message}
        </p>
      </Show>
      <Show when={props.busy}>
        <p role="status" class="text-xs">
          Action in progress.
        </p>
      </Show>
    </>
  );
}
