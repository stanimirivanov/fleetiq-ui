import { createSignal, Show } from 'solid-js';
import { clearSnapshotSelection } from '../../model/metadata-query';
import { RegistryCommissioning } from '../commissioning/RegistryCommissioning';
import { RegistryEvidence } from './RegistryEvidence';
import { useMetadataWorkspace } from './useMetadataWorkspace';

/** Commissioning stays mounted while acknowledged commands remount authoritative review reads. */
export function ConnectedRegistryView() {
  const workspace = useMetadataWorkspace(),
    [revision, setRevision] = createSignal(1);
  return (
    <div class="grid min-w-0 gap-4">
      <Show when={workspace.query()?.tenantId}>
        {(tenant) => (
          <RegistryCommissioning
            tenant={tenant()}
            bindingCommitted={(receipt, draft) => {
              workspace.update({
                ...clearSnapshotSelection(),
                after: null,
                q: null,
                type: null,
                asset: draft.target.asset_id,
                binding: receipt.id ?? null,
                binding_revision: receipt.revision ?? null,
                device_asset_id: draft.source.device_asset_id,
                endpoint_id: draft.source.endpoint_id,
                signal_id: draft.source.signal_id,
                effective_at_ms: String(draft.effective_interval.start_ms),
                known_at_ms: String(receipt.recordedAt),
              });
              setRevision((v) => v + 1);
            }}
            committed={(receipt, id, effectiveAt) => {
              workspace.update({
                ...clearSnapshotSelection(),
                after: null,
                q: null,
                type: null,
                asset: id,
                effective_at_ms: String(effectiveAt),
                known_at_ms: String(receipt.recordedAt),
              });
              setRevision((v) => v + 1);
            }}
          />
        )}
      </Show>
      <Show when={revision()} keyed>
        {(_revision) => <RegistryEvidence workspace={workspace} />}
      </Show>
    </div>
  );
}
