import { createMemo, createSignal } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { type BindingDraft, validBinding } from '../../model/binding-authoring';
import { type CommandReceipt, exactMillis } from '../../model/commissioning';
import { CommandFeedback } from '../commissioning/CommandFeedback';
import { CommandField, CommandForm } from '../commissioning/CommandFields';
import { useRegistryCommand } from '../commissioning/useRegistryCommand';
import { useMetadataReader } from '../connected/MetadataReaderProvider';
import { BindingSourceFields } from './BindingSourceFields';
import { BindingTargetFields } from './BindingTargetFields';
import { useBindingSource } from './useBindingSource';
import { useBindingTarget } from './useBindingTarget';
export function BindingAuthoring(props: {
  tenant: string;
  committed: (receipt: CommandReceipt, draft: BindingDraft) => void;
}) {
  const context = useMetadataReader(),
    source = useBindingSource(() => props.tenant),
    target = useBindingTarget(() => props.tenant),
    [id, setId] = createSignal(''),
    [revision, setRevision] = createSignal('1'),
    [start, setStart] = createSignal(''),
    [end, setEnd] = createSignal('');
  const draft = createMemo<BindingDraft>(() => ({
    source: source.value(),
    target: target.value(),
    effective_interval: {
      start_ms: exactMillis(start()) ?? Number.NaN,
      end_ms: end() === '' ? null : (exactMillis(end()) ?? Number.NaN),
    },
  }));
  const command = useRegistryCommand(
    (r: { id: string; revision: string; draft: BindingDraft }, o) =>
      context.bindings?.append(props.tenant, r.id, r.revision, r.draft, o) ??
      Promise.reject(new RequestFailure('unavailable')),
    (receipt, r) => props.committed(receipt, r.draft),
  );
  return (
    <section aria-label="Signal binding authoring" class="grid gap-3">
      <h3 class="text-sm font-semibold">
        Author source-to-property attribution
      </h3>
      <p class="text-xs text-muted">
        Revision 1 creates a lineage; explicitly name the authoritative
        successor to correct it. Binding changes do not reprocess observations
        or rewrite previously committed readings.
      </p>
      <CommandForm
        label="Signal binding revision"
        submit={() =>
          command.submit({ id: id(), revision: revision(), draft: draft() })
        }
        valid={
          source.valid() &&
          target.valid() &&
          validBinding(id(), revision(), draft())
        }
        locked={command.locked()}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <CommandField label="Binding ID" value={id()} change={setId} />
          <CommandField
            label="Exact binding revision (decimal u64)"
            value={revision()}
            change={setRevision}
          />
        </div>
        <div class="grid min-w-0 gap-4 lg:grid-cols-2">
          <BindingSourceFields source={source} />
          <BindingTargetFields target={target} />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <CommandField
            label="Binding effective start (Unix ms, inclusive)"
            value={start()}
            change={setStart}
          />
          <CommandField
            label="Binding effective end (Unix ms, exclusive; blank is open)"
            value={end()}
            required={false}
            change={setEnd}
          />
        </div>
      </CommandForm>
      <CommandFeedback
        state={command.state()}
        replay={command.replay}
        prepare={command.prepare}
      />
    </section>
  );
}
