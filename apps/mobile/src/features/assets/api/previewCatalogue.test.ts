import assert from 'node:assert/strict';
import test from 'node:test';
import { contractFixtures } from '@fleetiq/api-contract';
import { createPreviewAssetPageLoader } from './previewCatalogue.ts';

test('native preview adapter returns tenant-scoped contract data', async () => {
  const load = createPreviewAssetPageLoader();
  assert.deepEqual(
    await load('tenant-a', null, new AbortController().signal),
    contractFixtures.assetPage,
  );
  await assert.rejects(load('tenant-b', null, new AbortController().signal));
  await assert.rejects(load('tenant-a', 'cursor-1', new AbortController().signal));
});
