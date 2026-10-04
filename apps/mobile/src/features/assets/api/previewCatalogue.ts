import { contractFixtures } from '@fleetiq/api-contract';
import {
  CatalogueRequestError,
  parseTenantAssetPage,
  type AssetPageLoader,
} from '@fleetiq/asset-catalogue';

/** Native development adapter for the same page-loader boundary as web. */
export function createPreviewAssetPageLoader(): AssetPageLoader {
  return async (tenantId, after, signal) => {
    if (signal.aborted) throw new CatalogueRequestError('failure');
    if (after !== null) throw new CatalogueRequestError('invalid');
    return parseTenantAssetPage(contractFixtures.assetPage, tenantId);
  };
}
