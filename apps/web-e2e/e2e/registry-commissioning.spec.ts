import { installCommissioningApi } from '../fixtures/commissioning-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { RegistryCommissioningPage } from '../pages/registry-commissioning.page';

const access = {
  tenants: [
    {
      tenant_id: 'tenant-a',
      actions: ['metadata.read', 'metadata.manage'] as const,
    },
  ],
};
test('registry commissions exact assets and temporal corrections with authoritative receipt-scoped review', async ({
  page,
}) => {
  await installMetadataApi(page, access);
  const api = await installCommissioningApi(page),
    registry = new RegistryCommissioningPage(page);
  await registry.open();
  await registry.assetDraft();
  await registry
    .asset()
    .getByRole('button', { name: 'Add external identifier' })
    .click();
  await registry
    .asset()
    .getByLabel('Identifier 1 kind', { exact: true })
    .fill('serial');
  await registry
    .asset()
    .getByLabel('Identifier 1 value', { exact: true })
    .fill('serial-a');
  await registry.submitAsset();
  await expect(registry.asset()).toContainText('Committed: registered');
  await expect(
    page
      .getByRole('heading', { name: 'Selected asset', exact: true })
      .locator('..'),
  ).toContainText('Commissioned equipment');
  expect(api.commands[0]?.csrf).toBe('1');
  expect(api.commands[0]?.payload).toMatchObject({
    asset_type: { id: 'equipment', version: 2 },
    external_identifiers: [
      { kind: 'serial', authority: null, value: 'serial-a' },
    ],
  });
  await registry.relationshipDraft();
  await registry.submitRelationship();
  await expect(registry.relationship()).toContainText('Committed: appended');
  await expect(
    page.getByRole('list', { name: 'Directed relationship records' }),
  ).toContainText('commissioned-edge · revision 1');
  await registry
    .relationship()
    .getByRole('button', { name: 'Prepare another command' })
    .click();
  await registry.relationshipDraft('2', '2000');
  await registry.submitRelationship();
  await expect(
    page.getByRole('list', { name: 'Directed relationship records' }),
  ).toContainText('revision 2');
  await expect(
    page.getByRole('list', { name: 'Directed relationship records' }),
  ).toContainText('1000, 2000');
  expect(api.commands).toHaveLength(3);
  expect(api.reads.some((r) => r.includes('known_at_ms=10003'))).toBe(true);
});
test('registry preserves the frozen command after lost acknowledgement and surfaces denial/conflicts', async ({
  page,
}) => {
  await installMetadataApi(page, access);
  const api = await installCommissioningApi(page),
    registry = new RegistryCommissioningPage(page);
  await registry.open();
  await registry.assetDraft();
  api.failNext('lost');
  await registry.submitAsset();
  await expect(registry.asset()).toContainText('Outcome unknown');
  await expect(
    registry.asset().getByLabel('New internal asset ID', { exact: true }),
  ).toBeDisabled();
  await registry
    .asset()
    .getByRole('button', { name: 'Retry exact command' })
    .click();
  await expect(registry.asset()).toContainText('already_registered');
  expect(api.commands[0]?.payload).toEqual(api.commands[1]?.payload);
  await registry.relationshipDraft('2');
  await registry.submitRelationship();
  await expect(registry.relationship()).toContainText('Conflict');
  api.failNext('denied');
  await registry.relationshipDraft('1');
  await registry.submitRelationship();
  await expect(registry.relationship()).toContainText('forbidden');
});
test('read-only registry keeps evidence but exposes no mutation form or definition discovery', async ({
  page,
}) => {
  await installMetadataApi(page);
  const api = await installCommissioningApi(page),
    registry = new RegistryCommissioningPage(page);
  await registry.open();
  await expect(
    page.getByText(/Commissioning requires explicit metadata.read/),
  ).toBeVisible();
  expect(api.commands).toHaveLength(0);
  await expect(
    page.getByRole('form', { name: 'Asset registration' }),
  ).toHaveCount(0);
  expect(
    api.reads.filter((p) => p.endsWith('/asset-types?limit=20')),
  ).toHaveLength(0);
});
