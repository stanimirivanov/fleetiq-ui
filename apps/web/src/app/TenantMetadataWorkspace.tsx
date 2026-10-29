import { useLocation, useNavigate } from '@solidjs/router';
import type { ParentProps } from 'solid-js';
import type {
  CommissioningGateway,
  createMetadataReader,
} from '#features/assets';
import {
  MetadataReaderProvider,
  metadataHref,
  tenantContextChanges,
} from '#features/assets';
import { type DeviceGateway, DeviceProvider } from '#features/devices';
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
  readonly devices: DeviceGateway;
  readonly commissioning: CommissioningGateway;
  readonly reader: ReturnType<typeof createMetadataReader>;
  readonly tenants: OperatorTenantReader;
  readonly onUnauthorized: () => void;
}>;

/** App composition connects identity hints to asset reads without feature imports. */
export function TenantMetadataWorkspace(props: WorkspaceProps) {
  const location = useLocation();
  const enabled = () =>
    (location.pathname.startsWith('/assets') ||
      location.pathname === '/devices' ||
      location.pathname === '/map' ||
      location.pathname === '/') &&
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
      commissioning={props.commissioning}
      actions={() => {
        const s = tenants.state();
        return s.kind === 'ready'
          ? s.page.tenants.find(
              (t) =>
                t.id === new URLSearchParams(location.search).get('tenant'),
            )?.actions
          : undefined;
      }}
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
                location.pathname === '/map' || location.pathname === '/'
                  ? location.pathname
                  : '/assets',
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
      <DeviceProvider
        gateway={props.devices}
        onUnauthorized={props.onUnauthorized}
        actions={() => {
          const s = tenants.state();
          return s.kind === 'ready'
            ? (s.page.tenants.find(
                (t) =>
                  t.id === new URLSearchParams(location.search).get('tenant'),
              )?.actions ?? [])
            : undefined;
        }}
        tenantControl={(selected) => (
          <OperatorTenantSelector
            selected={selected}
            after={tenantDiscoveryCursor(location.search)}
            select={(id) =>
              navigate(`/devices?${new URLSearchParams({ tenant: id })}`)
            }
            page={(after) => {
              const p = new URLSearchParams(location.search);
              if (after) p.set('tenant_after', after);
              else p.delete('tenant_after');
              navigate(`/devices?${p}`);
            }}
          />
        )}
      >
        <AppShell>{props.children}</AppShell>
      </DeviceProvider>
    </MetadataReaderProvider>
  );
}
