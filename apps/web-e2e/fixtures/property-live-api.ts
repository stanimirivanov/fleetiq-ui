import type { Page } from '@playwright/test';
/** Finite same-origin SSE contract fixture; never a provider or real device. */
export async function installPropertyLiveApi(page: Page, burst = 0) {
  let allowed = 1;
  const gates = new Map<number, () => void>();
  page.once('close', () => {
    for (const release of gates.values()) release();
  });
  const cursors: (string | undefined)[] = [];
  const snapshot = (revision: string) => ({
    generation: '1',
    revision,
    processed_count: '12',
    pending: false,
    evaluated_at_ms: '40000',
    stale_after_ms: 30000,
    items: [],
  });
  const frame = (event: string, data: unknown, revision?: string) =>
    `event: ${event}\n${revision ? `id: v1.${'a'.repeat(64)}.1.${revision}\n` : ''}data: ${JSON.stringify(data)}\n\n`;
  await page.route(
    '**/api/v1/tenants/*/assets/*/properties/*/versions/*/live',
    async (route) => {
      cursors.push(route.request().headers()['last-event-id']);
      const n = cursors.length;
      if (
        n > allowed &&
        !(burst && !route.request().headers()['last-event-id'])
      )
        await new Promise<void>((resolve) => gates.set(n, resolve));
      if (page.isClosed()) return;
      let body =
        n === 1
          ? frame('snapshot', snapshot('9'), '9')
          : n === 2
            ? frame(
                'replace',
                { base_revision: '9', snapshot: snapshot('20') },
                '20',
              )
            : n === 3
              ? frame('resnapshot-required', { reason: 'projection_reset' })
              : n === 4
                ? frame('snapshot', snapshot('30'), '30')
                : frame('stream-ended', { reason: 'access_denied' });
      if (burst) body = frame('snapshot', snapshot('9'), '9');
      if (burst)
        for (let i = 0; i < burst; i++)
          body += frame(
            'replace',
            {
              base_revision: String(i + 9),
              snapshot: snapshot(String(i + 10)),
            },
            String(i + 10),
          );
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'cache-control': 'no-store' },
        body,
      });
    },
  );
  return {
    cursors,
    advance() {
      allowed++;
      gates.get(allowed)?.();
      gates.delete(allowed);
    },
  };
}
