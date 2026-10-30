import { useLocation } from '@solidjs/router';
import { onCleanup, type ParentProps, Show } from 'solid-js';
import { createAlertReader } from '#features/alerts';
import {
  createBindingGateway,
  createCommissioningGateway,
  createMetadataReader,
} from '#features/assets';
import { createDeviceGateway } from '#features/devices';
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
  const commissioning = createCommissioningGateway(browser);
  const bindings = createBindingGateway(browser);
  const alerts = createAlertReader(browser);
  const devices = createDeviceGateway(browser);
  const session = createOperatorSessionService(browser);
  const tenants = createOperatorTenantReader(browser);
  onCleanup(() => {
    void browser.dispose();
  });
  return (
    <OperatorSessionProvider service={session}>
      <MetadataComposition
        alerts={alerts}
        bindings={bindings}
        commissioning={commissioning}
        reader={reader}
        tenants={tenants}
        devices={devices}
      >
        {props.children}
      </MetadataComposition>
    </OperatorSessionProvider>
  );
}

function MetadataComposition(
  props: ParentProps<{
    readonly alerts: ReturnType<typeof createAlertReader>;
    readonly bindings: ReturnType<typeof createBindingGateway>;
    readonly commissioning: ReturnType<typeof createCommissioningGateway>;
    readonly devices: ReturnType<typeof createDeviceGateway>;
    readonly reader: ReturnType<typeof createMetadataReader>;
    readonly tenants: ReturnType<typeof createOperatorTenantReader>;
  }>,
) {
  const operator = useOperatorSession();
  return (
    <TenantMetadataWorkspace
      alerts={props.alerts}
      bindings={props.bindings}
      commissioning={props.commissioning}
      devices={props.devices}
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
                Workspace / Operator access
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
                Operator access is required to review authorized tenant records.
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
