import '../features/assets/ui/setupDom.ts';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { THEME_STORAGE_KEY } from '@fleetiq/theme-preference';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { ThemeControl } from './ThemeControl';
import { ThemeProvider } from './ThemeProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('light is default and an explicit dark choice survives remount', () => {
  const view = render(
    <ThemeProvider>
      <ThemeControl />
    </ThemeProvider>,
  );
  assert.equal(document.documentElement.dataset.theme, 'light');
  fireEvent.change(screen.getByLabelText('Appearance'), {
    target: { value: 'dark' },
  });
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(window.localStorage.getItem(THEME_STORAGE_KEY), 'dark');

  view.unmount();
  render(
    <ThemeProvider>
      <ThemeControl />
    </ThemeProvider>,
  );
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('system choice reacts to browser appearance changes', () => {
  const original = window.matchMedia;
  let dark = false;
  let notify: (() => void) | undefined;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      get matches() {
        return dark;
      },
      addEventListener: (_event: string, listener: () => void) => {
        notify = listener;
      },
      removeEventListener: () => {
        notify = undefined;
      },
    }),
  });
  try {
    render(
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText('Appearance'), {
      target: { value: 'system' },
    });
    assert.equal(document.documentElement.dataset.theme, 'light');
    dark = true;
    act(() => notify?.());
    assert.equal(document.documentElement.dataset.theme, 'dark');
  } finally {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: original,
    });
  }
});
