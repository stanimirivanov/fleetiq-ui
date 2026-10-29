import { createMemo, Show } from 'solid-js';
import type { CommandReceipt } from '../../model/commissioning';
import { MetadataPanel } from '../connected/MetadataPanel';
import { useMetadataReader } from '../connected/MetadataReaderProvider';
import { AssetCreationForm } from './AssetCreationForm';
import { RelationshipCommissioningForm } from './RelationshipCommissioningForm';
export function RegistryCommissioning(props: {
  tenant: string;
  committed: (receipt: CommandReceipt, id: string, effectiveAt: number) => void;
}) {
  const context = useMetadataReader();
  const scope = createMemo(() => ({
    tenant: props.tenant,
    access: context.accessRevision?.(),
  }));
  const allowed = () =>
    context.commissioning &&
    context.actions?.()?.includes('metadata.manage') &&
    context.actions?.()?.includes('metadata.read') &&
    !context.accessBlock?.();
  return (
    <MetadataPanel
      title="Registry commissioning"
      description="Create identities and append temporal facts. Successful commands refresh evidence at their recorded time and selected effective start."
    >
      <Show
        when={allowed()}
        fallback={
          <p class="text-xs text-muted">
            Commissioning requires explicit metadata.read and metadata.manage
            grants for a tenant on the current discovery page. Review remains
            available with read permission alone.
          </p>
        }
      >
        <Show when={scope()} keyed>
          {(s) => (
            <div class="grid min-w-0 gap-4 lg:grid-cols-2">
              <div class="grid content-start gap-3">
                <h3 class="text-sm font-semibold">Create asset</h3>
                <AssetCreationForm
                  tenant={s.tenant}
                  committed={props.committed}
                />
              </div>
              <div class="grid content-start gap-3">
                <h3 class="text-sm font-semibold">
                  Commission directed relationship
                </h3>
                <RelationshipCommissioningForm
                  tenant={s.tenant}
                  committed={props.committed}
                />
              </div>
            </div>
          )}
        </Show>
      </Show>
    </MetadataPanel>
  );
}
