import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { validateBundleEvidence } from '../bundle.mjs';
import { cspFor, inlineScriptHashes } from '../inline-csp.mjs';
import { inspectLayout } from '../oci.mjs';
import {
  CHECKS,
  REPOSITORY,
  readJson,
  validateDockerfile,
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
        { Class: 'os-pkgs', Packages: [{ Name: 'musl' }] },
        {
          Type: 'gobinary',
          Class: 'lang-pkgs',
          Packages: [{ Name: 'github.com/caddyserver/caddy/v2' }],
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
    (t) => (t.edge = 'caddy:latest'),
    (t) => (t.go = 'golang:1.26.9-alpine3.23'),
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
    recipe.replace('FROM golang:1.26.9-alpine3.23@', 'FROM golang:latest@'),
    recipe.replace('go mod verify', 'go mod tidy'),
    recipe.replace('-mod=readonly', ''),
    recipe.replace('COPY --from=edge-builder /edge/caddy /usr/bin/caddy', ''),
    recipe.replace('test -z "$(getcap /usr/bin/caddy)"', ''),
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
test('wrong image, incomplete OS/Go coverage, findings and stale DB fail closed', () => {
  const good = scanFixture();
  validateScan(good.scan, good.db, good.now, digest);
  for (const mutate of [
    (s) => (s.Metadata.ImageID = `sha256:${'b'.repeat(64)}`),
    (s) => s.Results.pop(),
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
