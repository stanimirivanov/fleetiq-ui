import '../features/assets/ui/setupDom.ts';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { contractFixtures } from '@fleetiq/api-contract';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '../theme/ThemeProvider';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('product chrome and content alignment persist from asset list to identity', async () => {
  const view = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/tenants/tenant-a/assets']}>
        <App assetLoader={async () => contractFixtures.assetPage} />
      </MemoryRouter>
    </ThemeProvider>,
  );
  const banner = view.container.querySelector('header');
  assert.ok(banner);
  const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
  const listMain = screen.getByRole('main');
  assert.ok(await screen.findByRole('link', { name: /Primary machine/ }));

  fireEvent.click(screen.getByRole('link', { name: /Primary machine/ }));
  assert.ok(screen.getByRole('heading', { name: 'Detail not connected' }));
  assert.equal(view.container.querySelector('header'), banner);
  assert.equal(
    screen.getByRole('navigation', { name: 'Primary navigation' }),
    nav,
  );
  assert.equal(screen.getByRole('main').className, listMain.className);
  assert.equal(
    screen
      .getByRole('link', { name: 'Asset catalogue' })
      .getAttribute('aria-current'),
    'page',
  );
  view.unmount();
});
