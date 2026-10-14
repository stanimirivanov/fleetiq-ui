import { expect, test } from '../fixtures/production-test';
import { UserGuideSession } from '../user-guide/user-guide-session';

/** Every page in a guide-owned context must obey the unexpected-error gate. */
for (const location of ['main', 'additional'] as const) {
  test(`guide-owned ${location} pages reject an actual unexpected browser exception`, async ({
    browser,
    baseURL,
  }) => {
    const guide = await UserGuideSession.start(browser, {
      baseURL: baseURL ?? 'http://127.0.0.1:4173',
      dataMode: 'production-shell',
      order: 0,
      slug: 'page-error-control',
      title: 'Owned page-error control',
      summary: 'Untyped browser failures cannot qualify a guide.',
    });
    try {
      const page =
        location === 'main' ? guide.page : await guide.page.context().newPage();
      await page.goto('/');
      const observed = page.waitForEvent('pageerror');
      await page.evaluate(() => {
        queueMicrotask(() => {
          throw new Error('Synthetic guide exception control');
        });
      });
      await observed;
      await expect(guide.finish()).rejects.toThrow(
        /Unexpected browser page error/u,
      );
      expect(guide.page.isClosed()).toBe(true);
      expect(page.isClosed()).toBe(true);
    } finally {
      await guide.abort();
    }
  });
}
