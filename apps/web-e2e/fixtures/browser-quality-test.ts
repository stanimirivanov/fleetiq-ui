import { test as base } from '@playwright/test';
import { requireNoPageErrors } from '../../../tools/quality/policy.mjs';

export { expect } from '@playwright/test';

interface Lifecycle {
  pageErrors: number;
  completed: number;
  cancelled: number;
  rejected: number;
}
/** Test-owned counters capture categories only: no URL, actor, headers, body or error message. */
export const test = base.extend<{ pageErrors: Lifecycle }>({
  pageErrors: [
    async ({ page }, use, testInfo) => {
      const observed: Lifecycle = {
        pageErrors: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
      };
      const pageError = () => {
        observed.pageErrors += 1;
      };
      const completed = (request: import('@playwright/test').Request) => {
        if (['fetch', 'xhr'].includes(request.resourceType()))
          observed.completed += 1;
      };
      const failed = (request: import('@playwright/test').Request) => {
        if (!['fetch', 'xhr'].includes(request.resourceType())) return;
        if (request.failure()?.errorText.includes('ABORTED'))
          observed.cancelled += 1;
        else observed.rejected += 1;
      };
      page.on('pageerror', pageError);
      page.on('requestfinished', completed);
      page.on('requestfailed', failed);
      try {
        await use(observed);
      } finally {
        page.off('pageerror', pageError);
        page.off('requestfinished', completed);
        page.off('requestfailed', failed);
        await testInfo.attach('redacted-browser-lifecycle', {
          body: JSON.stringify(observed),
          contentType: 'application/json',
        });
        requireNoPageErrors(observed.pageErrors);
      }
    },
    { auto: true },
  ],
});
