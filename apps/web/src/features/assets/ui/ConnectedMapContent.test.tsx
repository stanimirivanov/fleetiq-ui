import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import { parseFleet } from '../api/parse-fleet';
import { fleetRequest, observedFleetWire } from '../api/tests/fleet-fixture';
import type { FleetReader } from '../model/fleet';
import type { MetadataReader } from '../model/metadata';
import ConnectedMapContent from './ConnectedMapContent';
import { MetadataReaderProvider } from './connected/MetadataReaderProvider';

const sdk = vi.hoisted(() => ({ dispose: vi.fn(), update: vi.fn() }));
vi.mock('../api/maplibre-adapter', () => ({ mountFleetMap: () => sdk }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const search =
  '?tenant=tenant-a&latitude_property=position.latitude&latitude_version=1&longitude_property=position.longitude&longitude_version=1&encoding=e7';
function mount(fleet: FleetReader) {
  const history = createMemoryHistory();
  history.set({ value: `/map${search}` });
  const expired = vi.fn();
  const reader: MetadataReader & { fleet: FleetReader } = {
    fleet,
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
        path="/map"
        component={() => (
          <MetadataReaderProvider reader={reader} onUnauthorized={expired}>
            <ConnectedMapContent />
          </MetadataReaderProvider>
        )}
      />
    </MemoryRouter>
  ));
  return { history, expired, ...view };
}
test('map, loaded-page filters, exact selection and inspector evidence share URL scope', async () => {
  const wire = observedFleetWire();
  const snapshot = vi.fn(async () => parseFleet(wire, fleetRequest));
  const app = mount({ snapshot });
  const row = await screen.findByRole('button', {
    name: /Equipment A.*asset-a/,
  });
  await userEvent.click(row);
  expect(app.history.get()).toContain('asset=asset-a');
  expect(screen.getByText('51.5, -0.12')).toBeTruthy();
  expect(
    screen
      .getAllByRole('link', { name: 'Inspect reading and provenance' })[0]
      ?.getAttribute('href'),
  ).toContain('property=position.latitude');
  await userEvent.type(
    screen.getByRole('searchbox', { name: 'Filter loaded page' }),
    'absent',
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: /Equipment A.*asset-a/ }),
    ).toBeNull(),
  );
  expect(screen.getByText(/selected asset is outside/)).toBeTruthy();
  expect(snapshot).toHaveBeenCalledTimes(1);
  app.unmount();
  expect(sdk.dispose).toHaveBeenCalledTimes(1);
});
test('scope changes abort old reads, hide points immediately and discard non-cooperative completions', async () => {
  let resolve: (page: ReturnType<typeof parseFleet>) => void = () => {};
  const signals: AbortSignal[] = [];
  const snapshot = vi.fn(
    (
      _r: Parameters<FleetReader['snapshot']>[0],
      options: Parameters<FleetReader['snapshot']>[1],
    ) => {
      signals.push(options?.signal as AbortSignal);
      return new Promise<ReturnType<typeof parseFleet>>((r) => {
        resolve = r;
      });
    },
  );
  const app = mount({ snapshot });
  await waitFor(() => expect(snapshot).toHaveBeenCalledTimes(1));
  app.history.set({ value: `/map${search.replace('tenant-a', 'tenant-b')}` });
  await waitFor(() => expect(snapshot).toHaveBeenCalledTimes(2));
  expect(signals[0]?.aborted).toBe(true);
  resolve(parseFleet(observedFleetWire(), fleetRequest));
  app.unmount();
  expect(signals[1]?.aborted).toBe(true);
});
test('authorization loss disposes protected map ownership and never becomes an empty fleet', async () => {
  let denied = false;
  const snapshot = vi.fn(async () => {
    if (denied) throw new RequestFailure('unauthorized');
    return parseFleet(observedFleetWire(), fleetRequest);
  });
  const app = mount({ snapshot });
  await screen.findByRole('button', { name: /Equipment A.*asset-a/ });
  await waitFor(() => expect(sdk.update).toHaveBeenCalled());
  denied = true;
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh snapshot' }),
  );
  await screen.findByRole('region', { name: 'Fleet snapshot unavailable' });
  expect(app.expired).toHaveBeenCalledTimes(1);
  expect(sdk.dispose).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: /Equipment A.*asset-a/ }),
  ).toBeNull();
});
