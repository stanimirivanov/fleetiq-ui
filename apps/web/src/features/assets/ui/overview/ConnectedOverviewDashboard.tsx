import { createMemo, Show } from 'solid-js';
import type { FleetPage } from '../../model/fleet';
import { filterFleet } from '../../model/fleet';
import type { FleetQuery } from '../../model/fleet-query';
import { ConnectedOverviewMetrics } from './ConnectedOverviewMetrics';
import { OverviewAssetDiscovery } from './OverviewAssetDiscovery';
import { OverviewCoverage } from './OverviewCoverage';
import { OverviewLocationContext } from './OverviewLocationContext';
import { OverviewPlannedOperations } from './OverviewPlannedOperations';
import { OverviewSnapshotStatus } from './OverviewSnapshotStatus';
export function ConnectedOverviewDashboard(props: {
  readonly page: FleetPage;
  readonly query: Extract<FleetQuery, { kind: 'ready' }>;
  readonly search: string;
  readonly change: (values: Record<string, string | null>) => void;
  readonly refresh: () => void;
}) {
  const rows = createMemo(() =>
    filterFleet(props.page.assets, props.query.q, props.query.state),
  );
  return (
    <>
      <OverviewSnapshotStatus page={props.page} refresh={props.refresh} />
      <Show when={!props.page.mappingSupported}>
        <p role="status">
          The coordinate mapping is incompatible. Inventory counts remain
          available; observed location pairs are unavailable.
        </p>
      </Show>
      <Show when={!props.page.assets.length}>
        <p role="status">
          {props.query.request?.after
            ? 'No assets remain after this cursor. Return to the first page.'
            : 'This tenant has no registered assets in this snapshot.'}
        </p>
      </Show>
      <div class="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
        <div class="grid min-w-0 content-start gap-3">
          <ConnectedOverviewMetrics summary={props.page.summary} />
          <OverviewLocationContext
            assets={rows()}
            selected={props.query.selected}
            search={props.search}
            select={(id) => props.change({ asset: id })}
          />
          <OverviewAssetDiscovery
            assets={rows()}
            selected={props.query.selected}
            search={props.search}
            evaluatedAt={props.page.evaluatedAt}
            q={props.query.q}
            state={props.query.state}
            next={props.page.nextAfter}
            after={props.query.request?.after}
            change={props.change}
          />
        </div>
        <div class="grid min-w-0 content-start gap-3">
          <OverviewCoverage page={props.page} />
          <OverviewPlannedOperations />
        </div>
      </div>
      <Show
        when={
          props.query.selected &&
          !rows().some((a) => a.id === props.query.selected)
        }
      >
        <p role="status" class="text-sm text-muted">
          The selected asset is outside the loaded page or filter.
        </p>
      </Show>
    </>
  );
}
