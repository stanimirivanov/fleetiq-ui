import { test as base } from './browser-quality-test';
import { startIdentityDestination } from './identity-destination';
import { mockUnavailableSignIn } from './metadata-api';

export { expect } from '@playwright/test';

/** Default production scenarios model an explicitly unavailable session endpoint. */
export const test = base.extend<{
  unavailableSession: undefined;
  identityDestination: string;
}>({
  unavailableSession: [
    async ({ page }, use) => {
      await mockUnavailableSignIn(page);
      await use(undefined);
    },
    { auto: true },
  ],
  identityDestination: async ({ baseURL }, use) => {
    if (!baseURL)
      throw new Error('The identity fixture requires a configured web origin');
    const destination = await startIdentityDestination();
    try {
      await use(destination.url);
    } finally {
      await destination.close();
    }
  },
});

export type { Page } from '@playwright/test';
