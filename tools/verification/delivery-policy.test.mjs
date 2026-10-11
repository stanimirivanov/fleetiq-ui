import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse, stringify } from 'yaml';
import { ACTIONS } from './actions.mjs';
import { inspectPolicy } from './policy.mjs';

const root = new URL('../../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('package.json'));
const quality = parse(read('.github/workflows/quality.yml'));
const guide = parse(read('.github/workflows/user-guide.yml'));
const workspace = read('pnpm-workspace.yaml');
const inspect = (mutate) => {
  const inputs = {
    manifest: structuredClone(manifest),
    quality: structuredClone(quality),
    guide: structuredClone(guide),
  };
  mutate(inputs);
  return inspectPolicy(
    inputs.manifest,
    stringify(inputs.quality),
    workspace,
    stringify(inputs.guide),
  );
};
test('secure quality and both guide triggers pass the actual YAML policy', () =>
  assert.deepEqual(
    inspect(() => {}),
    [],
  ));
const cases = {
  'mutable action tag': ({ quality }) => {
    quality.jobs.check.steps[0].uses = 'actions/checkout@v6';
  },
  'different immutable action': ({ guide }) => {
    guide.jobs.deploy.steps[0].uses = `actions/deploy-pages@${'a'.repeat(40)}`;
  },
  'persisted checkout credential': ({ quality }) => {
    quality.jobs.check.steps[0].with['persist-credentials'] = true;
  },
  'shallow history': ({ quality }) => {
    quality.jobs.check.steps[0].with['fetch-depth'] = 1;
  },
  'manual-only publication': ({ guide }) => {
    delete guide.on.workflow_run;
  },
  'successful PR publication': ({ guide }) => {
    guide.jobs.build.if = 'success()';
  },
  'different publication revision': ({ guide }) => {
    guide.jobs.build.steps[0].with.ref = 'main';
  },
  'missing full acceptance': ({ guide }) => {
    guide.jobs.build.steps = guide.jobs.build.steps.filter(
      (step) => step.run !== 'pnpm check',
    );
  },
  'conditioned acceptance': ({ guide }) => {
    guide.jobs.build.steps.find((step) => step.run === 'pnpm check').if =
      'false';
  },
  'browser missing at publication revision': ({ guide }) => {
    guide.jobs.build.steps = guide.jobs.build.steps.filter(
      (step) => step.run !== 'pnpm e2e',
    );
  },
  'release dirty allowed': ({ guide }) => {
    guide.jobs.build.steps.find(
      (step) => step.run === 'pnpm guide:release --require-clean',
    ).run = 'pnpm guide:release';
  },
  'generation before verification': ({ guide }) => {
    guide.jobs.build.steps.reverse();
  },
  'scanner conditioned on success': ({ quality }) => {
    quality.jobs.browser.steps.find((step) => step.id === 'artifacts').if =
      'success()';
  },
  'scanner absent': ({ guide }) => {
    guide.jobs.build.steps = guide.jobs.build.steps.filter(
      (step) => step.id !== 'artifacts',
    );
  },
  'failure trace upload bypass': ({ quality }) => {
    quality.jobs.browser.steps.find(
      (step) =>
        step.uses === ACTIONS.upload && step.with.name.startsWith('playwright'),
    ).if = 'failure()';
  },
  'whole workspace upload': ({ quality }) => {
    quality.jobs.check.steps.find(
      (step) => step.uses === ACTIONS.upload,
    ).with.path = '.';
  },
  'pages bypass prior failure': ({ guide }) => {
    guide.jobs.build.steps.find(
      (step) => step.uses === ACTIONS.uploadPages,
    ).if = "always() && steps.artifacts.outcome == 'success'";
  },
  'unverified deploy dependency': ({ guide }) => {
    guide.jobs.deploy.needs = [];
  },
  'broader deployment permission': ({ guide }) => {
    guide.jobs.deploy.permissions.contents = 'write';
  },
  'execution hijack before gates': ({ quality }) => {
    quality.jobs.check.steps.unshift({ run: 'echo bypass' });
  },
  'duplicate scan identity': ({ quality }) => {
    quality.jobs.browser.steps.push({
      id: 'artifacts',
      run: 'corepack enable',
    });
  },
  'scanner installed after acceptance': ({ quality }) => {
    const step = quality.jobs.check.steps.find(
      (step) => step.run === 'pnpm security:install',
    );
    quality.jobs.check.steps = quality.jobs.check.steps.filter(
      (entry) => entry !== step,
    );
    quality.jobs.check.steps.push(step);
  },
  'privileged unregistered quality job': ({ quality }) => {
    quality.jobs.other = {
      'runs-on': 'ubuntu-latest',
      permissions: { contents: 'write' },
    };
  },
  'deployment injected environment': ({ guide }) => {
    guide.jobs.deploy.env = { NODE_OPTIONS: '--require unsafe' };
  },
  'scan before browser artifacts exist': ({ quality }) => {
    const steps = quality.jobs.browser.steps;
    const scanner = steps.find((step) => step.id === 'artifacts');
    steps.splice(steps.indexOf(scanner), 1);
    steps.splice(
      steps.findIndex((step) => step.run === 'pnpm e2e'),
      0,
      scanner,
    );
  },
  'registered execution after final scan': ({ quality }) => {
    quality.jobs.check.steps.push({ run: 'corepack enable' });
  },
  'checkout after final scan': ({ guide }) => {
    guide.jobs.build.steps.push({
      uses: ACTIONS.checkout,
      with: { 'persist-credentials': false, 'fetch-depth': 0 },
    });
  },
  'AST alias missing': ({ manifest }) => {
    delete manifest.devDependencies['typescript-parser'];
  },
  'archive parser unpinned': ({ manifest }) => {
    manifest.devDependencies.yauzl = '^3.4.0';
  },
};
for (const [name, mutate] of Object.entries(cases))
  test(`delivery bypass rejected: ${name}`, () =>
    assert.ok(inspect(mutate).length > 0));
