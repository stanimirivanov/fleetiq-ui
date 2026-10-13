import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { temporary } from '../security/owned.mjs';
import { retainCandidateArtifacts } from './candidate-artifacts.mjs';

test('retention copies browser diagnostics into owned names and excludes inner receipts', (t) => {
  const input = temporary('fleetiq-candidate-artifacts-');
  const output = temporary('fleetiq-candidate-retained-');
  t.after(() => input.dispose());
  t.after(() => output.dispose());
  for (const relative of ['test-results', 'playwright-report', '.verification'])
    mkdirSync(path.join(input.root, relative));
  writeFileSync(
    path.join(input.root, 'test-results/failure.json'),
    '{"safe":true}',
  );
  writeFileSync(
    path.join(input.root, 'playwright-report/index.html'),
    '<p>synthetic</p>',
  );
  writeFileSync(
    path.join(input.root, '.verification/acceptance-private.json'),
    '{}',
  );
  mkdirSync(path.join(output.root, 'test-results'));
  writeFileSync(path.join(output.root, 'test-results/original.json'), '{}');
  retainCandidateArtifacts(output.root, input.root);
  const prefix = readdirSync(path.join(output.root, 'test-results')).find(
    (name) => name.startsWith('candidate-'),
  );
  assert.equal(
    readFileSync(
      path.join(output.root, 'test-results', prefix, 'failure.json'),
      'utf8',
    ),
    '{"safe":true}',
  );
  assert.equal(existsSync(path.join(output.root, '.verification')), false);
  assert.equal(
    readFileSync(path.join(output.root, 'test-results/original.json'), 'utf8'),
    '{}',
  );
});
test('linked input and output roots cannot redirect candidate retention', (t) => {
  const input = temporary('fleetiq-candidate-artifacts-');
  const output = temporary('fleetiq-candidate-retained-');
  const outside = temporary('fleetiq-candidate-outside-');
  t.after(() => input.dispose());
  t.after(() => output.dispose());
  t.after(() => outside.dispose());
  mkdirSync(path.join(input.root, 'test-results'));
  writeFileSync(path.join(input.root, 'test-results/failure.json'), '{}');
  symlinkSync(outside.root, path.join(output.root, 'test-results'), 'junction');
  assert.throws(() => retainCandidateArtifacts(output.root, input.root));
  assert.deepEqual(readdirSync(outside.root), []);
});
