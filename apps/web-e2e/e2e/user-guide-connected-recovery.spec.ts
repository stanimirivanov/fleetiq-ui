import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { OperatorSessionPage } from '../pages/operator-session.page';
import { ShellPage } from '../pages/shell.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('recover denied, failed, empty and missing metadata with keyboard and narrow layouts', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 14,
      slug: 'connected-recovery',
      title: 'Recover safely and use accessible metadata views',
      summary:
        'Distinguish denied access, unavailable reads, empty catalogues and missing resources; review empty source results and retain keyboard, narrow-layout and theme usability.',
    },
    {},
    async (guide, api) => {
      const metadata = new ConnectedMetadataPage(guide.page, guide);
      const session = new OperatorSessionPage(guide.page, guide);
      const shell = new ShellPage(guide.page, guide);
      const alert = guide.page.getByRole('alert');

      await test.step('Distinguish tenant denial from expired sign-in', async () => {
        await guide.page.goto('/assets?tenant=tenant-denied');
        await expect(alert).toContainText(
          /permission|forbidden|not authorized|not permitted/i,
        );
        await expect(metadata.catalogue).toHaveCount(0);
        await expect(session.signedOut).toHaveCount(0);
        await guide.result(alert, {
          title: 'An authenticated operator can still be denied',
          body: 'A denied tenant request does not expose its records and does not mean sign-in expired. Ask an administrator for permission rather than treating another tenant ID as access.',
        });
        await session.openAccount();
        await expect(session.actor('operator-a')).toBeVisible();
        await session.closeAccount();
        await metadata.chooseTenant('tenant-a');
        await expect(metadata.catalogue).toBeVisible();
      });
      await test.step('Retry a transient read in the same context', async () => {
        api.setCatalogueStatus(500);
        await metadata.nextCataloguePage();
        await expect(alert).toContainText(/unavailable|could not|failed/i);
        await expect(metadata.catalogue).toHaveCount(0);
        await guide.result(alert, {
          title: 'An unavailable read is not an empty catalogue',
          body: 'FleetIQ removes superseded records and exposes a retry. The tenant and cursor stay in the URL, so recovery does not silently read a different page.',
        });
        api.setCatalogueStatus(200);
        await guide.action(
          metadata.retryCatalogue,
          {
            title: 'Retry the requested catalogue page',
            body: 'Retry this read after the service recovers. Do not switch tenants or mistake a failed request for missing assets.',
          },
          () => metadata.retryCatalogue.click(),
        );
        await expect(metadata.asset('Power system')).toBeVisible();
        await expect(guide.page).toHaveURL(/after=assembly-a/u);
        await guide.result(metadata.catalogue, {
          title: 'Recovery preserves the forward cursor',
          body: 'The next page is read again in the same tenant context. No synthetic preview replaces a failed production read.',
        });
        await metadata.firstCataloguePage();
      });
      await test.step('Keep empty and missing results distinct', async () => {
        api.setEmptyCatalogue(true);
        await guide.page.reload();
        const empty = guide.page
          .getByRole('status')
          .filter({ hasText: /no assets|empty/i });
        await expect(empty).toBeVisible();
        await expect(metadata.catalogue).toHaveCount(0);
        await guide.result(empty, {
          title: 'An empty response is a successful read',
          body: 'No registered assets appear in this bounded response. The interface does not substitute sample machines or fabricate a fleet total.',
        });
        api.setEmptyCatalogue(false);
        await guide.page.goto('/assets/missing-example?tenant=tenant-a');
        await expect(alert).toContainText(/not found|does not exist|missing/i);
        await expect(metadata.identity).toHaveCount(0);
        await guide.result(alert, {
          title: 'A missing asset stays missing',
          body: 'An unknown internal asset ID produces an explicit missing-resource state. There is no fallback to a sample inspector or invented telemetry.',
        });
      });
      await test.step('Recover invalid review times and inspect an empty exact source', async () => {
        await guide.page.goto(
          '/assets/registry/review?tenant=tenant-a&asset=power-system-1&effective_at_ms=1500&known_at_ms=invalid',
        );
        await expect(alert).toContainText(/No metadata requests/u);
        await guide.result(alert, {
          title: 'Invalid cutoffs block metadata reads',
          body: 'Both effective and known time must be valid Unix milliseconds. FleetIQ does not replace an invalid value with a different instant.',
        });
        await metadata.applyReviewTimes('1500', '2500');
        await expect(metadata.targetBindings).toContainText('binding-1');
        await metadata.chooseSource(
          'gateway-1',
          'can-primary',
          'unmapped-example',
        );
        await expect(metadata.sourceBindings).toContainText(
          'No candidates appear',
        );
        await expect(metadata.sourceBindings.getByRole('list')).toHaveCount(0);
        await guide.result(metadata.sourceBindings, {
          title: 'No candidates is not a sensor inventory verdict',
          body: 'This exact tuple has no candidates in the bounded response. That does not prove the device is unregistered, the signal is unassigned, or an observed value is zero.',
        });
      });
      await test.step('Retain keyboard and narrow dark-layout access', async () => {
        await guide.page.setViewportSize({ width: 390, height: 844 });
        await shell.cycleTheme();
        await expect(guide.page.locator('html')).toHaveAttribute(
          'data-theme',
          'dark',
        );
        await expect(metadata.sourceBindings).toContainText(
          'No candidates appear',
        );
        expect(
          await guide.page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await guide.result(metadata.sourceBindings, {
          title: 'Review the same source on a narrow dark workspace',
          body: 'The selected tenant, times and exact source survive a layout and theme change. Panels remain readable without horizontal page scrolling.',
        });
        await guide.page.reload();
        await expect(guide.page.locator('html')).toHaveAttribute(
          'data-theme',
          'dark',
        );
        await expect(metadata.sourceBindings).toContainText(
          'No candidates appear',
        );
        await guide.page.keyboard.press('Tab');
        await expect(shell.skipLink).toBeFocused();
        await guide.result(shell.skipLink, {
          title: 'Use the keyboard shortcut to main content',
          body: 'The first keyboard link skips repeated navigation. Appearance and URL-backed review context persist after a reload.',
        });
        await guide.page.keyboard.press('Enter');
        await expect(shell.main).toBeFocused();
        await shell.cycleTheme();
        await expect(shell.themeButton).toHaveAccessibleName(/Theme: system/u);
      });
    },
  );
});
