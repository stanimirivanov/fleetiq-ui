import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contractFixtures } from '@fleetiq/api-contract';
import { CatalogueRequestError, parseTenantAssetPage } from './index.ts';

test('tenant page validation is shared by both app adapters', () => {
  assert.deepEqual(
    parseTenantAssetPage(contractFixtures.assetPage, 'tenant-a'),
    contractFixtures.assetPage,
  );
  assert.throws(
    () => parseTenantAssetPage(contractFixtures.assetPage, 'tenant-b'),
    (error) =>
      error instanceof CatalogueRequestError && error.kind === 'failure',
  );
});
