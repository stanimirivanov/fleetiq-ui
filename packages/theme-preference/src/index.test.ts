import assert from 'node:assert/strict';
import test from 'node:test';
import { parseThemePreference, resolveTheme } from './index.ts';

test('absent or malformed saved choices keep the light default', () => {
  for (const value of [null, undefined, '', 'auto', 'DARK', 42]) {
    assert.equal(parseThemePreference(value), 'light');
  }
});

test('explicit choice wins over system appearance', () => {
  assert.equal(resolveTheme('light', 'dark'), 'light');
  assert.equal(resolveTheme('dark', 'light'), 'dark');
});

test('system choice follows appearance changes with a light fallback', () => {
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(resolveTheme('system', 'dark'), 'dark');
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', null), 'light');
});
