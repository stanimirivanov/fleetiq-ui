import { A } from '@solidjs/router';
import { assetSelectionChanges } from '../../model/metadata-query';
import type { MetadataWorkspace } from './useMetadataWorkspace';

/** Stable inspector header; its parent owns the surrounding workspace layout. */
export function ConnectedInspectorHeader(props: {
  readonly name: string;
  readonly assetId: string;
  readonly workspace: MetadataWorkspace;
}) {
  return (
    <header class="grid gap-3">
      <nav aria-label="Breadcrumb" class="text-xs text-muted">
        <A
          class="text-accent underline underline-offset-2"
          href={props.workspace.href('/assets')}
        >
          Assets
        </A>
        <span class="mx-2" aria-hidden="true">
          /
        </span>
        <span>Inspector</span>
      </nav>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-accent">
            Workspace / Asset inspector
          </p>
          <h1
            id="page-title"
            class="mt-1 text-2xl font-semibold tracking-tight"
          >
            {props.name}
          </h1>
          <p class="mt-1 break-all font-mono text-xs text-muted">
            {props.assetId}
          </p>
        </div>
        <A
          class="text-xs font-semibold text-accent underline underline-offset-2"
          href={props.workspace.href(
            '/assets/registry/review',
            assetSelectionChanges(props.assetId),
          )}
        >
          Review registry mapping
        </A>
      </div>
    </header>
  );
}
