import { createSignal, Show } from 'solid-js';
import { positiveId, validResolution } from '../../../model/history-review';
import type { RestoreSelection } from '../../../model/history-review-types';
import { isMillis } from '../../../model/property-evidence';
import { metadataButtonClass, metadataInputClass } from '../MetadataPanel';
export function HistoryWindow(props: {
  readonly start: string;
  readonly end: string;
  readonly resolution?: string;
  readonly restore?: RestoreSelection;
  readonly apply: (
    start: string,
    end: string,
    resolution?: string,
    restore?: RestoreSelection,
  ) => void;
}) {
  const [invalid, setInvalid] = createSignal(false);
  return (
    <form
      class="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget),
          start = String(data.get('start') ?? ''),
          end = String(data.get('end') ?? ''),
          resolution = String(data.get('resolution') ?? ''),
          manifest = String(data.get('manifest') ?? ''),
          generation = String(data.get('generation') ?? '');
        const valid =
          isMillis(start) &&
          isMillis(end) &&
          BigInt(end) > BigInt(start) &&
          BigInt(end) - BigInt(start) <= 604800000n &&
          (!resolution || validResolution(start, end, resolution)) &&
          ((!manifest && !generation) ||
            (positiveId(manifest) && positiveId(generation)));
        setInvalid(!valid);
        if (valid)
          props.apply(
            start,
            end,
            resolution || undefined,
            manifest ? { manifestId: manifest, generation } : undefined,
          );
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
      <label class="grid gap-1 text-xs">
        History representation
        <select
          class={metadataInputClass}
          name="resolution"
          value={props.resolution ?? ''}
        >
          <option value="">Raw interpretations</option>
          <option value="1000">Numeric summary · 1 second</option>
          <option value="60000">Numeric summary · 1 minute</option>
          <option value="3600000">Numeric summary · 1 hour</option>
          <Show
            when={
              props.resolution &&
              !['1000', '60000', '3600000'].includes(props.resolution)
            }
          >
            <option value={props.resolution}>
              Numeric summary · {props.resolution} ms
            </option>
          </Show>
        </select>
      </label>
      <div class="grid gap-2 sm:col-span-2 sm:grid-cols-2">
        <label class="grid gap-1 text-xs">
          Archive manifest ID (optional)
          <input
            class={metadataInputClass}
            name="manifest"
            value={props.restore?.manifestId ?? ''}
            maxlength={19}
            inputmode="numeric"
          />
        </label>
        <label class="grid gap-1 text-xs">
          Restore generation (paired)
          <input
            class={metadataInputClass}
            name="generation"
            value={props.restore?.generation ?? ''}
            maxlength={19}
            inputmode="numeric"
          />
        </label>
        <p class="text-xs text-muted sm:col-span-2">
          Select existing restored evidence only. This does not request
          restoration or establish complete interval coverage.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button type="submit" class={metadataButtonClass}>
          Apply history window
        </button>
        <p class="text-xs text-muted">
          Up to 7 days · 50 records per page · summaries require aligned full
          buckets, at most 64.
        </p>
      </div>
      <Show when={invalid()}>
        <p role="alert" class="text-xs text-status-critical sm:col-span-2">
          Enter exact signed 64-bit milliseconds, with an increasing window of
          at most seven days. Summaries require aligned full buckets (at most
          64); archive IDs must be paired positive exact integers.
        </p>
      </Show>
    </form>
  );
}
