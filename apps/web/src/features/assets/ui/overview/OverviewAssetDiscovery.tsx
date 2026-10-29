import { Show } from 'solid-js';
import type { FleetAsset } from '../../model/fleet';
import {
  clearSnapshotSelection,
  metadataHref,
} from '../../model/metadata-query';
import { OverviewAssetTable } from './OverviewAssetTable';
import { OverviewPanel } from './OverviewPanel';
export function OverviewAssetDiscovery(props: {
  readonly assets: readonly FleetAsset[];
  readonly selected: string | null;
  readonly search: string;
  readonly evaluatedAt: string;
  readonly q: string;
  readonly state: string;
  readonly next: string | null;
  readonly after?: string;
  readonly change: (values: Record<string, string | null>) => void;
}) {
  const inspect = (id: string) =>
    metadataHref(`/assets/${encodeURIComponent(id)}`, props.search, {
      ...clearSnapshotSelection(),
      asset: null,
      ...(Number.isSafeInteger(Number(props.evaluatedAt))
        ? { effective_at_ms: props.evaluatedAt, known_at_ms: props.evaluatedAt }
        : {}),
    });
  return (
    <OverviewPanel
      title="Asset discovery"
      description="One bounded inventory page · filters apply only to loaded rows"
    >
      <div class="grid gap-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-xs">
            Filter loaded assets
            <input
              type="search"
              class="rounded border border-outline bg-canvas p-2"
              value={props.q}
              onInput={(e) =>
                props.change({ map_q: e.currentTarget.value || null })
              }
            />
          </label>
          <label class="grid gap-1 text-xs">
            Location evidence
            <select
              class="rounded border border-outline bg-canvas p-2"
              value={props.state}
              onChange={(e) =>
                props.change({
                  map_state:
                    e.currentTarget.value === 'all'
                      ? null
                      : e.currentTarget.value,
                })
              }
            >
              <option value="all">All loaded assets</option>
              <option value="located">Observed positions</option>
              <option value="unlocated">Without usable position</option>
            </select>
          </label>
        </div>
        <OverviewAssetTable
          assets={props.assets}
          selected={props.selected}
          select={(id) => props.change({ asset: id })}
          inspect={inspect}
        />
        <Show when={!props.assets.length}>
          <p role="status" class="text-sm text-muted">
            {props.q || props.state !== 'all'
              ? 'No loaded assets match this filter.'
              : 'This loaded page contains no assets.'}
          </p>
        </Show>
        <nav
          aria-label="Overview asset pages"
          class="flex flex-wrap gap-3 text-sm"
        >
          <Show when={props.after}>
            <button
              type="button"
              class="fi-action-button"
              onClick={() => props.change({ fleet_after: null, asset: null })}
            >
              First asset page
            </button>
          </Show>
          <Show when={props.next}>
            {(next) => (
              <button
                type="button"
                class="fi-action-button"
                onClick={() =>
                  props.change({ fleet_after: next(), asset: null })
                }
              >
                Next asset page
              </button>
            )}
          </Show>
        </nav>
      </div>
    </OverviewPanel>
  );
}
