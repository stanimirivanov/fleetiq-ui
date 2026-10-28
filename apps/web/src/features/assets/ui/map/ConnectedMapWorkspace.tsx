import { createMemo, createSignal, Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import { type FleetPage, filterFleet } from '../../model/fleet';
import type { FleetQuery } from '../../model/fleet-query';
import { ConnectedMapList } from './ConnectedMapList';
import { ConnectedMapSelection } from './ConnectedMapSelection';
import { GeodeticCanvas } from './GeodeticCanvas';
export function ConnectedMapWorkspace(props: {
  readonly page: FleetPage;
  readonly query: Extract<FleetQuery, { kind: 'ready' }>;
  readonly search: string;
  readonly change: (values: Record<string, string | null>) => void;
  readonly refresh: () => void;
}) {
  const [pane, setPane] = createSignal<'list' | 'map'>('map');
  const rows = createMemo(() =>
    filterFleet(props.page.assets, props.query.q, props.query.state),
  );
  const selected = createMemo(() =>
    rows().find((a) => a.id === props.query.selected),
  );
  return (
    <>
      <section
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline bg-surface p-4"
        aria-label="Fleet snapshot summary"
      >
        <div>
          <h2 class="text-sm font-semibold">
            {props.page.summary.assets} assets · {props.page.summary.mapped}{' '}
            mapped · {props.page.summary.devices} communication devices
          </h2>
          <p class="text-xs text-muted">
            Whole-tenant counts · categories overlap · generation{' '}
            {props.page.generation}, revision {props.page.revision}
            {props.page.pending ? ' · work pending' : ''}
          </p>
        </div>
        <button
          type="button"
          class="rounded border border-outline px-3 py-2 text-sm"
          onClick={props.refresh}
        >
          Refresh snapshot
        </button>
      </section>
      <Show when={!props.page.mappingSupported}>
        <p role="status">
          The selected property mapping is incompatible. No observed points can
          be shown.
        </p>
      </Show>
      <div class="flex gap-2 lg:hidden">
        <button
          type="button"
          aria-pressed={pane() === 'list'}
          onClick={() => setPane('list')}
        >
          Asset list
        </button>
        <button
          type="button"
          aria-pressed={pane() === 'map'}
          onClick={() => setPane('map')}
        >
          Geographic map
        </button>
      </div>
      <div class="grid min-w-0 gap-4 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)] xl:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)_minmax(17rem,0.9fr)]">
        <div classList={{ 'hidden lg:block': pane() !== 'list' }}>
          <ConnectedMapList
            rows={rows()}
            selected={selected()?.id ?? null}
            select={(id) => props.change({ asset: id })}
            q={props.query.q}
            state={props.query.state}
            filter={(q, state) =>
              props.change({
                map_q: q || null,
                map_state: state === 'all' ? null : state,
              })
            }
          />
          <div class="mt-4 flex gap-3 text-sm">
            <Show when={props.query.request?.after}>
              <button
                type="button"
                onClick={() => props.change({ fleet_after: null, asset: null })}
              >
                First page
              </button>
            </Show>
            <Show when={props.page.nextAfter}>
              {(next) => (
                <button
                  type="button"
                  onClick={() =>
                    props.change({ fleet_after: next(), asset: null })
                  }
                >
                  Next page
                </button>
              )}
            </Show>
          </div>
        </div>
        <div classList={{ 'hidden lg:block': pane() !== 'map' }}>
          <GeodeticCanvas
            assets={rows()}
            selected={selected()?.id ?? null}
            select={(id) => props.change({ asset: id })}
          />
        </div>
        <ConnectedMapSelection
          asset={selected()}
          search={props.search}
          evaluatedAt={props.page.evaluatedAt}
        />
      </div>
      <Show when={props.query.selected && !selected()}>
        <p role="status" class="text-sm text-muted">
          The selected asset is outside this page or filter. Clear the filter or
          select a loaded asset.
        </p>
      </Show>
      <TextLink href="/assets">Browse asset catalogue</TextLink>
    </>
  );
}
