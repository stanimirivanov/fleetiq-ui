import { A } from '@solidjs/router';
import { For, Show } from 'solid-js';
import type { SignalBinding } from '../../model/metadata';
import { clearSnapshotSelection } from '../../model/metadata-query';
import { metadataButtonClass } from './MetadataPanel';
import type { MetadataWorkspace } from './useMetadataWorkspace';

/** Revision identifiers remain decimal strings, preserving their full u64 precision. */
export function BindingRecords(props: {
  readonly bindings: readonly SignalBinding[];
  readonly workspace: MetadataWorkspace;
  readonly sourceCandidates?: boolean;
}) {
  const reviewSource = (binding: SignalBinding) =>
    props.workspace.update({
      device_asset_id: binding.source.deviceAssetId,
      endpoint_id: binding.source.endpointId,
      signal_id: binding.source.signalId,
      binding: binding.id,
      source_after: null,
    });
  return (
    <ul
      aria-label={
        props.sourceCandidates
          ? 'Source binding candidate records'
          : 'Target binding records'
      }
      class="grid gap-3"
    >
      <For each={props.bindings}>
        {(binding) => (
          <li class="grid gap-2 rounded-lg border border-outline p-3 text-xs">
            <p class="break-all font-mono text-muted">
              {binding.id} · revision {binding.revision}
            </p>
            <p class="break-all">
              {binding.source.deviceAssetId} / {binding.source.endpointId} /{' '}
              <strong>{binding.source.signalId}</strong>
            </p>
            <p class="break-all">
              Target:{' '}
              <A
                class="text-accent underline underline-offset-2"
                href={props.workspace.href(
                  `/assets/${encodeURIComponent(binding.target.assetId)}`,
                  { ...clearSnapshotSelection(), binding: null },
                )}
              >
                {binding.target.assetId}
              </A>{' '}
              · {binding.target.property.id} v{binding.target.property.version}
            </p>
            <p class="text-muted">
              Recorded at {binding.recordedAtMs} ms · Effective [
              {binding.effectiveInterval.startMs},{' '}
              {binding.effectiveInterval.endMs ?? 'open'}) ms
            </p>
            <Show
              when={!props.sourceCandidates}
              fallback={
                <button
                  type="button"
                  class={metadataButtonClass}
                  aria-pressed={
                    props.workspace.query()?.bindingId === binding.id
                  }
                  onClick={() =>
                    props.workspace.update({ binding: binding.id })
                  }
                >
                  Review property for {binding.id}
                </button>
              }
            >
              <button
                type="button"
                class={metadataButtonClass}
                aria-pressed={props.workspace.query()?.bindingId === binding.id}
                onClick={() => reviewSource(binding)}
              >
                Review source {binding.source.signalId}
              </button>
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}
