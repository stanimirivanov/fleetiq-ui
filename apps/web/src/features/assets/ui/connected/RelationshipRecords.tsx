import { A } from '@solidjs/router';
import { For } from 'solid-js';
import type { Relationship } from '../../model/metadata';
import { clearSnapshotSelection } from '../../model/metadata-query';
import { ExpandableDefinition } from './DefinitionEvidence';
import type { MetadataWorkspace } from './useMetadataWorkspace';

/** Directed identity edges and exact definition references, without topology inference. */
export function RelationshipRecords(props: {
  readonly relationships: readonly Relationship[];
  readonly tenantId: string;
  readonly workspace: MetadataWorkspace;
}) {
  const assetHref = (assetId: string) =>
    props.workspace.href(`/assets/${encodeURIComponent(assetId)}`, {
      ...clearSnapshotSelection(),
      binding: null,
    });
  return (
    <ul aria-label="Directed relationship records" class="grid gap-3">
      <For each={props.relationships}>
        {(relationship) => (
          <li class="grid gap-2 rounded-lg border border-outline p-3 text-xs">
            <p class="break-all font-mono text-muted">
              {relationship.id} · revision {relationship.revision}
            </p>
            <p class="break-all">
              <A
                class="text-accent underline underline-offset-2"
                href={assetHref(relationship.sourceAssetId)}
              >
                {relationship.sourceAssetId}
              </A>
              <span>
                <span class="sr-only"> directed to </span>
                <span aria-hidden="true"> → </span>
              </span>
              <A
                class="text-accent underline underline-offset-2"
                href={assetHref(relationship.targetAssetId)}
              >
                {relationship.targetAssetId}
              </A>
            </p>
            <ExpandableDefinition
              tenantId={props.tenantId}
              reference={relationship.relationshipType}
              kind="relationship-type"
            />
            <p class="text-muted">
              Recorded at {relationship.recordedAtMs} ms · Effective [
              {relationship.effectiveInterval.startMs},{' '}
              {relationship.effectiveInterval.endMs ?? 'open'}) ms
            </p>
          </li>
        )}
      </For>
    </ul>
  );
}
