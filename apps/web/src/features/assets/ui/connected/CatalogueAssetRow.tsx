import { A } from '@solidjs/router';
import { Show } from 'solid-js';
import type { AssetSummary } from '../../model/asset-catalogue';
import {
  assetSelectionChanges,
  clearSnapshotSelection,
} from '../../model/metadata-query';
import { metadataButtonClass } from './MetadataPanel';
import type { MetadataWorkspace } from './useMetadataWorkspace';

export function CatalogueAssetRow(props: {
  readonly asset: AssetSummary;
  readonly workspace: MetadataWorkspace;
  readonly selectable: boolean;
}) {
  const href = () =>
    props.workspace.href(`/assets/${encodeURIComponent(props.asset.id)}`, {
      ...clearSnapshotSelection(),
      binding: null,
    });
  const selected = () => props.workspace.query()?.assetId === props.asset.id;
  return (
    <li class="grid gap-2 border-t border-outline p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div class="min-w-0">
        <A
          href={href()}
          aria-label={`Inspect ${props.asset.name}`}
          class="text-sm font-semibold text-accent hover:underline"
        >
          {props.asset.name}
        </A>
        <p class="break-all font-mono text-[11px] text-muted">
          {props.asset.id}
        </p>
        <p class="mt-1 break-all text-xs text-muted">
          {props.asset.assetType.id} · v{props.asset.assetType.version}
        </p>
      </div>
      <Show when={props.selectable}>
        <button
          type="button"
          class={metadataButtonClass}
          aria-label={`${selected() ? 'Selected' : 'Select'} ${props.asset.name}`}
          aria-pressed={selected()}
          onClick={() =>
            props.workspace.update(assetSelectionChanges(props.asset.id))
          }
        >
          {selected() ? 'Selected' : 'Select'}
        </button>
      </Show>
    </li>
  );
}
