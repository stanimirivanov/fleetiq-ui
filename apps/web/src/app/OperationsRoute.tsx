import { useLocation, useNavigate } from '@solidjs/router';
import { createContext, createMemo, useContext } from 'solid-js';
import {
  OperatorTenantSelector,
  tenantDiscoveryCursor,
  useOperatorSession,
  useOperatorTenants,
} from '#features/identity';
import {
  type OperationsGateway,
  OperationsPage,
  type WorkKind,
  workFamilies,
} from '#features/operations';
import { APP_ROUTES } from './route-metadata';

export const OperationsGatewayContext = createContext<OperationsGateway>();

export function OperationsRoute() {
  const gateway = useContext(OperationsGatewayContext);
  if (!gateway) throw new Error('Operations gateway is missing');
  const location = useLocation();
  const navigate = useNavigate();
  const operator = useOperatorSession();
  const tenants = useOperatorTenants();
  const search = createMemo(() => new URLSearchParams(location.search));
  const tenant = () => {
    const selected = search().getAll('tenant');
    return selected.length === 1 ? (selected[0] ?? '') : '';
  };
  const kind = () => {
    const selected = search().get('kind');
    return selected && Object.hasOwn(workFamilies, selected)
      ? (selected as WorkKind)
      : 'replay';
  };
  const actor = () => {
    const state = operator.state();
    return state.kind === 'authenticated' ? state.session.actorId : '';
  };
  const actions = () => {
    const state = tenants.state();
    return state.kind === 'ready'
      ? state.page.tenants.find((entry) => entry.id === tenant())?.actions
      : undefined;
  };
  function update(key: string, value: string | null) {
    const params = new URLSearchParams(search());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === 'tenant') params.delete('kind');
    navigate(`${APP_ROUTES.operations.path}?${params}`);
  }
  return (
    <OperationsPage
      gateway={gateway}
      tenant={tenant()}
      actor={actor()}
      read={Boolean(actor() && actions()?.includes('operations.read'))}
      manage={actions()?.includes('operations.manage') === true}
      kind={kind()}
      selectKind={(value) => update('kind', value)}
      onUnauthorized={operator.invalidate}
      tenantControl={
        <OperatorTenantSelector
          selected={tenant()}
          after={tenantDiscoveryCursor(location.search)}
          select={(value) => update('tenant', value)}
          page={(value) => update('tenant_after', value)}
        />
      }
    />
  );
}
