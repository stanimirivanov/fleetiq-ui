import { createMemo, createSignal } from 'solid-js';
import {
  type CommandReceipt,
  exactMillis,
  type RelationshipDraft,
  validRelationship,
} from '../../model/commissioning';
import type { DefinitionRef } from '../../model/metadata';
import { useCommissioningGateway } from '../connected/MetadataReaderProvider';
import { CommandFeedback } from './CommandFeedback';
import { CommandField, CommandForm } from './CommandFields';
import { DefinitionChooser } from './DefinitionChooser';
import { useRegistryCommand } from './useRegistryCommand';
export function RelationshipCommissioningForm(props: {
  tenant: string;
  committed: (receipt: CommandReceipt, id: string, effectiveAt: number) => void;
}) {
  const context = useCommissioningGateway(),
    [id, setId] = createSignal(''),
    [revision, setRevision] = createSignal('1'),
    [source, setSource] = createSignal(''),
    [target, setTarget] = createSignal(''),
    [start, setStart] = createSignal(''),
    [end, setEnd] = createSignal(''),
    [type, setType] = createSignal<DefinitionRef>({ id: '', version: 1 });
  const draft = createMemo<RelationshipDraft>(() => ({
    relationship_type: type(),
    source_asset_id: source(),
    target_asset_id: target(),
    effective_interval: {
      start_ms: exactMillis(start()) ?? Number.NaN,
      end_ms: end() === '' ? null : (exactMillis(end()) ?? Number.NaN),
    },
  }));
  const command = useRegistryCommand(
    (r: { id: string; revision: string; draft: RelationshipDraft }, o) =>
      context.append(props.tenant, r.id, r.revision, r.draft, o),
    (receipt, r) =>
      props.committed(
        receipt,
        r.draft.source_asset_id,
        r.draft.effective_interval.start_ms,
      ),
  );
  return (
    <section class="grid gap-3" aria-label="Relationship commissioning">
      <p class="text-xs text-muted">
        Revision 1 creates a lineage. A correction must name the exact successor
        of its authoritative head; historical review is not proof of the latest
        head. No revision is inferred or incremented automatically.
      </p>
      <CommandForm
        label="Relationship revision"
        submit={() =>
          command.submit({ id: id(), revision: revision(), draft: draft() })
        }
        valid={validRelationship(id(), revision(), draft())}
        locked={command.locked()}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <CommandField label="Relationship ID" value={id()} change={setId} />
          <CommandField
            label="Exact revision (decimal u64)"
            value={revision()}
            change={setRevision}
          />
        </div>
        <DefinitionChooser
          tenant={props.tenant}
          kind="relationship"
          selected={type()}
          select={setType}
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <CommandField
            label="Source asset ID"
            value={source()}
            change={setSource}
          />
          <CommandField
            label="Target asset ID"
            value={target()}
            change={setTarget}
          />
          <CommandField
            label="Effective start (Unix ms, inclusive)"
            value={start()}
            change={setStart}
          />
          <CommandField
            label="Effective end (Unix ms, exclusive; blank is open)"
            required={false}
            value={end()}
            change={setEnd}
          />
        </div>
        <p class="text-xs text-muted">
          Source → target, within this tenant. Effective time is physical time;
          the server supplies actor and recorded time. Integer milliseconds must
          fit JavaScript's exact integer range.
        </p>
      </CommandForm>
      <CommandFeedback
        state={command.state()}
        replay={command.replay}
        prepare={command.prepare}
      />
    </section>
  );
}
