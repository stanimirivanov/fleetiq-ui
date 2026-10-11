import type { Page, Request } from '@playwright/test';

/** Test-only observer. Detects browser bypasses; it is not a production firewall. */
export class BrowserRequestAudit {
  private readonly violations: string[] = [];
  private readonly pending: Promise<void>[] = [];
  private readonly origin: string;
  private readonly onRequest: (request: Request) => void;
  private readonly onSocket: () => void;

  constructor(
    private readonly page: Page,
    baseURL: string,
  ) {
    this.origin = new URL(baseURL).origin;
    this.onRequest = (request) => {
      this.pending.push(this.inspect(request));
    };
    this.onSocket = () => {
      this.violations.push('unowned-websocket');
    };
    page.on('request', this.onRequest);
    page.on('websocket', this.onSocket);
  }

  async result(): Promise<readonly string[]> {
    await Promise.all(this.pending);
    return [...this.violations];
  }

  dispose(): void {
    this.page.off('request', this.onRequest);
    this.page.off('websocket', this.onSocket);
  }

  private async inspect(request: Request): Promise<void> {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.origin !== this.origin) this.violations.push('external-request');
    const headers = await request.allHeaders();
    if (headers.authorization !== undefined)
      this.violations.push('browser-authorization');
    if (!['fetch', 'xhr', 'eventsource'].includes(request.resourceType()))
      return;
    if (!url.pathname.startsWith('/api/v1/'))
      this.violations.push('unowned-api-path');
    if (!['GET', 'POST'].includes(request.method()))
      this.violations.push('unowned-api-method');
    if (
      request.method() === 'POST' &&
      (url.pathname !== '/api/v1/auth/logout' ||
        headers['x-fleetiq-csrf'] !== '1')
    )
      this.violations.push('unowned-api-mutation');
  }
}
