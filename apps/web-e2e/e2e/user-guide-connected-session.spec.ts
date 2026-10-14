import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { OperatorSessionPage } from '../pages/operator-session.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('sign in, inspect the operator and recover expired or unconfirmed sessions', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 11,
      slug: 'connected-operator-session',
      title: 'Sign in and manage the operator session',
      summary:
        'Start native sign-in, inspect the active account, recover expiry and retry sign-out without exposing credentials or protected data.',
    },
    { sessionStatus: 401, simulateSignInReturn: true },
    async (guide, api) => {
      const metadata = new ConnectedMetadataPage(guide.page, guide);
      const session = new OperatorSessionPage(guide.page, guide);
      const banner = guide.page.getByRole('banner');

      await test.step('Recognize the signed-out state', async () => {
        await metadata.openCatalogue();
        await expect(session.signedOut).toBeVisible();
        await expect(metadata.catalogue).toHaveCount(0);
        await expect(session.signIn).toHaveAttribute(
          'href',
          '/api/v1/auth/login',
        );
        await guide.result(session.signedOut, {
          title: 'Protected metadata requires an operator session',
          body: 'The sign-in prompt hides tenant records. This demonstration uses synthetic API responses; it never records an identity provider or customer account.',
        });
        expect(
          api.requests.filter((request) =>
            request.path.startsWith('/api/v1/tenants/'),
          ),
        ).toHaveLength(0);
      });
      await test.step('Return from sign-in to the requested metadata route', async () => {
        await session.logIn();
        await expect(guide.page).toHaveURL(/\/assets\?tenant=tenant-a/u);
        await expect(metadata.catalogue).toBeVisible();
        await expect(banner).toContainText('Operator connected');
        await guide.result(banner, {
          title: 'The requested workspace is restored',
          body: 'After the server returns to FleetIQ, the application restores the saved internal route. The provider exchange is simulated here and requires separate deployment qualification.',
        });
        expect(
          api.requests.some(
            (request) =>
              request.path === '/api/v1/auth/login' && request.method === 'GET',
          ),
        ).toBe(true);
      });
      await test.step('Check which operator owns the session', async () => {
        await session.openAccount();
        await expect(session.actor('operator-a')).toBeVisible();
        await guide.result(session.actor('operator-a'), {
          title: 'Check the active account',
          body: 'The operator ID identifies the current account. Tenant permissions are checked separately on every request; sign-in is not universal access.',
        });
        await session.closeAccount();
      });
      await test.step('Recover an expired session without stale protected rows', async () => {
        api.setSessionStatus(401);
        api.setCatalogueStatus(401);
        await metadata.nextCataloguePage();
        await expect(session.signedOut).toBeVisible();
        await expect(metadata.catalogue).toHaveCount(0);
        await expect(banner).toContainText('Sign-in required');
        await guide.result(session.signedOut, {
          title: 'Expired authorization removes protected evidence',
          body: 'When the session is rejected, FleetIQ clears the previous records and asks for sign-in. An old catalogue is not presented as still authorized.',
        });
        api.setCatalogueStatus(200);
        await session.logIn();
        await expect(metadata.asset('Power system')).toBeVisible();
        await expect(guide.page).toHaveURL(/after=assembly-a/u);
        await guide.result(metadata.catalogue, {
          title: 'Continue at the saved catalogue cursor',
          body: 'A successful return restores the requested page. The response is read again rather than exposing the records from the expired session.',
        });
      });
      await test.step('Keep an unconfirmed sign-out explicit and retry', async () => {
        api.setLogoutStatus(500);
        await session.logOut();
        await expect(session.unconfirmedSignOut).toBeVisible();
        await expect(metadata.catalogue).toHaveCount(0);
        await expect(session.signedOut).toHaveCount(0);
        await guide.result(session.unconfirmedSignOut, {
          title: 'A failed request is not confirmed revocation',
          body: 'Protected content stays hidden, but the interface does not claim that the server session was revoked. Retry sign-out before treating the operation as complete.',
        });
        api.setLogoutStatus(204);
        await session.retryLogOut();
        await expect(session.signedOut).toBeVisible();
        await guide.result(session.signedOut, {
          title: 'Server-confirmed sign-out',
          body: 'The sign-in prompt returns after the server confirms revocation. No identity, mapping or catalogue evidence remains visible.',
        });
        const logout = api.requests.filter(
          (request) => request.path === '/api/v1/auth/logout',
        );
        expect(logout).toHaveLength(2);
        expect(
          logout.every(
            (request) =>
              request.method === 'POST' &&
              request.csrf === '1' &&
              request.origin === new URL(guide.page.url()).origin,
          ),
        ).toBe(true);
        expect(
          api.requests.every((request) => request.authorization === undefined),
        ).toBe(true);
      });
    },
  );
});
