import type { Page } from '@playwright/test';
import {
  catalogueRecords,
  publishedBinding,
  publishedProperty,
  publishedRelationship,
  publishedRelationshipType,
  publishedType,
  type ResponseKind,
  validatedPayload,
} from './contract-examples';

export interface ApiRequestEvidence {
  readonly method: string;
  readonly path: string;
  readonly search: string;
  readonly csrf?: string;
  readonly origin?: string;
  readonly authorization?: string;
}

export interface TenantFixture {
  readonly tenant_id: string;
  readonly actions: readonly (
    | 'metadata.read'
    | 'metadata.manage'
    | 'access.manage'
  )[];
}

export interface MetadataMockOptions {
  readonly tenants?: readonly TenantFixture[];
  readonly tenantPageSize?: number;
  readonly discoveryStatus?: 200 | 401 | 500;
  readonly malformedDiscovery?: boolean;
  readonly catalogueSize?: number;
  readonly sessionStatus?: 200 | 401 | 404 | 500;
  readonly actorId?: string;
  readonly identityDestination?: string;
  /** Model only the fixed server return, never a real provider exchange. */
  readonly simulateSignInReturn?: boolean;
  readonly catalogueStatus?: 200 | 401 | 403 | 500;
  readonly emptyCatalogue?: boolean;
  readonly malformedCatalogue?: boolean;
  readonly wrongTenantCatalogue?: boolean;
  readonly missingAsset?: string;
  readonly logoutStatus?: 204 | 500;
}

/** Explicit test-only responses; no application fixture or provider tokens are used. */
export async function installMetadataApi(
  page: Page,
  options: MetadataMockOptions = {},
) {
  if (
    options.catalogueSize !== undefined &&
    (!Number.isInteger(options.catalogueSize) ||
      options.catalogueSize < 50 ||
      options.catalogueSize > 200)
  )
    throw new Error('Quality catalogue requires 50..200 bounded records');
  const inventory =
    options.catalogueSize === undefined
      ? catalogueRecords
      : [
          ...catalogueRecords,
          ...Array.from(
            { length: options.catalogueSize - catalogueRecords.length },
            (_, index) => ({
              ...catalogueRecords[0],
              id: `zz-fixture-${String(index).padStart(4, '0')}`,
              name: `Fixture machine ${index}`,
            }),
          ),
        ];
  const requests: ApiRequestEvidence[] = [];
  let sessionStatus = options.sessionStatus ?? 200;
  let actorId = options.actorId ?? 'operator-a';
  let catalogueStatus = options.catalogueStatus ?? 200;
  let logoutStatus = options.logoutStatus ?? 204;
  let tenants = options.tenants ?? [
    { tenant_id: 'tenant-a', actions: ['metadata.read'] as const },
  ];
  let discoveryStatus = options.discoveryStatus ?? 200;
  let emptyCatalogue = options.emptyCatalogue ?? false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = request.headers();
    requests.push({
      method: request.method(),
      path: url.pathname,
      search: url.search,
      csrf: headers['x-fleetiq-csrf'],
      origin: headers.origin,
      authorization: headers.authorization,
    });
    const reply = async (
      status: number,
      kind: ResponseKind,
      payload: unknown,
      validate = true,
    ) =>
      route.fulfill({
        status,
        contentType:
          status >= 400 ? 'application/problem+json' : 'application/json',
        headers: {
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        },
        body: JSON.stringify(
          validate ? validatedPayload(kind, payload) : payload,
        ),
      });
    const problem = (status: number) =>
      reply(status, 'problem', {
        type: 'about:blank',
        title:
          status === 401 ? 'Authentication required' : 'Request unavailable',
        status,
      });

    const requiredMethod =
      url.pathname === '/api/v1/auth/logout' ? 'POST' : 'GET';
    if (request.method() !== requiredMethod) return problem(405);
    if (headers.authorization !== undefined) return problem(401);

    if (url.pathname === '/api/v1/auth/session') {
      if (sessionStatus !== 200) return problem(sessionStatus);
      return reply(200, 'session', {
        actor_id: actorId,
        expires_at_ms: Date.now() + 28_800_000,
      });
    }
    if (url.pathname === '/api/v1/auth/logout') {
      if (headers['x-fleetiq-csrf'] !== '1' || headers.origin !== url.origin)
        return problem(403);
      if (logoutStatus === 500) return problem(500);
      sessionStatus = 401;
      return route.fulfill({
        status: 204,
        headers: { 'cache-control': 'no-store' },
      });
    }
    if (url.pathname === '/api/v1/auth/login') {
      if (options.simulateSignInReturn) sessionStatus = 200;
      return route.fulfill({
        status: 303,
        headers: {
          location: options.simulateSignInReturn
            ? '/'
            : (options.identityDestination ??
              `${url.origin}/test-only-identity-provider`),
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        },
      });
    }
    if (sessionStatus !== 200) return problem(401);
    if (url.pathname === '/api/v1/me/tenants') {
      if (discoveryStatus !== 200) return problem(discoveryStatus);
      const after = url.searchParams.get('after');
      const offset =
        after === null
          ? 0
          : tenants.findIndex((tenant) => tenant.tenant_id === after) + 1;
      const limit = Math.min(
        Number(url.searchParams.get('limit') ?? 50),
        options.tenantPageSize ?? 50,
      );
      const entries = tenants.slice(offset, offset + limit);
      return reply(
        200,
        'tenants',
        options.malformedDiscovery
          ? { tenants: 'invalid', next_after: null }
          : {
              tenants: entries,
              next_after:
                offset + entries.length < tenants.length
                  ? (entries.at(-1)?.tenant_id ?? null)
                  : null,
            },
        !options.malformedDiscovery,
      );
    }
    if (!url.pathname.startsWith('/api/v1/tenants/tenant-a/'))
      return problem(403);

    const resource = url.pathname.slice('/api/v1/tenants/tenant-a/'.length);
    const parts = resource.split('/').map(decodeURIComponent);
    const effectiveAtMs = Number(url.searchParams.get('effective_at_ms'));
    const knownAtMs = Number(url.searchParams.get('known_at_ms'));
    const snapshot = {
      effective_at_ms: effectiveAtMs,
      known_at_ms: knownAtMs,
      next_after: null,
    };
    const binding = publishedBinding;
    const relationship = publishedRelationship;
    if (!binding || !relationship)
      throw new Error('Missing published evidence');

    if (resource === 'assets') {
      if (catalogueStatus !== 200) return problem(catalogueStatus);
      if (options.malformedCatalogue)
        return reply(
          200,
          'catalogue',
          { assets: [{ secret: 'untrusted-wire-detail' }], next_after: null },
          false,
        );
      const after = url.searchParams.get('after');
      const first = after === null;
      const offset =
        after === null
          ? 0
          : inventory.findIndex((entry) => entry.id === after) + 1;
      const bounded = inventory.slice(
        offset,
        offset + Number(url.searchParams.get('limit') ?? 50),
      );
      const records = emptyCatalogue
        ? []
        : options.catalogueSize !== undefined
          ? bounded
          : first
            ? catalogueRecords.slice(0, 2)
            : catalogueRecords.slice(2);
      return reply(200, 'catalogue', {
        assets: records.map(({ external_identifiers: _, ...asset }) => ({
          ...asset,
          tenant_id: options.wrongTenantCatalogue ? 'tenant-b' : 'tenant-a',
        })),
        next_after: emptyCatalogue
          ? null
          : options.catalogueSize !== undefined
            ? offset + bounded.length < inventory.length
              ? bounded.at(-1)?.id
              : null
            : first
              ? 'assembly-a'
              : null,
      });
    }
    if (parts[0] === 'assets' && parts[1]) {
      const assetId = parts[1];
      if (options.missingAsset === assetId) return problem(404);
      const asset = catalogueRecords.find((entry) => entry.id === assetId);
      if (!asset) return problem(404);
      if (parts.length === 2) return reply(200, 'asset', asset);
      if (parts[2] === 'relationships') {
        const continued = url.searchParams.has('after');
        const edge = {
          ...relationship,
          id: continued ? 'relationship-2' : relationship.id,
          source_asset_id: assetId,
          target_asset_id: continued
            ? 'gateway-1'
            : relationship.target_asset_id,
        };
        const effective =
          effectiveAtMs >= 1000 && effectiveAtMs < 3000 && knownAtMs >= 2000;
        return reply(200, 'relationships', {
          ...snapshot,
          asset_id: assetId,
          relationships: effective ? [edge] : [],
          next_after: effective && !continued ? relationship.id : null,
        });
      }
      if (parts[2] === 'signal-bindings') {
        const continued = url.searchParams.has('after');
        const effective =
          assetId === 'power-system-1' &&
          effectiveAtMs >= 1000 &&
          effectiveAtMs < 3000 &&
          knownAtMs >= 2000;
        return reply(200, 'target', {
          ...snapshot,
          asset_id: assetId,
          bindings: effective
            ? [{ ...binding, id: continued ? 'binding-2' : binding.id }]
            : [],
          next_after: effective && !continued ? binding.id : null,
        });
      }
    }
    if (resource === 'signal-bindings') {
      const source = {
        device_asset_id: url.searchParams.get('device_asset_id'),
        endpoint_id: url.searchParams.get('endpoint_id'),
        signal_id: url.searchParams.get('signal_id'),
      };
      const continued = url.searchParams.has('after');
      const effective =
        effectiveAtMs >= 1000 &&
        effectiveAtMs < 3000 &&
        knownAtMs >= 2000 &&
        source.device_asset_id === binding.source.device_asset_id &&
        source.endpoint_id === binding.source.endpoint_id &&
        source.signal_id === binding.source.signal_id;
      return reply(200, 'source', {
        ...snapshot,
        source,
        bindings: effective
          ? [
              {
                ...binding,
                id: continued ? 'binding-2' : binding.id,
                target: continued
                  ? { ...binding.target, asset_id: 'assembly-a' }
                  : binding.target,
              },
            ]
          : [],
        next_after: effective && !continued ? binding.id : null,
      });
    }
    if (parts[0] === 'asset-types') {
      return reply(200, 'assetType', {
        ...publishedType,
        id: parts[1],
        version: Number(parts[3]),
        name: parts[1] === 'generic.machine' ? 'Machine' : publishedType.name,
      });
    }
    if (parts[0] === 'properties') {
      const voltage = parts[1] === 'electrical.voltage';
      return reply(200, 'property', {
        ...publishedProperty,
        id: parts[1],
        version: Number(parts[3]),
        name: voltage ? 'Supply voltage' : publishedProperty.name,
        canonical_unit: voltage ? 'V' : publishedProperty.canonical_unit,
      });
    }
    if (parts[0] === 'relationship-types') {
      return reply(200, 'relationshipType', {
        ...publishedRelationshipType,
        id: parts[1],
        version: Number(parts[3]),
      });
    }
    return problem(404);
  });
  return {
    requests,
    setTenants(value: readonly TenantFixture[]) {
      tenants = value;
    },
    setDiscoveryStatus(value: 200 | 401 | 500) {
      discoveryStatus = value;
    },
    setEmptyCatalogue(empty: boolean) {
      emptyCatalogue = empty;
    },
    setActorId(id: string) {
      actorId = id;
    },
    setSessionStatus(status: 200 | 401 | 404 | 500) {
      sessionStatus = status;
    },
    setLogoutStatus(status: 204 | 500) {
      logoutStatus = status;
    },
    setCatalogueStatus(status: 200 | 401 | 403 | 500) {
      catalogueStatus = status;
    },
  };
}

/** Legacy production cases explicitly model a deployment without browser sign-in. */
export async function mockUnavailableSignIn(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/session', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/problem+json',
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Not found',
        status: 404,
      }),
    }),
  );
}
