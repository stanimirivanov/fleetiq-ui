import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { validateBundleEvidence } from '../bundle.mjs';
import { cspFor, inlineScriptHashes } from '../inline-csp.mjs';
import { inspectLayout } from '../oci.mjs';
import {
  CHECKS,
  IMAGE,
  REPOSITORY,
  readJson,
  SOURCE,
  validateDockerfile,
  validateEdgeConfiguration,
  validateQualification,
  validateScan,
  validateTools,
} from '../policy.mjs';
import {
  validateImportedRuntime,
  validateLoadedIdentity,
} from '../transport.mjs';
import {
  checkProducer,
  checkPublication,
  validateContext,
} from '../workflow-policy.mjs';
import { layoutFixture } from './fixtures.mjs';

const tools = readJson('tools/images/tools.json');
const recipe = readFileSync('Dockerfile', 'utf8').replaceAll('\r\n', '\n');
const digest = `sha256:${'a'.repeat(64)}`;
function scanFixture() {
  const now = Date.now();
  return {
    now,
    scan: {
      SchemaVersion: 2,
      Metadata: { ImageID: digest, OS: { Family: 'alpine' } },
      Results: [
        {
          Class: 'os-pkgs',
          Packages: [{ Name: 'musl' }, { Name: 'nginx', Version: '1.30.6-r1' }],
        },
      ],
    },
    db: {
      Version: '0.76.0',
      VulnerabilityDB: {
        Version: 2,
        UpdatedAt: new Date(now - 1000).toISOString(),
        NextUpdate: new Date(now + 100000).toISOString(),
      },
    },
  };
}
test('actual image recipe/context/workflow pass strict producer policy', () => {
  checkProducer();
  validateTools(tools);
  validateDockerfile(recipe, tools);
});
test('floating tools, root images and environment-specific browser builds fail', () => {
  for (const mutate of [
    (t) => (t.edge = 'nginx:latest'),
    (t) => (t.transport = `quay.io/skopeo/stable:v1.22.3@${digest}`),
    (t) => (t.transport = `quay.io/containers/skopeo:v1.22.3@${digest}`),
    (t) =>
      (t.transport = `quay.io/containers/skopeo:latest-immutable@${digest}`),
    (t) => (t.tls = 'alpine/openssl:3.5.9'),
    (t) => (t.platform = 'linux/arm64'),
    (t) => (t.node = `untrusted/node@${digest}`),
  ]) {
    const candidate = structuredClone(tools);
    mutate(candidate);
    assert.throws(() => validateTools(candidate));
  }
  for (const bad of [
    recipe.replace('USER 10001:10001', 'USER root'),
    recipe.replace('--frozen-lockfile', ''),
    recipe.replace('COPY packaging/nginx/ /etc/fleetiq/', ''),
    recipe.replace(
      'COPY --from=builder /tmp/csp.conf /usr/share/fleetiq/csp.conf',
      '',
    ),
    recipe.replace('STOPSIGNAL SIGQUIT', 'STOPSIGNAL SIGTERM'),
    recipe.replace('command -v nginx >/dev/null', 'true'),
    recipe.replace('command -v wget >/dev/null', 'true'),
    `${recipe}\nRUN apk add openssl`,
    `${recipe}\nRUN setcap cap_net_bind_service=+ep /usr/sbin/nginx`,
    `${recipe}\nARG VITE_BACKEND_URL`,
  ])
    assert.throws(() => validateDockerfile(bad, tools));
  const context = readFileSync('.dockerignore', 'utf8');
  for (const bad of [
    `${context}\n!.env\n`,
    context.replace('**/.git', ''),
    context.replace('**/node_modules', ''),
  ])
    assert.throws(() => validateContext(bad));
});
test('publication permissions, exact checkout, prerequisites and retention cannot drift', () => {
  const template = readFileSync(
    '.github/image-publication.yml.template',
    'utf8',
  );
  const current = readFileSync('.github/workflows/publish-image.yml', 'utf8');
  checkPublication(template, current);
  for (const bad of [
    current.replace('packages: write', 'contents: write'),
    current.replace(
      'ref: \u0024{{ github.sha }}',
      'ref: \u0024{{ inputs.source_revision }}',
    ),
    current.replace('pnpm image:qualify', 'echo skipped'),
    current.replace('pnpm e2e', 'echo skipped'),
    current.replace("steps.artifacts.outcome == 'success'", 'always()'),
  ])
    assert.throws(() => checkPublication(template, bad));
});
test('real OCI descriptors bind runtime, SBOM, npm builder coverage and source', () => {
  const f = layoutFixture();
  try {
    const artifact = inspectLayout(f.layout, f.revision);
    assert.deepEqual(artifact.runtime, f.image);
    assert.equal(artifact.config, f.config.digest);
    assert.throws(() => inspectLayout(f.layout, 'b'.repeat(40)));
    writeFileSync(
      join(f.layout, 'blobs/sha256', f.config.digest.slice(7)),
      'corrupt',
    );
    assert.throws(() => inspectLayout(f.layout, f.revision));
  } finally {
    f.cleanup();
  }
});
test('canonical UI identity rejects historical labels and provenance in new artifacts', () => {
  assert.equal(REPOSITORY, 'stanimirivanov/fleetiq-ui');
  assert.equal(SOURCE, 'https://github.com/stanimirivanov/fleetiq-ui');
  assert.equal(IMAGE, 'ghcr.io/stanimirivanov/fleetiq-ui');
  for (const options of [
    { source: 'https://github.com/stanimirivanov/fleetiq-ux' },
    { provenanceSource: 'https://github.com/stanimirivanov/fleetiq-ux.git' },
    { provenanceSource: 'git@github.com:stanimirivanov/fleetiq-ux.git' },
  ]) {
    const fixture = layoutFixture(options);
    try {
      assert.throws(
        () => inspectLayout(fixture.layout, fixture.revision),
        /source labels|repository differs/,
      );
    } finally {
      fixture.cleanup();
    }
  }
});

test('wrong image, incomplete native coverage, findings and stale DB fail closed', () => {
  const good = scanFixture();
  validateScan(good.scan, good.db, good.now, digest);
  for (const mutate of [
    (s) => (s.Metadata.ImageID = `sha256:${'b'.repeat(64)}`),
    (s) => s.Results[0].Packages.pop(),
    (s) =>
      s.Results.push({ Type: 'gobinary', Packages: [{ Name: 'unexpected' }] }),
    (s) => (s.Results[0].Packages = []),
    (s) =>
      (s.Results[0].Vulnerabilities = [{ Severity: 'HIGH', FixedVersion: '' }]),
    (s) => (s.Results[0].Secrets = [{ RuleID: 'synthetic' }]),
  ]) {
    const value = structuredClone(good.scan);
    mutate(value);
    assert.throws(() => validateScan(value, good.db, good.now, digest));
  }
  assert.throws(() =>
    validateScan(good.scan, good.db, good.now + 86400001, digest),
  );
});
test('local store IDs stay separate from the pulled complete OCI digest', () => {
  for (const id of [digest, `sha256:${'b'.repeat(64)}`]) {
    const loaded = { id, image: `127.0.0.1:1234/fleetiq@${digest}` };
    validateLoadedIdentity({ Id: id, RepoTags: [loaded.image] }, loaded);
    assert.throws(() =>
      validateLoadedIdentity({ Id: id, RepoTags: [] }, loaded),
    );
  }
});
test('inline CSP hashes preserve bootstrap behavior without unsafe script execution', () => {
  const html =
    '<script>const theme = "light";</script><script src="/assets/a.js"></script>';
  const [hash] = inlineScriptHashes(html);
  assert.match(hash, /^'sha256-[a-zA-Z0-9+/=]+'$/u);
  assert.ok(cspFor(html).includes(hash));
  assert.ok(cspFor(html).includes("worker-src 'self'"));
  assert.ok(!cspFor(html).includes('blob:'));
  assert.ok(!cspFor(html).includes('unsafe-eval'));
  assert.ok(!cspFor(html).includes("script-src 'self' 'unsafe-inline'"));
  assert.notDeepEqual(inlineScriptHashes(`${html}<script>other()</script>`), [
    hash,
  ]);
});
test('incomplete receipts and excessive bundle sizes cannot authorize publication', () => {
  const record = {
    format: 'fleetiq-ux-image-qualification.v1',
    outcome: 'passed',
    source: { revision: 'a'.repeat(40), repository: REPOSITORY },
    platform: 'linux/amd64',
    image: { digest, manifest: digest, config: digest },
    bundle: { digest },
    scan: { digest, outcome: 'passed' },
    sbom: { digest },
    provenance: { digest },
    checks: CHECKS,
  };
  validateQualification(record, record.source.revision);
  assert.throws(() =>
    validateQualification(
      { ...record, checks: CHECKS.slice(1) },
      record.source.revision,
    ),
  );
  assert.throws(() =>
    validateQualification(
      { ...record, outcome: 'incomplete' },
      record.source.revision,
    ),
  );
  assert.throws(() =>
    validateBundleEvidence({
      passed: true,
      files: 1,
      modules: 1,
      graphDigest: digest,
      javascriptBytes: Number.MAX_SAFE_INTEGER,
    }),
  );
});

test('import preserves active config and ordered filesystem hashes across daemon stores', () => {
  const expected = {
    os: 'linux',
    architecture: 'amd64',
    config: {
      User: '10001:10001',
      Entrypoint: ['/usr/local/bin/fleetiq-edge'],
      Env: ['XDG_DATA_HOME=/tmp/data'],
    },
    rootfs: { type: 'layers', diff_ids: [`sha256:${'a'.repeat(64)}`] },
  };
  const actual = {
    Os: 'linux',
    Architecture: 'amd64',
    Config: { ...expected.config, Cmd: null, AttachStdin: false },
    RootFS: { Type: 'layers', Layers: expected.rootfs.diff_ids },
  };
  validateImportedRuntime(actual, expected);
  assert.throws(() =>
    validateImportedRuntime(
      {
        ...actual,
        Config: { ...actual.Config, Volumes: { '/unplanned': {} } },
      },
      expected,
    ),
  );
  assert.throws(() =>
    validateImportedRuntime(
      { ...actual, Config: { ...actual.Config, Labels: { unexpected: '' } } },
      expected,
    ),
  );
  assert.throws(() =>
    validateImportedRuntime(
      { ...actual, RootFS: { Layers: [`sha256:${'b'.repeat(64)}`] } },
      expected,
    ),
  );
  assert.throws(() =>
    validateImportedRuntime(
      { ...actual, Config: { ...actual.Config, Cmd: ['unexpected'] } },
      expected,
    ),
  );
  assert.throws(() =>
    validateImportedRuntime(
      { ...actual, Config: { ...actual.Config, User: '0' } },
      expected,
    ),
  );
});

test('runtime bundle evidence requires independently bounded lazy map bytes', () => {
  const report = {
    passed: true,
    files: 1,
    modules: 1,
    graphDigest: digest,
    javascriptBytes: 1,
    javascriptGzipBytes: 1,
    cssBytes: 1,
    cssGzipBytes: 1,
    map: {
      javascriptBytes: 1,
      javascriptGzipBytes: 1,
      cssBytes: 1,
      cssGzipBytes: 1,
    },
  };
  validateBundleEvidence(report);
  assert.throws(
    () => validateBundleEvidence({ ...report, map: undefined }),
    /map bundle/,
  );
  assert.throws(
    () =>
      validateBundleEvidence({
        ...report,
        map: { ...report.map, javascriptBytes: 1700001 },
      }),
    /map bundle/,
  );
});

test('owned map resources fail closed while asset inspector routes retain SPA fallback', () => {
  const nginx = readFileSync(
    'packaging/nginx/nginx.conf.template',
    'utf8',
  ).replaceAll('\r\n', '\n');
  assert(nginx.includes('location /maps/ {'));
  assert(nginx.includes('try_files $uri =404;'));
  assert(nginx.includes('try_files $uri /index.html;'));
  assert(!nginx.includes('location /assets/ {'));
  assert(nginx.includes('proxy_read_timeout 75s;'));
  assert(nginx.includes('server_tokens off;'));
});

test('NGINX routing/privacy/streaming controls cannot be silently removed', () => {
  const main = readFileSync('packaging/nginx/nginx.conf.template', 'utf8');
  const proxy = readFileSync('packaging/nginx/proxy.conf.template', 'utf8');
  const entry = readFileSync('packaging/entrypoint.sh', 'utf8');
  validateEdgeConfiguration(main, proxy, entry);
  for (const weakened of [
    main.replace('server_tokens off;', 'server_tokens on;'),
    main.replace('fastcgi_temp_path /tmp/fastcgi;', ''),
    main.replace('types { application/javascript mjs; }', ''),
    main.replace('client_max_body_size 8m;', 'client_max_body_size 1m;'),
    main.replace('add_header_inherit merge;', ''),
    main.replace('return 421;', 'return 200;'),
    main.replace('try_files $uri =404;', 'try_files $uri /index.html;'),
    main.replace('proxy_read_timeout 75s;', ''),
    main.replace('        include @@SCRATCH@@/proxy.conf;', ''),
  ])
    assert.throws(() => validateEdgeConfiguration(weakened, proxy, entry));
  for (const weakened of [
    proxy.replace('proxy_buffering off;', 'proxy_buffering on;'),
    proxy.replace(
      'proxy_set_header X-Forwarded-For $remote_addr;',
      'proxy_set_header X-Forwarded-For $http_x_forwarded_for;',
    ),
    proxy.replace(
      'proxy_set_header Origin $http_origin;',
      'proxy_set_header Origin https://fleet.test;',
    ),
    proxy.replace('proxy_hide_header ETag;', ''),
  ])
    assert.throws(() => validateEdgeConfiguration(main, weakened, entry));
  assert.throws(() =>
    validateEdgeConfiguration(
      main,
      proxy,
      entry.replace('nginx -t -c', 'true -c'),
    ),
  );
});
