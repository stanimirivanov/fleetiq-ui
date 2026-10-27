import { Effect } from 'effect';
import { type BrowserApi, normalizeRequestFailure } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { FleetIqApi } from '../../../generated/fleetiq-api';
import {
  AssetPageContractError,
  type AssetReadOptions,
  validateAssetPageRequest,
} from '../model/asset-catalogue';
import {
  type MetadataReader,
  type SnapshotRequest,
  validateAssetRequest,
  validateDefinitionRequest,
  validateSnapshotRequest,
  validateSourceRequest,
} from '../model/metadata';
import type { TelemetryReader } from '../model/property-evidence';
import { createTelemetryReader } from './live-telemetry-reader';
import { parseAssetPage } from './parse-asset-page';
import {
  parseAssetDetail,
  parseAssetType,
  parseProperty,
  parseRelationshipPage,
  parseRelationshipType,
  parseSourceBindingPage,
  parseTargetBindingPage,
} from './parse-metadata';

/** Live read port: generated Effect client -> strict boundary -> pure feature model. */
export function createLiveMetadataReader(
  api: BrowserApi,
): MetadataReader & { readonly telemetry?: TelemetryReader } {
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
            catch: (cause) =>
              cause instanceof AssetPageContractError
                ? new RequestFailure('invalid-response')
                : normalizeRequestFailure(cause),
          }),
        ),
      options,
    );
  return {
    telemetry: createTelemetryReader(api),
    async listPage(request, options) {
      validateAssetPageRequest(request);
      return read(
        (client) =>
          client.listAssets(request.tenantId, {
            params: {
              limit: request.limit,
              ...(request.after === undefined ? {} : { after: request.after }),
            },
          }),
        (wire) => {
          const page = parseAssetPage(wire, request);
          if (
            page.nextAfter !== null &&
            page.assets.at(-1)?.id !== page.nextAfter
          )
            throw new RequestFailure('invalid-response');
          return page;
        },
        options,
      );
    },
    async getAsset(request, options) {
      validateAssetRequest(request);
      return read(
        (client) =>
          client.getAsset(request.tenantId, request.assetId, undefined),
        (wire) => parseAssetDetail(wire, request),
        options,
      );
    },
    async getAssetType(request, options) {
      validateDefinitionRequest(request);
      return read(
        (client) =>
          client.getAssetTypeDefinition(
            request.tenantId,
            request.id,
            String(request.version),
            undefined,
          ),
        (wire) => parseAssetType(wire, request),
        options,
      );
    },
    async getProperty(request, options) {
      validateDefinitionRequest(request);
      return read(
        (client) =>
          client.getPropertyDefinition(
            request.tenantId,
            request.id,
            String(request.version),
            undefined,
          ),
        (wire) => parseProperty(wire, request),
        options,
      );
    },
    async getRelationshipType(request, options) {
      validateDefinitionRequest(request);
      return read(
        (client) =>
          client.getRelationshipTypeDefinition(
            request.tenantId,
            request.id,
            String(request.version),
            undefined,
          ),
        (wire) => parseRelationshipType(wire, request),
        options,
      );
    },
    async listRelationships(request, options) {
      validateAssetRequest(request);
      validateSnapshotRequest(request);
      return read(
        (client) =>
          client.listAssetRelationships(request.tenantId, request.assetId, {
            params: snapshotParams(request),
          }),
        (wire) => parseRelationshipPage(wire, request),
        options,
      );
    },
    async listTargetBindings(request, options) {
      validateAssetRequest(request);
      validateSnapshotRequest(request);
      return read(
        (client) =>
          client.listAssetSignalBindings(request.tenantId, request.assetId, {
            params: snapshotParams(request),
          }),
        (wire) => parseTargetBindingPage(wire, request),
        options,
      );
    },
    async listSourceBindings(request, options) {
      validateSourceRequest(request);
      return read(
        (client) =>
          client.listSourceSignalBindings(request.tenantId, {
            params: {
              ...snapshotParams(request),
              device_asset_id: request.source.deviceAssetId,
              endpoint_id: request.source.endpointId,
              signal_id: request.source.signalId,
            },
          }),
        (wire) => parseSourceBindingPage(wire, request),
        options,
      );
    },
  };
}

function snapshotParams(request: SnapshotRequest) {
  return {
    effective_at_ms: request.effectiveAtMs,
    known_at_ms: request.knownAtMs,
    limit: request.limit,
    ...(request.after === undefined ? {} : { after: request.after }),
  };
}

/** Public factory name used by app composition. */
export const createMetadataReader = createLiveMetadataReader;
