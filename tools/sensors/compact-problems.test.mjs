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

test('shares complete response dispatch and tenant prefixes without changing arguments', () => {
  const operation = source
    .replace(
      '      "400":',
      '    () => "/api/v1/tenants/" + tenant,\n    withResponse(options?.config)(HttpClientResponse.matchStatus({\n      "2xx": decodeSuccess(Work200),\n      "400":',
    )
    .replace(
      '      orElse: unexpectedStatus',
      '      orElse: unexpectedStatus\n    }))',
    );
  const output = compactGeneratedProblems(operation);
  assert.match(
    output,
    /respond\(options\?\.config, Work200, "Work", \[400, 409\]\)/u,
  );
  assert.match(output, /\(\) => tenantPathPrefix \+ tenant/u);
  assert.match(output, /const tenantPathPrefix = "\/api\/v1\/tenants\/"/u);
  const special = compactGeneratedProblems(
    operation.replace('decodeSuccess(Work200)', 'decodeSpecial(Work200)'),
  );
  assert.match(special, /decodeSpecial\(Work200\)/u);
});

test('shares exact browser mutation markers and leaves other headers alone', () => {
  const markers =
    'HttpClientRequest.setHeaders({ "Origin": options?.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options?.params?.["X-FleetIQ-CSRF"] ?? undefined })';
  const operation = source.replace(
    '    httpClient,',
    '    httpClient,\n    ' + markers + ',',
  );
  assert.match(
    compactGeneratedProblems(operation),
    /mutationHeaders\(options\?\.params\),/u,
  );
  const different = operation.replace('X-FleetIQ-CSRF', 'If-Match');
  assert.match(
    compactGeneratedProblems(different),
    /HttpClientRequest\.setHeaders/u,
  );
});
