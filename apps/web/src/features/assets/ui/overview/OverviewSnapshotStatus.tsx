import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { StatusBadge } from '#shared/ui';
import type { FleetPage } from '../../model/fleet';
import { overviewAge } from '../../model/fleet-overview';
import { evidenceTime } from '../../model/property-evidence';
export function OverviewSnapshotStatus(props: {
  readonly page: FleetPage;
  readonly refresh: () => void;
}) {
  const [now, setNow] = createSignal(Date.now());
  const age = createMemo(() => overviewAge(props.page.evaluatedAt, now()));
  onMount(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    onCleanup(() => clearInterval(timer));
  });
  return (
    <section
      aria-label="Overview snapshot status"
      class="grid gap-3 rounded-panel border border-outline bg-surface p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={
              props.page.pending
                ? 'Projection catching up'
                : 'No pending work at evaluation'
            }
            tone={props.page.pending ? 'warning' : 'unknown'}
          />
          <Show when={props.page.generation === '0'}>
            <StatusBadge label="Projection not initialized" tone="unknown" />
          </Show>
          <Show when={age() !== 'recent'}>
            <StatusBadge
              label={
                age() === 'aged'
                  ? 'Snapshot ageing'
                  : age() === 'clock-ahead'
                    ? 'Browser/server clock differs'
                    : 'Snapshot age unavailable'
              }
              tone="warning"
            />
          </Show>
        </div>
        <button type="button" class="fi-action-button" onClick={props.refresh}>
          Refresh overview
        </button>
      </div>
      <p class="text-xs text-muted">
        Evaluated {evidenceTime(props.page.evaluatedAt)} · generation{' '}
        {props.page.generation}, revision {props.page.revision}. Snapshot age
        uses this browser's clock; source freshness stays evaluated at the
        server snapshot.
      </p>
      <Show when={props.page.pending}>
        <p role="status" class="text-sm">
          Processing is pending. Current-property and location coverage may be
          incomplete; inventory counts are not online or health measurements.
        </p>
      </Show>
    </section>
  );
}
