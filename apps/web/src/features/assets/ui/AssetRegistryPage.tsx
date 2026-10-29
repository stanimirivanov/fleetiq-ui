import { useLocation } from '@solidjs/router';
import { lazy, Show, Suspense } from 'solid-js';
import { isRegistrySamplePreview } from '../model/asset-preview-url';
import { ConnectedRegistryView } from './connected/ConnectedRegistryView';

const DevelopmentRegistryContent = import.meta.env.DEV
  ? lazy(() => import('./DevelopmentRegistryContent'))
  : undefined;
const SampleContent = DevelopmentRegistryContent ?? (() => null);

/** Connected registry commissioning and evidence; sample scenes remain dev-only. */
export function AssetRegistryPage() {
  const location = useLocation();
  const showingSample = () =>
    Boolean(DevelopmentRegistryContent) &&
    isRegistrySamplePreview(location.pathname, location.search);
  return (
    <div class="grid min-w-0 gap-4">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Workspace / Assets / Registry
        </p>
        <h1
          id="page-title"
          class="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.7rem]"
        >
          Asset registry & signal mapping
        </h1>
        <p class="mt-1 text-sm text-muted">
          Create assets, commission directed relationships, and review pinned
          metadata revisions.
        </p>
      </header>
      <Show when={showingSample()} fallback={<ConnectedRegistryView />}>
        <Suspense fallback={<p role="status">Opening sample registry…</p>}>
          <SampleContent />
        </Suspense>
      </Show>
    </div>
  );
}
