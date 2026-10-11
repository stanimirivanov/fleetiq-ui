import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, symlinkSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { checkDocumentation } from './check.mjs';
import { fixture, minimalPolicy } from './fixtures.mjs';
import { documentationPolicy } from './policy.mjs';

const check = (owned, policy = minimalPolicy) =>
  checkDocumentation(owned.root, { policy });
const codes = (result) =>
  result.diagnostics.map((diagnostic) => diagnostic.code);

test('Git discovery ignores IDE documents but includes newly authored sources', (context) => {
  const owned = fixture(context);
  owned.write('.idea/tmp/audit.md', `# Ignored\n${'word '.repeat(650)}`);
  owned.write('new-guide.md', '# Guide\n\n[Missing](missing.md)\n');
  const result = check(owned);
  assert.ok(result.sourceFiles.includes('new-guide.md'));
  assert.ok(!result.sourceFiles.some((file) => file.startsWith('.idea/')));
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.file),
    ['new-guide.md'],
  );
  assert.equal(
    readFileSync(
      path.join(owned.root, '.idea/tmp/audit.md'),
      'utf8',
    ).startsWith('# Ignored'),
    true,
  );
});

test('tracked ignored Markdown remains subject to repository ownership', (context) => {
  const owned = fixture(context);
  owned.write('.idea/tracked-guide.md', '# Tracked\n\n[Missing](missing.md)\n');
  owned.git('add', '--force', '--', '.idea/tracked-guide.md');
  assert.deepEqual(
    check(owned).diagnostics.map((diagnostic) => diagnostic.file),
    ['.idea/tracked-guide.md'],
  );
});

test('real direct and reference links resolve encoded filenames and heading anchors', (context) => {
  const owned = fixture(context, {
    'README.md':
      '# Fixture\n\n[Guide](docs/space%20name.md#real-heading)\n\n[By reference][guide]\n\n[guide]: docs/space%20name.md#real-heading\n',
    'docs/space name.md': '# Guide\n\n## Real heading\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
});

test('broken reference destinations retain the rendered source location', (context) => {
  const owned = fixture(context, {
    'README.md':
      '# Fixture\n\n[Read the guide][guide]\n\n[guide]: missing.md\n',
  });
  const [diagnostic] = check(owned).diagnostics;
  assert.equal(diagnostic.code, 'docs.link');
  assert.equal(diagnostic.line, 3);
  assert.match(diagnostic.message, /does not exist/u);
});

test('fenced and HTML comment examples never become real links', (context) => {
  const owned = fixture(context, {
    'README.md':
      '# Fixture\n\n~~~md\n[Example](missing.md)\n~~~\n\n<!-- [Example](also-missing.md) -->\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
});

test('LF and CRLF documents produce identical heading/link results', (context) => {
  const source = '# Fixture\n\n[Here](#real-heading)\n\n## Real heading\n';
  const owned = fixture(context, { 'README.md': source });
  assert.deepEqual(check(owned).diagnostics, []);
  owned.write('README.md', source.replaceAll('\n', '\r\n'));
  assert.deepEqual(check(owned).diagnostics, []);
});

test('missing and duplicate-heading anchors follow GitHub heading slugs', (context) => {
  const owned = fixture(context, {
    'README.md':
      '# Fixture\n\n[Duplicate](#real-heading-1)\n\n## Real heading\n\n## Real heading\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
  owned.write('README.md', '# Fixture\n\n[Missing](#not-real)\n');
  assert.match(check(owned).diagnostics[0].message, /heading anchor/u);
});

test('malformed percent escapes fail as controlled diagnostics', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Bad](bad%ZZ.md)\n',
  });
  const result = check(owned);
  assert.deepEqual(codes(result), ['docs.link']);
  assert.equal(
    result.diagnostics[0].message,
    'destination has malformed URI encoding',
  );
});

test('encoded traversal and absolute paths cannot escape source ownership', (context) => {
  const owned = fixture(context);
  for (const destination of [
    '%2e%2e/outside.md',
    '%2Foutside.md',
    'C:/outside.md',
    'bad%5Cpath.md',
  ]) {
    owned.write('README.md', `# Fixture\n\n[Bad](${destination})\n`);
    assert.ok(
      check(owned).diagnostics.some(
        (diagnostic) => diagnostic.code === 'docs.link',
      ),
      destination,
    );
  }
});

test('link casing is exact even on case-insensitive filesystems', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Wrong](guide.md)\n',
    'Guide.md': '# Guide\n',
  });
  assert.match(check(owned).diagnostics[0].message, /casing/u);
});

test('existing ignored link targets cannot inject unchecked context', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Ignored](.idea/guide.md)\n',
  });
  owned.write('.idea/guide.md', '# Ignored\n');
  assert.match(check(owned).diagnostics[0].message, /outside Git-owned/u);
});

test('source links may name owned code files without importing their bodies', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Code](src/value.ts)\n',
    'src/value.ts': 'export const value = 1;\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
});

test('long documents need a parsed summary immediately after the title', (context) => {
  const owned = fixture(context, {
    'README.md': `# Fixture\n\n${'word '.repeat(610)}`,
  });
  assert.ok(codes(check(owned)).includes('docs.summary'));
  owned.write('README.md', `# Fixture\n\n## TL;DR\n\n${'word '.repeat(610)}`);
  assert.deepEqual(check(owned).diagnostics, []);
  owned.write(
    'README.md',
    `# Fixture\n\n~~~md\n## TL;DR\n~~~\n\n${'word '.repeat(610)}`,
  );
  assert.ok(codes(check(owned)).includes('docs.summary'));
});

test('a real Windows junction or Unix symlink escape fails without exposing target content', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Escape](redirect/private.md)\n',
  });
  const outside = path.join(owned.parent, 'outside');
  owned.write('../outside/private.md', '# Synthetic private content\n');
  const redirect = path.join(owned.root, 'redirect');
  symlinkSync(
    outside,
    redirect,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  try {
    const result = check(owned);
    assert.match(result.diagnostics[0].message, /junction target escapes/u);
    assert.ok(
      !JSON.stringify(result.diagnostics).includes('Synthetic private'),
    );
    assert.equal(
      readFileSync(path.join(outside, 'private.md'), 'utf8'),
      '# Synthetic private content\n',
    );
  } finally {
    unlinkSync(redirect);
  }
});

test('the CLI module can be imported without executing repository verification', () => {
  const cli = pathToFileURL(path.resolve('tools/check-docs.mjs')).href;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(cli)})`],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('the registered policy accepts a complete isolated context map', (context) => {
  const files = {};
  for (const required of documentationPolicy.requiredEntries) {
    if (required.endsWith('.md')) files[required] = '# Fixture\n';
    else files[`${required}/README.md`] = '# Fixture\n';
  }
  for (const rule of documentationPolicy.guidanceRoutes) {
    for (const target of rule.targets) files[target] ??= '# Fixture\n';
    files[rule.file] =
      '# Context\n\n' +
      rule.targets
        .map(
          (target) =>
            `- [Guide](${path.posix.relative(path.posix.dirname(rule.file), target)})`,
        )
        .join('\n') +
      '\n';
  }
  const owned = fixture(context, files);
  assert.deepEqual(check(owned, documentationPolicy).diagnostics, []);
  owned.write('tools/AGENTS.md', '# Missing routes\n');
  assert.ok(
    check(owned, documentationPolicy).diagnostics.some(
      (diagnostic) =>
        diagnostic.file === 'tools/AGENTS.md' &&
        diagnostic.code === 'docs.routes',
    ),
  );
});

test('duplicate reference definitions use CommonMark first-definition precedence', (context) => {
  const owned = fixture(context, {
    'README.md':
      '# Fixture\n\n[Guide][OWNER]\n\n[owner]: guide.md\n[owner]: missing.md\n',
    'guide.md': '# Guide\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
});

test('Unicode heading fragments use valid UTF-8 URI decoding', (context) => {
  const owned = fixture(context, {
    'README.md': '# Fixture\n\n[Heading](#caf%C3%A9)\n\n## Café\n',
  });
  assert.deepEqual(check(owned).diagnostics, []);
  owned.write('README.md', '# Fixture\n\n[Bad](#%C3%28)\n');
  assert.equal(
    check(owned).diagnostics[0].message,
    'destination has malformed URI encoding',
  );
});

test('every agreed guidance owner retains its mandatory routing sensor', (context) => {
  const files = {};
  for (const required of documentationPolicy.requiredEntries) {
    files[required.endsWith('.md') ? required : `${required}/README.md`] =
      '# Fixture\n';
  }
  for (const rule of documentationPolicy.guidanceRoutes) {
    for (const target of rule.targets) files[target] ??= '# Fixture\n';
    files[rule.file] = `# Context\n\n${rule.targets
      .map(
        (target) =>
          `- [Guide](${path.posix.relative(path.posix.dirname(rule.file), target)})`,
      )
      .join('\n')}\n`;
  }
  const owned = fixture(context, files);
  const expectedOwners = [
    ['AGENTS.md', 4],
    ['docs/README.md', 7],
    ['apps/web/src/app/AGENTS.md', 3],
    ['apps/web/src/features/AGENTS.md', 3],
    ['apps/web/src/shared/AGENTS.md', 3],
    ['apps/web-e2e/AGENTS.md', 2],
    ['tools/AGENTS.md', 3],
  ];
  for (const [file, minimumRoutes] of expectedOwners) {
    const rule = documentationPolicy.guidanceRoutes.find(
      (candidate) => candidate.file === file,
    );
    assert.ok(
      rule && rule.targets.length >= minimumRoutes,
      `${file} mandatory route scope`,
    );
    owned.write(file, '# Missing canonical routes\n');
    assert.ok(
      check(owned, documentationPolicy).diagnostics.some(
        (diagnostic) =>
          diagnostic.file === file && diagnostic.code === 'docs.routes',
      ),
      file,
    );
    owned.write(file, files[file]);
  }
});
