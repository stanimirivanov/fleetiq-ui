import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import { type BindingGateway, validBinding } from '../model/binding-authoring';
import { commandIdentifier } from '../model/commissioning';
import { isRevision } from '../model/metadata';
/** Binding transport shares the app runtime, never a device-feature dependency or second client. */
export function createBindingGateway(api: BrowserApi): BindingGateway {
  const bad = () => {
    throw new RequestFailure('invalid-response');
  };
  const scope = (tenant: string, id: string) => {
    if (!commandIdentifier(tenant) || !commandIdentifier(id))
      throw new RequestFailure('invalid-request');
  };
  const params = { Origin: api.origin, 'X-FleetIQ-CSRF': '1' as const };
  return {
    async device(tenant, id, options) {
      scope(tenant, id);
      const wire = await api.run(
        (c) => c.getCommunicationDevice(tenant, id, undefined),
        options,
      );
      if (
        wire.tenant_id !== tenant ||
        wire.asset_id !== id ||
        wire.endpoints.length > 100 ||
        new Set(wire.endpoints.map((e) => e.id)).size !==
          wire.endpoints.length ||
        wire.endpoints.some((e) => !commandIdentifier(e.id) || !e.kind.trim())
      )
        bad();
      return { endpoints: wire.endpoints };
    },
    async observed(tenant, id, options) {
      scope(tenant, id);
      const wire = await api.run(
        (c) => c.getDeviceIngestionDiagnostics(tenant, id, undefined),
        options,
      );
      if (
        !Number.isSafeInteger(wire.observed_at_ms) ||
        wire.sources.length > 128 ||
        wire.coverage.frame_limit !== 64 ||
        wire.coverage.output_limit_per_frame !== 64 ||
        wire.coverage.source_limit !== 128 ||
        wire.sources.some(
          (s) =>
            ![
              s.endpoint_id,
              s.signal_id,
              s.package_id,
              s.package_version,
            ].every(commandIdentifier),
        )
      )
        bad();
      return {
        observedAt: wire.observed_at_ms,
        truncated:
          wire.coverage.frames_truncated ||
          wire.coverage.observations_truncated ||
          wire.coverage.sources_truncated,
        sources: wire.sources,
      };
    },
    async append(tenant, id, revision, draft, options) {
      scope(tenant, id);
      if (!validBinding(id, revision, draft))
        throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (c) =>
          c.appendSignalBindingRevision(tenant, id, revision, {
            params,
            payload: draft,
          }),
        options,
      );
      if (
        wire.id !== id ||
        wire.revision !== revision ||
        !commandIdentifier(wire.recorded_by) ||
        !Number.isSafeInteger(wire.recorded_at_ms)
      )
        bad();
      return {
        outcome: wire.outcome,
        id: wire.id,
        revision: wire.revision,
        actor: wire.recorded_by,
        recordedAt: wire.recorded_at_ms,
      };
    },
    async exact(tenant, id, revision, options) {
      scope(tenant, id);
      if (!isRevision(revision)) throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (c) => c.getSignalBindingRevision(tenant, id, revision, undefined),
        options,
      );
      if (
        wire.tenant_id !== tenant ||
        wire.id !== id ||
        wire.revision !== revision ||
        !Number.isSafeInteger(wire.recorded_at_ms) ||
        !validBinding(id, revision, wire)
      )
        bad();
      return {
        id: wire.id,
        tenantId: wire.tenant_id,
        revision: wire.revision,
        recordedAt: wire.recorded_at_ms,
        source: wire.source,
        target: wire.target,
        effective_interval: wire.effective_interval,
      };
    },
  };
}
