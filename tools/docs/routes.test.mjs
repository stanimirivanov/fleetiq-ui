import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkDocumentation } from './check.mjs';
import { fixture } from './fixtures.mjs';

const policy = {
  requiredEntries: ['AGENTS.md', 'guide.md'],
  guidanceRoutes: [{ file: 'AGENTS.md', maxWords: 30, targets: ['guide.md'] }],
};
function check(owned) {
  return checkDocumentation(owned.root, { policy }).diagnostics;
}

test('canonical routes can use rendered reference links and percent encoding', (context) => {
  const owned = fixture(context, {
    'AGENTS.md': '# Context\n\n[Guide][owner]\n\n[owner]: %67uide.md\n',
    'guide.md': '# Guide\n',
  });
  assert.deepEqual(check(owned), []);
});

test('fences, comments, empty links and image-only links cannot supply required routes', (context) => {
  const owned = fixture(context, {
    'guide.md': '# Guide\n',
    'icon.svg': '<svg />\n',
  });
  for (const fake of [
    '~~~md\n[Guide](guide.md)\n~~~',
    '<!-- [Guide](guide.md) -->',
    '[](guide.md)',
    '[![Icon](icon.svg)](guide.md)',
  ]) {
    owned.write('AGENTS.md', `# Context\n\n${fake}\n`);
    assert.ok(
      check(owned).some((diagnostic) => diagnostic.code === 'docs.routes'),
      fake,
    );
  }
});

test('non-comment HTML is forbidden in registered navigation sources', (context) => {
  const owned = fixture(context, {
    'AGENTS.md': '# Context\n\n<a href="guide.md">Guide</a>\n',
    'guide.md': '# Guide\n',
  });
  assert.ok(
    check(owned).some((diagnostic) =>
      /plain Markdown/u.test(diagnostic.message),
    ),
  );
  owned.write(
    'AGENTS.md',
    '# Context\n\n<!-- comment --> <a href="guide.md">Guide</a> <!-- comment -->\n\n[Guide](guide.md)\n',
  );
  assert.ok(
    check(owned).some((diagnostic) =>
      /plain Markdown/u.test(diagnostic.message),
    ),
  );
});

test('real comments alongside visible routes are accepted', (context) => {
  const owned = fixture(context, {
    'AGENTS.md': '# Context\n\n<!-- explanation -->\n\n[Guide](guide.md)\n',
    'guide.md': '# Guide\n',
  });
  assert.deepEqual(check(owned), []);
});

test('registered context must exist and fit its bounded word budget', (context) => {
  const owned = fixture(context, { 'guide.md': '# Guide\n' });
  assert.ok(
    check(owned).some((diagnostic) => /missing/u.test(diagnostic.message)),
  );
  owned.write(
    'AGENTS.md',
    `# Context\n\n[Guide](guide.md)\n\n${'word '.repeat(35)}`,
  );
  assert.ok(
    check(owned).some((diagnostic) => diagnostic.code === 'docs.context'),
  );
});

test('missing source discovery prevents a docs acceptance pass', (context) => {
  const owned = fixture(context);
  const result = checkDocumentation(owned.root, {
    policy,
    runGit: () => ({ error: new Error('unavailable'), status: null }),
  });
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    ['docs.discovery'],
  );
});

test('an unused reference definition does not establish a rendered route', (context) => {
  const owned = fixture(context, {
    'AGENTS.md': '# Context\n\n[unused]: guide.md\n',
    'guide.md': '# Guide\n',
  });
  assert.ok(
    check(owned).some((diagnostic) =>
      /missing rendered/u.test(diagnostic.message),
    ),
  );
});
