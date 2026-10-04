import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const css = await readFile(new URL('apps/web/src/styles.css', root), 'utf8');
const native = await readFile(
  new URL('apps/mobile/src/theme/tokens.ts', root),
  'utf8',
);
const config = JSON.parse(
  await readFile(new URL('apps/mobile/app.json', root), 'utf8'),
);

const tokenNames = [
  'canvas',
  'surface',
  'outline',
  'foreground',
  'muted',
  'accent',
  'unknown',
];

function block(source, marker) {
  const start = source.indexOf(marker);
  assert(start >= 0, `Missing ${marker} palette`);
  const open = source.indexOf('{', start);
  const close = source.indexOf('}', open);
  assert(open >= 0 && close >= 0, `Incomplete ${marker} palette`);
  return source.slice(open + 1, close);
}

function token(source, name, prefix) {
  const line = source
    .split('\n')
    .find((item) => item.trimStart().startsWith(`${prefix}${name}:`));
  const value = line?.match(/#[0-9a-fA-F]{6}/)?.[0];
  assert(value, `Missing ${name} token`);
  return value.toLowerCase();
}

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => {
      const value = Number.parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const webBlocks = {
  light: block(css, ':root {'),
  dark: block(css, ':root[data-theme="dark"] {'),
};
const nativeBlocks = {
  light: block(native, 'light: {'),
  dark: block(native, 'dark: {'),
};
for (const scheme of ['light', 'dark']) {
  const palette = {};
  for (const name of tokenNames) {
    assert(css.includes(`--color-${name}: var(--theme-${name});`));
    const web = token(webBlocks[scheme], name, '--theme-');
    const mobile = token(nativeBlocks[scheme], name, '');
    assert.equal(web, mobile, `${scheme} ${name} must match across platforms`);
    palette[name] = web;
  }
  for (const background of ['canvas', 'surface']) {
    for (const foreground of ['foreground', 'muted', 'accent', 'unknown']) {
      assert(
        contrast(palette[foreground], palette[background]) >= 4.5,
        `${scheme} ${foreground} text needs 4.5:1 contrast on ${background}`,
      );
    }
  }
}
assert(webBlocks.light.includes('color-scheme: light;'));
assert(webBlocks.dark.includes('color-scheme: dark;'));
assert.equal(config.expo.userInterfaceStyle, 'automatic');
console.log(
  'Web/native light and dark tokens match; text colors meet 4.5:1 contrast',
);
