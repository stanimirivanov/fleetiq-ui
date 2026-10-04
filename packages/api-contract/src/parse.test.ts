import assert from 'node:assert/strict';
import test from 'node:test';
import { contractFixtures } from './fixtures.ts';
import { parseApiDescription, parseAssetPage, parseProblem } from './parse.ts';

test('published fixtures parse at the external-data boundary', () => {
  assert.deepEqual(
    parseApiDescription(contractFixtures.discovery),
    contractFixtures.discovery,
  );
  assert.deepEqual(
    parseAssetPage(contractFixtures.assetPage),
    contractFixtures.assetPage,
  );
  for (const problem of [
    contractFixtures.invalidRequest,
    contractFixtures.unauthenticated,
    contractFixtures.forbidden,
    contractFixtures.internalError,
  ]) {
    assert.deepEqual(parseProblem(problem), problem);
  }
});

test('malformed identifiers, versions, cursors and problems are rejected', () => {
  assert.throws(() => parseAssetPage({ assets: [{}], next_after: null }));
  assert.throws(() => parseAssetPage({ assets: [], next_after: 42 }));
  assert.throws(() =>
    parseAssetPage({
      assets: [
        {
          ...contractFixtures.assetPage.assets[0],
          asset_type: { id: 'generic.machine', version: 0 },
        },
      ],
      next_after: null,
    }),
  );
  assert.throws(() => parseProblem({ type: 'x', title: 'x', status: 200 }));
  assert.throws(() =>
    parseApiDescription({ service: 'FleetIQ', version: 'v2' }),
  );
});
