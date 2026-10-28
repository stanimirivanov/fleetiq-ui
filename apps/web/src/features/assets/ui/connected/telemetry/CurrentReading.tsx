import { Show } from 'solid-js';
import { StatusBadge } from '#shared/ui';
import {
  type CurrentProperty,
  evidenceTime,
  evidenceValue,
} from '../../../model/property-evidence';
import { metadataButtonClass } from '../MetadataPanel';
export function CurrentReading(props: {
  readonly snapshot: CurrentProperty;
  readonly inspect: (token: string) => void;
  readonly refresh: () => void;
  readonly live?: boolean;
}) {
  return (
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted">
          Committed reading · generation {props.snapshot.generation} / revision{' '}
          {props.snapshot.revision}
        </p>
        <button
          type="button"
          class={metadataButtonClass}
          onClick={props.refresh}
        >
          Refresh reading
        </button>
      </div>
      <Show
        when={props.snapshot.item}
        fallback={
          <p
            role="status"
            class="rounded-lg border border-dashed border-outline bg-canvas p-4 text-sm"
          >
            No materialized value for this property. Upstream or unresolved
            observations are not established by this empty snapshot.
          </p>
        }
      >
        {(item) => (
          <div class="grid gap-3 rounded-lg border border-outline bg-canvas p-4">
            <p class="break-all font-mono text-2xl font-semibold">
              {evidenceValue(item().change.value)}{' '}
              <span class="text-sm text-muted">
                {item().change.unit ?? 'No canonical unit'}
              </span>
            </p>
            <div class="flex flex-wrap gap-2">
              <StatusBadge
                label={`Quality: ${item().change.quality}`}
                tone={
                  item().change.quality === 'good'
                    ? 'nominal'
                    : item().change.quality === 'invalid'
                      ? 'critical'
                      : 'warning'
                }
              />
              <StatusBadge
                label={`At evaluation: ${item().freshness}`}
                tone={item().freshness === 'fresh' ? 'nominal' : 'warning'}
              />
            </div>
            <p class="text-xs text-muted">
              Event: {evidenceTime(item().change.eventAt)}
            </p>
            <button
              type="button"
              class={metadataButtonClass}
              onClick={() => props.inspect(item().change.interpretation)}
            >
              Inspect reading provenance
            </button>
          </div>
        )}
      </Show>
      <p class="text-xs text-muted">
        Evaluated {evidenceTime(props.snapshot.evaluatedAt)} · fresh for at most
        30 seconds at that evaluation.{' '}
        {props.live
          ? 'Heartbeat evaluations reassess age; source quality is independent.'
          : 'Refresh to reassess age; this is not a live subscription.'}
      </p>
      <p role="status" class="text-xs text-muted">
        {props.snapshot.pending
          ? 'Projection work is pending for this tenant. The reading can lag committed interpretations.'
          : 'No committed projection work was pending at this snapshot. Upstream and unresolved coverage remain separate.'}{' '}
        Processed interpretations: {props.snapshot.processedCount}.
      </p>
    </div>
  );
}
