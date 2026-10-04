import assert from 'node:assert/strict';
import test from 'node:test';
import { contractFixtures } from '@fleetiq/api-contract';
import { listFixtureAssets } from './fixtureAssetCatalogue.ts';

test('native fixture adapter returns validated synthetic data for its tenant', async () => {
  assert.deepEqual(
    await listFixtureAssets('tenant-a'),
    contractFixtures.assetPage,
  );
  await assert.rejects(listFixtureAssets('tenant-b'), /No contract fixture/);
});
