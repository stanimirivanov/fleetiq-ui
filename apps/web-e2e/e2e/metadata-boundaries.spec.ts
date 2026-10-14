import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { OperatorSessionPage } from '../pages/operator-session.page';

test('an empty tenant catalogue is explicit and has no synthetic fallback', async ({
  page,
}) => {
  await installMetadataApi(page, { emptyCatalogue: true });
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue();
  await expect(
    page.getByRole('status').filter({ hasText: /no assets|empty/i }),
  ).toBeVisible();
  await expect(metadata.catalogue).toHaveCount(0);
  await expect(page.getByText('Primary machine', { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText('Sample data', { exact: true })).toHaveCount(0);
});

test('permission denial leaves the operator signed in and protected rows hidden', async ({
  page,
}) => {
  await installMetadataApi(page, { catalogueStatus: 403 });
  const metadata = new ConnectedMetadataPage(page);
  const session = new OperatorSessionPage(page);
  await metadata.openCatalogue();
  await expect(page.getByRole('alert')).toContainText(
    /permission|forbidden|not authorized|not permitted/i,
  );
  await expect(metadata.catalogue).toHaveCount(0);
  await session.openAccount();
  await expect(session.actor('operator-a')).toBeVisible();
  await expect(session.signedOut).toHaveCount(0);
});

for (const failure of ['malformed', 'cross-tenant'] as const) {
  test(`a ${failure} response is rejected before catalogue records reach the view`, async ({
    page,
  }) => {
    await installMetadataApi(page, {
      malformedCatalogue: failure === 'malformed',
      wrongTenantCatalogue: failure === 'cross-tenant',
    });
    const metadata = new ConnectedMetadataPage(page);
    await metadata.openCatalogue();
    await expect(page.getByRole('alert')).toContainText(
      /invalid response|invalid.*data|contract/i,
    );
    await expect(metadata.catalogue).toHaveCount(0);
    await expect(
      page.getByText('Primary machine', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('untrusted-wire-detail', { exact: true }),
    ).toHaveCount(0);
  });
}

test('a missing asset remains a missing identity rather than sample detail', async ({
  page,
}) => {
  await installMetadataApi(page, { missingAsset: 'asset-1' });
  await page.goto('/assets/asset-1?tenant=tenant-a&preview=sample');
  const metadata = new ConnectedMetadataPage(page);
  await expect(page.getByRole('alert')).toContainText(
    /not found|does not exist|missing/i,
  );
  await expect(metadata.identity).toHaveCount(0);
  await expect(page.getByText('SN-100', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Synthetic signal playback' }),
  ).toHaveCount(0);
});

test('a failed read can be retried without losing tenant and page selection', async ({
  page,
}) => {
  const api = await installMetadataApi(page, { catalogueStatus: 500 });
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue('&after=assembly-a');
  await expect(page.getByRole('alert')).toContainText(
    /unavailable|could not|failed/i,
  );
  api.setCatalogueStatus(200);
  await page
    .getByRole('button', { name: 'Retry asset catalogue', exact: true })
    .click();
  await expect(metadata.asset('Power system')).toBeVisible();
  await expect(page).toHaveURL(/tenant=tenant-a.*after=assembly-a/u);
  const reads = api.requests.filter((request) =>
    request.path.endsWith('/assets'),
  );
  expect(reads).toHaveLength(2);
  expect(
    reads.every(
      (request) =>
        new URLSearchParams(request.search).get('after') === 'assembly-a',
    ),
  ).toBe(true);
});

test('missing tenant requests explicit selection before any protected read', async ({
  page,
}) => {
  const api = await installMetadataApi(page);
  await page.goto('/assets');
  const metadata = new ConnectedMetadataPage(page);
  await expect(metadata.permittedTenant).toBeEnabled();
  expect(
    api.requests.filter((request) =>
      request.path.startsWith('/api/v1/tenants/'),
    ),
  ).toHaveLength(0);
  await metadata.chooseTenant('tenant-a');
  await expect(page).toHaveURL(/tenant=tenant-a/u);
  await expect(metadata.catalogue).toBeVisible();
});

for (const search of [
  'tenant=tenant-a&tenant=tenant-b',
  'tenant=tenant-a&after=',
  'tenant=%20tenant-a%20',
]) {
  test(`invalid catalogue URL is rejected without issuing a protected request: ${search}`, async ({
    page,
  }) => {
    const api = await installMetadataApi(page);
    await page.goto(`/assets?${search}`);
    await expect(page.getByRole('alert')).toBeVisible();
    expect(
      api.requests.filter((request) =>
        request.path.startsWith('/api/v1/tenants/'),
      ),
    ).toHaveLength(0);
  });
}

for (const times of [
  'effective_at_ms=1500',
  'effective_at_ms=1500&known_at_ms=invalid',
  'effective_at_ms=1500&known_at_ms=2500&known_at_ms=3000',
]) {
  test(`invalid temporal URL never reads a different snapshot: ${times}`, async ({
    page,
  }) => {
    const api = await installMetadataApi(page);
    await page.goto(
      `/assets/registry/review?tenant=tenant-a&asset=power-system-1&${times}`,
    );
    await expect(page.getByRole('alert')).toBeVisible();
    expect(
      api.requests.filter((request) =>
        /relationships|signal-bindings/u.test(request.path),
      ),
    ).toHaveLength(0);
    await expect(page.getByText('binding-1', { exact: true })).toHaveCount(0);
  });
}
