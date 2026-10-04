import {
  createHttpAssetPageLoader,
  type AssetPageLoader,
} from '@fleetiq/asset-catalogue';

export {
  CatalogueRequestError,
  type CatalogueErrorKind,
  type AssetPageLoader,
} from '@fleetiq/asset-catalogue';

/**
 * Web-only development adapter. Its synthetic bearer value is accepted only
 * by MSW and must never be used as a real backend credential.
 */
export function createPreviewAssetPageLoader(origin: string): AssetPageLoader {
  return createHttpAssetPageLoader({
    origin,
    authorization: () => 'Bearer contract-preview-only',
  });
}
