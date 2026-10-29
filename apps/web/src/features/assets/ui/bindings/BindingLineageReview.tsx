import { createMemo } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { isRevision } from '../../model/metadata';
import {
  MetadataPanel,
  metadataButtonClass,
  metadataInputClass,
} from '../connected/MetadataPanel';
import { MetadataReadContent } from '../connected/MetadataReadContent';
import { useMetadataReader } from '../connected/MetadataReaderProvider';
import { useMetadataRead } from '../connected/useMetadataRead';
import type { MetadataWorkspace } from '../connected/useMetadataWorkspace';
export function BindingLineageReview(props: { workspace: MetadataWorkspace }) {
  const context = useMetadataReader();
  const request = createMemo(() => {
    const q = props.workspace.query(),
      revision = props.workspace.value('binding_revision');
    return q?.bindingId && isRevision(revision)
      ? { tenant: q.tenantId, id: q.bindingId, revision }
      : null;
  });
  const read = useMetadataRead(
    request,
    (_r, q, o) =>
      context.bindings?.exact(q.tenant, q.id, q.revision, o) ??
      Promise.reject(new RequestFailure('unavailable')),
  );
  return (
    <MetadataPanel
      title="Immutable binding revision"
      description="Exact fact lookup, independent of snapshot cutoffs. This is not a latest-head or complete-history query."
    >
      <div class="grid gap-3">
        <form
          aria-label="Exact binding revision lookup"
          class="grid gap-2 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            props.workspace.update({
              binding: String(d.get('id') ?? ''),
              binding_revision: String(d.get('revision') ?? ''),
            });
          }}
        >
          <label class="grid gap-1">
            Immutable binding ID
            <input
              class={metadataInputClass}
              name="id"
              value={props.workspace.value('binding')}
              required
            />
          </label>
          <label class="grid gap-1">
            Immutable binding revision
            <input
              class={metadataInputClass}
              name="revision"
              value={props.workspace.value('binding_revision')}
              required
            />
          </label>
          <button type="submit" class={metadataButtonClass}>
            Review immutable binding revision
          </button>
        </form>
        <MetadataReadContent
          state={read.state()}
          label="immutable binding revision"
          retry={read.retry}
        >
          {(fact) => (
            <div class="grid gap-2 break-all text-xs">
              <p>
                {fact.id} · revision {fact.revision} · recorded{' '}
                {fact.recordedAt} ms
              </p>
              <p>
                {fact.source.device_asset_id} / {fact.source.endpoint_id} /{' '}
                {fact.source.signal_id} → {fact.target.asset_id} /{' '}
                {fact.target.property.id} v{fact.target.property.version}
              </p>
              <p>
                Effective [{fact.effective_interval.start_ms},{' '}
                {fact.effective_interval.end_ms ?? 'open'}) ms
              </p>
              <p>
                Original fact retained. Actor attribution is shown on
                acknowledged command receipts; this read contract does not
                return an actor.
              </p>
            </div>
          )}
        </MetadataReadContent>
      </div>
    </MetadataPanel>
  );
}
