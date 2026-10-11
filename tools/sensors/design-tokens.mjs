import { readFile } from 'node:fs/promises';

// Selected pairs do not certify rendered accessibility. Normal text targets
// WCAG AA; focus/control outlines target non-text contrast.
const pairs = [
  ['foreground', 'canvas', 4.5],
  ['foreground', 'surface', 4.5],
  ['muted', 'canvas', 4.5],
  ['muted', 'surface', 4.5],
  ['accent', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['status-nominal', 'status-nominal-bg', 4.5],
  ['status-warning', 'status-warning-bg', 4.5],
  ['status-critical', 'status-critical-bg', 4.5],
  ['status-unknown', 'status-unknown-bg', 4.5],
  ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
  ['control-outline', 'canvas', 3],
  ['control-outline', 'surface', 3],
];

function readTheme(stylesheet, selector, errors) {
  const start = stylesheet.indexOf(`${selector} {`);
  if (start < 0) {
    errors.push(`Missing theme selector: ${selector}`);
    return {};
  }
  const bodyStart = stylesheet.indexOf('{', start) + 1;
  const bodyEnd = stylesheet.indexOf('}', bodyStart);
  if (bodyEnd < 0) {
    errors.push(`Unclosed theme selector: ${selector}`);
    return {};
  }
  return Object.fromEntries(
    [
      ...stylesheet
        .slice(bodyStart, bodyEnd)
        .matchAll(/(--fi-[\w-]+):\s*(#[\da-f]{6})\s*;/giu),
    ].map(([, name, value]) => [name, value]),
  );
}
function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Report missing theme/tokens and inadequate contrast without exposing CSS. */
export function inspectDesignTokens(stylesheet) {
  const errors = [];
  if (!/:root\s*,\s*\[data-theme="light"\]\s*\{/u.test(stylesheet)) {
    errors.push(
      'Light tokens must apply to both the root and an explicit light specimen.',
    );
  }
  for (const [name, selector] of [
    ['light', '[data-theme="light"]'],
    ['dark', '[data-theme="dark"]'],
  ]) {
    const tokens = readTheme(stylesheet, selector, errors);
    for (const [foregroundName, backgroundName, minimum] of pairs) {
      const foreground = tokens[`--fi-${foregroundName}`];
      const background = tokens[`--fi-${backgroundName}`];
      if (!foreground || !background) {
        errors.push(
          `${name}: missing token for ${foregroundName}/${backgroundName}`,
        );
        continue;
      }
      const ratio = contrast(foreground, background);
      if (ratio < minimum) {
        errors.push(
          `${name}: ${foregroundName}/${backgroundName} contrast ${ratio.toFixed(2)}:1 is below ${minimum}:1`,
        );
      }
    }
  }
  return errors;
}

/** Read only the selected stylesheet; callers own fixture and repository paths. */
export async function checkDesignTokens({ stylesheetPath }) {
  let stylesheet;
  try {
    stylesheet = await readFile(stylesheetPath, 'utf8');
  } catch {
    throw new Error('Cannot read semantic token stylesheet');
  }
  const errors = inspectDesignTokens(stylesheet);
  if (errors.length) throw new Error(errors.join('\n'));
  return { themes: 2, checks: pairs.length * 2 };
}
