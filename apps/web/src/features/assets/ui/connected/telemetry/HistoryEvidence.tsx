import { createMemo, createUniqueId, For, Show } from 'solid-js';
import { evidenceChart } from '../../../model/evidence-chart';
import {
  evidenceTime,
  evidenceValue,
  type PropertyHistory,
} from '../../../model/property-evidence';
import { metadataButtonClass } from '../MetadataPanel';
/** The exact table is authoritative; drawing normalizes only bounded pixel coordinates. */
export function HistoryEvidence(props: {
  readonly page: PropertyHistory;
  readonly after?: string;
  readonly inspect: (token: string) => void;
  readonly pageTo: (token: string | null) => void;
  readonly refresh: () => void;
}) {
  const chart = createMemo(() => evidenceChart(props.page.changes)),
    title = createUniqueId();
  return (
    <div class="grid min-w-0 gap-3">
      <p class="text-xs text-muted">
        Stored interpretations, ascending event time. Late appends behind a
        cursor require restarting the window. Current state and separate pages
        do not share one database snapshot.
      </p>
      <Show
        when={chart()}
        fallback={
          <p class="text-xs text-muted">
            Exact table shown. A chart requires at least two numeric readings
            within the supported drawing scale.
          </p>
        }
      >
        {(points) => (
          <svg
            viewBox="0 0 1000 200"
            role="img"
            aria-labelledby={title}
            class="h-36 w-full rounded-lg border border-outline bg-canvas"
          >
            <title id={title}>
              Event-time values on this history page; exact values and quality
              appear in the table
            </title>
            <polyline
              points={points()}
              fill="none"
              stroke="currentColor"
              class="text-accent"
              stroke-width="3"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        )}
      </Show>
      <Show
        when={props.page.changes.length}
        fallback={
          <p role="status" class="text-sm text-muted">
            {props.after
              ? 'This continuation page contains no stored interpretations. Restart from the first page to review the window; this is not an empty-window claim.'
              : 'No stored interpretations in this window. This does not establish complete upstream or unresolved coverage.'}
          </p>
        }
      >
        <div class="min-w-0 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <caption class="sr-only">
              Exact historical values, quality and provenance
            </caption>
            <thead>
              <tr>
                <th scope="col" class="p-2">
                  Event time
                </th>
                <th scope="col" class="p-2">
                  Exact value / quality
                </th>
                <th scope="col" class="p-2">
                  Evidence
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={props.page.changes}>
                {(change, index) => (
                  <tr class="border-t border-outline">
                    <td class="p-2 align-top">
                      <span class="block">{evidenceTime(change.eventAt)}</span>
                      <code>{change.eventAt} ms</code>
                    </td>
                    <td class="break-all p-2 align-top">
                      <code>{evidenceValue(change.value)}</code>
                      <span class="block text-muted">
                        {change.unit ?? 'No canonical unit'} · {change.quality}
                      </span>
                    </td>
                    <td class="p-2 align-top">
                      <button
                        type="button"
                        class={metadataButtonClass}
                        aria-label={`Inspect history interpretation ${index() + 1}`}
                        onClick={() => props.inspect(change.interpretation)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={metadataButtonClass}
          disabled={!props.after}
          onClick={() => props.pageTo(null)}
        >
          First history page
        </button>
        <button
          type="button"
          class={metadataButtonClass}
          disabled={!props.page.nextAfter}
          onClick={() => props.pageTo(props.page.nextAfter)}
        >
          Next history page
        </button>
        <button
          type="button"
          class={metadataButtonClass}
          onClick={props.refresh}
        >
          Refresh history page
        </button>
      </div>
      <p class="text-xs text-muted">
        Chart lines are visual guides between stored events, including
        invalid/uncertain values; they do not imply measurements between events.
      </p>
    </div>
  );
}
