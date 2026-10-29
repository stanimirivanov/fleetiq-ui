import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { installTelemetryApi } from '../fixtures/telemetry-api';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { PropertyEvidencePage } from '../pages/property-evidence.page';

test('discover pages, preserve history, select exact grants and revoke metadata access', async ({
  page,
}) => {
  const api = await installMetadataApi(page, {
    tenants: [
      { tenant_id: 'tenant-a', actions: ['metadata.read'] },
      { tenant_id: 'tenant-b', actions: ['access.manage', 'metadata.manage'] },
    ],
    tenantPageSize: 1,
  });
  const metadata = new ConnectedMetadataPage(page);
  await page.goto('/assets');
  await expect(metadata.permittedTenant).toBeEnabled();
  expect(
    api.requests.filter((request) =>
      request.path.startsWith('/api/v1/tenants/'),
    ),
  ).toHaveLength(0);
  await metadata.chooseTenant('tenant-a');
  await expect(metadata.catalogue).toBeVisible();
  const discoveryBeforeFilter = api.requests.filter(
    (request) => request.path === '/api/v1/me/tenants',
  ).length;
  const metadataBeforeFilter = api.requests.filter((request) =>
    request.path.startsWith('/api/v1/tenants/'),
  ).length;
  await metadata.filterCatalogue('Primary');
  await expect(metadata.asset('Primary machine')).toBeVisible();
  expect(
    api.requests.filter((request) => request.path === '/api/v1/me/tenants'),
  ).toHaveLength(discoveryBeforeFilter);
  expect(
    api.requests.filter((request) =>
      request.path.startsWith('/api/v1/tenants/'),
    ),
  ).toHaveLength(metadataBeforeFilter);
  await metadata.nextTenants.click();
  await expect(page).toHaveURL(/tenant_after=tenant-a/u);
  await expect(metadata.tenantAccess).toContainText('access is unverified');
  await page.reload();
  await expect(
    metadata.permittedTenant.getByRole('option', {
      name: 'tenant-b',
      exact: true,
    }),
  ).toBeAttached();
  await metadata.chooseTenant('tenant-b');
  await expect(page).toHaveURL(/tenant=tenant-b/u);
  await expect(page).not.toHaveURL(/q=|asset=|after=assembly/u);
  await expect(metadata.tenantAccess).toContainText('metadata.manage');
  await expect(metadata.catalogue).toHaveCount(0);
  await expect(metadata.registryMappingLink).toHaveCount(0);
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Assets', exact: true }),
  ).toHaveCount(0);
  expect(
    api.requests.filter((request) =>
      request.path.startsWith('/api/v1/tenants/tenant-b/'),
    ),
  ).toHaveLength(0);
  await page.goBack();
  await expect(page).toHaveURL(/tenant=tenant-a/u);
  await expect(metadata.asset('Primary machine')).toBeVisible();
  await metadata.firstTenants.click();
  await expect(metadata.permittedTenant).toHaveValue('tenant-a');
  api.setTenants([{ tenant_id: 'tenant-a', actions: ['metadata.manage'] }]);
  await metadata.refreshTenants.click();
  await expect(metadata.catalogue).toHaveCount(0);
  await expect(metadata.tenantAccess).toContainText('do not imply read');
  api.setTenants([]);
  await metadata.refreshTenants.click();
  await expect(metadata.tenantAccess).toContainText('No accessible tenants');
  await expect(metadata.catalogue).toHaveCount(0);
});

test('discovery failures, invalid cursors, retries and expired sessions keep protected views clear', async ({
  page,
}) => {
  const api = await installMetadataApi(page, { discoveryStatus: 500 });
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue();
  await expect(metadata.tenantAccess).toContainText(
    'Tenant discovery is unavailable',
  );
  expect(
    api.requests.filter((request) =>
      request.path.startsWith('/api/v1/tenants/'),
    ),
  ).toHaveLength(0);
  api.setDiscoveryStatus(200);
  await metadata.refreshTenants.click();
  await expect(metadata.catalogue).toBeVisible();
  await page.goto('/assets?tenant=tenant-a&tenant_after=x&tenant_after=y');
  await expect(metadata.tenantAccess).toContainText(
    'Invalid tenant page cursor',
  );
  await expect(metadata.catalogue).toHaveCount(0);
  await metadata.firstTenants.click();
  await expect(metadata.catalogue).toBeVisible();
  api.setDiscoveryStatus(401);
  await metadata.refreshTenants.click();
  await expect(
    page.getByText('Sign in to FleetIQ', { exact: true }),
  ).toBeVisible();
  await expect(metadata.catalogue).toHaveCount(0);
  await expect(metadata.permittedTenant).toHaveCount(0);
});

test('a removed selected grant is unverified until the protected endpoint denies it', async ({
  page,
}) => {
  const api = await installMetadataApi(page);
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue();
  await expect(metadata.catalogue).toBeVisible();
  api.setTenants([
    { tenant_id: 'different-tenant', actions: ['metadata.read'] },
  ]);
  api.setCatalogueStatus(403);
  await metadata.refreshTenants.click();
  await expect(metadata.tenantAccess).toContainText('access is unverified');
  await expect(page.getByText(/Access to this tenant is denied/)).toBeVisible();
  await expect(metadata.catalogue).toHaveCount(0);
});

test('account refresh discards old tenant grants before applying the new account capabilities', async ({
  page,
}) => {
  const api = await installMetadataApi(page);
  const metadata = new ConnectedMetadataPage(page);
  await metadata.openCatalogue();
  await expect(metadata.catalogue).toBeVisible();
  api.setActorId('operator-b');
  api.setTenants([{ tenant_id: 'tenant-a', actions: ['access.manage'] }]);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(metadata.tenantAccess).toContainText('access.manage');
  await expect(
    metadata.tenantAccess.getByText('metadata.read', { exact: true }),
  ).toHaveCount(0);
  await expect(metadata.catalogue).toHaveCount(0);
});

test('all five advertised grants allow connected catalogue and inspector readings', async ({
  page,
}) => {
  const actions = [
    'access.manage',
    'metadata.manage',
    'metadata.read',
    'protocol.manage',
    'telemetry.read',
  ] as const;
  await installMetadataApi(page, {
    tenants: [{ tenant_id: 'tenant-a', actions }],
  });
  await installTelemetryApi(page);
  const metadata = new ConnectedMetadataPage(page);
  const inspector = new PropertyEvidencePage(page);
  await metadata.openCatalogue();
  await expect(metadata.permittedTenant).toBeEnabled();
  for (const action of actions)
    await expect(
      metadata.tenantAccess.getByText(action, { exact: true }),
    ).toBeVisible();
  await expect(metadata.asset('Primary machine')).toBeVisible();
  await metadata.inspect('Primary machine');
  await expect(metadata.identity).toBeVisible();
  await expect(inspector.property).toBeVisible();
  await inspector.open();
  await expect(inspector.readings).toContainText('32.1');
  await expect(metadata.permittedTenant).toHaveValue('tenant-a');
});
