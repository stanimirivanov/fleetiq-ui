import {
  contractFixtures,
  parseAssetPage,
  type AssetPage,
} from '@fleetiq/api-contract';

/** Explicit fixture adapter for native development; it never contacts the backend. */
export async function listFixtureAssets(tenantId: string): Promise<AssetPage> {
  if (tenantId !== contractFixtures.assetPage.assets[0]?.tenant_id) {
    throw new Error('No contract fixture exists for this tenant');
  }
  return parseAssetPage(contractFixtures.assetPage);
}
