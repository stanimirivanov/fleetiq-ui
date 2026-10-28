import { Effect } from 'effect';
import { type BrowserApi, normalizeRequestFailure } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { FleetReader } from '../model/fleet';
import { readFleetQuery } from '../model/fleet-query';
import { parseFleet } from './parse-fleet';
/** Current repeatable-read fleet pages share the app-owned cancellable runtime. */
export function createFleetReader(api: BrowserApi): FleetReader {
  return {
    async snapshot(r, options) {
      const q = new URLSearchParams({
        tenant: r.tenantId,
        latitude_property: r.mapping.latitude.id,
        latitude_version: String(r.mapping.latitude.version),
        longitude_property: r.mapping.longitude.id,
        longitude_version: String(r.mapping.longitude.version),
        encoding: r.mapping.encoding,
        ...(r.after ? { fleet_after: r.after } : {}),
      });
      if (readFleetQuery(q.toString()).kind !== 'ready' || r.limit !== 50)
        throw new RequestFailure('invalid-request');
      return api.run(
        (client) =>
          Effect.flatMap(
            client.getFleetSnapshot(r.tenantId, {
              params: {
                latitude_property: r.mapping.latitude.id,
                latitude_version: r.mapping.latitude.version,
                longitude_property: r.mapping.longitude.id,
                longitude_version: r.mapping.longitude.version,
                encoding: r.mapping.encoding,
                limit: r.limit,
                ...(r.after ? { after: r.after } : {}),
              },
            }),
            (wire) =>
              Effect.try({
                try: () => parseFleet(wire, r),
                catch: normalizeRequestFailure,
              }),
          ),
        options,
      );
    },
  };
}
