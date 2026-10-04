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
const palette = {};
for (const name of tokenNames) {
  const web = css.match(
    new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`),
  )?.[1];
  const mobile = native.match(
    new RegExp(`\\b${name}:\\s*'(#[0-9a-fA-F]{6})'`),
  )?.[1];
  assert(web && mobile, `Missing ${name} theme token`);
  assert.equal(web.toLowerCase(), mobile.toLowerCase(), `${name} must match`);
  palette[name] = web;
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

for (const background of ['canvas', 'surface']) {
  for (const foreground of ['foreground', 'muted', 'accent', 'unknown']) {
    assert(
      contrast(palette[foreground], palette[background]) >= 4.5,
      `${foreground} text needs at least 4.5:1 contrast on ${background}`,
    );
  }
}
assert.match(css, /color-scheme:\s*light\s*;/);
assert.equal(config.expo.userInterfaceStyle, 'light');
console.log(
  'Web/native light tokens match and text colors meet 4.5:1 contrast',
);
