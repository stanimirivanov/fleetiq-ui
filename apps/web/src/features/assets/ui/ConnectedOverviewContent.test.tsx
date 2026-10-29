import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import { parseFleet } from '../api/parse-fleet';
import { fleetRequest, observedFleetWire } from '../api/tests/fleet-fixture';
import type { FleetPage, FleetReader } from '../model/fleet';
import type { MetadataReader } from '../model/metadata';
import ConnectedOverviewContent from './ConnectedOverviewContent';
import { MetadataReaderProvider } from './connected/MetadataReaderProvider';

const sdk = vi.hoisted(() => ({
  mount: vi.fn(),
  dispose: vi.fn(),
  update: vi.fn(),
}));
vi.mock('../api/maplibre-adapter', () => ({
  mountFleetMap: () => {
    sdk.mount();
    return sdk;
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const search =
  '?tenant=tenant-a&latitude_property=position.latitude&latitude_version=1&longitude_property=position.longitude&longitude_version=1&encoding=e7';
function page(): FleetPage {
  const p = parseFleet(observedFleetWire(), fleetRequest);
  return {
    ...p,
    pending: true,
    summary: {
      ...p.summary,
      assets: '9007199254740993',
      mapped: '9007199254740992',
    },
    assets: [
      ...p.assets,
      {
        id: 'asset-b',
        name: 'Unlocated equipment',
        type: { id: 'equipment', version: 1 },
        location: { status: 'missing' },
      },
    ],
  };
}
function mount(
  snapshot: FleetReader['snapshot'],
  suffix = search,
  fleetConfigured = true,
) {
  const history = createMemoryHistory();
  history.set({ value: `/${suffix}` });
  const expired = vi.fn();
  const reader: MetadataReader & { fleet?: FleetReader } = {
    ...(fleetConfigured ? { fleet: { snapshot } } : {}),
    listPage: vi.fn(),
    getAsset: vi.fn(),
    getAssetType: vi.fn(),
    getProperty: vi.fn(),
    getRelationshipType: vi.fn(),
    listRelationships: vi.fn(),
    listTargetBindings: vi.fn(),
    listSourceBindings: vi.fn(),
  };
  const view = render(() => (
    <MemoryRouter history={history}>
      <Route
        path="/"
        component={() => (
          <MetadataReaderProvider reader={reader} onUnauthorized={expired}>
            <ConnectedOverviewContent />
          </MetadataReaderProvider>
        )}
      />
    </MemoryRouter>
  ));
  return { history, expired, ...view };
}
test('global inventory stays exact while loaded-page selection and filters do not fetch or change totals', async () => {
  const snapshot = vi.fn(async () => page()),
    app = mount(snapshot);
  await screen.findByRole('region', { name: 'Fleet metrics' });
  expect(
    screen.getByRole('article', { name: 'Registered assets' }).textContent,
  ).toContain('9,007,199,254,740,993');
  expect(screen.getByText('99.9%')).toBeTruthy();
  expect(screen.getByText(/Processing is pending/)).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Equipment A' }));
  expect(app.history.get()).toContain('asset=asset-a');
  expect(screen.getByText(/51.5, -0.12/)).toBeTruthy();
  await userEvent.type(
    screen.getByRole('searchbox', { name: 'Filter loaded assets' }),
    'Unlocated',
  );
  expect(screen.queryByRole('button', { name: 'Equipment A' })).toBeNull();
  expect(
    screen.getByRole('article', { name: 'Registered assets' }).textContent,
  ).toContain('9,007,199,254,740,993');
  expect(snapshot).toHaveBeenCalledTimes(1);
  expect(sdk.mount).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole('link', { name: 'Open map workbench' })
      .getAttribute('href'),
  ).toContain('map_q=Unlocated');
});
test('overview preview is explicitly owned and authorization loss disposes it before retry', async () => {
  let denied = false;
  const snapshot = vi.fn(async () => {
    if (denied) throw new RequestFailure('unauthorized');
    return page();
  });
  const app = mount(snapshot);
  await screen.findByRole('region', { name: 'Fleet metrics' });
  expect(sdk.mount).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Load geographic preview' }),
  );
  await waitFor(() => expect(sdk.mount).toHaveBeenCalledTimes(1));
  denied = true;
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh overview' }),
  );
  await screen.findByRole('region', { name: 'Overview snapshot unavailable' });
  expect(app.expired).toHaveBeenCalledTimes(1);
  expect(sdk.dispose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('region', { name: 'Fleet metrics' })).toBeNull();
  denied = false;
  await userEvent.click(screen.getByRole('button', { name: 'Retry overview' }));
  await screen.findByRole('region', { name: 'Fleet metrics' });
  expect(sdk.mount).toHaveBeenCalledTimes(1);
});
test('tenant changes abort reads and non-cooperative late evidence cannot replace the new scope', async () => {
  const requests: {
    signal: AbortSignal | undefined;
    resolve: (p: FleetPage) => void;
  }[] = [];
  const snapshot = vi.fn<FleetReader['snapshot']>(
    async (_r, options) =>
      new Promise((resolve) => {
        requests.push({ signal: options?.signal, resolve });
      }),
  );
  const app = mount(snapshot);
  await waitFor(() => expect(requests).toHaveLength(1));
  app.history.set({ value: `/${search.replace('tenant-a', 'tenant-b')}` });
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[0]?.signal?.aborted).toBe(true);
  requests[1]?.resolve({
    ...page(),
    summary: { assets: '77', devices: '0', mapped: '1', withProperties: '1' },
  });
  await waitFor(() =>
    expect(
      screen.getByRole('article', { name: 'Registered assets' }).textContent,
    ).toContain('77'),
  );
  requests[0]?.resolve(page());
  await waitFor(() =>
    expect(
      screen.getByRole('article', { name: 'Registered assets' }).textContent,
    ).not.toContain('9,007'),
  );
  app.unmount();
  expect(requests[1]?.signal?.aborted).toBe(true);
});
test('missing and contradictory URL context cannot trigger overview reads', async () => {
  const snapshot = vi.fn(async () => page());
  const app = mount(snapshot, '?tenant=tenant-a');
  expect(
    screen.getByRole('region', { name: 'Configure fleet overview' }),
  ).toBeTruthy();
  expect(snapshot).not.toHaveBeenCalled();
  app.history.set({ value: `/${search}&latitude_version=2` });
  await screen.findByRole('region', { name: 'Invalid overview scope' });
  expect(snapshot).not.toHaveBeenCalled();
});
test('empty inventory is a valid zero snapshot rather than a fabricated health result', async () => {
  mount(async () => ({
    ...page(),
    summary: { assets: '0', devices: '0', mapped: '0', withProperties: '0' },
    assets: [],
  }));
  await screen.findByText(
    'This tenant has no registered assets in this snapshot.',
  );
  expect(screen.getAllByText('No assets')).toHaveLength(2);
  expect(
    screen.getByRole('region', { name: 'Attention queue' }).textContent,
  ).toContain('unavailable');
});

test('a metadata reader without its fleet capability fails explicitly rather than fabricating totals', async () => {
  const snapshot = vi.fn(async () => page());
  mount(snapshot, search, false);
  await screen.findByRole('region', { name: 'Overview snapshot unavailable' });
  expect(snapshot).not.toHaveBeenCalled();
  expect(screen.queryByRole('region', { name: 'Fleet metrics' })).toBeNull();
});
