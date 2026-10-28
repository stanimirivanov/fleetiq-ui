import { createMemo, Show } from 'solid-js';
import { isValidAssetIdentifier } from '../../model/asset-catalogue';
import type { AssetRequest } from '../../model/metadata';
import { AssetIdentityEvidence } from './AssetIdentityEvidence';
import { ConnectedInspectorHeader } from './ConnectedInspectorHeader';
import { MetadataContextControls } from './MetadataContextControls';
import { MetadataReadContent } from './MetadataReadContent';
import { RelationshipEvidence } from './RelationshipEvidence';
import { SourceBindingEvidence } from './SourceBindingEvidence';
import { TargetBindingEvidence } from './TargetBindingEvidence';
import { InspectorTelemetry } from './telemetry/InspectorTelemetry';
import { UnavailableOperations } from './UnavailableOperations';
import { useMetadataRead } from './useMetadataRead';
import { useMetadataWorkspace } from './useMetadataWorkspace';

/** Identity gates this inspector; snapshot errors remain independent and explicit. */
export function ConnectedInspectorView(props: { readonly assetId: string }) {
  const workspace = useMetadataWorkspace();
  const request = createMemo<AssetRequest | null>(() => {
    const query = workspace.query();
    return query && isValidAssetIdentifier(props.assetId)
      ? { tenantId: query.tenantId, assetId: props.assetId }
      : null;
  });
  const read = useMetadataRead(request, (reader, query, options) =>
    reader.getAsset(query, options),
  );
  const name = () => {
    const state = read.state();
    return state.kind === 'ready' ? state.value.name : 'Asset inspector';
  };
  const path = () => `/assets/${encodeURIComponent(props.assetId)}`;
  return (
    <div class="grid min-w-0 gap-4">
      <ConnectedInspectorHeader
        name={name()}
        assetId={props.assetId}
        workspace={workspace}
      />
      <MetadataContextControls workspace={workspace} />
      <Show
        when={isValidAssetIdentifier(props.assetId)}
        fallback={
          <p role="alert" class="text-sm text-status-critical">
            The asset identifier is invalid. No metadata requests have been
            sent.
          </p>
        }
      >
        <MetadataReadContent
          state={read.state()}
          label="asset identity"
          retry={read.retry}
        >
          {(asset) => (
            <>
              <div class="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.5fr)_minmax(16rem,1fr)]">
                <RelationshipEvidence
                  workspace={workspace}
                  assetId={asset.id}
                  path={path()}
                />
                <div class="grid min-w-0 gap-4">
                  <InspectorTelemetry asset={asset} workspace={workspace} />
                  <AssetIdentityEvidence asset={asset} />
                </div>
                <div class="grid gap-4">
                  <TargetBindingEvidence
                    workspace={workspace}
                    assetId={asset.id}
                    path={path()}
                  />
                  <SourceBindingEvidence workspace={workspace} path={path()} />
                </div>
              </div>
              <UnavailableOperations />
            </>
          )}
        </MetadataReadContent>
      </Show>
    </div>
  );
}
