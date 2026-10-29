import { createMemo, createSignal, Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import type { FleetAsset } from '../../model/fleet';
import { fleetWorkspaceHref } from '../../model/fleet-query';
import { GeodeticCanvas } from '../map/GeodeticCanvas';
import { OverviewPanel } from './OverviewPanel';
export function OverviewLocationContext(props: {
  readonly assets: readonly FleetAsset[];
  readonly selected: string | null;
  readonly search: string;
  readonly select: (id: string) => void;
}) {
  const [enabled, setEnabled] = createSignal(false);
  const selected = createMemo(() =>
    props.assets.find((a) => a.id === props.selected),
  );
  return (
    <OverviewPanel
      title="Fleet location context"
      description="Matching loaded assets · observed coordinates only"
      action={
        <TextLink href={fleetWorkspaceHref('/map', props.search)}>
          Open map workbench
        </TextLink>
      }
    >
      <div class="grid gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-muted">
            {props.assets.length} matching loaded assets. The geographic preview
            loads on demand.
          </p>
          <button
            class="fi-action-button"
            type="button"
            onClick={() => setEnabled((v) => !v)}
          >
            {enabled() ? 'Close geographic preview' : 'Load geographic preview'}
          </button>
        </div>
        <Show
          when={enabled()}
          fallback={
            <div class="grid min-h-48 place-content-center rounded-lg border border-dashed border-outline bg-canvas p-5 text-center">
              <p class="text-sm font-semibold">Geographic preview is off</p>
              <p class="mt-2 text-xs text-muted">
                Review evidence below or open the full map workbench.
              </p>
            </div>
          }
        >
          <GeodeticCanvas
            assets={props.assets}
            selected={selected()?.id ?? null}
            select={props.select}
            compact
          />
        </Show>
        <Show
          when={selected()}
          keyed
          fallback={
            <p class="text-sm text-muted">
              Select an asset in discovery to review its location context.
            </p>
          }
        >
          {(asset) => (
            <div class="rounded border border-outline p-3">
              <h3 class="text-sm font-semibold">{asset.name}</h3>
              <p class="mt-1 break-all text-xs text-muted">
                {asset.location.status === 'observed'
                  ? `${asset.location.point.latitude}, ${asset.location.point.longitude} · ${asset.location.point.freshness} · ${asset.location.point.quality}`
                  : `No usable position: ${asset.location.status.replaceAll('_', ' ')}`}
              </p>
              <TextLink href={fleetWorkspaceHref('/map', props.search)}>
                Review coordinate provenance in map workbench
              </TextLink>
            </div>
          )}
        </Show>
      </div>
    </OverviewPanel>
  );
}
