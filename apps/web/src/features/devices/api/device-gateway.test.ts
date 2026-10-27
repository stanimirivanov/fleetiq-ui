import { describe, expect, it } from 'vitest';
import { createBrowserApi } from '#shared/api';
import {
  activeRoute,
  diagnosticsEvidence,
  storedRelease,
} from '../fixtures/evidence';
import {
  deviceQuery,
  validAsset,
  validEndpoints,
  validText,
} from '../model/devices';
import { createDeviceGateway } from './device-gateway';
import { checkDiagnostics, checkRoute } from './validation';

const scope = { tenant: 'tenant-a', device: 'gateway-new', channel: 'tcp' };
describe('device commissioning boundaries', () => {
  it('keeps opaque Unicode IDs and rejects controls, duplicate declarations and malformed context', () => {
    expect(validText('機器-1')).toBe(true);
    expect(validText(' leading')).toBe(false);
    expect(validText(String.fromCodePoint(128))).toBe(false);
    expect(
      validEndpoints([
        { id: 'a', kind: 'can', name: 'Bus' },
        { id: 'a', kind: 'can', name: 'Other' },
      ]),
    ).toBe(false);
    const draft = {
      id: 'x',
      name: 'Gateway',
      asset_type: { id: 'equipment', version: 1 },
      external_identifiers: [
        { kind: 'imei', authority: null, value: '123' },
        { kind: 'imei', authority: null, value: '123' },
      ],
    };
    expect(validAsset(draft)).toBe(false);
    expect(deviceQuery('?tenant=a&tenant=b').valid).toBe(false);
    expect(deviceQuery('?tenant=a&type_after_id=equipment').valid).toBe(false);
    expect(deviceQuery('?tenant=a&asset_after=x&asset_after=y').valid).toBe(
      false,
    );
    expect(
      deviceQuery('?tenant=a&type_after_id=equipment&type_after_version=2')
        .valid,
    ).toBe(true);
    expect(deviceQuery('?tenant=a&device=b&channel=bad/channel').valid).toBe(
      false,
    );
  });
  it('validates sampled evidence, safe precision, duplicates and independent replay/decode facts', () => {
    expect(checkDiagnostics(diagnosticsEvidence(true)).frames).toHaveLength(64);
    const pending = diagnosticsEvidence();
    pending.frames.push({
      message_id: 'pending-marker',
      package_id: 'teltonika.avl',
      package_version: '1',
      received_at_ms: 1,
      processing: 'queued',
      observation_count: 0,
    });
    expect(checkDiagnostics(pending).frames[0]?.processing).toBe('queued');
    expect(() =>
      checkDiagnostics({
        ...diagnosticsEvidence(),
        observed_at_ms: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow('invalid');
    const duplicate = diagnosticsEvidence(true);
    duplicate.sources.push({
      package_id: 'teltonika.avl',
      package_version: '1',
      endpoint_id: 'can-primary',
      signal_id: 'battery.voltage',
    });
    expect(() => checkDiagnostics(duplicate)).toThrow('invalid');
    expect(() =>
      checkRoute({ ...activeRoute, device_asset_id: 'foreign' }, scope),
    ).toThrow('invalid');
    expect(() =>
      checkRoute({ ...activeRoute, selection: null, policy_version: 1 }, scope),
    ).toThrow('invalid');
  });
  it('uses generated decoding, exact paths and CSRF, and distinguishes conflicts', async () => {
    const requests: { url: string; init: RequestInit | undefined }[] = [];
    const browser = createBrowserApi({
      origin: 'https://fleet.test',
      fetch: async (input, init) => {
        requests.push({ url: String(input), init });
        const url = String(input);
        return new Response(
          JSON.stringify(
            url.includes('/protocol-routes/')
              ? activeRoute
              : url.includes('/protocol-packages/')
                ? storedRelease
                : {
                    outcome: 'registered',
                    registered_by: 'operator-a',
                    recorded_at_ms: 1,
                  },
          ),
          { status: 200 },
        );
      },
    });
    const gateway = createDeviceGateway(browser);
    try {
      await gateway.changeRoute(scope, 0, activeRoute.selection);
      expect(
        new Headers(requests[0]?.init?.headers).get('x-fleetiq-csrf'),
      ).toBe('1');
      expect(new Headers(requests[0]?.init?.headers).has('authorization')).toBe(
        false,
      );
      expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
        expected_revision: 0,
        selection: activeRoute.selection,
      });
      expect(await gateway.release(activeRoute.selection, 'tenant-a')).toEqual(
        storedRelease,
      );
      await gateway.registerAsset('tenant-a', {
        id: 'new',
        name: 'Gateway',
        asset_type: { id: 'equipment', version: 1 },
        external_identifiers: [],
      });
      await expect(
        gateway.registerDevice(scope, [
          { id: 'dup', name: 'One', kind: 'can' },
          { id: 'dup', name: 'Two', kind: 'can' },
        ]),
      ).rejects.toMatchObject({ kind: 'invalid-request' });
    } finally {
      await browser.dispose();
    }
    const conflict = createBrowserApi({
      origin: 'https://fleet.test',
      fetch: async () =>
        new Response('not a problem document', { status: 409 }),
    });
    try {
      await expect(
        createDeviceGateway(conflict).changeRoute(scope, 0, null),
      ).rejects.toMatchObject({ kind: 'conflict' });
    } finally {
      await conflict.dispose();
    }
  });
  it('rejects foreign device scope and contradictory generated route variants', async () => {
    const browser = createBrowserApi({
      origin: 'https://fleet.test',
      fetch: async () =>
        new Response(
          JSON.stringify({
            ...activeRoute,
            selection: null,
            policy_version: 1,
          }),
        ),
    });
    try {
      await expect(
        createDeviceGateway(browser).route(scope),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    } finally {
      await browser.dispose();
    }
    const foreign = createBrowserApi({
      origin: 'https://fleet.test',
      fetch: async () =>
        new Response(
          JSON.stringify({
            tenant_id: 'tenant-b',
            asset_id: 'gateway-new',
            endpoints: [],
          }),
        ),
    });
    try {
      await expect(
        createDeviceGateway(foreign).device(scope),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    } finally {
      await foreign.dispose();
    }
  });
});

it('bounds catalogue and diagnostic reads and rejects nonadvancing discovery pages', async () => {
  const received: string[] = [];
  let broken = false;
  const browser = createBrowserApi({
    origin: 'https://fleet.test',
    fetch: async (input, init) => {
      const path = new URL(String(input)).pathname;
      received.push(path);
      const payload = path.endsWith('/asset-types')
        ? {
            definitions: [{ id: 'equipment', version: 1, name: 'Equipment' }],
            next_after: broken ? { id: 'other', version: 1 } : null,
          }
        : path.endsWith('/ingestion-diagnostics')
          ? diagnosticsEvidence()
          : path.endsWith('/device')
            ? init?.method === 'POST'
              ? {
                  outcome: 'registered',
                  registered_by: 'operator-a',
                  recorded_at_ms: 1,
                }
              : {
                  tenant_id: 'tenant-a',
                  asset_id: 'gateway-new',
                  endpoints: [],
                }
            : {
                tenant_id: broken ? 'foreign' : 'tenant-a',
                assets: [
                  {
                    id: 'gateway-new',
                    tenant_id: broken ? 'foreign' : 'tenant-a',
                    name: 'Gateway',
                    asset_type: { id: 'equipment', version: 1 },
                  },
                ],
                next_after: null,
              };
      return new Response(JSON.stringify(payload));
    },
  });
  try {
    const gateway = createDeviceGateway(browser);
    expect((await gateway.assets('tenant-a', undefined)).assets).toHaveLength(
      1,
    );
    expect(
      (await gateway.types('tenant-a', null)).definitions[0]?.version,
    ).toBe(1);
    expect((await gateway.device(scope)).endpoints).toEqual([]);
    expect((await gateway.diagnostics(scope)).frames).toEqual([]);
    expect((await gateway.registerDevice(scope, [])).outcome).toBe(
      'registered',
    );
    broken = true;
    await expect(gateway.assets('tenant-a', undefined)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
    await expect(gateway.types('tenant-a', null)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
    const before = received.length;
    await expect(gateway.assets('tenant-a', ' ')).rejects.toMatchObject({
      kind: 'invalid-request',
    });
    await expect(
      gateway.route({ ...scope, channel: 'bad/channel' }),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    await expect(gateway.changeRoute(scope, -1, null)).rejects.toMatchObject({
      kind: 'invalid-request',
    });
    expect(received).toHaveLength(before);
  } finally {
    await browser.dispose();
  }
});
