import type { Effect } from 'effect';
import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { FleetIqApi } from '../../../generated/fleetiq-api';
import {
  type DeviceGateway,
  type Options,
  type Scope,
  validAsset,
  validEndpoints,
  validText,
} from '../model/devices';
import { checkDiagnostics, checkReceipt, checkRoute } from './validation';

/** Generated decoding validates shape; these guards validate scope, precision and command invariants. */
export function createDeviceGateway(browser: BrowserApi): DeviceGateway {
  const scope = (s: Scope) => {
    if (
      !validText(s.tenant) ||
      !validText(s.device) ||
      !/^[A-Za-z0-9_.-]{1,128}$/u.test(s.channel)
    )
      throw new RequestFailure('invalid-request');
  };
  const run = async <A, E>(
    operation: (client: FleetIqApi) => Effect.Effect<A, E>,
    options?: Options,
  ) => browser.run(operation, options);
  const params = { Origin: browser.origin, 'X-FleetIQ-CSRF': '1' as const };
  const tenant = (id: string) => {
    if (!validText(id)) throw new RequestFailure('invalid-request');
  };
  return {
    async assets(id, after, options) {
      tenant(id);
      if (after !== undefined && !validText(after))
        throw new RequestFailure('invalid-request');
      const wire = await run(
        (c) => c.listAssets(id, { params: { limit: 20, after } }),
        options,
      );
      if (
        wire.assets.some((asset) => asset.tenant_id !== id) ||
        wire.assets.length > 20 ||
        new Set(wire.assets.map((a) => a.id)).size !== wire.assets.length ||
        wire.assets.some((a) => !validText(a.id) || a.id === after) ||
        (wire.next_after !== null &&
          (wire.next_after !== wire.assets.at(-1)?.id ||
            wire.next_after === after))
      )
        throw new RequestFailure('invalid-response');
      return wire;
    },
    async types(id, after, options) {
      tenant(id);
      const wire = await run(
        (c) =>
          c.listAssetTypeDefinitions(id, {
            params: {
              limit: 20,
              after_id: after?.id,
              after_version: after?.version,
            },
          }),
        options,
      );
      const keys = wire.definitions.map((d) =>
        JSON.stringify([d.id, d.version]),
      );
      if (
        wire.definitions.length > 20 ||
        new Set(keys).size !== keys.length ||
        wire.definitions.some(
          (d) => !validText(d.id) || !Number.isSafeInteger(d.version),
        ) ||
        (wire.next_after !== null &&
          (wire.next_after.id !== wire.definitions.at(-1)?.id ||
            wire.next_after.version !== wire.definitions.at(-1)?.version ||
            (wire.next_after.id === after?.id &&
              wire.next_after.version === after?.version)))
      )
        throw new RequestFailure('invalid-response');
      return wire;
    },
    async device(s, o) {
      scope(s);
      const wire = await run(
        (c) => c.getCommunicationDevice(s.tenant, s.device, undefined),
        o,
      );
      if (
        wire.tenant_id !== s.tenant ||
        wire.asset_id !== s.device ||
        !validEndpoints(wire.endpoints)
      )
        throw new RequestFailure('invalid-response');
      return wire;
    },
    async diagnostics(s, o) {
      scope(s);
      return checkDiagnostics(
        await run(
          (c) => c.getDeviceIngestionDiagnostics(s.tenant, s.device, undefined),
          o,
        ),
      );
    },
    async route(s, o) {
      scope(s);
      return checkRoute(
        await run(
          (c) =>
            c.getDeviceProtocolRoute(s.tenant, s.device, s.channel, undefined),
          o,
        ),
        s,
      );
    },
    async release(selection, id, o) {
      tenant(id);
      if (
        !validText(selection.package_id) ||
        !validText(selection.package_version)
      )
        throw new RequestFailure('invalid-request');
      const wire = await run(
        (c) =>
          c.getProtocolPackageRelease(
            id,
            selection.package_id,
            selection.package_version,
            undefined,
          ),
        o,
      );
      if (
        wire.package_id !== selection.package_id ||
        wire.package_version !== selection.package_version
      )
        throw new RequestFailure('invalid-response');
      return wire;
    },
    async registerAsset(id, draft, o) {
      tenant(id);
      if (!validAsset(draft)) throw new RequestFailure('invalid-request');
      return checkReceipt(
        await run((c) => c.registerAsset(id, { params, payload: draft }), o),
      );
    },
    async registerDevice(s, endpoints, o) {
      scope(s);
      if (!validEndpoints(endpoints))
        throw new RequestFailure('invalid-request');
      return checkReceipt(
        await run(
          (c) =>
            c.registerCommunicationDevice(s.tenant, s.device, {
              params,
              payload: { endpoints },
            }),
          o,
        ),
      );
    },
    async changeRoute(s, expected, selection, o) {
      scope(s);
      if (
        !Number.isInteger(expected) ||
        expected < 0 ||
        expected > 4294967295 ||
        (selection !== null &&
          (!validText(selection.package_id) ||
            !validText(selection.package_version)))
      )
        throw new RequestFailure('invalid-request');
      return checkRoute(
        await run(
          (c) =>
            c.changeDeviceProtocolRoute(s.tenant, s.device, s.channel, {
              params,
              payload: { expected_revision: expected, selection },
            }),
          o,
        ),
        s,
      );
    },
  };
}
