import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { checkDesignTokens } from './design-tokens.mjs';
import { ownedFixture } from './fixtures.mjs';

const stylesheet = await readFile(
  new URL('../../apps/web/src/design-system/tokens.css', import.meta.url),
  'utf8',
);
async function fixture(context, content = stylesheet) {
  const root = await ownedFixture(context);
  const stylesheetPath = path.join(root, 'tokens.css');
  await writeFile(stylesheetPath, content);
  return { stylesheetPath };
}
function changeTheme(source, theme, mutate) {
  const selector = `[data-theme="${theme}"] {`;
  const start = source.indexOf(selector) + selector.length;
  const end = source.indexOf('}', start);
  return (
    source.slice(0, start) +
    mutate(source.slice(start, end)) +
    source.slice(end)
  );
}

for (const newline of ['LF', 'CRLF']) {
  test(`real Light/Dark semantic tokens pass with ${newline} source`, async (context) => {
    const source = stylesheet.replace(
      /\r?\n/gu,
      newline === 'LF' ? '\n' : '\r\n',
    );
    assert.deepEqual(await checkDesignTokens(await fixture(context, source)), {
      themes: 2,
      checks: 28,
    });
  });
}

test('absence of default Light applicability fails', async (context) => {
  const source = stylesheet.replace(/:root,\s*/u, '');
  await assert.rejects(
    checkDesignTokens(await fixture(context, source)),
    /Light tokens must apply/,
  );
});
test('absence of the Dark selector fails', async (context) => {
  await assert.rejects(
    checkDesignTokens(
      await fixture(
        context,
        stylesheet.replace('[data-theme="dark"]', '[data-theme="missing"]'),
      ),
    ),
    /Missing theme selector/,
  );
});
test('an unclosed theme block fails', async (context) => {
  const source = stylesheet.slice(0, stylesheet.lastIndexOf('}'));
  await assert.rejects(
    checkDesignTokens(await fixture(context, source)),
    /Unclosed theme selector/,
  );
});
test('a removed or unsupported token value fails closed', async (context) => {
  for (const value of ['', '--fi-foreground: rgb(20 34 53);']) {
    const source = changeTheme(stylesheet, 'light', (body) =>
      body.replace(/--fi-foreground:\s*#[\da-f]{6};/iu, value),
    );
    await assert.rejects(
      checkDesignTokens(await fixture(context, source)),
      /missing token for foreground/,
    );
  }
});
test('missing stylesheet fails without including its contents', async (context) => {
  const root = await ownedFixture(context);
  await assert.rejects(
    checkDesignTokens({ stylesheetPath: path.join(root, 'missing.css') }),
    /Cannot read semantic token/,
  );
});

// Exercise every promised pair in both themes. This locks the policy surface,
// without reproducing luminance mathematics or declaring full WCAG compliance.
const requiredPairs = [
  ['foreground', 'canvas'],
  ['foreground', 'surface'],
  ['muted', 'canvas'],
  ['muted', 'surface'],
  ['accent', 'surface'],
  ['on-accent', 'accent'],
  ['status-nominal', 'status-nominal-bg'],
  ['status-warning', 'status-warning-bg'],
  ['status-critical', 'status-critical-bg'],
  ['status-unknown', 'status-unknown-bg'],
  ['focus', 'canvas'],
  ['focus', 'surface'],
  ['control-outline', 'canvas'],
  ['control-outline', 'surface'],
];
for (const theme of ['light', 'dark']) {
  for (const [foreground, background] of requiredPairs) {
    test(`${theme} rejects unreadable ${foreground}/${background}`, async (context) => {
      const source = changeTheme(stylesheet, theme, (body) => {
        const color = body.match(
          new RegExp(`--fi-${background}:\\s*(#[\\da-f]{6});`, 'iu'),
        )?.[1];
        assert.ok(color, 'the real theme must declare the background fixture');
        return body.replace(
          new RegExp(`--fi-${foreground}:\\s*#[\\da-f]{6};`, 'iu'),
          `--fi-${foreground}: ${color};`,
        );
      });
      await assert.rejects(
        checkDesignTokens(await fixture(context, source)),
        new RegExp(
          `${theme}: ${foreground}/${background} contrast 1\\.00:1`,
          'u',
        ),
      );
    });
  }
}

test('normal text below 4.5:1 is rejected even when it exceeds 3:1', async (context) => {
  const source = changeTheme(stylesheet, 'light', (body) =>
    body
      .replace(/--fi-canvas:\s*#[\da-f]{6};/iu, '--fi-canvas: #ffffff;')
      .replace(
        /--fi-foreground:\s*#[\da-f]{6};/iu,
        '--fi-foreground: #777777;',
      ),
  );
  await assert.rejects(
    checkDesignTokens(await fixture(context, source)),
    /light: foreground\/canvas contrast 4\.48:1 is below 4\.5:1/,
  );
});
test('non-text focus and control outlines accept contrast between 3:1 and 4.5:1', async (context) => {
  const source = changeTheme(stylesheet, 'light', (body) =>
    body
      .replace(/--fi-canvas:\s*#[\da-f]{6};/iu, '--fi-canvas: #ffffff;')
      .replace(/--fi-surface:\s*#[\da-f]{6};/iu, '--fi-surface: #ffffff;')
      .replace(/--fi-focus:\s*#[\da-f]{6};/iu, '--fi-focus: #888888;')
      .replace(
        /--fi-control-outline:\s*#[\da-f]{6};/iu,
        '--fi-control-outline: #888888;',
      ),
  );
  assert.deepEqual(await checkDesignTokens(await fixture(context, source)), {
    themes: 2,
    checks: 28,
  });
});
test('non-text focus below 3:1 is rejected', async (context) => {
  const source = changeTheme(stylesheet, 'light', (body) =>
    body
      .replace(/--fi-surface:\s*#[\da-f]{6};/iu, '--fi-surface: #ffffff;')
      .replace(/--fi-focus:\s*#[\da-f]{6};/iu, '--fi-focus: #aaaaaa;'),
  );
  await assert.rejects(
    checkDesignTokens(await fixture(context, source)),
    /light: focus\/surface contrast 2\.32:1 is below 3:1/,
  );
});
