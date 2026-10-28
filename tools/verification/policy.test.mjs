import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { GROUPS, REQUIRED_SCRIPTS, selectedChecks } from './catalogue.mjs';
import { inspectPolicy } from './policy.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const manifest = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const workflow = parse(
  readFileSync(path.join(root, '.github/workflows/quality.yml'), 'utf8'),
);
const workspace = readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
const guide = readFileSync(
  path.join(root, '.github/workflows/user-guide.yml'),
  'utf8',
);
function mutated(modify) {
  const inputs = {
    manifest: structuredClone(manifest),
    workflow: structuredClone(workflow),
  };
  modify(inputs);
  return inspectPolicy(
    inputs.manifest,
    stringify(inputs.workflow),
    workspace,
    guide,
  );
}
test('current policy and every catalogue group have valid explicit commands', () => {
  assert.deepEqual(
    inspectPolicy(manifest, stringify(workflow), workspace, guide),
    [],
  );
  for (const group of Object.keys(GROUPS)) {
    assert.ok(selectedChecks(group).length > 0);
    assert.ok(
      selectedChecks(group).every(({ script }) => REQUIRED_SCRIPTS[script]),
    );
  }
  assert.throws(() => selectedChecks('unknown'), /Unknown/);
});
for (const name of ['check', 'browser', 'browser-quality', 'harness-windows']) {
  test(`missing required ${name} job is rejected`, () => {
    assert.ok(
      mutated(({ workflow: config }) => {
        delete config.jobs[name];
      }).length,
    );
  });
  test(`conditional ${name} gate is rejected`, () => {
    assert.ok(
      mutated(({ workflow: config }) => {
        config.jobs[name].steps.at(-1).if = 'false';
        // Browser's last step is its optional upload; condition the actual gate too.
        config.jobs[name].steps.find(
          (step) =>
            step.run?.startsWith('pnpm ') && !step.run.includes('install'),
        ).if = 'false';
      }).length,
    );
  });
}
for (const script of Object.keys(REQUIRED_SCRIPTS)) {
  test(`canonical command bypass rejected: ${script}`, () => {
    assert.ok(
      mutated(({ manifest: config }) => {
        config.scripts[script] = 'node -e ""';
      }).length,
    );
  });
}
test('setup ordering, frozen installs and skip permissions are enforced', () => {
  for (const edit of [
    (config) => {
      config.jobs.check.if = 'github.event_name == "push"';
    },
    (config) => {
      config.jobs.check['continue-on-error'] = true;
    },
    (config) => {
      config.jobs.check.steps.find((step) => step.run === 'pnpm check')[
        'continue-on-error'
      ] = true;
    },
    (config) => {
      config.jobs.check.steps.find((step) =>
        step.run?.includes('--frozen-lockfile'),
      ).run = 'pnpm install';
    },
    (config) => {
      config.jobs.check.steps.reverse();
    },
    (config) => {
      config.permissions.contents = 'write';
    },
    (config) => {
      config.jobs.check.permissions = { contents: 'write' };
    },
    (config) => {
      delete config.on.pull_request;
    },
  ])
    assert.ok(mutated(({ workflow: config }) => edit(config)).length);
});
test('invalid and duplicate-key YAML and absent parser declaration fail', () => {
  assert.ok(inspectPolicy(manifest, 'jobs: [invalid', workspace, guide).length);
  assert.ok(
    inspectPolicy(manifest, 'jobs: {}\njobs: {}\n', workspace, guide).length,
  );
  assert.ok(
    inspectPolicy(manifest, stringify(workflow), 'packages: []', guide).length,
  );
});

test('expression skips, event filters and execution overrides cannot weaken required gates', () => {
  const edits = [
    (config) => {
      config.jobs.check['continue-on-error'] = '\u0024{{ true }}';
    },
    (config) => {
      config.jobs.check.steps.find((step) => step.run === 'pnpm check')[
        'continue-on-error'
      ] = '\u0024{{ true }}';
    },
    (config) => {
      config.on.pull_request = { 'paths-ignore': ['**'] };
    },
    (config) => {
      config.on.pull_request = { branches: ['irrelevant'] };
    },
    (config) => {
      config.on.push = { branches: ['main'] };
    },
    (config) => {
      config.jobs.check.needs = ['conditional-preparation'];
    },
    (config) => {
      config.defaults = { run: { 'working-directory': 'elsewhere' } };
    },
    (config) => {
      config.env = { NODE_OPTIONS: '--require arbitrary' };
    },
    (config) => {
      config.jobs.check.defaults = { run: { shell: 'echo {0}' } };
    },
    (config) => {
      config.jobs.check.container = 'unreviewed';
    },
    (config) => {
      config.jobs.check.steps.find((step) => step.run === 'pnpm check').shell =
        'echo {0}';
    },
    (config) => {
      config.jobs.check.steps.find((step) => step.run === 'pnpm check')[
        'working-directory'
      ] = 'elsewhere';
    },
  ];
  for (const edit of edits)
    assert.ok(mutated(({ workflow: config }) => edit(config)).length);
});

// Exact reviewed edges keep roots independent and expensive jobs success-gated.
test('acceptance and Windows roots precede parallel browser and image gates', () => {
  for (const name of ['check', 'harness-windows'])
    assert.equal(workflow.jobs[name].needs, undefined);
  for (const name of ['browser', 'browser-quality', 'image']) {
    assert.deepEqual(workflow.jobs[name].needs, ['check', 'harness-windows']);
    for (const needs of [
      undefined,
      [],
      ['check'],
      ['harness-windows'],
      [name],
      ['missing'],
      ['check', 'harness-windows', 'image'],
    ])
      assert.ok(
        mutated(({ workflow: config }) => {
          config.jobs[name].needs = needs;
        }).length,
      );
    for (const condition of [
      'always()',
      'failure()',
      "needs.check.result != 'cancelled'",
    ])
      assert.ok(
        mutated(({ workflow: config }) => {
          config.jobs[name].if = condition;
        }).length,
      );
  }
  assert.ok(
    mutated(({ workflow: config }) => {
      config.jobs['harness-windows'].needs = ['check'];
    }).length,
  );
});
