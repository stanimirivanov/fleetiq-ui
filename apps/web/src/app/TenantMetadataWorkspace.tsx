import { useLocation, useNavigate } from '@solidjs/router';
import type { ParentProps } from 'solid-js';
import type { createMetadataReader } from '#features/assets';
import {
  MetadataReaderProvider,
  metadataHref,
  tenantContextChanges,
} from '#features/assets';
import {
  OperatorTenantProvider,
  type OperatorTenantReader,
  OperatorTenantSelector,
  tenantDiscoveryCursor,
  useOperatorTenants,
} from '#features/identity';
import { AppShell } from './AppShell';
import { isDevelopmentSampleRoute } from './sample-route';

type WorkspaceProps = ParentProps<{
  readonly reader: ReturnType<typeof createMetadataReader>;
  readonly tenants: OperatorTenantReader;
  readonly onUnauthorized: () => void;
}>;

/** App composition connects identity hints to asset reads without feature imports. */
export function TenantMetadataWorkspace(props: WorkspaceProps) {
  const location = useLocation();
  const enabled = () =>
    location.pathname.startsWith('/assets') &&
    !isDevelopmentSampleRoute(
      location.pathname,
      location.search,
      import.meta.env.DEV,
    );
  return (
    <OperatorTenantProvider
      reader={props.tenants}
      enabled={enabled}
      after={() => tenantDiscoveryCursor(location.search)}
      selected={() => new URLSearchParams(location.search).get('tenant') ?? ''}
    >
      <MetadataWorkspaceBridge {...props} />
    </OperatorTenantProvider>
  );
}

function MetadataWorkspaceBridge(props: WorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const tenants = useOperatorTenants();
  return (
    <MetadataReaderProvider
      reader={props.reader}
      onUnauthorized={props.onUnauthorized}
      accessBlock={tenants.metadataBlock}
      accessRevision={tenants.state}
      tenantControl={(control) => (
        <OperatorTenantSelector
          selected={control.tenantId()}
          after={tenantDiscoveryCursor(location.search)}
          select={(id) =>
            navigate(
              metadataHref(
                '/assets',
                location.search,
                tenantContextChanges(id),
              ),
            )
          }
          page={(after) =>
            navigate(
              metadataHref(location.pathname, location.search, {
                tenant_after: after,
              }),
            )
          }
        />
      )}
    >
      <AppShell>{props.children}</AppShell>
    </MetadataReaderProvider>
  );
}
