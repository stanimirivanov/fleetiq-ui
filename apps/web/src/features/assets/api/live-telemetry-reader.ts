import { Effect } from 'effect';
import { type BrowserApi, normalizeRequestFailure } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { FleetIqApi } from '../../../generated/fleetiq-api';
import type { AssetReadOptions } from '../model/asset-catalogue';
import {
  isToken,
  type TelemetryReader,
  validHistory,
  validProperty,
} from '../model/property-evidence';
import {
  parseCurrentProperty,
  parsePropertyEvidence,
  parsePropertyHistory,
} from './parse-property-evidence';
/** Three independently authorized reads, sharing the app-owned managed runtime. */
export function createTelemetryReader(api: BrowserApi): TelemetryReader {
  const read = <A, W, E>(
    operation: (client: FleetIqApi) => Effect.Effect<W, E>,
    parse: (wire: W) => A,
    options?: AssetReadOptions,
  ): Promise<A> =>
    api.run(
      (client) =>
        Effect.flatMap(operation(client), (wire) =>
          Effect.try({
            try: () => parse(wire),
            catch: normalizeRequestFailure,
          }),
        ),
      options,
    );
  return {
    async current(request, options) {
      validProperty(request);
      return read(
        (client) =>
          client.getCurrentPropertySnapshot(
            request.tenantId,
            request.assetId,
            request.property.id,
            String(request.property.version),
            undefined,
          ),
        (wire) => parseCurrentProperty(wire, request),
        options,
      );
    },
    async history(request, options) {
      validHistory(request);
      return read(
        (client) =>
          client.listPropertyHistory(
            request.tenantId,
            request.assetId,
            request.property.id,
            String(request.property.version),
            {
              params: {
                start_at_ms: request.start,
                end_at_ms: request.end,
                limit: request.limit,
                after: request.after,
              },
            },
          ),
        (wire) => parsePropertyHistory(wire, request),
        options,
      );
    },
    async interpretation(request, options) {
      validProperty(request);
      if (!isToken(request.interpretation))
        throw new RequestFailure('invalid-request');
      return read(
        (client) =>
          client.getPropertyInterpretation(
            request.tenantId,
            request.assetId,
            request.property.id,
            String(request.property.version),
            request.interpretation,
            undefined,
          ),
        (wire) => {
          const parsed = parsePropertyEvidence(wire, request);
          if (parsed.interpretation !== request.interpretation)
            throw new RequestFailure('invalid-response');
          return parsed;
        },
        options,
      );
    },
  };
}
