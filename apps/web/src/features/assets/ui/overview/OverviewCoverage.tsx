import { createMemo, For } from 'solid-js';
import type { FleetPage } from '../../model/fleet';
import {
  coverageRatio,
  overviewCount,
  pageLocationCoverage,
} from '../../model/fleet-overview';
import { OverviewPanel } from './OverviewPanel';
export function OverviewCoverage(props: { readonly page: FleetPage }) {
  const coverage = createMemo(() => pageLocationCoverage(props.page.assets));
  const ratios = () => [
    {
      label: 'Selected coordinate properties installed',
      part: props.page.summary.mapped,
    },
    {
      label: 'Any projected current property',
      part: props.page.summary.withProperties,
    },
  ];
  return (
    <OverviewPanel
      title="Evidence coverage"
      description="Whole-tenant coverage and the bounded page are separate scopes"
    >
      <div class="grid gap-4">
        <For each={ratios()}>
          {(row) => (
            <div>
              <div class="flex flex-wrap justify-between gap-2 text-xs">
                <span>{row.label}</span>
                <strong>
                  {coverageRatio(row.part, props.page.summary.assets)?.label ??
                    'No assets'}
                </strong>
              </div>
              <div
                class="mt-2 h-1.5 overflow-hidden rounded bg-canvas"
                aria-hidden="true"
              >
                <div
                  class="h-full rounded bg-accent"
                  style={{
                    width: `${coverageRatio(row.part, props.page.summary.assets)?.width ?? 0}%`,
                  }}
                />
              </div>
              <p class="mt-1 text-xs text-muted">
                {overviewCount(row.part)} of{' '}
                {overviewCount(props.page.summary.assets)} assets
              </p>
            </div>
          )}
        </For>
        <p class="text-xs text-muted">
          Categories overlap. A current property is not proof of recent
          reporting or a usable position.
        </p>
        <div class="border-t border-outline pt-3">
          <h3 class="text-xs font-semibold">
            Loaded page · {coverage().loaded} assets
          </h3>
          <dl class="mt-2 grid grid-cols-2 gap-2 text-xs">
            <dt>Observed pairs</dt>
            <dd>{coverage().observed}</dd>
            <dt>Fresh at evaluation</dt>
            <dd>{coverage().fresh}</dd>
            <dt>Stale at evaluation</dt>
            <dd>{coverage().stale}</dd>
            <dt>Future source time</dt>
            <dd>{coverage().future}</dd>
            <dt>Uncertain quality</dt>
            <dd>{coverage().uncertain}</dd>
            <dt>Without usable position</dt>
            <dd>{coverage().unlocated}</dd>
          </dl>
        </div>
        <p class="text-xs text-muted">
          Page coverage is not a fleet-wide total and is unaffected by the
          discovery filter.
        </p>
      </div>
    </OverviewPanel>
  );
}
