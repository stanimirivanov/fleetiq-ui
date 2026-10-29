/** Actual image traffic; all peers are disposable synthetic fixtures on one owned network. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { qualifyBrowser } from './browser.mjs';
import { inspectRuntimeBundle } from './bundle.mjs';
import { inlineScriptHashes } from './inline-csp.mjs';
import { ensure, hash } from './policy.mjs';
import { docker, jsonDocker } from './process.mjs';
import { until } from './resources.mjs';
import { fixtureCertificates } from './tls.mjs';
import { validateLoadedIdentity } from './transport.mjs';

const restrictions = [
  '--read-only',
  '--cap-drop',
  'ALL',
  '--security-opt',
  'no-new-privileges:true',
  '--tmpfs',
  '/tmp:rw,noexec,nosuid,size=32m',
];
export async function qualifyRuntime(loaded, tools, directory, resources) {
  validateLoadedIdentity(
    (await jsonDocker(['image', 'inspect', loaded.image]))[0],
    loaded,
  );
  const fixtures = resolve('tools/images/fixtures');
  const upstream = await resources.container('upstream', [
    '--user',
    '10001:10001',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--volume',
    `${fixtures}:/fixture:ro`,
    tools.node,
    'node',
    '/fixture/upstream.mjs',
  ]);
  const edge = await resources.container('edge', [
    ...restrictions,
    '--env',
    'FLEETIQ_PUBLIC_AUTHORITY=fleet.test',
    '--env',
    `FLEETIQ_API_UPSTREAM=${upstream}:8080`,
    loaded.image,
  ]);
  await until(async () => {
    const [meta] = await jsonDocker(['inspect', edge]);
    ensure(
      !['exited', 'dead'].includes(meta.State.Status),
      `Native edge stopped before readiness (exit=${meta.State.ExitCode}).`,
    );
    return meta.State.Health?.Status === 'healthy';
  });
  const [meta] = await jsonDocker(['inspect', edge]);
  ensure(
    meta.Config.User === '10001:10001' &&
      meta.HostConfig.ReadonlyRootfs &&
      meta.HostConfig.CapDrop.includes('ALL') &&
      meta.HostConfig.SecurityOpt.includes('no-new-privileges:true'),
    'Runtime restrictions differ.',
  );
  ensure(
    meta.Image === loaded.id,
    'Running container uses another local image.',
  );
  const bundle = await inspectRuntimeBundle(edge, directory);
  const graph = JSON.parse(
    readFileSync(join(bundle.root, 'quality-manifest.json'), 'utf8'),
  );
  const contract = {
    index: hash(readFileSync(join(bundle.root, 'index.html'))),
    cspHashes: inlineScriptHashes(
      readFileSync(join(bundle.root, 'index.html'), 'utf8'),
    ),
    files: graph.files.map(({ name, sha256 }) => ({ name, sha256 })),
  };
  writeFileSync(join(directory, 'contract.json'), JSON.stringify(contract));
  const base = [
    '--rm',
    '--user',
    '10001:10001',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--network',
    resources.network,
    '--volume',
    `${fixtures}:/fixture:ro`,
    '--volume',
    `${join(directory, 'contract.json')}:/contract.json:ro`,
    '--env',
    `FLEETIQ_TEST_EDGE_HOST=${edge}`,
  ];
  const runProbe = async (mode, extra = []) => {
    const report = JSON.parse(
      await docker(
        [
          'run',
          ...base,
          ...extra,
          tools.node,
          'node',
          '/fixture/probe.mjs',
          mode,
        ],
        { timeout: 90000, diagnostics: true },
      ),
    );
    ensure(
      report.passed === true && report.mode === mode && report.checks > 0,
      'Incomplete edge probe.',
    );
    return report;
  };
  await runProbe('http');
  const browserEdge = await resources.container('browser-edge', [
    ...restrictions,
    '--publish',
    '127.0.0.1::8080',
    '--env',
    'FLEETIQ_PUBLIC_AUTHORITY=127.0.0.1',
    '--env',
    `FLEETIQ_API_UPSTREAM=${upstream}:8080`,
    loaded.image,
  ]);
  await until(async () => {
    const [state] = await jsonDocker(['inspect', browserEdge]);
    ensure(
      !['exited', 'dead'].includes(state.State.Status),
      `Browser edge stopped before readiness (exit=${state.State.ExitCode}).`,
    );
    return state.State.Health?.Status === 'healthy';
  });
  const [browserMeta] = await jsonDocker(['inspect', browserEdge]);
  const [browserPort] = browserMeta.NetworkSettings.Ports['8080/tcp'];
  ensure(
    browserPort.HostIp === '127.0.0.1',
    'Browser fixture must remain loopback.',
  );
  await qualifyBrowser(`http://127.0.0.1:${browserPort.HostPort}`);
  const tls = await fixtureCertificates(tools, resources);
  const gateway = await resources.container('gateway', [
    ...restrictions,
    '--no-healthcheck',
    '--env',
    'FLEETIQ_PUBLIC_AUTHORITY=fleet.test',
    '--env',
    `FLEETIQ_API_UPSTREAM=${edge}:8080`,
    '--volume',
    `${fixtures}/gateway.conf.template:/etc/fleetiq/nginx.conf.template:ro`,
    '--mount',
    `type=volume,source=${tls},target=/run/tls,readonly,volume-subpath=edge`,
    loaded.image,
  ]);
  await until(async () => {
    try {
      return (
        (
          await docker(['exec', gateway, 'test', '-s', '/tmp/nginx.pid'])
        ).trim() === ''
      );
    } catch {
      return false;
    }
  });
  await runProbe('tls', [
    '--env',
    `FLEETIQ_TEST_GATEWAY=${gateway}`,
    '--mount',
    `type=volume,source=${tls},target=/run/public,readonly,volume-subpath=public`,
  ]);
  await docker(['stop', '--timeout', '10', upstream]);
  await runProbe('unavailable');
  for (const [publicHost, backend] of [
    ['', 'backend:8080'],
    ['fleet.test', ''],
    ['https://fleet.test', 'backend:8080'],
    ['fleet.test', 'backend:70000'],
    ['fleet.test\nadmin on', 'backend:8080'],
    ['fleet.test', 'http://backend:8080'],
  ]) {
    const invalid = await resources.container(
      `invalid-${resources.containers.length}`,
      [
        ...restrictions,
        '--env',
        `FLEETIQ_PUBLIC_AUTHORITY=${publicHost}`,
        '--env',
        `FLEETIQ_API_UPSTREAM=${backend}`,
        loaded.image,
      ],
    );
    ensure(
      (await docker(['wait', invalid], { timeout: 15000 })).trim() === '78',
      'Invalid edge configuration was accepted.',
    );
  }
  await docker(['stop', '--timeout', '10', edge]);
  ensure(
    (await jsonDocker(['inspect', edge]))[0].State.ExitCode === 0,
    'Edge did not stop gracefully.',
  );
  return {
    bundle: bundle.report,
    checks: [
      'production-bundle',
      'runtime-config',
      'proxy-http-contract',
      'built-browser',
      'external-tls',
      'upstream-failure',
      'invalid-configuration',
      'graceful-stop',
    ],
  };
}
