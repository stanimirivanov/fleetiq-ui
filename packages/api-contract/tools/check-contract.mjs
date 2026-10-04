import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { contractFixtures } from '../src/fixtures.ts';

const root = new URL('../', import.meta.url);
const bytes = await readFile(
  new URL('fleetiq-v1-ui-baseline.openapi.json', root),
);
const expectedHash = (
  await readFile(new URL('contract.sha256', root), 'utf8')
).trim();
const actualHash = createHash('sha256').update(bytes).digest('hex');
assert.equal(
  actualHash,
  expectedHash,
  'Backend contract changed: review and repin the artifact',
);

const contract = JSON.parse(bytes.toString('utf8'));
assert.equal(contract.openapi, '3.1.1');
assert.equal(contract.info.version, '1.0.0-baseline.1');

function responseExample(path, status) {
  let response = contract.paths[path].get.responses[status];
  if (response.$ref) {
    response = contract.components.responses[response.$ref.split('/').at(-1)];
  }
  const media =
    status === '200' ? 'application/json' : 'application/problem+json';
  return response.content[media].example;
}

assert.deepEqual(contractFixtures.discovery, responseExample('/api/v1', '200'));
const assetsPath = '/api/v1/tenants/{tenant_id}/assets';
for (const [fixture, status] of [
  ['assetPage', '200'],
  ['invalidRequest', '400'],
  ['unauthenticated', '401'],
  ['forbidden', '403'],
  ['internalError', '500'],
]) {
  assert.deepEqual(
    contractFixtures[fixture],
    responseExample(assetsPath, status),
    fixture,
  );
}
console.log(
  'Pinned contract hash and all response fixtures match the backend artifact',
);
