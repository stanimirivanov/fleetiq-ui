import assert from 'node:assert/strict';
import test from 'node:test';
import { verificationExitCode } from './cli-decision.mjs';

const pending = { completePass: false, blocker: 'dependency-review-required' };
const candidate = {
  kind: 'dependency-candidate',
  completePass: false,
  qualificationPass: true,
};
test('the required check stays blocked even after candidate acceptance tests pass', () => {
  for (const requested of [false, true])
    assert.equal(
      verificationExitCode('acceptance', requested, pending, candidate),
      1,
    );
});
test('qualification jobs expose real success only in explicit candidate mode', () => {
  for (const group of ['browser', 'browser-quality', 'structural', 'product']) {
    assert.equal(verificationExitCode(group, true, pending, candidate), 0);
    assert.equal(verificationExitCode(group, false, pending, candidate), 1);
    for (const defect of [
      { ...candidate, qualificationPass: false },
      { ...candidate, completePass: true },
      { ...candidate, kind: undefined },
      undefined,
    ])
      assert.equal(verificationExitCode(group, true, pending, defect), 1);
    for (const blocker of [
      'sources-changed',
      'dependency-inventory-invalid',
      'interrupted',
    ])
      assert.equal(
        verificationExitCode(group, true, { ...pending, blocker }, candidate),
        1,
      );
  }
});
test('reviewed complete verification retains its canonical success path', () => {
  for (const group of [
    'acceptance',
    'browser',
    'browser-quality',
    'structural',
  ])
    assert.equal(
      verificationExitCode(group, false, { completePass: true }, undefined),
      0,
    );
});
