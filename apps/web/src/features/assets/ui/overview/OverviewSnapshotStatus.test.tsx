import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, expect, test, vi } from 'vitest';
import { parseFleet } from '../../api/parse-fleet';
import { fleetRequest, observedFleetWire } from '../../api/tests/fleet-fixture';
import { OverviewSnapshotStatus } from './OverviewSnapshotStatus';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
test('snapshot review age updates without fetching and its clock stops on unmount', () => {
  vi.useFakeTimers();
  vi.setSystemTime(2000);
  const p = parseFleet(observedFleetWire(), fleetRequest),
    refresh = vi.fn();
  const view = render(() => (
    <OverviewSnapshotStatus page={p} refresh={refresh} />
  ));
  expect(screen.queryByText('Snapshot ageing')).toBeNull();
  vi.advanceTimersByTime(45000);
  expect(screen.getByText('Snapshot ageing')).toBeTruthy();
  expect(refresh).not.toHaveBeenCalled();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
