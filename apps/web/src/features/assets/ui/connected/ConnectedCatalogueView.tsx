import { A } from '@solidjs/router';
import { Show } from 'solid-js';
import { ConnectedAssetCatalogue } from './ConnectedAssetCatalogue';
import { MetadataContextControls } from './MetadataContextControls';
import { useMetadataReader } from './MetadataReaderProvider';
import { useMetadataWorkspace } from './useMetadataWorkspace';

/** Route-level orchestration delegates controls, reads, and presentation. */
export function ConnectedCatalogueView() {
  const access = useMetadataReader();
  const workspace = useMetadataWorkspace();
  return (
    <div class="grid min-w-0 gap-4">
      <MetadataContextControls workspace={workspace} />
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
        <p class="text-muted">Identity catalogue · tenant-scoped metadata</p>
        <Show when={!access.accessBlock?.()}>
          <A
            class="font-semibold text-accent hover:underline"
            href={workspace.href('/assets/registry/review')}
          >
            Review registry mapping
          </A>
        </Show>
      </div>
      <ConnectedAssetCatalogue workspace={workspace} />
    </div>
  );
}
