/** Deliberate public entry for app-owned session composition. */
export { createOperatorSessionService } from './api/browser-session-service';
export { createOperatorTenantReader } from './api/operator-tenant-reader';
export type { OperatorSessionService } from './model/operator-session';
export type { OperatorTenantReader } from './model/operator-tenants';
export { tenantDiscoveryCursor } from './model/operator-tenants';
export { OperatorAccessBoundary } from './ui/OperatorAccessBoundary';
export {
  OperatorAccountControl,
  operatorConnectionLabel,
} from './ui/OperatorAccountControl';
export {
  OperatorSessionProvider,
  useOperatorSession,
} from './ui/OperatorSessionProvider';
export {
  OperatorTenantProvider,
  useOperatorTenants,
  useOptionalOperatorTenants,
} from './ui/OperatorTenantProvider';
export { OperatorTenantSelector } from './ui/OperatorTenantSelector';
