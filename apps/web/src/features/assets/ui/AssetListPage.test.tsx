import './setupDom.ts';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { contractFixtures, type AssetPage } from '@fleetiq/api-contract';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { CatalogueRequestError, type AssetPageLoader } from '../api/previewCatalogue';
import { AssetIdentityPage } from './AssetIdentityPage';
import { AssetListPage } from './AssetListPage';

afterEach(cleanup);

function renderCatalogue(loader?: AssetPageLoader) {
  return render(
    <MemoryRouter initialEntries={['/tenants/tenant-a/assets']}>
      <Routes>
        <Route path="/tenants/:tenantId/assets" element={<AssetListPage tenantId="tenant-a" loadPage={loader} />} />
        <Route path="/tenants/:tenantId/assets/:assetId" element={<AssetIdentityPage tenantId="tenant-a" assetId="asset-1" />} />
      </Routes>
    </MemoryRouter>,
  );
}

test('preview shows contract identity and navigates without claiming live detail', async () => {
  const calls: Array<{ tenantId: string; after: string | null }> = [];
  const loader: AssetPageLoader = async (tenantId, after) => {
    calls.push({ tenantId, after });
    return contractFixtures.assetPage;
  };
  renderCatalogue(loader);
  assert.match(screen.getByRole('status').textContent ?? '', /Loading assets/);
  const link = await screen.findByRole('link', { name: /Primary machine/ });
  assert.match(link.textContent ?? '', /Condition unknown/);
  assert.deepEqual(calls, [{ tenantId: 'tenant-a', after: null }]);
  fireEvent.click(link);
  assert.ok(screen.getByRole('heading', { name: 'Detail not connected' }));
});

test('empty and failed catalogues have distinct visible states and retry', async () => {
  const empty: AssetPage = { assets: [], next_after: null };
  let calls = 0;
  const loader: AssetPageLoader = async () => {
    calls += 1;
    if (calls === 1) throw new Error('offline');
    return empty;
  };
  renderCatalogue(loader);
  assert.match((await screen.findByRole('alert')).textContent ?? '', /could not be loaded/);
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  assert.ok(await screen.findByText('No assets are registered for this tenant.'));
  assert.equal(calls, 2);
});

test('unconnected production view makes no request', () => {
  renderCatalogue();
  assert.ok(screen.getByRole('heading', { name: 'Catalogue not connected' }));
  assert.equal(screen.queryByText('Primary machine'), null);
});

test('cursor paging appends the next page without replacing current assets', async () => {
  const first: AssetPage = { ...contractFixtures.assetPage, next_after: 'cursor-1' };
  const second: AssetPage = {
    assets: [{ ...contractFixtures.assetPage.assets[0]!, id: 'asset-2', name: 'Second machine' }],
    next_after: null,
  };
  const calls: Array<string | null> = [];
  const loader: AssetPageLoader = async (_tenantId, after) => {
    calls.push(after);
    return after === null ? first : second;
  };
  renderCatalogue(loader);
  fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
  assert.ok(await screen.findByText('Second machine'));
  assert.ok(screen.getByText('Primary machine'));
  assert.deepEqual(calls, [null, 'cursor-1']);
});
test('permission failure is stated without exposing response internals', async () => {
  const loader: AssetPageLoader = async () => {
    throw new CatalogueRequestError('forbidden');
  };
  renderCatalogue(loader);
  assert.match((await screen.findByRole('alert')).textContent ?? '', /do not have access/);
});

test('changing tenant cancels the old request and does not show its assets', async () => {
  let resolveFirst: ((page: AssetPage) => void) | undefined;
  let oldSignal: AbortSignal | undefined;
  const loader: AssetPageLoader = async (tenantId, _after, signal) => {
    if (tenantId === 'tenant-a') {
      oldSignal = signal;
      return new Promise<AssetPage>((resolve) => {
        resolveFirst = resolve;
      });
    }
    return { assets: [], next_after: null };
  };
  const view = render(
    <MemoryRouter>
      <AssetListPage tenantId="tenant-a" loadPage={loader} />
    </MemoryRouter>,
  );
  view.rerender(
    <MemoryRouter>
      <AssetListPage tenantId="tenant-b" loadPage={loader} />
    </MemoryRouter>,
  );
  assert.equal(oldSignal?.aborted, true);
  resolveFirst?.(contractFixtures.assetPage);
  assert.ok(await screen.findByText('No assets are registered for this tenant.'));
  assert.equal(screen.queryByText('Primary machine'), null);
});
