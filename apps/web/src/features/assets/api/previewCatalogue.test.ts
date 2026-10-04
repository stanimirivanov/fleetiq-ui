import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { contractFixtures } from '@fleetiq/api-contract';
import { HttpResponse, http } from 'msw/http';
import { setupServer } from 'msw/node';
import { handlers } from '../../../mocks/handlers.ts';
import {
  CatalogueRequestError,
  createPreviewAssetPageLoader,
} from './previewCatalogue.ts';

const server = setupServer(...handlers);
const load = createPreviewAssetPageLoader('http://localhost');

before(() => server.listen({ onUnhandledFrame: 'error' }));
after(() => server.close());

test('preview adapter validates the catalogue and preserves tenant scope', async () => {
  const page = await load('tenant-a', null, new AbortController().signal);
  assert.deepEqual(page, contractFixtures.assetPage);
  await assert.rejects(load('tenant-b', null, new AbortController().signal), {
    name: 'CatalogueRequestError',
    kind: 'forbidden',
  });
});

test('preview adapter rejects an asset from another tenant', async () => {
  server.use(
    http.get('*/api/v1/tenants/:tenantId/assets', () =>
      HttpResponse.json({
        ...contractFixtures.assetPage,
        assets: [
          {
            ...contractFixtures.assetPage.assets[0],
            tenant_id: 'tenant-b',
          },
        ],
      }),
    ),
  );
  await assert.rejects(load('tenant-a', null, new AbortController().signal), {
    name: 'CatalogueRequestError',
    kind: 'failure',
  });
  server.resetHandlers();
});

test('preview adapter classifies missing access without leaking problem text', async () => {
  server.use(
    http.get('*/api/v1/tenants/:tenantId/assets', () =>
      HttpResponse.json(contractFixtures.unauthenticated, {
        status: 401,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    ),
  );
  await assert.rejects(load('tenant-a', null, new AbortController().signal), (error) => {
    assert(error instanceof CatalogueRequestError);
    assert.equal(error.kind, 'unauthorized');
    return true;
  });
  server.resetHandlers();
});
