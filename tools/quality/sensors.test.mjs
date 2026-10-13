import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { build } from 'vite';
import browserConfiguration from '../../apps/web-e2e/playwright.quality.config.ts';
import { temporary } from '../security/owned.mjs';
import { REVIEWED } from '../verification/reviewed-dependencies.mjs';
import { qualityManifest } from './build-manifest.mjs';
import { inspectBundle } from './bundle.mjs';
import { prepareCoverage } from './component-tests.mjs';
import { inspectQualityConfiguration } from './configuration.mjs';
import { assessCoverage, coverageScope } from './coverage.mjs';
import { applyMutation, requireMutationResult } from './mutations.mjs';
import { validateObservation } from './observations.mjs';
import {
  assessPerformance,
  qualityPolicy,
  requireNoPageErrors,
  requireUnrecordedMeasurement,
} from './policy.mjs';

function fixture(context) {
  const owned = temporary('fleetiq-quality-test-');
  context.after(() => owned.dispose());
  return owned.root;
}
function reports() {
  const summary = Object.fromEntries(
    coverageScope.map((file) => [
      `/fixture/apps/web/${file}`,
      Object.fromEntries(
        Object.entries(qualityPolicy.coverage[file]).map(
          ([metric, baseline]) => [
            metric,
            {
              total: baseline.minimumTotal,
              covered: baseline.minimumTotal,
              pct: 100,
            },
          ],
        ),
      ),
    ]),
  );
  const results = {
    success: true,
    testResults: qualityPolicy.obligations.map((entry) => ({
      name: `/fixture/apps/web/${entry.file}`,
      assertionResults: entry.titles.map((title) => ({
        title,
        status: 'passed',
      })),
    })),
  };
  return { summary, results };
}
test('scoped coverage qualifies complete measured sources and mandatory assertions', () => {
  const { summary, results } = reports();
  assert.equal(assessCoverage(summary, results).passed, true);
});
for (const defect of [
  'omitted-file',
  'denominator',
  'false-percentage',
  'deleted-assertion',
  'skipped-assertion',
  'failed-run',
]) {
  test(`coverage rejects ${defect}`, () => {
    const { summary, results } = reports();
    const first = Object.keys(summary)[0];
    if (defect === 'omitted-file') delete summary[first];
    if (defect === 'denominator')
      summary[first].statements = { total: 1, covered: 1, pct: 100 };
    if (defect === 'false-percentage') summary[first].lines.covered = 0;
    if (defect === 'deleted-assertion')
      results.testResults[0].assertionResults.shift();
    if (defect === 'skipped-assertion')
      results.testResults[0].assertionResults[0].status = 'pending';
    if (defect === 'failed-run') results.success = false;
    assert.throws(() => assessCoverage(summary, results));
  });
}
test('coverage cleanup preserves unrelated outputs and rejects redirected parents', (context) => {
  const root = fixture(context),
    external = fixture(context);
  const directory = prepareCoverage(root);
  writeFileSync(path.join(directory, 'keep.txt'), 'preserve');
  writeFileSync(path.join(directory, 'coverage-summary.json'), 'stale');
  prepareCoverage(root);
  assert.equal(
    readFileSync(path.join(directory, 'keep.txt'), 'utf8'),
    'preserve',
  );
  const second = fixture(context);
  mkdirSync(path.join(second, 'apps'));
  symlinkSync(
    external,
    path.join(second, 'apps/web'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(() => prepareCoverage(second));
});
test('real Vite graph and final bytes distinguish sample owners from legitimate example text', async (context) => {
  const root = fixture(context);
  const source = path.join(root, 'apps/web/src');
  mkdirSync(path.join(source, 'features/assets/demo'), { recursive: true });
  writeFileSync(
    path.join(root, 'index.html'),
    '<script type="module" src="/apps/web/src/main.js"></script>',
  );
  writeFileSync(
    path.join(source, 'main.js'),
    'document.body.dataset.example="Electric locomotive 417";',
  );
  const compile = () =>
    build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [qualityManifest(root)],
      build: { outDir: 'dist', minify: false },
    });
  await compile();
  const output = path.join(root, 'dist');
  assert.equal(inspectBundle(output).passed, true);
  assert.throws(
    () =>
      inspectBundle(output, { ...qualityPolicy.bundle, javascriptBytes: 1 }),
    /budget/u,
  );
  const manifest = JSON.parse(
    readFileSync(path.join(output, 'quality-manifest.json'), 'utf8'),
  );
  const file = path.join(output, manifest.files[0].name);
  writeFileSync(file, `${readFileSync(file, 'utf8')}changed`);
  assert.throws(() => inspectBundle(output), /changed/u);
  writeFileSync(
    path.join(source, 'features/assets/demo/sample.js'),
    'export const sample="synthetic";',
  );
  writeFileSync(
    path.join(source, 'main.js'),
    'import {sample} from "./features/assets/demo/sample.js";document.body.dataset.example=sample;',
  );
  await compile();
  assert.throws(() => inspectBundle(output), /sample modules/u);
});

test('real Vite graph canonicalizes directory aliases without hiding sample owners', async (context) => {
  const root = fixture(context);
  const aliasParent = fixture(context);
  const alias = path.join(aliasParent, 'checkout');
  symlinkSync(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const source = path.join(root, 'apps/web/src');
  mkdirSync(path.join(source, 'features/assets/demo'), { recursive: true });
  writeFileSync(
    path.join(root, 'index.html'),
    '<script type="module" src="/apps/web/src/main.js"></script>',
  );
  writeFileSync(
    path.join(source, 'main.js'),
    'document.body.dataset.ready="yes";',
  );
  const compile = () =>
    build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [qualityManifest(alias)],
      build: { outDir: 'dist', minify: false },
    });
  await compile();
  const output = path.join(root, 'dist');
  assert.equal(inspectBundle(output).passed, true);
  const manifest = JSON.parse(
    readFileSync(path.join(output, 'quality-manifest.json'), 'utf8'),
  );
  assert.deepEqual(manifest.modules, ['apps/web/src/main.js']);
  writeFileSync(
    path.join(source, 'features/assets/demo/sample.js'),
    'export const sample="synthetic";',
  );
  writeFileSync(
    path.join(source, 'main.js'),
    'import {sample} from "./features/assets/demo/sample.js";document.body.dataset.example=sample;',
  );
  await compile();
  assert.throws(() => inspectBundle(output), /sample modules/u);
});

test('unavailable source paths and an empty owned graph cannot emit a valid manifest', (context) => {
  const root = fixture(context);
  const plugin = qualityManifest(root);
  assert.throws(
    () =>
      plugin.generateBundle(
        {},
        {
          missing: {
            type: 'chunk',
            modules: { [path.join(root, 'apps/web/src/missing.js')]: {} },
          },
        },
      ),
    /ENOENT/u,
  );
  plugin.generateBundle(
    {},
    {
      virtual: { type: 'chunk', modules: { '\0virtual-entry': {} } },
    },
  );
  assert.throws(
    () => plugin.writeBundle({ dir: path.join(root, 'dist') }, {}),
    /module graph is unavailable/u,
  );
});

test('linked output and fabricated inventory never qualify as production bytes', (context) => {
  const root = fixture(context);
  const external = fixture(context);
  symlinkSync(
    external,
    path.join(root, 'linked'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(() => inspectBundle(root));
});
test('critical mutants must hit one exact anchor and fail the actual assertion', () => {
  assert.equal(
    applyMutation('a target b', 'target', 'replacement'),
    'a replacement b',
  );
  assert.throws(() => applyMutation('none', 'target', 'x'));
  assert.throws(() => applyMutation('target target', 'target', 'x'));
  const result = (status) => ({
    testResults: [
      {
        assertionResults: [
          {
            title: 'critical',
            status,
            failureMessages: ['AssertionError: controlled regression'],
          },
        ],
      },
    ],
  });
  requireMutationResult(result('failed'), 'critical', 'failed');
  assert.throws(() =>
    requireMutationResult(result('passed'), 'critical', 'failed'),
  );
  assert.throws(() =>
    requireMutationResult({ testResults: [] }, 'critical', 'failed'),
  );
});
test('performance budgets reject absent, malformed, slow and retained-resource observations', () => {
  const samples = Array.from(
    { length: qualityPolicy.performance.samples },
    () => ({ navigationMs: 1, filterMs: 1 }),
  );
  const resources = {
    heapBefore: 100,
    heapAfter: 100,
    nodesBefore: 100,
    nodesAfter: 100,
  };
  assert.equal(assessPerformance(samples, resources).passed, true);
  assert.throws(() => assessPerformance(samples.slice(1), resources));
  assert.throws(() =>
    assessPerformance(
      [{ navigationMs: NaN, filterMs: 1 }, ...samples.slice(1)],
      resources,
    ),
  );
  assert.throws(() => assessPerformance(samples, null));
  assert.throws(
    () =>
      assessPerformance(
        [
          {
            navigationMs: qualityPolicy.performance.navigationMs + 1,
            filterMs: 1,
          },
          ...samples.slice(1),
        ],
        resources,
      ),
    /maxNavigationMs=2001, limit=2000/u,
  );
  assert.throws(
    () =>
      assessPerformance(samples, {
        ...resources,
        nodesAfter: 100 + qualityPolicy.performance.nodeGrowth + 1,
      }),
    /nodeGrowth=401, limit=400/u,
  );
  assert.throws(() =>
    assessPerformance(samples, {
      ...resources,
      heapAfter: 100 + qualityPolicy.performance.heapGrowthBytes + 1,
    }),
  );
});
test('measured fixture rejects recording and cannot silently accept missing options', () => {
  requireUnrecordedMeasurement('off', 'off');
  for (const trace of ['on', 'retain-on-failure', { mode: 'off' }, undefined])
    assert.throws(
      () => requireUnrecordedMeasurement(trace, 'off'),
      /recording/u,
    );
  for (const video of ['on', 'retain-on-failure', undefined])
    assert.throws(
      () => requireUnrecordedMeasurement('off', video),
      /recording/u,
    );
});
test('page errors and payload-bearing observation extensions cannot be discarded', () => {
  requireNoPageErrors(0);
  assert.throws(() => requireNoPageErrors(1), /redacted/u);
  const value = {
    viewport: 'desktop',
    theme: 'light',
    observations: [{ screen: 'catalogue', violations: [] }],
  };
  validateObservation('accessibility', value);
  assert.throws(() =>
    validateObservation('accessibility', { ...value, html: 'private-marker' }),
  );
  assert.throws(() =>
    validateObservation('accessibility', {
      ...value,
      observations: [
        {
          screen: 'catalogue',
          violations: [{ id: 'rule', count: 1, html: 'private-marker' }],
        },
      ],
    }),
  );
  assert.throws(() => validateObservation('unknown', value));
});

test('provider and source scope cannot bypass the measured component gate', () => {
  const app = {
    scripts: {
      'test:component': 'node ../../tools/quality/component-tests.mjs',
    },
    devDependencies: {
      vitest: REVIEWED.tools.vitest,
      '@vitest/coverage-v8': REVIEWED.tools.vitest,
    },
  };
  inspectQualityConfiguration(app);
  assert.throws(() =>
    inspectQualityConfiguration({
      ...app,
      scripts: { 'test:component': 'vitest run' },
    }),
  );
  assert.throws(() =>
    inspectQualityConfiguration(app, qualityPolicy, coverageScope.slice(1)),
  );
  assert.throws(() =>
    inspectQualityConfiguration({
      ...app,
      devDependencies: { vitest: REVIEWED.tools.vitest },
    }),
  );
  assert.throws(() =>
    inspectQualityConfiguration({
      ...app,
      devDependencies: {
        vitest: REVIEWED.tools.vitest,
        '@vitest/coverage-v8': '0.0.0',
      },
    }),
  );
});

for (const defect of [
  'missing-project',
  'missing-sensor',
  'trace',
  'video',
  'gc',
  'workers',
  'retries',
]) {
  test(`quality project registration rejects ${defect}`, () => {
    const browser = structuredClone(browserConfiguration);
    const profile = browser.projects[1];
    if (defect === 'missing-project') browser.projects.pop();
    if (defect === 'missing-sensor') profile.testMatch.pop();
    if (defect === 'trace') profile.use.trace = 'retain-on-failure';
    if (defect === 'video') profile.use.video = 'on';
    if (defect === 'gc') profile.use.launchOptions.args = [];
    if (defect === 'workers') browser.workers = 2;
    if (defect === 'retries') browser.retries = 1;
    const app = {
      scripts: {
        'test:component': 'node ../../tools/quality/component-tests.mjs',
      },
      devDependencies: {
        vitest: REVIEWED.tools.vitest,
        '@vitest/coverage-v8': REVIEWED.tools.vitest,
      },
    };
    assert.throws(
      () =>
        inspectQualityConfiguration(app, qualityPolicy, coverageScope, browser),
      /owned quality projects/u,
    );
  });
}
test('missing budget fields and sparse samples cannot qualify', () => {
  const limits = { ...qualityPolicy.performance };
  delete limits.navigationMs;
  const samples = Array.from({ length: 5 }, () => ({
    navigationMs: 1,
    filterMs: 1,
  }));
  const resources = {
    heapBefore: 1,
    heapAfter: 1,
    nodesBefore: 1,
    nodesAfter: 1,
  };
  assert.throws(() => assessPerformance(samples, resources, limits));
  assert.throws(() => assessPerformance(Array(5), resources));
  const { summary, results } = reports();
  const policy = structuredClone(qualityPolicy);
  delete policy.coverage[coverageScope[0]].lines.minimumTotal;
  assert.throws(() => assessCoverage(summary, results, policy));
});
