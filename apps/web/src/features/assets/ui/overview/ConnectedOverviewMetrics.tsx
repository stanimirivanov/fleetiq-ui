import { For } from 'solid-js';
import type { FleetPage } from '../../model/fleet';
import { overviewCount, overviewMetrics } from '../../model/fleet-overview';
export function ConnectedOverviewMetrics(props: {
  readonly summary: FleetPage['summary'];
}) {
  return (
    <section aria-label="Fleet metrics" class="grid gap-3 sm:grid-cols-2">
      <For each={overviewMetrics(props.summary)}>
        {(metric) => (
          <article
            aria-label={metric.label}
            class="rounded-panel border border-outline border-t-2 border-t-accent/40 bg-surface p-4 shadow-sm"
          >
            <h2 class="text-xs font-medium text-muted">{metric.label}</h2>
            <p class="mt-2 break-all text-2xl font-semibold tabular-nums">
              {overviewCount(metric.value)}
            </p>
            <p class="mt-2 text-xs text-muted">{metric.detail}</p>
          </article>
        )}
      </For>
    </section>
  );
}
