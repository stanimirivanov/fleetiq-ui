import { A } from '@solidjs/router';
import { createMemo, Show } from 'solid-js';
import type { AssetRequest } from '../../model/metadata';
import { BindingLineageReview } from '../bindings/BindingLineageReview';
import { AssetIdentityEvidence } from './AssetIdentityEvidence';
import { ConnectedAssetCatalogue } from './ConnectedAssetCatalogue';
import { MetadataContextControls } from './MetadataContextControls';
import { MetadataPanel } from './MetadataPanel';
import { MetadataReadContent } from './MetadataReadContent';
import { RelationshipEvidence } from './RelationshipEvidence';
import { SourceBindingEvidence } from './SourceBindingEvidence';
import { TargetBindingEvidence } from './TargetBindingEvidence';
import { useMetadataRead } from './useMetadataRead';
import type { MetadataWorkspace } from './useMetadataWorkspace';

/** Three-zone read-only review: paged identities, directed structure, binding evidence. */
export function RegistryEvidence(props: { workspace: MetadataWorkspace }) {
  const workspace = props.workspace;
  const request = createMemo<AssetRequest | null>(() => {
    const query = workspace.query();
    return query?.assetId
      ? { tenantId: query.tenantId, assetId: query.assetId }
      : null;
  });
  const identity = useMetadataRead(request, (reader, query, options) =>
    reader.getAsset(query, options),
  );
  const selectedAsset = createMemo(() => {
    const state = identity.state();
    return state.kind === 'ready' ? state.value : undefined;
  });
  const path = '/assets/registry/review';
  return (
    <div class="grid min-w-0 gap-4">
      <MetadataContextControls workspace={workspace} />
      <div class="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.7fr)] xl:grid-cols-[minmax(14rem,0.8fr)_minmax(15rem,0.95fr)_minmax(0,1.9fr)]">
        <ConnectedAssetCatalogue workspace={workspace} selectable />
        <div class="grid min-w-0 gap-4">
          <MetadataPanel
            title="Selected asset"
            description="Select an identity from the current page, or retain an explicit asset ID in the URL."
          >
            <MetadataReadContent
              state={identity.state()}
              label="selected asset"
              retry={identity.retry}
            >
              {(asset) => (
                <div class="grid gap-2 text-xs">
                  <p class="text-sm font-semibold">{asset.name}</p>
                  <p class="break-all font-mono text-muted">{asset.id}</p>
                  <A
                    class="text-accent hover:underline"
                    href={workspace.href(
                      `/assets/${encodeURIComponent(asset.id)}`,
                    )}
                  >
                    Inspect {asset.name}
                  </A>
                </div>
              )}
            </MetadataReadContent>
          </MetadataPanel>
          <Show when={selectedAsset()}>
            {(asset) => (
              <>
                <RelationshipEvidence
                  workspace={workspace}
                  assetId={asset().id}
                  path={path}
                />
                <AssetIdentityEvidence asset={asset()} />
              </>
            )}
          </Show>
        </div>
        <div class="grid min-w-0 gap-4">
          <MetadataPanel
            title="Signal binding evidence"
            description="Pinned metadata and exact-source candidates are reviewed at the same cutoffs. Authoring appends metadata; it does not rewrite committed readings."
          >
            <p class="text-xs leading-5 text-muted">
              Select an asset to review target bindings, then choose an exact
              source to inspect candidate revisions and the pinned property
              definition.
            </p>
          </MetadataPanel>
          <Show when={identity.state().kind === 'ready'}>
            <TargetBindingEvidence
              workspace={workspace}
              assetId={workspace.query()?.assetId}
              path={path}
            />
          </Show>
          <SourceBindingEvidence workspace={workspace} path={path} />
          <BindingLineageReview workspace={workspace} />
        </div>
      </div>
    </div>
  );
}
