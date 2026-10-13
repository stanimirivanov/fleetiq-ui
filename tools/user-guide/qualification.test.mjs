import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { REVIEWED } from '../verification/reviewed-dependencies.mjs';
import { fixture, manifest, report, source } from './fixtures.mjs';
import { qualifiedReport, requireQualification } from './qualification.mjs';

test('reviewed declared and installed tool evidence is required for guide publication', () => {
  assert.equal(
    qualifiedReport(report('acceptance'), 'acceptance', source, REVIEWED.pnpm),
    true,
  );
});
const defects = {
  'legacy receipt without review': (value) => {
    delete value.dependencyReview;
  },
  'pending upgrade review': (value) => {
    value.dependencyReview = {
      status: 'review-required',
      changes: 1,
      issues: 0,
    };
  },
  'inconsistent upgrade review': (value) => {
    value.dependencyReview.issues = 1;
  },
  'review marked current with changes': (value) => {
    value.dependencyReview.changes = 1;
  },
  'legacy receipt without install check': (value) => {
    delete value.installedTools;
  },
  'unavailable install': (value) => {
    value.installedTools = { status: 'blocked', issues: 1 };
  },
  'install marked current with issues': (value) => {
    value.installedTools.issues = 1;
  },
  'malformed runtime version': (value) => {
    value.tools.node = 24;
  },
};
for (const [label, mutate] of Object.entries(defects)) {
  test(`guide qualification rejects ${label} for every canonical group`, async (context) => {
    for (const group of ['acceptance', 'browser', 'browser-quality']) {
      const value = report(group);
      mutate(value);
      assert.equal(qualifiedReport(value, group, source, REVIEWED.pnpm), false);
    }
    const { root } = await fixture(context);
    const file = path.join(root, '.verification/acceptance-123-fixture.json');
    const value = JSON.parse(await readFile(file, 'utf8'));
    mutate(value);
    await writeFile(file, JSON.stringify(value));
    assert.throws(
      () => requireQualification(root, source, manifest),
      /complete acceptance/u,
    );
  });
}
