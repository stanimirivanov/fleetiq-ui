import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import {
  detail,
  evaluation,
  history,
  outputs,
  queue,
} from '../../api/tests/alert-fixture';
import type { AlertReader, QueueRequest } from '../../model/connected-alerts';
import { AlertProvider } from './AlertProvider';
import { ConnectedAlertsContent } from './ConnectedAlertsContent';
import { useAlertRead } from './useAlertRead';

afterEach(cleanup);
function readerWith(overrides: Partial<AlertReader> = {}): AlertReader {
  return {
    queue: vi.fn(async () => queue),
    detail: vi.fn(async () => detail),
    history: vi.fn(async () => history),
    evaluation: vi.fn(async () => evaluation),
    outputs: vi.fn(async () => outputs),
    ...overrides,
  };
}
function mount(
  reader: AlertReader,
  url = '/alerts?tenant=tenant-a',
  onUnauthorized = vi.fn(),
) {
  const navigation = createMemoryHistory();
  navigation.set({ value: url });
  render(() => (
    <MemoryRouter history={navigation}>
      <Route
        path="/alerts"
        component={() => (
          <AlertProvider reader={reader} onUnauthorized={onUnauthorized}>
            <ConnectedAlertsContent />
          </AlertProvider>
        )}
      />
    </MemoryRouter>
  ));
  return navigation;
}
test('links exact detail, transition and calculator evidence without float conversion or sample fields', async () => {
  const reader = readerWith();
  mount(reader);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('link', { name: 'voltage-high · revision 1' }),
  );
  await user.click(
    await screen.findByRole('link', {
      name: 'Inspect latest transition evidence',
    }),
  );
  expect(
    await screen.findByText('12345678901234567890.1234567890123456789 volt'),
  ).toBeTruthy();
  expect(reader.evaluation).toHaveBeenCalledWith(
    expect.objectContaining({
      tenant: 'tenant-a',
      transition: detail.alert.latest_transition,
    }),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(
    screen.getByText(/Selection does not describe condition health/),
  ).toBeTruthy();
});
test('invalid URL blocks all reads and arbitrary evidence selection cannot make an evaluation request', async () => {
  const reader = readerWith(),
    nav = mount(reader, '/alerts?tenant=..');
  expect(screen.getByRole('alert').textContent).toContain('Invalid alert URL');
  expect(reader.queue).not.toHaveBeenCalled();
  nav.set({
    value:
      '/alerts?tenant=tenant-a&rule=voltage-high&revision=1&evaluation=not-referenced',
  });
  await screen.findByText(/Selected evaluation is not referenced/);
  expect(reader.evaluation).not.toHaveBeenCalled();
});
test('denied calculator evidence leaves the separately authorized alert visible and retries explicitly', async () => {
  let denied = true;
  const reader = readerWith({
    evaluation: vi.fn(async () => {
      if (denied) throw new RequestFailure('forbidden');
      return evaluation;
    }),
  });
  mount(
    reader,
    '/alerts?tenant=tenant-a&rule=voltage-high&revision=1&evaluation=evaluation-b',
  );
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Access is denied',
  );
  expect(
    screen.getByRole('region', { name: 'Alert detail' }).textContent,
  ).toContain('voltage-high');
  expect(reader.outputs).not.toHaveBeenCalled();
  denied = false;
  await userEvent.setup().click(
    screen.getByRole('button', {
      name: 'Retry calculator evaluation evidence',
    }),
  );
  await screen.findByText('12345678901234567890.1234567890123456789 volt');
});
test('loading, empty, missing, malformed and unauthorized outcomes stay distinct', async () => {
  const onUnauthorized = vi.fn(),
    reader = readerWith({
      queue: vi.fn(async () => {
        throw new RequestFailure('invalid-response');
      }),
      detail: vi.fn(async () => {
        throw new RequestFailure('not-found');
      }),
    });
  const nav = mount(
    reader,
    '/alerts?tenant=tenant-a&rule=missing&revision=1',
    onUnauthorized,
  );
  expect(
    screen.getAllByRole('status').some((e) => e.textContent === 'Loading…'),
  ).toBe(true);
  await screen.findByText('The server response is invalid');
  await screen.findByText('The requested record was not found');
  reader.queue = vi.fn(async () => ({ alerts: [], next_after: null }));
  nav.set({ value: '/alerts?tenant=tenant-b' });
  await screen.findByText(/No observed alerts on this page/);
  reader.queue = vi.fn(async () => {
    throw new RequestFailure('unauthorized');
  });
  nav.set({ value: '/alerts?tenant=tenant-c' });
  await waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce());
});
test('bounded page navigation clears dependent selections and phase changes clear the queue cursor', async () => {
  const reader = readerWith({
    queue: vi.fn(async () => ({ ...queue, next_after: 'v1.00' })),
  });
  mount(reader);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('link', { name: 'Next alerts' }));
  await waitFor(() =>
    expect(reader.queue).toHaveBeenLastCalledWith(
      { tenant: 'tenant-a', phase: undefined, after: 'v1.00' },
      expect.anything(),
    ),
  );
  await user.selectOptions(screen.getByLabelText('Phase filter'), 'resolved');
  await waitFor(() =>
    expect(reader.queue).toHaveBeenLastCalledWith(
      { tenant: 'tenant-a', phase: 'resolved', after: undefined },
      expect.anything(),
    ),
  );
});
test('scope changes hide old data synchronously, abort and ignore non-cooperative late completions and unmount', async () => {
  const pending: {
    resolve: (page: typeof queue) => void;
    signal?: AbortSignal;
  }[] = [];
  const reader = readerWith({
    queue: vi.fn(
      (_r, o) =>
        new Promise<typeof queue>((resolve) =>
          pending.push({ resolve, signal: o?.signal }),
        ),
    ),
  });
  const [request, setRequest] = createSignal<QueueRequest | null>({
    tenant: 'tenant-a',
  });
  function Harness() {
    const read = useAlertRead(request, (r, q, o) => r.queue(q, o));
    return <output>{JSON.stringify(read.state())}</output>;
  }
  const rendered = render(() => (
    <AlertProvider reader={reader}>
      <Harness />
    </AlertProvider>
  ));
  await waitFor(() => expect(pending).toHaveLength(1));
  setRequest({ tenant: 'tenant-b' });
  await waitFor(() => expect(pending).toHaveLength(2));
  expect(pending[0]?.signal?.aborted).toBe(true);
  pending[1]?.resolve({
    ...queue,
    alerts: [{ ...detail.alert, rule_id: 'new-scope' }],
  });
  await screen.findByText(/new-scope/);
  pending[0]?.resolve(queue);
  await Promise.resolve();
  expect(screen.queryByText(/voltage-high/)).toBeNull();
  setRequest({ tenant: 'tenant-c' });
  expect(within(rendered.container).queryByText(/new-scope/)).toBeNull();
  await waitFor(() => expect(pending).toHaveLength(3));
  rendered.unmount();
  expect(pending[2]?.signal?.aborted).toBe(true);
  pending[2]?.resolve(queue);
});
