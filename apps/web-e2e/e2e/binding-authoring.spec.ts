import { installBindingApi } from '../fixtures/binding-api';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { BindingAuthoringPage } from '../pages/binding-authoring.page';

const access = {
  tenants: [
    {
      tenant_id: 'tenant-a',
      actions: ['metadata.read', 'metadata.manage', 'protocol.manage'] as const,
    },
  ],
};
test('binding commissioning preserves exact-source attribution, target membership and immutable correction history', async ({
  page,
}) => {
  await installMetadataApi(page, access);
  const api = await installBindingApi(page),
    binding = new BindingAuthoringPage(page);
  await binding.open();
  await binding.chooseSource();
  await binding.chooseTarget();
  await binding.draft();
  await binding.submit();
  await expect(binding.form()).toContainText('Committed: appended');
  expect(api.commands[0]?.csrf).toBe('1');
  const targets = page.getByRole('list', { name: 'Target binding records' }),
    sources = page.getByRole('list', {
      name: 'Source binding candidate records',
    });
  await expect(targets).toContainText('authored-binding · revision 1');
  await expect(sources).toContainText('can-primary / bus.voltage');
  await binding.prepare();
  await binding.draft('2', '3000');
  await binding.submit();
  await expect(targets).toContainText('revision 2');
  await expect(targets).toContainText('electrical.voltage v3');
  await binding.exact('1');
  const history = page.getByRole('region', {
    name: 'Immutable binding revision',
    exact: true,
  });
  await expect(history).toContainText('electrical.voltage v3');
  await expect(history).toContainText('revision 1');
  await expect(history).toContainText('1000, open');
  await page
    .getByLabel('Source device asset ID', { exact: true })
    .fill('gateway-1');
  await page
    .getByLabel('Source endpoint ID', { exact: true })
    .fill('can-other');
  await page
    .getByLabel('Source signal ID', { exact: true })
    .fill('bus.voltage');
  await page
    .getByRole('button', { name: 'Review exact source', exact: true })
    .click();
  await expect(sources).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Source binding candidates' }),
  ).toContainText(/No candidates/);
  expect(api.commands).toHaveLength(2);
});
test('unknown binding outcome replays exact content while revision conflict and denied writes remain distinct', async ({
  page,
}) => {
  await installMetadataApi(page, access);
  const api = await installBindingApi(page),
    binding = new BindingAuthoringPage(page);
  await binding.open();
  await binding.chooseSource();
  await binding.chooseTarget();
  await binding.draft();
  api.failNext('lost');
  await binding.submit();
  await expect(binding.form()).toContainText('Outcome unknown');
  await expect(
    binding.form().getByLabel('Binding ID', { exact: true }),
  ).toBeDisabled();
  await binding
    .form()
    .getByRole('button', { name: 'Retry exact command' })
    .click();
  await expect(binding.form()).toContainText('already_appended');
  expect(api.commands[0]?.payload).toEqual(api.commands[1]?.payload);
  await binding.prepare();
  await binding.draft('3');
  await binding.submit();
  await expect(binding.form()).toContainText('Conflict');
  await binding.draft('2');
  api.failNext('denied');
  await binding.submit();
  await expect(binding.form()).toContainText('forbidden');
});
test('manual custom-protocol signal entry needs no protocol grant and empty observation samples never imply inventory', async ({
  page,
}) => {
  await installMetadataApi(page, {
    tenants: [
      { tenant_id: 'tenant-a', actions: ['metadata.read', 'metadata.manage'] },
    ],
  });
  const api = await installBindingApi(page),
    binding = new BindingAuthoringPage(page);
  await binding.open();
  await binding.chooseSource(false);
  await expect(binding.source()).toContainText('separate protocol.manage');
  expect(api.reads.some((p) => p.includes('ingestion-diagnostics'))).toBe(
    false,
  );
  await binding.chooseTarget();
  await binding.draft();
  await binding.submit();
  await expect(binding.form()).toContainText('Committed: appended');
});

test('empty observed samples remain explicitly incomplete and never disable deliberate custom signals', async ({
  page,
}) => {
  await installMetadataApi(page, access);
  const api = await installBindingApi(page);
  api.emptyObservations();
  const binding = new BindingAuthoringPage(page);
  await binding.open();
  await binding.chooseSource(false);
  await binding
    .source()
    .getByRole('button', { name: 'Inspect observed signals' })
    .click();
  await expect(binding.source()).toContainText('No sources in this sample');
  await expect(binding.source()).toContainText('does not mean no sensors');
  await binding.chooseTarget();
  await binding.draft();
  await binding.submit();
  await expect(binding.form()).toContainText('Committed: appended');
});
