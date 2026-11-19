import { expect, test } from '../fixtures/browser-quality-test';
import { startConnectedFixture } from '../fixtures/connected-development';
import { ConnectedDevelopmentPage } from '../pages/connected-development.page';

test('connected edge keeps session, SSE and HMR on one origin without reloading', async ({
  page,
}) => {
  const fixture = await startConnectedFixture();
  const view = new ConnectedDevelopmentPage(page);
  let foreign = false,
    hmrReady = false;
  const sockets: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      url.origin !== fixture.origin
    )
      foreign = true;
  });
  page.on('websocket', (socket) => {
    const url = new URL(socket.url());
    if (url.origin !== fixture.origin.replace('http:', 'ws:')) foreign = true;
    sockets.push(url.pathname);
    socket.on('framereceived', (event) => {
      if (event.payload === '{"type":"connected"}') hmrReady = true;
    });
  });
  try {
    expect(await fixture.probeMisrouting()).toBe(400);
    await view.open(fixture.origin);
    await expect(view.heading).toBeVisible();
    await expect(view.session).toHaveText('connected');
    await expect(view.stream).toHaveText('streamed');
    await expect(view.hotModule).toHaveText('before');
    const boot = await view.bootMarker();
    await expect.poll(() => hmrReady).toBe(true);
    await fixture.update();
    await expect(view.hotModule).toHaveText('after');
    expect(await view.bootMarker()).toBe(boot);
    await view.logOut();
    await expect(view.session).toHaveText('logged out');
    expect(fixture.observed()).toEqual({
      session: true,
      stream: true,
      cookie: true,
      origin: true,
      csrf: true,
    });
    expect(sockets).toEqual(['/__fleetiq_hmr']);
    expect(foreign).toBe(false);
  } finally {
    await fixture.close();
  }
});
