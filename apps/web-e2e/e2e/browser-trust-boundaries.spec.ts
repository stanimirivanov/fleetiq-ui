import { BrowserRequestAudit } from '../fixtures/browser-request-audit';
import { installMetadataApi } from '../fixtures/metadata-api';
import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { OperatorSessionPage } from '../pages/operator-session.page';

test('connected reads and sign-out remain inside the owned same-origin browser API', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error('A qualified production origin is required.');
  const audit = new BrowserRequestAudit(page, baseURL);
  try {
    await installMetadataApi(page);
    const metadata = new ConnectedMetadataPage(page);
    await metadata.openCatalogue();
    await expect(metadata.catalogue).toBeVisible();
    await metadata.inspect('Primary machine');
    await expect(metadata.identity).toContainText('SN-100');
    const session = new OperatorSessionPage(page);
    await session.logOut();
    await expect(session.signedOut).toBeVisible();
    expect(await audit.result()).toEqual([]);
  } finally {
    audit.dispose();
  }
});

test('the browser observer detects real forbidden requests even when the network is intercepted', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error('A qualified production origin is required.');
  await installMetadataApi(page);
  await page.route('https://forbidden.invalid/**', (route) => route.abort());
  const audit = new BrowserRequestAudit(page, baseURL);
  try {
    await page.goto('/');
    await page.evaluate(async () => {
      await fetch('https://forbidden.invalid/transport-probe').catch(
        () => undefined,
      );
      await fetch('/api/v1/auth/session', {
        headers: { Authorization: 'synthetic-test-only' },
      });
    });
    expect(await audit.result()).toEqual(
      expect.arrayContaining(['external-request', 'browser-authorization']),
    );
  } finally {
    audit.dispose();
  }
});
