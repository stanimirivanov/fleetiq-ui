import { Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { StatusBadge } from '#shared/ui';
import { metadataButtonClass } from '../MetadataPanel';
import { CurrentReading } from './CurrentReading';
import type { usePropertyLive } from './usePropertyLive';
export function LiveReading(props: {
  readonly live: ReturnType<typeof usePropertyLive>;
  readonly inspect: (token: string) => void;
}) {
  const state = () => props.live.state();
  return (
    <section aria-label="Live property delivery" class="grid gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={`Delivery: ${state()?.kind ?? 'paused'}`}
          tone={state()?.kind === 'live' ? 'nominal' : 'unknown'}
        />
        <Show
          when={props.live.enabled()}
          fallback={
            <button
              type="button"
              class={metadataButtonClass}
              onClick={props.live.start}
            >
              Start live updates
            </button>
          }
        >
          <button
            type="button"
            class={metadataButtonClass}
            onClick={props.live.stop}
          >
            Stop live updates
          </button>
        </Show>
        <Show when={props.live.enabled() && state()?.kind === 'stopped'}>
          <button
            type="button"
            class={metadataButtonClass}
            onClick={props.live.start}
          >
            Retry live updates
          </button>
        </Show>
      </div>
      <p class="text-xs text-muted">
        Latest committed state; updates can coalesce. History retains
        intermediate interpretations. Delivery does not establish asset health
        or device connectivity.
      </p>
      <Show when={state()?.failure}>
        {(failure) => (
          <p role="alert" class="text-xs text-status-critical">
            {new RequestFailure(failure()).message}. Automatic recovery stopped;
            review access or retry explicitly.
          </p>
        )}
      </Show>
      <Show when={state()?.kind === 'resnapshot'}>
        <p role="status" class="text-xs text-muted">
          Continuity changed. Discarding the old baseline and requesting a fresh
          snapshot.
        </p>
      </Show>
      <Show when={state()?.snapshot}>
        {(snapshot) => (
          <CurrentReading
            snapshot={snapshot()}
            inspect={props.inspect}
            refresh={props.live.start}
            live
          />
        )}
      </Show>
    </section>
  );
}
