import type { Locator, Page } from '@playwright/test';
import {
  type GuideNarrator,
  performDocumentedAction,
} from '../user-guide/guide-narrator';

/** Same-origin account actions; provider exchange is never captured by these page objects. */
export class OperatorSessionPage {
  readonly unavailable: Locator;
  readonly signedOut: Locator;
  readonly account: Locator;
  readonly signIn: Locator;
  readonly signOut: Locator;
  readonly retrySignOut: Locator;
  readonly unconfirmedSignOut: Locator;

  constructor(
    private readonly page: Page,
    private readonly narrator?: GuideNarrator,
  ) {
    this.unavailable = page.getByRole('region', {
      name: 'Sign-in unavailable',
      exact: true,
    });
    this.signedOut = page.getByRole('region', {
      name: 'Sign in to FleetIQ',
      exact: true,
    });
    this.account = page.getByRole('button', {
      name: 'Operator account',
      exact: true,
    });
    this.signIn = page.getByRole('link', { name: 'Sign in', exact: true });
    this.signOut = page.getByRole('button', { name: 'Sign out', exact: true });
    this.retrySignOut = page.getByRole('button', {
      name: 'Retry sign-out',
      exact: true,
    });
    this.unconfirmedSignOut = page.getByRole('alert', {
      name: 'Sign-out not confirmed',
      exact: true,
    });
  }
  async logIn(): Promise<void> {
    await performDocumentedAction(
      this.narrator,
      this.signIn,
      {
        title: 'Start sign-in through FleetIQ',
        body: 'Sign in opens the configured provider through the server. This recording simulates only the safe return to FleetIQ; provider pages and credentials are omitted.',
      },
      () => this.signIn.click(),
    );
  }
  async openAccount(): Promise<void> {
    await performDocumentedAction(
      this.narrator,
      this.account,
      {
        title: 'Inspect the current operator account',
        body: 'Check the account before reviewing tenant data. A signed-in account does not automatically have access to every tenant.',
      },
      () => this.account.click(),
    );
  }
  async closeAccount(): Promise<void> {
    await this.account.click();
  }
  async logOut(): Promise<void> {
    await this.openAccount();
    await performDocumentedAction(
      this.narrator,
      this.signOut,
      {
        title: 'Request server-confirmed sign-out',
        body: 'Sign out immediately hides protected evidence. FleetIQ confirms completion only after the server revokes the session.',
      },
      () => this.signOut.click(),
    );
  }
  async retryLogOut(): Promise<void> {
    await performDocumentedAction(
      this.narrator,
      this.retrySignOut,
      {
        title: 'Retry an unconfirmed sign-out',
        body: 'Keep protected data hidden and retry. A failed request must not be described as a revoked server session.',
      },
      () => this.retrySignOut.click(),
    );
  }
  actor(id: string): Locator {
    return this.page.getByText(id, { exact: true });
  }
}
