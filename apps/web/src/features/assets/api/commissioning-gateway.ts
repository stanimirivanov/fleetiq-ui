import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import { isValidAssetIdentifier } from '../model/asset-catalogue';
import {
  type CommissioningGateway,
  validAssetDraft,
  validReference,
  validRelationship,
} from '../model/commissioning';
/** Commands use the shared managed runtime; response shape is decoded by the generated client. */
export function createCommissioningGateway(
  api: BrowserApi,
): CommissioningGateway {
  const requireTenant = (tenant: string) => {
    if (!isValidAssetIdentifier(tenant))
      throw new RequestFailure('invalid-request');
  };
  const invalid = () => {
    throw new RequestFailure('invalid-response');
  };
  const params = { Origin: api.origin, 'X-FleetIQ-CSRF': '1' as const };
  const audit = (actor: string, time: number) => {
    if (!isValidAssetIdentifier(actor) || !Number.isSafeInteger(time))
      invalid();
  };
  return {
    async types(tenant, kind, after, options) {
      requireTenant(tenant);
      if (after && !validReference(after))
        throw new RequestFailure('invalid-request');
      const args = {
        params: {
          limit: 20,
          after_id: after?.id,
          after_version: after?.version,
        },
      };
      const wire =
        kind === 'asset'
          ? await api.run(
              (c) => c.listAssetTypeDefinitions(tenant, args),
              options,
            )
          : await api.run(
              (c) => c.listRelationshipTypeDefinitions(tenant, args),
              options,
            );
      const rows = wire.definitions;
      if (
        rows.length > 20 ||
        rows.some((d) => !validReference(d) || !d.name.trim()) ||
        new Set(rows.map((d) => JSON.stringify([d.id, d.version]))).size !==
          rows.length ||
        rows.some((d, i) => {
          const p = i ? rows[i - 1] : after;
          return (
            p && (d.id < p.id || (d.id === p.id && d.version <= p.version))
          );
        }) ||
        (wire.next_after &&
          (wire.next_after.id !== rows.at(-1)?.id ||
            wire.next_after.version !== rows.at(-1)?.version))
      )
        invalid();
      return { definitions: rows, next: wire.next_after };
    },
    async register(tenant, draft, options) {
      requireTenant(tenant);
      if (!validAssetDraft(draft)) throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (c) => c.registerAsset(tenant, { params, payload: draft }),
        options,
      );
      audit(wire.registered_by, wire.recorded_at_ms);
      return {
        outcome: wire.outcome,
        actor: wire.registered_by,
        recordedAt: wire.recorded_at_ms,
      };
    },
    async append(tenant, id, revision, draft, options) {
      requireTenant(tenant);
      if (!validRelationship(id, revision, draft))
        throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (c) =>
          c.appendRelationshipRevision(tenant, id, revision, {
            params,
            payload: draft,
          }),
        options,
      );
      audit(wire.recorded_by, wire.recorded_at_ms);
      if (wire.id !== id || wire.revision !== revision) invalid();
      return {
        outcome: wire.outcome,
        actor: wire.recorded_by,
        recordedAt: wire.recorded_at_ms,
        id: wire.id,
        revision: wire.revision,
      };
    },
  };
}
