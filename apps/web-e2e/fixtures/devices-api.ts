import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import {
  activeRoute,
  diagnosticsEvidence,
  storedRelease,
} from '../../web/src/features/devices/fixtures/evidence';
import * as Wire from '../../web/src/generated/fleetiq-api';
import { installMetadataApi } from './metadata-api';
export interface DeviceMockOptions {
  readonly identityInstalled?: boolean;
  readonly actions?: readonly (
    | 'metadata.read'
    | 'metadata.manage'
    | 'protocol.manage'
  )[];
  readonly ambiguousRegistration?: boolean;
  readonly conflictAssignment?: boolean;
}
/** Stateful, synthetic contract responses; product never imports these fixtures. */
export async function installDevicesApi(
  page: Page,
  options: DeviceMockOptions = {},
) {
  if (!options.identityInstalled)
    await installMetadataApi(page, {
      tenants: [
        {
          tenant_id: 'tenant-a',
          actions: options.actions ?? [
            'metadata.read',
            'metadata.manage',
            'protocol.manage',
          ],
        },
      ],
    });
  const assets = new Map<string, Wire.RegisterAssetRequest>();
  assets.set('gateway-existing', {
    id: 'gateway-existing',
    name: 'Existing monitoring gateway',
    asset_type: { id: 'equipment', version: 1 },
    external_identifiers: [],
  });
  const devices = new Map<string, Wire.CommunicationDevice>();
  const routes = new Map<string, Wire.ProtocolDeviceRoute>();
  const traffic = new Set<string>();
  let ambiguous = options.ambiguousRegistration ?? false,
    conflict = options.conflictAssignment ?? false;
  const commands: {
    method: string;
    path: string;
    payload: unknown;
    csrf: string | undefined;
    origin: string | undefined;
  }[] = [];
  await page.route('**/api/v1/tenants/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      segments = url.pathname.split('/').map(decodeURIComponent),
      method = request.method();
    const headers = await request.allHeaders();
    const problem = (status: number) =>
      route.fulfill({
        status,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Synthetic request outcome',
          status,
        }),
      });
    async function reply<A>(
      schema: Schema.Decoder<A>,
      payload: unknown,
      status = 200,
    ) {
      const parsed = Schema.decodeUnknownSync(schema)(payload);
      await route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify(parsed),
      });
    }
    if (segments[4] !== 'tenant-a') return problem(403);
    if (method !== 'GET') {
      commands.push({
        method,
        path: url.pathname,
        payload: request.postDataJSON(),
        csrf: headers['x-fleetiq-csrf'],
        origin: headers.origin,
      });
      if (headers['x-fleetiq-csrf'] !== '1' || headers.origin !== url.origin)
        return problem(403);
    }
    if (segments[5] === 'asset-types' && method === 'GET')
      return reply(Wire.DefinitionCataloguePage, {
        definitions: [{ id: 'equipment', version: 1, name: 'Equipment' }],
        next_after: null,
      });
    if (segments[5] === 'protocol-packages')
      return segments[6] === 'teltonika.avl' && segments[8] === '1'
        ? reply(Wire.ProtocolPackageRelease, storedRelease)
        : problem(404);
    if (segments[5] !== 'assets') return problem(404);
    const id = segments[6];
    if (!id) {
      if (method === 'GET')
        return reply(Wire.AssetPage, {
          tenant_id: 'tenant-a',
          assets: [...assets.values()].map((asset) => ({
            ...asset,
            tenant_id: 'tenant-a',
          })),
          next_after: null,
        });
      if (method === 'POST') {
        const body = Schema.decodeUnknownSync(Wire.RegisterAssetRequest)(
          request.postDataJSON(),
        );
        const previous = assets.get(body.id);
        if (previous && JSON.stringify(previous) !== JSON.stringify(body))
          return problem(409);
        assets.set(body.id, body);
        return reply(
          Wire.MetadataRegistrationResult,
          {
            outcome: previous ? 'already_registered' : 'registered',
            registered_by: 'operator-a',
            recorded_at_ms: 1700000000000,
          },
          previous ? 200 : 201,
        );
      }
    }
    if (!id) return problem(404);
    if (segments[7] === 'device') {
      if (method === 'GET')
        return devices.has(id)
          ? reply(Wire.CommunicationDevice, devices.get(id))
          : problem(404);
      if (method === 'POST') {
        if (!assets.has(id)) return problem(404);
        const body = Schema.decodeUnknownSync(
          Wire.RegisterCommunicationDeviceRequest,
        )(request.postDataJSON());
        const previous = devices.get(id),
          value = {
            tenant_id: 'tenant-a',
            asset_id: id,
            endpoints: body.endpoints,
          };
        if (previous && JSON.stringify(previous) !== JSON.stringify(value))
          return problem(409);
        devices.set(id, value);
        if (ambiguous) {
          ambiguous = false;
          return problem(503);
        }
        return reply(
          Wire.MetadataRegistrationResult,
          {
            outcome: previous ? 'already_registered' : 'registered',
            registered_by: 'operator-a',
            recorded_at_ms: 1700000000000,
          },
          previous ? 200 : 201,
        );
      }
    }
    if (segments[7] === 'ingestion-diagnostics')
      return devices.has(id)
        ? reply(Wire.IngestionDiagnostics, diagnosticsEvidence(traffic.has(id)))
        : problem(404);
    if (segments[7] === 'protocol-routes') {
      const channel = segments[8] ?? '',
        key = JSON.stringify([id, channel]);
      const previous = routes.get(key);
      if (method === 'GET')
        return previous
          ? reply(Wire.ProtocolDeviceRoute, previous)
          : problem(404);
      if (method === 'PUT') {
        const body = Schema.decodeUnknownSync(Wire.ChangeProtocolRouteRequest)(
          request.postDataJSON(),
        );
        if (
          conflict ||
          !devices.has(id) ||
          body.expected_revision !== (previous?.revision ?? 0) ||
          body.selection?.package_id === 'missing.package'
        )
          return problem(409);
        const value = {
          ...activeRoute,
          device_asset_id: id,
          channel_id: channel,
          revision: (previous?.revision ?? 0) + 1,
          selection: body.selection,
          policy_version: body.selection === null ? null : 1,
        };
        routes.set(
          key,
          Schema.decodeUnknownSync(Wire.ProtocolDeviceRoute)(value),
        );
        return reply(Wire.ProtocolDeviceRoute, value);
      }
    }
    return problem(404);
  });
  return {
    commands,
    emitTraffic: (id: string) => traffic.add(id),
    setConflict: (value: boolean) => {
      conflict = value;
    },
  };
}
