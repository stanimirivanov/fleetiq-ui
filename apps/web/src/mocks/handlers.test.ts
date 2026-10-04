import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  contractFixtures,
  parseApiDescription,
  parseAssetPage,
  parseProblem,
} from '@fleetiq/api-contract';
import { setupServer } from 'msw/node';
import { handlers } from './handlers.ts';

const server = setupServer(...handlers);
before(() => server.listen({ onUnhandledFrame: 'error' }));
after(() => server.close());

test('mocked discovery and authorized catalogue satisfy the shared parsers', async () => {
  const discovery = await fetch('http://localhost/api/v1');
  assert.equal(discovery.status, 200);
  assert.deepEqual(
    parseApiDescription(await discovery.json()),
    contractFixtures.discovery,
  );

  const response = await fetch(
    'http://localhost/api/v1/tenants/tenant-a/assets?limit=1',
    {
      headers: { Authorization: 'Bearer development-only' },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(
    parseAssetPage(await response.json()),
    contractFixtures.assetPage,
  );
});

test('mocked catalogue exposes unauthorized, invalid and empty states', async () => {
  const base = 'http://localhost/api/v1/tenants/tenant-a/assets';
  const unauthorized = await fetch(base);
  assert.equal(unauthorized.status, 401);
  assert.equal(
    unauthorized.headers.get('content-type'),
    'application/problem+json',
  );
  assert.deepEqual(
    parseProblem(await unauthorized.json()),
    contractFixtures.unauthenticated,
  );

  const invalid = await fetch(new URL('?limit=0', base), {
    headers: { Authorization: 'Bearer development-only' },
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(
    parseProblem(await invalid.json()),
    contractFixtures.invalidRequest,
  );

  const empty = await fetch(new URL('?after=asset-1', base), {
    headers: { Authorization: 'Bearer development-only' },
  });
  assert.deepEqual(parseAssetPage(await empty.json()), {
    assets: [],
    next_after: null,
  });
});
