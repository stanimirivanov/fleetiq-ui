import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseDocument } from 'yaml';

const file = new URL('../../.github/dependabot.yml', import.meta.url);
function inspect(source) {
  const document = parseDocument(source, { uniqueKeys: true });
  assert.deepEqual(document.errors, []);
  const config = document.toJS();
  assert.equal(config.version, 2);
  assert.deepEqual(
    config.updates.map((entry) => entry['package-ecosystem']).sort(),
    ['github-actions', 'npm'],
  );
  for (const entry of config.updates) {
    assert.equal(entry.directory, '/');
    assert.equal(entry.ignore, undefined, 'Do not suppress upgrade proposals.');
    assert.equal(entry.allow, undefined, 'Do not restrict proposal inventory.');
    assert.equal(
      entry['target-branch'],
      undefined,
      'Security review uses the default branch.',
    );
  }
  const npm = config.updates.find(
    (entry) => entry['package-ecosystem'] === 'npm',
  );
  const groups = npm.groups;
  for (const group of Object.values(groups))
    assert.deepEqual(group['update-types'], ['minor', 'patch']);
  assert.deepEqual(groups['analysis-tools'].patterns, [
    'typescript',
    'typescript-parser',
    'dependency-cruiser',
  ]);
  assert.deepEqual(groups['component-testing'].patterns, [
    'vitest',
    '@vitest/coverage-v8',
  ]);
  assert.deepEqual(groups['browser-testing'].patterns, [
    '@playwright/test',
    '@axe-core/playwright',
  ]);
  assert.deepEqual(groups.effect.patterns, ['effect', '@effect/*']);
  // First matching group wins; the general development group must stay last.
  assert.equal(Object.keys(groups).at(-1), 'development-tools');
  const actions = config.updates.find(
    (entry) => entry['package-ecosystem'] === 'github-actions',
  );
  assert.equal(
    actions.groups,
    undefined,
    'Review action semantics individually.',
  );
}
test('actual Dependabot configuration coordinates related maintenance updates without suppressing majors', () => {
  inspect(readFileSync(file, 'utf8'));
});
for (const [name, from, to] of [
  [
    'hidden major group',
    'update-types: [minor, patch]',
    'update-types: [minor, patch, major]',
  ],
  [
    'suppressed proposals',
    '    directory: /',
    '    directory: /\n    ignore:\n      - dependency-name: "*"',
  ],
  [
    'separated coverage provider',
    "          - '@vitest/coverage-v8'",
    "          - '@vitest/other'",
  ],
]) {
  test(`Dependabot drift is rejected: ${name}`, () => {
    const source = readFileSync(file, 'utf8');
    assert.ok(source.includes(from));
    assert.throws(() => inspect(source.replace(from, to)));
  });
}
