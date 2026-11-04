import assert from 'node:assert/strict';
import test from 'node:test';
import { compactGeneratedProblems } from './compact-problems.mjs';

const source = [
  'export const Work400 = Problem',
  'export const Work409 = Problem',
  '  return {',
  '    httpClient,',
  '      "400": decodeError("Work400", Work400),',
  '      "409": decodeError("Work409", Work409),',
  '      orElse: unexpectedStatus',
  '  }',
  '',
].join('\n');

test('shares problem dispatch without changing registered statuses or error prefix', () => {
  const output = compactGeneratedProblems(source);
  assert.match(output, /\.\.\.decodeProblems\("Work", \[400, 409\]\)/u);
  assert.match(output, /decodeError\(\(prefix \+ status\) as .*?, Problem\)/u);
  assert.match(output, /orElse: unexpectedStatus/u);
});
test('retains other error schemas and unusual tags without reinterpretation', () => {
  for (const modified of [
    source.replace('Work409 = Problem', 'Work409 = SpecialProblem'),
    source.replace('"Work409"', '"Conflict"'),
  ])
    assert.equal(compactGeneratedProblems(modified), modified);
});
