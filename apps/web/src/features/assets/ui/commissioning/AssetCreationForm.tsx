import { createMemo, createSignal } from 'solid-js';
import {
  type AssetDraft,
  type CommandReceipt,
  validAssetDraft,
} from '../../model/commissioning';
import type { DefinitionRef, ExternalIdentifier } from '../../model/metadata';
import { useCommissioningGateway } from '../connected/MetadataReaderProvider';
import { CommandFeedback } from './CommandFeedback';
import { CommandField, CommandForm } from './CommandFields';
import { DefinitionChooser } from './DefinitionChooser';
import { ExternalIdentifierFields } from './ExternalIdentifierFields';
import { useRegistryCommand } from './useRegistryCommand';
export function AssetCreationForm(props: {
  tenant: string;
  committed: (receipt: CommandReceipt, id: string, effectiveAt: number) => void;
}) {
  const context = useCommissioningGateway(),
    [id, setId] = createSignal(''),
    [name, setName] = createSignal(''),
    [type, setType] = createSignal<DefinitionRef>({ id: '', version: 1 }),
    [identifiers, setIdentifiers] = createSignal<readonly ExternalIdentifier[]>(
      [],
    );
  const draft = createMemo<AssetDraft>(() => ({
    id: id(),
    name: name(),
    asset_type: type(),
    external_identifiers: identifiers(),
  }));
  const command = useRegistryCommand(
    (r: AssetDraft, o) => context.register(props.tenant, r, o),
    (receipt, r) => props.committed(receipt, r.id, receipt.recordedAt),
  );
  return (
    <section class="grid gap-3" aria-label="Asset creation">
      <p class="text-xs text-muted">
        Create a tenant-owned identity. Equal complete content is idempotent;
        conflicting existing content is never overwritten.
      </p>
      <CommandForm
        label="Asset registration"
        submit={() => command.submit(draft())}
        valid={validAssetDraft(draft())}
        locked={command.locked()}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <CommandField
            label="New internal asset ID"
            value={id()}
            change={setId}
          />
          <CommandField
            label="New asset display name"
            value={name()}
            maxLength={256}
            change={setName}
          />
        </div>
        <DefinitionChooser
          tenant={props.tenant}
          kind="asset"
          selected={type()}
          select={setType}
        />
        <ExternalIdentifierFields
          values={identifiers()}
          change={setIdentifiers}
        />
      </CommandForm>
      <CommandFeedback
        state={command.state()}
        replay={command.replay}
        prepare={command.prepare}
      />
    </section>
  );
}
