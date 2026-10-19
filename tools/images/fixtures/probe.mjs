import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const mode = process.argv[2];
const contract = JSON.parse(readFileSync('/contract.json', 'utf8'));
const edge = process.env.FLEETIQ_TEST_EDGE_HOST;
const sha = (body) => createHash('sha256').update(body).digest('hex');
function request(path, options = {}) {
  const tls = options.tls;
  return new Promise((resolve, reject) => {
    const client = tls ? https : http;
    const req = client.request(
      {
        hostname: tls ? process.env.FLEETIQ_TEST_GATEWAY : edge,
        port: tls ? 8443 : 8080,
        path,
        method: options.method ?? 'GET',
        headers: { Host: 'fleet.test', ...options.headers },
        servername: tls ? 'fleet.test' : undefined,
        ca: options.ca,
        agent: false,
      },
      (response) => {
        const chunks = [];
        let bytes = 0;
        response.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > 2 * 1024 * 1024)
            response.destroy(new Error('Probe response exceeds bound.'));
          else chunks.push(chunk);
        });
        response.on('error', reject);
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () =>
      req.destroy(new Error('Probe deadline expired.')),
    );
    req.end(options.body);
  });
}
let checks = 0;
if (mode === 'http') {
  for (const path of [
    '/',
    '/tenants/tenant-a/assets/asset-1?view=details',
    '/tenants/tenant-a/registry',
  ]) {
    const r = await request(path);
    assert.equal(r.status, 200);
    assert.equal(sha(r.body), contract.index);
    assert.equal(r.headers['cache-control'], 'no-cache');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.equal(r.headers['x-frame-options'], 'DENY');
    assert.ok(
      r.headers['content-security-policy'].includes("frame-ancestors 'none'"),
    );
    assert.equal(r.headers.server, undefined);
    for (const hash of contract.cspHashes)
      assert.ok(r.headers['content-security-policy'].includes(hash));
    assert.ok(
      !r.headers['content-security-policy'].includes(
        "script-src 'self' 'unsafe-inline'",
      ),
    );
    checks++;
  }
  const head = await request('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  checks++;
  for (const file of contract.files) {
    const r = await request(`/${file.name}`);
    assert.equal(r.status, 200);
    assert.equal(sha(r.body), file.sha256);
    assert.equal(
      r.headers['cache-control'],
      'public, max-age=31536000, immutable',
    );
    checks++;
  }
  for (const path of [
    '/assets/absent.js',
    '/.env',
    '/.git/config',
    '/quality-manifest.json',
    '/assets/absent.js.map',
  ])
    assert.equal((await request(path)).status, 404);
  assert.equal((await request('/', { method: 'POST' })).status, 405);
  checks++;
  assert.equal(
    (await request('/', { headers: { Host: 'evil.test' } })).status,
    421,
  );
  checks++;
  const r = await request('/api/echo?cursor=a%2Fb', {
    method: 'POST',
    body: 'fixture body',
    headers: {
      Origin: 'https://fleet.test',
      Cookie: 'fleetiq.session=fixture',
      Forwarded: 'for=203.0.113.13;proto=http;host=evil.test',
      'X-Forwarded-For': '203.0.113.13',
      'X-Forwarded-Proto': 'http',
      'X-Forwarded-Host': 'evil.test',
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.equal(r.headers.etag, undefined);
  assert.deepEqual(r.headers['set-cookie'], [
    'fleetiq.session=fixture; Path=/; HttpOnly; Secure; SameSite=Lax',
    'fleetiq.csrf=fixture; Path=/; Secure; SameSite=Strict',
  ]);
  const echo = JSON.parse(r.body);
  assert.equal(echo.path, '/api/echo?cursor=a%2Fb');
  assert.equal(echo.body, 'fixture body');
  assert.equal(echo.headers.host, 'fleet.test');
  assert.equal(echo.headers.origin, 'https://fleet.test');
  assert.equal(echo.headers.cookie, 'fleetiq.session=fixture');
  assert.equal(echo.headers.forwarded, undefined);
  assert.equal(echo.headers['x-forwarded-proto'], 'https');
  assert.equal(echo.headers['x-forwarded-host'], 'fleet.test');
  assert.ok(!echo.headers['x-forwarded-for']?.includes('203.0.113.13'));
  checks++;
  const untrusted = JSON.parse(
    (await request('/api/echo', { headers: { Origin: 'https://evil.test' } }))
      .body,
  );
  assert.equal(untrusted.headers.origin, 'https://evil.test');
  checks++;
  const redirect = await request('/api/redirect');
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.location, 'https://fleet.test/api/callback');
  assert.equal(redirect.headers['cache-control'], 'no-store');
  checks++;
  assert.equal(JSON.parse((await request('/api')).body).path, '/api');
  checks++;
  await assert.rejects(
    new Promise((resolve, reject) =>
      http
        .get({ hostname: edge, port: 8081, path: '/ready' }, resolve)
        .on('error', reject),
    ),
  );
  checks++;
} else if (mode === 'tls') {
  await assert.rejects(request('/', { tls: true }), (error) =>
    [
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    ].includes(error.code),
  );
  const ca = Buffer.from(process.env.FLEETIQ_TEST_CA, 'base64');
  const r = await request('/tenants/tenant-a/assets', { tls: true, ca });
  assert.equal(r.status, 200);
  assert.equal(sha(r.body), contract.index);
  const api = await request('/api/echo', {
    tls: true,
    ca,
    headers: { Origin: 'https://fleet.test' },
  });
  const echo = JSON.parse(api.body);
  assert.equal(echo.headers.origin, 'https://fleet.test');
  assert.equal(echo.headers.host, 'fleet.test');
  assert.equal(echo.headers['x-forwarded-proto'], 'https');
  checks = 3;
} else if (mode === 'unavailable') {
  const r = await request('/api/echo');
  assert.equal(r.status, 502);
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.notEqual(sha(r.body), contract.index);
  checks = 1;
} else throw new Error('Unknown image probe mode.');
console.log(JSON.stringify({ mode, checks, passed: true }));
