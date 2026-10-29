import { useLocation } from '@solidjs/router';
import { lazy, Show, Suspense } from 'solid-js';
import { TextLink } from '#shared/ui';
import { isOverviewSamplePreview } from '../model/asset-preview-url';

const ConnectedOverviewContent = lazy(
  () => import('./ConnectedOverviewContent'),
);
const DevelopmentOverviewContent = import.meta.env.DEV
  ? lazy(() => import('./DevelopmentOverviewContent'))
  : undefined;
const SampleContent = DevelopmentOverviewContent ?? (() => null);
/** Route orchestration separates connected inventory from explicit development samples. */
export function FleetOverviewPage() {
  const location = useLocation();
  const showingSample = () =>
    Boolean(DevelopmentOverviewContent) &&
    isOverviewSamplePreview(location.pathname, location.search);
  return (
    <div class="grid min-w-0 gap-3">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            id="page-title"
            class="text-2xl font-semibold tracking-tight sm:text-[1.7rem]"
          >
            Fleet overview
          </h1>
          <p class="mt-1 text-sm text-muted">
            Inventory, evidence coverage and observed location context.
          </p>
        </div>
        <Show when={showingSample()}>
          <p class="rounded-md border border-outline bg-surface px-3 py-1.5 text-xs text-muted">
            Fixed sample snapshot · 6 Oct 2026, 10:00 UTC
          </p>
        </Show>
      </header>
      <Suspense fallback={<p role="status">Opening fleet overview…</p>}>
        <Show when={showingSample()} fallback={<ConnectedOverviewContent />}>
          <SampleContent />
        </Show>
      </Suspense>
      <Show when={DevelopmentOverviewContent && !showingSample()}>
        <TextLink href="/?preview=sample">View illustrative overview</TextLink>
      </Show>
    </div>
  );
}
