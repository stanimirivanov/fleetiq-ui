import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARCHITECTURE_TYPESCRIPT,
  assertExtractionEnvironment,
  assertGraphEvidence,
} from './architecture/evidence.mjs';
import { architectureFixture } from './architecture/fixtures.mjs';
import { importProbes } from './architecture/import-probes.mjs';
import { lintProbes } from './architecture/lint-probes.mjs';
import { runBiome, runDependencyCruiser } from './architecture/runner.mjs';
import { architectureSources } from './architecture/sources.mjs';
import { checkArchitecture } from './check-architecture.mjs';

function assertDependencyViolation(fixture, probe) {
  fixture.write(`apps/web/src/${probe.file}`, probe.source);
  const result = runDependencyCruiser(fixture.root);
  assertGraphEvidence(result.graph, architectureSources(fixture.root));
  // The JSON reporter's process status is not its policy verdict.
  assert.ok(
    result.graph.summary.error > 0,
    `Expected architecture diagnostic ${probe.rule}`,
  );
  assert.ok(
    result.graph.summary.violations.some(
      (violation) =>
        violation.rule.name === probe.rule &&
        violation.rule.severity === 'error',
    ),
    `Expected architecture diagnostic ${probe.rule}`,
  );
}

function assertLintViolation(
  fixture,
  probe,
  file = 'apps/web/src/features/assets/ui/Probe.tsx',
) {
  fixture.write(file, probe.source);
  const result = runBiome(fixture.root, file);
  assert.equal(
    result.status,
    1,
    `Expected lint diagnostic ${probe.diagnostic}`,
  );
  assert.ok(
    result.stderr.includes(probe.diagnostic),
    `Expected lint diagnostic ${probe.diagnostic}: ${result.stderr}`,
  );
}

test('public entries, sibling imports and TSX extraction pass together', (context) => {
  const fixture = architectureFixture(context);
  const result = checkArchitecture(fixture.root);
  assert.ok(result.sources >= 15);
  assert.ok(result.dependencies > 0);
});

for (const probe of importProbes) {
  test(probe.name, (context) =>
    assertDependencyViolation(architectureFixture(context), probe),
  );
}

test('circular imports fail through the installed CLI', (context) => {
  const fixture = architectureFixture(context);
  fixture.write(
    'apps/web/src/features/assets/model/a.ts',
    "import { second } from './b';\nexport const first = () => second;\n",
  );
  assertDependencyViolation(fixture, {
    rule: 'no-circular-imports',
    file: 'features/assets/model/b.ts',
    source:
      "import { first } from './a';\nexport const second = () => first;\n",
  });
});

for (const probe of lintProbes) {
  test(probe.name, (context) =>
    assertLintViolation(architectureFixture(context), probe),
  );
}

for (const file of [
  'apps/web/src/app/Probe.tsx',
  'apps/web/src/shared/ui/Probe.tsx',
]) {
  test(`Effect restriction covers ${file}`, (context) =>
    assertLintViolation(architectureFixture(context), lintProbes[2], file));
}

test('tracked props and For rendering pass the selected lint rules', (context) => {
  const fixture = architectureFixture(context);
  const file = 'apps/web/src/features/assets/ui/Probe.tsx';
  fixture.write(
    file,
    "import { For } from 'solid-js';\nexport function Probe(props: { readonly items: string[] }) {\n  return <div><For each={props.items}>{(item) => <span>{item}</span>}</For></div>;\n}\n",
  );
  const result = runBiome(fixture.root, file);
  assert.equal(result.status, 0, result.stderr);
});

test('removing a boundary rule makes its violation probe fail', (context) => {
  const probe = importProbes[0];
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.forbidden = config.forbidden.filter(
        (rule) => rule.name !== probe.rule,
      );
    },
  });
  assert.throws(
    () => assertDependencyViolation(fixture, probe),
    /Expected architecture diagnostic/u,
  );
});

test('moving a boundary outside its owner makes its violation probe fail', (context) => {
  const probe = importProbes[0];
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.forbidden.find((rule) => rule.name === probe.rule).from.path =
        '^unscanned/';
    },
  });
  assert.throws(
    () => assertDependencyViolation(fixture, probe),
    /Expected architecture diagnostic/u,
  );
});

test('disabled type-only extraction cannot qualify the graph', (context) => {
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.options.tsPreCompilationDeps = false;
    },
  });
  assert.throws(
    () => checkArchitecture(fixture.root),
    /must include type-only/u,
  );
});

test('an empty CLI graph fails instead of claiming acceptance', (context) => {
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.options.exclude = { path: '^apps/web/src/' };
    },
  });
  assert.throws(() => checkArchitecture(fixture.root), /empty source graph/u);
});

test('a partial source graph cannot qualify the scan', (context) => {
  const fixture = architectureFixture(context, {
    mutateDependencies(config) {
      config.options.exclude = { path: '^apps/web/src/generated/' };
    },
  });
  assert.throws(() => checkArchitecture(fixture.root), /omitted sources/u);
});

test('disabling Solid prop protection makes its lint probe fail', (context) => {
  const fixture = architectureFixture(context, {
    mutateBiome(config) {
      config.linter.rules.correctness.noSolidDestructuredProps = 'off';
    },
  });
  assert.throws(
    () => assertLintViolation(fixture, lintProbes[0]),
    /Expected lint diagnostic/u,
  );
});

test('moving the Effect override outside presentation makes its probe fail', (context) => {
  const fixture = architectureFixture(context, {
    mutateBiome(config) {
      config.overrides[0].includes = ['apps/web/src/never/**/*.tsx'];
    },
  });
  assert.throws(
    () => assertLintViolation(fixture, lintProbes[2]),
    /Expected lint diagnostic/u,
  );
});

test('missing, unsupported or wrong parser metadata fails explicitly', () => {
  for (const parser of [
    undefined,
    { name: 'typescript', available: false, currentVersion: '-' },
    {
      name: 'typescript',
      available: true,
      currentVersion: 'typescript@unqualified',
    },
  ]) {
    assert.throws(
      () =>
        assertExtractionEnvironment({
          transpilersFound: parser ? [parser] : [],
        }),
      (error) => error.message.includes(`requires ${ARCHITECTURE_TYPESCRIPT}`),
    );
  }
});

test('configuration launch failure is never a skipped probe', (context) => {
  const fixture = architectureFixture(context);
  fixture.write(
    '.dependency-cruiser.cjs',
    'throw new Error("synthetic configuration failure");\n',
  );
  assert.throws(() => checkArchitecture(fixture.root), /no valid JSON graph/u);
});

test('unsupported TS or TSX extensions cannot qualify extraction', () => {
  for (const missing of ['.ts', '.tsx']) {
    assert.throws(
      () =>
        assertExtractionEnvironment({
          transpilersFound: [
            {
              name: 'typescript',
              available: true,
              currentVersion: ARCHITECTURE_TYPESCRIPT,
            },
          ],
          extensionsFound: ['.ts', '.tsx'].map((extension) => ({
            extension,
            available: extension !== missing,
          })),
        }),
      /does not support/u,
    );
  }
});

for (const file of [
  'apps/web-e2e/e2e/Probe.spec.ts',
  'apps/web-e2e/e2e-dev/Probe.spec.ts',
  'apps/web-e2e/quality/Probe.spec.ts',
]) {
  test(`browser scenario cannot bypass the owned error fixture: ${file}`, (context) =>
    assertLintViolation(
      architectureFixture(context),
      {
        source:
          "import { test as unchecked } from '@playwright/test';\nunchecked('probe', async () => {});\n",
        diagnostic: 'noRestrictedImports',
      },
      file,
    ));
}
test('owned browser fixture imports pass the actual lint rule', (context) => {
  const fixture = architectureFixture(context);
  const file = 'apps/web-e2e/quality/Probe.spec.ts';
  fixture.write(
    file,
    "import { test } from '../fixtures/production-test';\ntest('probe', async () => {});\n",
  );
  assert.equal(runBiome(fixture.root, file).status, 0);
});
