import assert from 'node:assert/strict';
import { request } from 'node:http';
import test from 'node:test';
import { createServer, resolveConfig } from 'vite';
import { connectedDevelopment } from '../../apps/web/connected-dev.ts';

test('connected routing explicitly owns the external host and websocket without changing build/test/default behavior', () => {
  const result = connectedDevelopment(
    'https://fleet.fleetiq.test:58443',
    'serve',
    'development',
  );
  assert.equal(result.server.origin, 'https://fleet.fleetiq.test:58443');
  assert.deepEqual(result.server.allowedHosts, ['fleet.fleetiq.test']);
  assert.deepEqual(result.server.cors, {
    origin: 'https://fleet.fleetiq.test:58443',
  });
  assert.deepEqual(result.server.ws, {
    protocol: 'wss',
    host: 'fleet.fleetiq.test',
    clientPort: 58443,
    path: '/__fleetiq_hmr',
  });
  for (const args of [
    [undefined, 'serve', 'development'],
    ['', 'serve', 'development'],
    ['invalid', 'build', 'production'],
    ['invalid', 'serve', 'test'],
    ['invalid', 'serve', 'production', true],
  ])
    assert.deepEqual(connectedDevelopment(...args), {});
  for (const origin of [
    'http://fleet.fleetiq.test',
    'https://evil.test',
    'https://user:pass@fleet.fleetiq.test',
    'https://fleet.fleetiq.test/path',
    'https://fleet.fleetiq.test?token=private',
    'https://fleet.fleetiq.test#fragment',
    'https://fleet.fleetiq.test:0',
    '*',
    'not-a-url',
  ])
    assert.throws(
      () => connectedDevelopment(origin, 'serve', 'development'),
      /Invalid connected development origin/,
    );
  assert.equal(
    connectedDevelopment('http://127.0.0.1:5183', 'serve', 'development').server
      .ws.protocol,
    'ws',
  );
});
test('the actual Vite configuration wires the explicit opt-in', async () => {
  const previous = process.env.FLEETIQ_CONNECTED_ORIGIN;
  try {
    process.env.FLEETIQ_CONNECTED_ORIGIN = 'https://fleet.fleetiq.test:58443';
    const config = await resolveConfig(
      { configFile: 'apps/web/vite.config.ts' },
      'serve',
    );
    assert.equal(config.server.origin, 'https://fleet.fleetiq.test:58443');
    assert.equal(config.server.ws.clientPort, 58443);
    for (const [command, preview] of [
      ['build', false],
      ['serve', true],
    ]) {
      const isolated = await resolveConfig(
        { configFile: 'apps/web/vite.config.ts' },
        command,
        undefined,
        undefined,
        preview,
      );
      assert.equal(isolated.server.origin, undefined);
      assert.equal(
        isolated.plugins.some(
          (plugin) => plugin.name === 'fleetiq-connected-api-boundary',
        ),
        false,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.FLEETIQ_CONNECTED_ORIGIN;
    else process.env.FLEETIQ_CONNECTED_ORIGIN = previous;
  }
});
test('connected Vite refuses direct API/session/SSE requests and hostile hosts instead of SPA HTML', async () => {
  const connected = connectedDevelopment(
    'https://fleet.fleetiq.test:58443',
    'serve',
    'development',
  );
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: [connected.plugin],
    server: { ...connected.server, host: '127.0.0.1', port: 0 },
    logLevel: 'silent',
  });
  try {
    await server.listen();
    const address = server.httpServer.address();
    assert(address && typeof address !== 'string');
    for (const path of [
      '/api',
      '/api/v1/auth/session',
      '/api/v1/live',
      '/api/v1/auth/logout',
    ]) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      assert.equal(response.status, 503);
      assert.match(
        response.headers.get('content-type'),
        /application\/problem\+json/,
      );
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    const status = await new Promise((resolve, reject) => {
      const req = request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/',
          headers: { host: 'evil.test' },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(status, 403);
  } finally {
    await server.close();
  }
});
