import { createSignal, Show } from 'solid-js';
import { isMillis } from '../../../model/property-evidence';
import { metadataButtonClass, metadataInputClass } from '../MetadataPanel';
export function HistoryWindow(props: {
  readonly start: string;
  readonly end: string;
  readonly apply: (start: string, end: string) => void;
}) {
  const [invalid, setInvalid] = createSignal(false);
  return (
    <form
      class="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget),
          start = String(data.get('start') ?? ''),
          end = String(data.get('end') ?? '');
        const valid =
          isMillis(start) &&
          isMillis(end) &&
          BigInt(end) > BigInt(start) &&
          BigInt(end) - BigInt(start) <= 604800000n;
        setInvalid(!valid);
        if (valid) props.apply(start, end);
      }}
    >
      <label class="grid gap-1 text-xs">
        History start (Unix ms, inclusive)
        <input
          class={metadataInputClass}
          name="start"
          value={props.start}
          maxlength={20}
          inputmode="numeric"
          required
        />
      </label>
      <label class="grid gap-1 text-xs">
        History end (Unix ms, exclusive)
        <input
          class={metadataInputClass}
          name="end"
          value={props.end}
          maxlength={20}
          inputmode="numeric"
          required
        />
      </label>
      <div class="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button type="submit" class={metadataButtonClass}>
          Apply history window
        </button>
        <p class="text-xs text-muted">
          Up to 7 days · 50 interpretations per page
        </p>
      </div>
      <Show when={invalid()}>
        <p role="alert" class="text-xs text-status-critical sm:col-span-2">
          Enter exact signed 64-bit milliseconds, with an increasing window of
          at most seven days.
        </p>
      </Show>
    </form>
  );
}
