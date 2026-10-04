import {
  parseAssetPage,
  parseProblem,
  type AssetPage,
} from '@fleetiq/api-contract';

/** One page of the preview catalogue. The caller owns cancellation and paging. */
export type AssetPageLoader = (
  tenantId: string,
  after: string | null,
  signal: AbortSignal,
) => Promise<AssetPage>;

export type CatalogueErrorKind = 'unauthorized' | 'forbidden' | 'invalid' | 'failure';

export class CatalogueRequestError extends Error {
  readonly kind: CatalogueErrorKind;

  constructor(kind: CatalogueErrorKind) {
    super(kind);
    this.kind = kind;
    this.name = 'CatalogueRequestError';
  }
}

/**
 * Build a development-only HTTP adapter. Its synthetic bearer value is accepted
 * only by MSW and must never be used as a real backend credential.
 */
export function createPreviewAssetPageLoader(origin: string): AssetPageLoader {
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
    const response = await fetch(url, {
      headers: { Authorization: 'Bearer contract-preview-only' },
      signal,
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const problem = parseProblem(payload);
      if (problem.status !== response.status) {
        throw new CatalogueRequestError('failure');
      }
      if (response.status === 401) throw new CatalogueRequestError('unauthorized');
      if (response.status === 403) throw new CatalogueRequestError('forbidden');
      if (response.status === 400) throw new CatalogueRequestError('invalid');
      throw new CatalogueRequestError('failure');
    }

    if (response.status !== 200) throw new CatalogueRequestError('failure');
    const page = parseAssetPage(payload);
    if (page.assets.some((asset) => asset.tenant_id !== tenantId)) {
      throw new CatalogueRequestError('failure');
    }
    return page;
  };
}
