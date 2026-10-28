import { Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import type { FleetAsset } from '../../model/fleet';
import {
  clearSnapshotSelection,
  metadataHref,
} from '../../model/metadata-query';
import { evidenceTime } from '../../model/property-evidence';
import { CoordinateEvidence } from './CoordinateEvidence';
export function ConnectedMapSelection(props: {
  readonly asset: FleetAsset | undefined;
  readonly search: string;
  readonly evaluatedAt: string;
}) {
  return (
    <aside
      class="grid content-start gap-3 rounded-xl border border-outline bg-surface p-4"
      aria-label="Selected location evidence"
    >
      <h2 class="font-semibold">Location evidence</h2>
      <Show
        when={props.asset}
        keyed
        fallback={
          <p class="text-sm text-muted">
            Select an asset in the list or on the map. Unlocated assets remain
            selectable.
          </p>
        }
      >
        {(asset) => (
          <>
            <h3 class="text-lg font-semibold">{asset.name}</h3>
            <p class="break-all text-xs text-muted">{asset.id}</p>
            <Show
              when={
                asset.location.status === 'observed'
                  ? asset.location.point
                  : null
              }
              keyed
              fallback={
                <p class="text-sm text-muted">
                  No usable coordinate pair:{' '}
                  {asset.location.status.replaceAll('_', ' ')}. No last-good
                  position is substituted.
                </p>
              }
            >
              {(point) => (
                <CoordinateEvidence
                  point={point}
                  assetId={asset.id}
                  search={props.search}
                  evaluatedAt={props.evaluatedAt}
                />
              )}
            </Show>
            <TextLink
              href={metadataHref(
                `/assets/${encodeURIComponent(asset.id)}`,
                props.search,
                {
                  ...clearSnapshotSelection(),
                  ...reviewCutoffs(props.evaluatedAt),
                  asset: null,
                },
              )}
            >
              Open asset inspector
            </TextLink>
          </>
        )}
      </Show>
      <p class="text-xs text-muted">
        Snapshot evaluated {evidenceTime(props.evaluatedAt)}. Freshness is not a
        connectivity or health claim.
      </p>
    </aside>
  );
}
/** Metadata's current safe-integer review boundary remains separate from exact telemetry time. */
function reviewCutoffs(value: string): Record<string, string> {
  return Number.isSafeInteger(Number(value))
    ? { effective_at_ms: value, known_at_ms: value }
    : {};
}
