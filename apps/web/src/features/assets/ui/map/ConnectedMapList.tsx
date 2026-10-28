import { For, Show } from 'solid-js';
import type { FleetAsset } from '../../model/fleet';
export function ConnectedMapList(props: {
  readonly rows: readonly FleetAsset[];
  readonly selected: string | null;
  readonly select: (id: string) => void;
  readonly q: string;
  readonly state: string;
  readonly filter: (q: string, state: string) => void;
}) {
  return (
    <section class="grid content-start gap-3" aria-label="Loaded fleet page">
      <label class="grid gap-1 text-sm">
        Filter loaded page
        <input
          type="search"
          class="rounded border border-outline bg-surface p-2"
          value={props.q}
          onInput={(e) => props.filter(e.currentTarget.value, props.state)}
        />
      </label>
      <label class="grid gap-1 text-sm">
        Position coverage
        <select
          class="rounded border border-outline bg-surface p-2"
          value={props.state}
          onChange={(e) => props.filter(props.q, e.currentTarget.value)}
        >
          <option value="all">All loaded assets</option>
          <option value="located">Observed positions</option>
          <option value="unlocated">Without a usable position</option>
        </select>
      </label>
      <p class="text-xs text-muted">
        {props.rows.length} matching assets on this page
      </p>
      <ul class="grid max-h-[30rem] gap-2 overflow-y-auto">
        <For each={props.rows}>
          {(a) => (
            <li>
              <button
                type="button"
                aria-pressed={props.selected === a.id}
                class="grid w-full gap-1 rounded-lg border border-outline bg-surface p-3 text-left aria-pressed:border-accent"
                onClick={() => props.select(a.id)}
              >
                <span class="font-semibold">{a.name}</span>
                <span class="text-xs text-muted">
                  {a.id} · {a.type.id}
                </span>
                <span class="text-xs">
                  {a.location.status === 'observed'
                    ? `${a.location.point.freshness} · ${a.location.point.quality}`
                    : a.location.status.replaceAll('_', ' ')}
                </span>
              </button>
            </li>
          )}
        </For>
      </ul>
      <Show when={!props.rows.length}>
        <p class="text-sm text-muted">
          No assets match this loaded-page filter.
        </p>
      </Show>
    </section>
  );
}
