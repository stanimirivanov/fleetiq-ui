import assert from 'node:assert/strict';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { temporary } from '../security/owned.mjs';
import { ACTIONS } from './actions.mjs';
import {
  REVIEWED,
  REVIEWED_PATH,
  readReviewedDependencies,
  validateReviewedDependencies,
} from './reviewed-dependencies.mjs';

function fixture(context) {
  const owned = temporary('fleetiq-reviewed-test-');
  context.after(owned.dispose);
  const directory = path.join(owned.root, 'tools/verification');
  mkdirSync(directory, { recursive: true });
  return {
    root: owned.root,
    write(value) {
      writeFileSync(path.join(owned.root, REVIEWED_PATH), value);
    },
  };
}

test('reviewed inventory is deeply immutable and compiler/parser decisions stay separate', () => {
  const candidate = structuredClone(REVIEWED);
  const qualified = validateReviewedDependencies(candidate);
  assert.deepEqual(qualified, REVIEWED);
  assert.notEqual(qualified, candidate);
  assert.ok(Object.isFrozen(qualified));
  assert.ok(Object.isFrozen(qualified.tools));
  assert.ok(Object.isFrozen(qualified.actions));
  assert.ok(Object.isFrozen(qualified.actions.checkout));
  assert.throws(() => {
    qualified.tools.astParser = '0.0.0';
  }, TypeError);
  assert.throws(() => {
    qualified.actions.checkout.commit = 'a'.repeat(40);
  }, TypeError);
  candidate.tools.astParser = '0.0.0';
  assert.equal(candidate.tools.compiler, REVIEWED.tools.compiler);
  assert.equal(qualified.tools.astParser, REVIEWED.tools.astParser);
});

test('action consumers retain exactly the reviewed upstream release commits', () => {
  assert.deepEqual(
    ACTIONS,
    Object.fromEntries(
      Object.entries(REVIEWED.actions).map(([role, entry]) => [
        role,
        `${entry.repository}@${entry.commit}`,
      ]),
    ),
  );
  assert.ok(Object.isFrozen(ACTIONS));
});

for (const [label, mutate] of [
  [
    'unknown root field',
    (value) => {
      value.allowUnreviewed = true;
    },
  ],
  [
    'missing root field',
    (value) => {
      delete value.nodeMajor;
    },
  ],
  [
    'unknown tool',
    (value) => {
      value.tools.extra = '1.0.0';
    },
  ],
  [
    'missing tool',
    (value) => {
      delete value.tools.astParser;
    },
  ],
  [
    'unknown action',
    (value) => {
      value.actions.custom = value.actions.checkout;
    },
  ],
  [
    'missing action',
    (value) => {
      delete value.actions.checkout;
    },
  ],
  [
    'unknown action field',
    (value) => {
      value.actions.checkout.allowAnySha = true;
    },
  ],
  [
    'missing action field',
    (value) => {
      delete value.actions.checkout.version;
    },
  ],
  [
    'wrong action identity',
    (value) => {
      value.actions.checkout.repository = 'untrusted/checkout';
    },
  ],
  [
    'swapped action role',
    (value) => {
      value.actions.checkout = value.actions.node;
    },
  ],
  [
    'mutable action reference',
    (value) => {
      value.actions.checkout.commit = 'v7';
    },
  ],
  [
    'short commit',
    (value) => {
      value.actions.checkout.commit = 'abcdef0';
    },
  ],
  [
    'upper-case commit',
    (value) => {
      value.actions.checkout.commit = 'A'.repeat(40);
    },
  ],
  [
    'non-string commit',
    (value) => {
      value.actions.checkout.commit = 123;
    },
  ],
  [
    'unsupported schema',
    (value) => {
      value.schemaVersion = 2;
    },
  ],
  [
    'array tool inventory',
    (value) => {
      value.tools = [];
    },
  ],
  [
    'null action inventory',
    (value) => {
      value.actions = null;
    },
  ],
]) {
  test(`reviewed registry rejects ${label}`, () => {
    const candidate = structuredClone(REVIEWED);
    mutate(candidate);
    assert.throws(
      () => validateReviewedDependencies(candidate),
      /Reviewed (?:dependency registry|action identity)/u,
    );
  });
}

for (const version of [
  '^1.2.3',
  '~1.2.3',
  'latest',
  '1.2',
  '01.2.3',
  '1.2.3-beta',
  ' 1.2.3',
  123,
]) {
  test(`registry requires exact stable package and release versions: ${version}`, () => {
    for (const mutate of [
      (value) => {
        value.pnpm = version;
      },
      (value) => {
        value.tools.compiler = version;
      },
      (value) => {
        value.actions.checkout.version = version;
      },
    ]) {
      const candidate = structuredClone(REVIEWED);
      mutate(candidate);
      assert.throws(
        () => validateReviewedDependencies(candidate),
        /Reviewed (?:dependency registry|action identity)/u,
      );
    }
  });
}

test('registry rejects unbounded exact-version strings', () => {
  for (const mutate of [
    (value) => {
      value.pnpm = `${'9'.repeat(65)}.0.0`;
    },
    (value) => {
      value.tools.compiler = `${'9'.repeat(65)}.0.0`;
    },
    (value) => {
      value.actions.checkout.version = `${'9'.repeat(65)}.0.0`;
    },
  ]) {
    const candidate = structuredClone(REVIEWED);
    mutate(candidate);
    assert.throws(
      () => validateReviewedDependencies(candidate),
      /Reviewed (?:dependency registry|action identity)/u,
    );
  }
});

for (const major of [0, -1, 100, 24.5, '24', null, Number.NaN]) {
  test(`registry rejects an invalid Node major: ${major}`, () => {
    const candidate = structuredClone(REVIEWED);
    candidate.nodeMajor = major;
    assert.throws(() => validateReviewedDependencies(candidate), /malformed/u);
  });
}

test('structural validation does not authorize a proposed action or parser change', () => {
  const candidate = structuredClone(REVIEWED);
  candidate.actions.checkout.commit = 'a'.repeat(40);
  candidate.tools.astParser = '0.0.0';
  const parsed = validateReviewedDependencies(candidate);
  assert.notEqual(
    parsed.actions.checkout.commit,
    REVIEWED.actions.checkout.commit,
  );
  assert.notEqual(parsed.tools.astParser, REVIEWED.tools.astParser);
  assert.equal(
    ACTIONS.checkout,
    `${REVIEWED.actions.checkout.repository}@${REVIEWED.actions.checkout.commit}`,
  );
});

test('registry reads an owned regular file and rejects malformed/missing content', (context) => {
  const owner = fixture(context);
  owner.write(JSON.stringify(REVIEWED));
  assert.deepEqual(readReviewedDependencies(owner.root), REVIEWED);
  owner.write('{malformed');
  assert.throws(() => readReviewedDependencies(owner.root), /valid JSON/u);
  owner.write('{}');
  assert.throws(() => readReviewedDependencies(owner.root), /malformed/u);
  assert.throws(() =>
    readReviewedDependencies(path.join(owner.root, 'missing')),
  );
});

test('oversized registry cannot become reviewed configuration', (context) => {
  const owner = fixture(context);
  owner.write(`${JSON.stringify(REVIEWED)}${' '.repeat(64 * 1024)}`);
  assert.throws(() => readReviewedDependencies(owner.root), /size bound/u);
});

test('directory links cannot redirect the reviewed registry', (context) => {
  const owner = temporary('fleetiq-reviewed-link-test-');
  context.after(owner.dispose);
  const target = path.join(owner.root, 'target/verification');
  mkdirSync(target, { recursive: true });
  writeFileSync(
    path.join(target, 'reviewed-dependencies.json'),
    JSON.stringify(REVIEWED),
  );
  symlinkSync(
    path.join(owner.root, 'target'),
    path.join(owner.root, 'tools'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(
    () => readReviewedDependencies(owner.root),
    /links are forbidden/u,
  );
});
