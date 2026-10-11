import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDocument } from './markdown.mjs';
import { validatePlan } from './plans.mjs';

const file = 'docs/exec-plans/completed/fixture.md';
const valid =
  '# Plan\n\nStatus: completed on 11 October 2026\nMilestone: M02 - Product Foundation\n\n## Goal\n\nImprove checks.\n\n## Scope\n\nCheck source.\n\n## Acceptance evidence\n\n- pnpm check passed.\n';

function check(source, filename = file) {
  return validatePlan(parseDocument(filename, source));
}

test('historical common fields and adjacent paragraph metadata remain valid', () => {
  assert.deepEqual(check(valid), []);
});

test('active plans record honest not-run evidence', () => {
  assert.deepEqual(
    check(
      valid
        .replace('completed on 11 October 2026', 'active (implementation)')
        .replace(
          'pnpm check passed',
          'pnpm check not run: implementation pending',
        ),
      'docs/exec-plans/active/fixture.md',
    ),
    [],
  );
});

test('README indexes are navigation rather than plans', () => {
  assert.deepEqual(
    check('# Index\n', 'docs/exec-plans/completed/README.md'),
    [],
  );
});

test('status examples in fenced code, inline code, HTML comments and nested quotes fail', () => {
  for (const fake of [
    '~~~md\nStatus: completed\n~~~',
    '`Status: completed`',
    '<!-- Status: completed -->',
    '> Status: completed',
  ]) {
    assert.ok(
      check(valid.replace('Status: completed on 11 October 2026', fake)).some(
        (diagnostic) => /Status:/u.test(diagnostic.message),
      ),
      fake,
    );
  }
});

test('status fields must agree with their lifecycle directory', () => {
  assert.ok(
    check(
      valid.replace('Status: completed on 11 October 2026', 'Status: active'),
    ).some((diagnostic) => /Status: completed/u.test(diagnostic.message)),
  );
});

test('duplicated status or milestone fields fail', () => {
  for (const extra of [
    'Status: completed',
    'Milestone: M04 - Semantic Twin and Live UI',
  ]) {
    assert.ok(
      check(valid.replace('## Goal', `${extra}\n\n## Goal`)).length > 0,
    );
  }
});

test('fields inserted after substantive plan sections do not count as metadata', () => {
  const source = valid
    .replace('Status: completed on 11 October 2026\n', '')
    .replace('Improve checks.', 'Improve checks.\n\nStatus: completed');
  assert.ok(
    check(source).some((diagnostic) => /Status:/u.test(diagnostic.message)),
  );
});

test('combined status and milestone prose cannot masquerade as standalone metadata', () => {
  const source = valid.replace(
    'Status: completed on 11 October 2026\nMilestone: M02 - Product Foundation',
    'Status: completed. Milestone: **M02 - Product Foundation**.',
  );
  assert.ok(
    check(source).some((diagnostic) => /Milestone:/u.test(diagnostic.message)),
  );
});

test('milestones use a two-digit positive index and a title', () => {
  for (const invalid of [
    'M2 - Product Foundation',
    'M00 - Product Foundation',
    'M02',
    'M02 - ',
  ]) {
    assert.ok(
      check(valid.replace('M02 - Product Foundation', invalid)).some(
        (diagnostic) => /Milestone:/u.test(diagnostic.message),
      ),
      invalid,
    );
  }
});

test('fake headings in code blocks cannot replace real plan sections', () => {
  assert.ok(
    check(
      valid.replace(
        '## Scope\n\nCheck source.',
        '~~~md\n## Scope\nCheck source.\n~~~',
      ),
    ).some((diagnostic) => /scope section/u.test(diagnostic.message)),
  );
});

test('empty sections and evidence with no outcome fail', () => {
  assert.ok(
    check(valid.replace('Improve checks.', '')).some((diagnostic) =>
      /substantive/u.test(diagnostic.message),
    ),
  );
  assert.ok(
    check(valid.replace('- pnpm check passed.', '- pnpm check.')).some(
      (diagnostic) => /distinguish/u.test(diagnostic.message),
    ),
  );
});

test('Evidence aliases and CRLF preserve historical acceptance records', () => {
  assert.deepEqual(
    check(
      valid.replace('Acceptance evidence', 'Evidence').replaceAll('\n', '\r\n'),
    ),
    [],
  );
});

test('metadata diagnostics retain the actual milestone source line', () => {
  const [diagnostic] = check(
    valid.replace('M02 - Product Foundation', 'M2 - Product Foundation'),
  );
  assert.equal(diagnostic.line, 4);
});

test('quoted headings cannot replace top-level plan sections', () => {
  assert.ok(
    check(valid.replace('## Scope', '> ## Scope')).some((diagnostic) =>
      /scope section/u.test(diagnostic.message),
    ),
  );
});
