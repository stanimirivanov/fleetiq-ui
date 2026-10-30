import { useLocation } from '@solidjs/router';
import { lazy, Show, Suspense } from 'solid-js';
import { TextLink } from '#shared/ui';
import {
  alertsSampleHref,
  isAlertsSamplePreview,
} from '../model/alert-preview-url';
import { ConnectedAlertsContent } from './connected/ConnectedAlertsContent';

const DevelopmentAlertsContent = import.meta.env.DEV
  ? lazy(() => import('./DevelopmentAlertsContent'))
  : undefined;
const SampleContent = DevelopmentAlertsContent ?? (() => null);

/** Explicit development samples are isolated from authenticated connected reads. */
export function AlertsPage() {
  const location = useLocation();
  const showingSample = () =>
    Boolean(DevelopmentAlertsContent) &&
    isAlertsSamplePreview(location.pathname, location.search);

  return (
    <div class="grid min-w-0 gap-4">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Workspace / Alerts
        </p>
        <h1
          id="page-title"
          class="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.7rem]"
        >
          Alerts &amp; evidence
        </h1>
        <p class="mt-1 text-sm text-muted">
          Prioritize abnormal conditions and inspect their supporting evidence.
        </p>
      </header>
      <Show
        when={showingSample()}
        fallback={
          <div class="grid min-w-0 gap-4">
            <ConnectedAlertsContent />
            {DevelopmentAlertsContent && (
              <TextLink href={alertsSampleHref()}>View sample alerts</TextLink>
            )}
          </div>
        }
      >
        <Suspense fallback={<p role="status">Opening sample alerts…</p>}>
          <SampleContent />
        </Suspense>
      </Show>
    </div>
  );
}
