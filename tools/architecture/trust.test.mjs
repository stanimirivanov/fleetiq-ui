import assert from 'node:assert/strict';
import { renameSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { checkArchitecture } from '../check-architecture.mjs';
import { assertGraphEvidence } from './evidence.mjs';
import { architectureFixture } from './fixtures.mjs';
import { runDependencyCruiser } from './runner.mjs';
import { architectureSources } from './sources.mjs';

const probes = [
  {
    name: 'product imports E2E fixture at runtime',
    rule: 'product-cannot-import-test-only-code',
    target: 'apps/web-e2e/e2e/fixtures/example.ts',
    source:
      "import { value } from '../../../../web-e2e/e2e/fixtures/example'; export const probe = value;",
    file: 'apps/web/src/features/assets/probe.ts',
  },
  {
    name: 'product imports E2E fixture only as a type',
    rule: 'product-cannot-import-test-only-code',
    target: 'apps/web-e2e/e2e/fixtures/example.ts',
    source:
      "import type { Value } from '../../../../web-e2e/e2e/fixtures/example'; export const probe = (input: Value) => input.id;",
    file: 'apps/web/src/features/assets/probe.ts',
  },
  {
    name: 'product imports colocated unit test at runtime',
    rule: 'product-cannot-import-test-only-code',
    target: 'apps/web/src/features/assets/model/example.test.ts',
    source:
      "import { value } from './model/example.test'; export const probe = value;",
    file: 'apps/web/src/features/assets/probe.ts',
  },
  {
    name: 'product imports test-folder types',
    rule: 'product-cannot-import-test-only-code',
    target: 'apps/web/src/tests/example.ts',
    source:
      "import type { Value } from '../../tests/example'; export const probe = (input: Value) => input.id;",
    file: 'apps/web/src/features/assets/probe.ts',
  },
  {
    name: 'pure model imports Solid runtime',
    imported: 'solid-js',
    rule: 'pure-models-cannot-import-external-dependencies',
    source:
      "import { createSignal } from 'solid-js'; export const probe = createSignal;",
    file: 'apps/web/src/features/assets/model/probe.ts',
  },
  {
    name: 'pure model imports Solid types',
    imported: 'solid-js',
    rule: 'pure-models-cannot-import-external-dependencies',
    source:
      "import type { Accessor } from 'solid-js'; export type Probe = Accessor<string>;",
    file: 'apps/web/src/features/assets/model/probe.ts',
  },
  {
    name: 'shared model imports Effect',
    imported: 'effect',
    rule: 'pure-models-cannot-import-external-dependencies',
    source: "import { Effect } from 'effect'; export const probe = Effect;",
    file: 'apps/web/src/shared/model/probe.ts',
  },
  {
    name: 'model imports SDK',
    rule: 'pure-models-cannot-import-external-dependencies',
    source: "import type { Map } from 'maplibre-gl'; export type Probe = Map;",
    file: 'apps/web/src/features/assets/model/probe.ts',
  },
  {
    name: 'model imports node execution API',
    rule: 'pure-models-cannot-import-external-dependencies',
    source:
      "import { readFileSync } from 'node:fs'; export const probe = readFileSync;",
    file: 'apps/web/src/shared/model/probe.ts',
  },
  {
    name: 'pure model imports demo runtime',
    rule: 'pure-models-cannot-import-non-model-code',
    target: 'apps/web/src/features/assets/demo/example.ts',
    source:
      "import { value } from '../demo/example'; export const probe = value;",
    file: 'apps/web/src/features/assets/model/probe.ts',
  },
  {
    name: 'pure model imports demo types',
    rule: 'pure-models-cannot-import-non-model-code',
    target: 'apps/web/src/features/assets/demo/example.ts',
    source:
      "import type { Value } from '../demo/example'; export const probe = (input: Value) => input.id;",
    file: 'apps/web/src/features/assets/model/probe.ts',
  },
];

function assertViolation(fixture, probe) {
  if (probe.target)
    fixture.write(
      probe.target,
      'export const value = 1; export interface Value { readonly id: string; }\n',
    );
  fixture.write(probe.file, `${probe.source}\n`);
  const result = runDependencyCruiser(fixture.root);
  assertGraphEvidence(result.graph, architectureSources(fixture.root));
  if (probe.imported) {
    const dependency = result.graph.modules
      .find((entry) => entry.source === probe.file)
      ?.dependencies.find((entry) => entry.module === probe.imported);
    assert.ok(
      dependency && !dependency.couldNotResolve,
      'Expected resolved installed dependency; unresolved stubs cannot qualify npm boundaries.',
    );
  }
  assert.ok(result.graph.summary.error > 0, `Expected policy ${probe.rule}`);
  assert.ok(
    result.graph.summary.violations.some(
      (entry) => entry.rule.name === probe.rule,
    ),
    `Expected policy ${probe.rule}`,
  );
}

for (const probe of probes) {
  test(`real graph rejects ${probe.name}`, (context) =>
    assertViolation(architectureFixture(context), probe));
}

test('pure model test files may use testing and framework utilities', (context) => {
  const fixture = architectureFixture(context);
  fixture.write(
    'apps/web/src/features/assets/model/only.test.ts',
    "import { createSignal } from 'solid-js'; export const testUtility = createSignal;\n",
  );
  assert.ok(checkArchitecture(fixture.root).sources > 0);
});

test('removing product-test policy makes the known-invalid fixture fail qualification', (context) => {
  const probe = probes[0];
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.forbidden = config.forbidden.filter(
        (rule) => rule.name !== probe.rule,
      );
    },
  });
  assert.throws(() => assertViolation(fixture, probe), /Expected policy/u);
});

test('removing model external policy makes the known-invalid fixture fail qualification', (context) => {
  const probe = probes[4];
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.forbidden = config.forbidden.filter(
        (rule) => rule.name !== probe.rule,
      );
    },
  });
  assert.throws(() => assertViolation(fixture, probe), /Expected policy/u);
});

test('every registered owner is included in actual graph extraction', (context) => {
  const fixture = architectureFixture(context);
  fixture.write(
    'packages/real-model/src/index.ts',
    'export interface Example { id: string; }\n',
  );
  const owners = ['apps/web/src', 'packages/real-model/src'];
  const result = runDependencyCruiser(fixture.root, owners);
  const sources = architectureSources(fixture.root, owners);
  assert.ok(sources.includes('packages/real-model/src/index.ts'));
  assertGraphEvidence(result.graph, sources);
});

test('registered owners require exact case and cannot be missing', (context) => {
  const fixture = architectureFixture(context);
  assert.throws(
    () => architectureSources(fixture.root, ['apps/web/Src']),
    /casing|does not exist/u,
  );
  renameSync(
    path.join(fixture.root, 'apps/web/src'),
    path.join(fixture.root, 'apps/web/hidden'),
  );
  assert.throws(() => architectureSources(fixture.root), /does not exist/u);
});

test('source links cannot redirect registered architecture inventory', (context) => {
  const fixture = architectureFixture(context);
  symlinkSync(
    path.dirname(fixture.root),
    path.join(fixture.root, 'apps/web/src/escape'),
    'dir',
  );
  assert.throws(
    () => architectureSources(fixture.root),
    /rejects source symlinks/u,
  );
});

test('resolved testing-library imports never supply product runtime or types', (context) => {
  for (const source of [
    "import { describe } from 'vitest'; export const probe = describe;",
    "import type { Locator } from '@playwright/test'; export type Probe = Locator;",
  ]) {
    const fixture = architectureFixture(context);
    assertViolation(fixture, {
      rule: 'product-cannot-import-testing-libraries',
      file: 'apps/web/src/features/assets/api/probe.ts',
      source,
    });
  }
});

test('excluding installed npm edges cannot qualify model-purity fixtures', (context) => {
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.options.exclude = { path: '(^|/)(node_modules|dist)/' };
    },
  });
  assert.throws(
    () => assertViolation(fixture, probes[4]),
    /Expected policy|Expected resolved/u,
  );
});

test('product cannot import executable harness helpers at runtime or as types', (context) => {
  for (const source of [
    "import { value } from '../../../../../tools/user-guide/example'; export const probe = value;",
    "import type { Value } from '../../../../../tools/user-guide/example'; export type Probe = Value;",
  ]) {
    const fixture = architectureFixture(context);
    assertViolation(fixture, {
      rule: 'product-cannot-import-harness-code',
      target: 'tools/user-guide/example.ts',
      file: 'apps/web/src/features/assets/probe.ts',
      source,
    });
  }
});

test('E2E may consume its owned executable guide helpers', (context) => {
  const fixture = architectureFixture(context);
  fixture.write('tools/user-guide/example.ts', 'export const value = 1;\n');
  fixture.write(
    'apps/web-e2e/helper.ts',
    "import { value } from '../../tools/user-guide/example'; export const probe = value;\n",
  );
  const result = runDependencyCruiser(fixture.root, ['apps/web-e2e']);
  assertGraphEvidence(result.graph, [
    'apps/web-e2e/helper.ts',
    'tools/user-guide/example.ts',
  ]);
  assert.equal(result.graph.summary.error, 0);
});

test('disabled package-exports resolution cannot qualify installed Effect imports', (context) => {
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      delete config.options.enhancedResolveOptions;
    },
  });
  assert.throws(
    () => assertViolation(fixture, probes[6]),
    /Expected resolved/u,
  );
});
