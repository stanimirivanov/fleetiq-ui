import { useLocation } from '@solidjs/router';
import { onCleanup, type ParentProps, Show } from 'solid-js';
import { createMetadataReader } from '#features/assets';
import {
  createOperatorSessionService,
  createOperatorTenantReader,
  OperatorAccessBoundary,
  OperatorSessionProvider,
  useOperatorSession,
} from '#features/identity';
import { createBrowserApi } from '#shared/api';
import { APP_ROUTES, routeTitle } from './route-metadata';
import { isDevelopmentSampleRoute } from './sample-route';
import { TenantMetadataWorkspace } from './TenantMetadataWorkspace';

/** One managed HTTP lifetime serves session and metadata ports for the app mount. */
export function BrowserWorkspace(props: ParentProps) {
  const browser = createBrowserApi();
  const reader = createMetadataReader(browser);
  const session = createOperatorSessionService(browser);
  const tenants = createOperatorTenantReader(browser);
  onCleanup(() => {
    void browser.dispose();
  });
  return (
    <OperatorSessionProvider service={session}>
      <MetadataComposition reader={reader} tenants={tenants}>
        {props.children}
      </MetadataComposition>
    </OperatorSessionProvider>
  );
}

function MetadataComposition(
  props: ParentProps<{
    readonly reader: ReturnType<typeof createMetadataReader>;
    readonly tenants: ReturnType<typeof createOperatorTenantReader>;
  }>,
) {
  const operator = useOperatorSession();
  return (
    <TenantMetadataWorkspace
      reader={props.reader}
      tenants={props.tenants}
      onUnauthorized={operator.invalidate}
    >
      {props.children}
    </TenantMetadataWorkspace>
  );
}

/** Sample previews never become an authentication fallback. */
export function MetadataAccessBoundary(props: ParentProps) {
  const location = useLocation();
  const operator = useOperatorSession();
  const preview = () =>
    isDevelopmentSampleRoute(
      location.pathname,
      location.search,
      import.meta.env.DEV,
    );
  return (
    <Show
      when={preview()}
      fallback={
        <div class="grid min-w-0 gap-5">
          <Show when={operator.state().kind !== 'authenticated'}>
            <header>
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                Workspace / Metadata
              </p>
              <h1
                id="page-title"
                class="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.7rem]"
              >
                {location.pathname === APP_ROUTES.registry.path
                  ? 'Asset registry & signal mapping'
                  : routeTitle(location.pathname)}
              </h1>
              <p class="mt-1 text-sm text-muted">
                Operator access is required to review authorized tenant
                metadata.
              </p>
            </header>
          </Show>
          <OperatorAccessBoundary>{props.children}</OperatorAccessBoundary>
        </div>
      }
    >
      {props.children}
    </Show>
  );
}
