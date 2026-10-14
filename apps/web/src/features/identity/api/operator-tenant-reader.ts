import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import {
  isValidTenantId,
  type OperatorTenantReader,
} from '../model/operator-tenants';

/**
 * The generated schema validates the wire shape. This adapter also enforces
 * requested bounds, distinct identities/actions and a cursor tied to the last
 * emitted tenant. Database collation is intentionally not reimplemented here.
 * Failures expose categories, never raw response values.
 */
export function createOperatorTenantReader(
  browser: BrowserApi,
): OperatorTenantReader {
  return {
    async list(request, options) {
      if (
        !Number.isInteger(request.limit) ||
        request.limit < 1 ||
        request.limit > 100 ||
        (request.after !== undefined && !isValidTenantId(request.after))
      ) {
        throw new RequestFailure('invalid-request');
      }
      const wire = await browser.run(
        (api) =>
          api.listOperatorTenants({
            params: { limit: request.limit, after: request.after },
          }),
        options,
      );
      const seen = new Set<string>();
      const invalid = () => {
        throw new RequestFailure('invalid-response');
      };
      if (wire.tenants.length > request.limit) invalid();
      for (const tenant of wire.tenants) {
        if (
          !isValidTenantId(tenant.tenant_id) ||
          tenant.tenant_id === request.after ||
          seen.has(tenant.tenant_id) ||
          new Set(tenant.actions).size !== tenant.actions.length
        )
          invalid();
        seen.add(tenant.tenant_id);
      }
      if (
        wire.next_after !== null &&
        (!isValidTenantId(wire.next_after) ||
          wire.next_after === request.after ||
          wire.next_after !== wire.tenants.at(-1)?.tenant_id)
      )
        invalid();
      return {
        tenants: wire.tenants.map((tenant) => ({
          id: tenant.tenant_id,
          actions: tenant.actions,
        })),
        nextAfter: wire.next_after,
      };
    },
  };
}
