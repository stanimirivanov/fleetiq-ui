import {
  type AssetPage,
  parseAssetPage,
  parseProblem,
} from '@fleetiq/api-contract';

/** A page request independent of web or native presentation. */
export type AssetPageLoader = (
  tenantId: string,
  after: string | null,
  signal: AbortSignal,
) => Promise<AssetPage>;

export type CatalogueErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid'
  | 'failure';

export class CatalogueRequestError extends Error {
  readonly kind: CatalogueErrorKind;

  constructor(kind: CatalogueErrorKind) {
    super(kind);
    this.kind = kind;
    this.name = 'CatalogueRequestError';
  }
}

/** Reject a valid page whose rows belong to another tenant. */
export function parseTenantAssetPage(
  value: unknown,
  tenantId: string,
): AssetPage {
  const page = parseAssetPage(value);
  if (page.assets.some((asset) => asset.tenant_id !== tenantId)) {
    throw new CatalogueRequestError('failure');
  }
  return page;
}

type HttpLoaderOptions = {
  origin: string;
  authorization: () => string | Promise<string>;
  fetcher?: typeof fetch;
};

/** Shared HTTP boundary; each app supplies its own identity and fetch runtime. */
export function createHttpAssetPageLoader({
  origin,
  authorization,
  fetcher,
}: HttpLoaderOptions): AssetPageLoader {
  return async (tenantId, after, signal) => {
    if (
      tenantId.length < 1 ||
      tenantId.length > 128 ||
      (after !== null && (after.length < 1 || after.length > 128))
    ) {
      throw new CatalogueRequestError('invalid');
    }

    const path = [
      '/api/v1/tenants',
      encodeURIComponent(tenantId),
      'assets',
    ].join('/');
    const url = new URL(path, origin);
    if (after !== null) url.searchParams.set('after', after);
    const response = await (fetcher ?? fetch)(url, {
      headers: { Authorization: await authorization() },
      signal,
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      const problem = parseProblem(payload);
      if (problem.status !== response.status) {
        throw new CatalogueRequestError('failure');
      }
      if (response.status === 401)
        throw new CatalogueRequestError('unauthorized');
      if (response.status === 403) throw new CatalogueRequestError('forbidden');
      if (response.status === 400) throw new CatalogueRequestError('invalid');
      throw new CatalogueRequestError('failure');
    }

    if (response.status !== 200) throw new CatalogueRequestError('failure');
    return parseTenantAssetPage(payload, tenantId);
  };
}
