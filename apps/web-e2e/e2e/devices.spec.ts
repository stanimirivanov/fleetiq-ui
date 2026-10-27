import { BrowserRequestAudit } from '../fixtures/browser-request-audit';
import { installDevicesApi } from '../fixtures/devices-api';
import { expect, test } from '../fixtures/production-test';
import { DevicesPage } from '../pages/devices.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('commission a device, assign a pinned decoder, inspect evidence and retire its route', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 15,
      slug: 'connected-device-onboarding',
      title: 'Commission a device and inspect ingestion evidence',
      summary:
        'Create an asset and endpoints, verify an immutable decoder, assign a revision-checked route, interpret sampled processing evidence and retire configuration.',
    },
    {
      tenants: [
        {
          tenant_id: 'tenant-a',
          actions: ['metadata.read', 'metadata.manage', 'protocol.manage'],
        },
      ],
    },
    async (guide) => {
      const api = await installDevicesApi(guide.page, {
        identityInstalled: true,
      });
      const device = new DevicesPage(guide.page, guide);
      const audit = new BrowserRequestAudit(
        guide.page,
        baseURL ?? 'http://127.0.0.1:4173',
      );
      try {
        await device.open();
        await expect(
          device.registration.getByLabel('Published type on this page'),
        ).toBeEnabled();
        await device.registerAsset();
        await expect(guide.page).toHaveURL(/device=gateway-new/u);
        await device.registerCapability();
        await expect(device.communication).toContainText('Primary CAN bus');
        await expect(device.diagnostics).toContainText(
          'No accepted traffic observed',
        );
        await device.checkRelease();
        await expect(device.protocol).toContainText('Stored release verified');
        await device.assign();
        await expect(device.protocol).toContainText('Current revision 1');
        api.emitTraffic('gateway-new');
        await device.refreshDiagnostics();
        await expect(device.diagnostics).toContainText('battery.voltage');
        await expect(device.diagnostics).toContainText('Partial coverage');
        await expect(device.diagnostics).toContainText(
          'Connection liveness: not observed',
        );
        await device.explainEvidence();
        await guide.page.reload();
        await expect(device.protocol).toContainText('Current revision 1');
        await device.retire();
        await expect(device.protocol).toContainText('Retired route');
        await expect(device.protocol).toContainText('Current revision 2');
        expect(
          api.commands
            .filter((r) => r.method === 'PUT')
            .map(
              (r) =>
                (r.payload as { expected_revision: number }).expected_revision,
            ),
        ).toEqual([0, 1]);
        expect(await audit.result()).toEqual([]);
      } finally {
        audit.dispose();
      }
    },
  );
});
test('ambiguous capability creation retries only exact content and route conflicts remain explicit', async ({
  page,
}) => {
  const api = await installDevicesApi(page, {
    ambiguousRegistration: true,
    conflictAssignment: true,
  });
  const device = new DevicesPage(page);
  await device.open();
  await device.registerAsset();
  await device.registerCapability();
  await expect(device.communication).toContainText('Outcome unconfirmed');
  await expect(
    device.communication.getByLabel('Endpoint 1 id', { exact: true }),
  ).toBeDisabled();
  await device.communication
    .getByRole('button', { name: 'Retry exact request' })
    .click();
  await expect(device.communication).toContainText('Primary CAN bus');
  const retries = api.commands.filter((r) => r.path.endsWith('/device'));
  expect(retries).toHaveLength(2);
  expect(retries[0]?.payload).toEqual(retries[1]?.payload);
  await device.checkRelease();
  await device.assign();
  await expect(device.protocol).toContainText('Conflict:');
  expect(api.commands.filter((r) => r.method === 'PUT')).toHaveLength(1);
});
test('read-only grants and malformed URL context cannot issue device mutations', async ({
  page,
}) => {
  const api = await installDevicesApi(page, { actions: ['metadata.read'] });
  const device = new DevicesPage(page);
  await device.open();
  await expect(
    device.registration.getByRole('button', {
      name: 'Register asset',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByLabel('Existing asset / device ID', { exact: true })
    .fill('gateway-existing');
  await page.getByRole('button', { name: 'Open device', exact: true }).click();
  await expect(device.protocol).toContainText('Requires protocol.manage');
  expect(api.commands).toHaveLength(0);
  await page.goto('/devices?tenant=tenant-a&tenant=tenant-b');
  await expect(page.getByRole('alert')).toContainText(
    'Invalid or duplicate device context',
  );
  await page.getByRole('link', { name: 'Reset device context' }).click();
  await expect(page).toHaveURL(/\/devices$/u);
});
test('device workspace remains usable in narrow dark layout and preserves selection through history', async ({
  page,
}) => {
  await installDevicesApi(page);
  const device = new DevicesPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await device.open();
  await device.registerAsset();
  await expect(
    page.getByRole('heading', { name: 'gateway-new', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/device=gateway-new/u);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: /theme/iu }).click();
});
