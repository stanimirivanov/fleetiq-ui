import { Effect } from 'effect';
import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { ExportJob as WireJob } from '../../../generated/fleetiq-api';
import type { ExportScope, HistoryExports } from '../model/history-export';
import { positiveId } from '../model/history-review';
import { isMillis, validHistory } from '../model/property-evidence';

const maxBytes = 2 * 1024 * 1024;
function job(wire: typeof WireJob.Type, scope: ExportScope, id?: string) {
  const restore = scope.restore;
  const bytes = Number(wire.file_bytes);
  if (
    !positiveId(wire.export_id) ||
    (id !== undefined && wire.export_id !== id) ||
    !isMillis(wire.expires_at_ms) ||
    bytes < 1 ||
    bytes > maxBytes ||
    wire.coverage.manifest_id !== (restore?.manifestId ?? null) ||
    wire.coverage.restore_generation !== (restore?.generation ?? null) ||
    wire.coverage.scope !==
      (restore ? 'hot_and_selected_manifest_snapshot' : 'hot_snapshot')
  )
    throw new RequestFailure('invalid-response');
  return {
    id: wire.export_id,
    state: wire.state,
    expiresAt: wire.expires_at_ms,
    bytes,
  };
}

function validate(scope: ExportScope, id?: string) {
  validHistory({ ...scope, limit: 1 });
  if (
    scope.tenantId === '.' ||
    scope.tenantId === '..' ||
    (id !== undefined && !positiveId(id))
  )
    throw new RequestFailure('invalid-request');
}

export function createHistoryExports(api: BrowserApi): HistoryExports {
  const params = { Origin: api.origin, 'X-FleetIQ-CSRF': '1' as const };
  return {
    async create(command, options) {
      validate(command);
      if (!/^[a-z0-9][a-z0-9._-]{0,127}$/u.test(command.key))
        throw new RequestFailure('invalid-request');
      const restore = command.restore;
      const wire = await api.run(
        (client) =>
          client.createHistoricalExport(command.tenantId, command.key, {
            params,
            payload: {
              asset_id: command.assetId,
              property_id: command.property.id,
              property_version: command.property.version,
              start_at_ms: command.start,
              end_at_ms: command.end,
              ...(restore
                ? {
                    manifest_id: restore.manifestId,
                    restore_generation: restore.generation,
                  }
                : {}),
            },
          }),
        options,
      );
      return job(wire, command);
    },
    async status(scope, id, options) {
      validate(scope, id);
      return job(
        await api.run(
          (client) => client.getHistoricalExport(scope.tenantId, id, undefined),
          options,
        ),
        scope,
        id,
      );
    },
    async cancel(scope, id, options) {
      validate(scope, id);
      const result = job(
        await api.run(
          (client) =>
            client.cancelHistoricalExport(scope.tenantId, id, { params }),
          options,
        ),
        scope,
        id,
      );
      if (result.state !== 'cancelled' && result.state !== 'expired')
        throw new RequestFailure('invalid-response');
      return result;
    },
    async download(scope, selected, options) {
      validate(scope, selected.id);
      if (
        selected.state !== 'ready' ||
        !Number.isInteger(selected.bytes) ||
        selected.bytes < 1 ||
        selected.bytes > maxBytes
      )
        throw new RequestFailure('invalid-request');
      const path = `/api/v1/tenants/${encodeURIComponent(scope.tenantId)}/exports/jobs/${selected.id}/download`;
      const filename = `fleetiq-export-${selected.id}.parquet`;
      return api.run(
        (client) =>
          client.httpClient.get(path).pipe(
            Effect.flatMap((response) => {
              if (
                response.status !== 200 ||
                response.headers['content-type'] !==
                  'application/vnd.apache.parquet' ||
                response.headers['content-disposition'] !==
                  `attachment; filename="${filename}"` ||
                response.headers['content-length'] !== String(selected.bytes)
              )
                return Effect.fail(new RequestFailure('invalid-response'));
              return response.arrayBuffer.pipe(
                Effect.flatMap((bytes) =>
                  bytes.byteLength === selected.bytes
                    ? Effect.succeed(bytes)
                    : Effect.fail(new RequestFailure('invalid-response')),
                ),
              );
            }),
          ),
        options,
      );
    },
  };
}
