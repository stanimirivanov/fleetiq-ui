import { createMemoryHistory, MemoryRouter, Route } from '@solidjs/router';
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal, Show } from 'solid-js';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import type {
  OperatorTenantPage,
  OperatorTenantReader,
} from '../model/operator-tenants';
import { OperatorSessionProvider } from './OperatorSessionProvider';
import {
  OperatorTenantProvider,
  useOperatorTenants,
} from './OperatorTenantProvider';
import { OperatorTenantSelector } from './OperatorTenantSelector';

afterEach(cleanup);
const readable: OperatorTenantPage = {
  tenants: [{ id: 'tenant-a', actions: ['metadata.read'] }],
  nextAfter: 'tenant-a',
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function mount(
  reader: OperatorTenantReader,
  start: string | undefined | null = undefined,
) {
  const [after, setAfter] = createSignal(start);
  const [unrelatedQuery, setUnrelatedQuery] = createSignal(0);
  const [selected, select] = createSignal('tenant-a');
  const [enabled, setEnabled] = createSignal(true);
  let actor = 'actor-a';
  const history = createMemoryHistory();
  history.set({ value: '/assets' });
  function Probe() {
    const tenants = useOperatorTenants();
    return (
      <>
        <p data-testid="state">{tenants.state().kind}</p>
        <p data-testid="block">{tenants.metadataBlock()}</p>
        <Show when={!tenants.metadataBlock()}>
          <p>Current metadata evidence</p>
        </Show>
        <OperatorTenantSelector
          selected={selected()}
          after={after()}
          select={select}
          page={(value) => setAfter(value ?? undefined)}
        />
      </>
    );
  }
  const view = render(() => (
    <MemoryRouter
      history={history}
      root={(props) => (
        <OperatorSessionProvider
          service={{
            inspect: async () => ({
              actorId: actor,
              expiresAtMs: Date.now() + 60_000,
            }),
            signOut: async () => {},
          }}
        >
          <OperatorTenantProvider
            reader={reader}
            enabled={() => {
              unrelatedQuery();
              return enabled();
            }}
            after={() => {
              unrelatedQuery();
              return after();
            }}
            selected={selected}
          >
            {props.children}
          </OperatorTenantProvider>
        </OperatorSessionProvider>
      )}
    >
      <Route path="*" component={Probe} />
    </MemoryRouter>
  ));
  return {
    ...view,
    setAfter,
    changeUnrelatedQuery: () => setUnrelatedQuery((value) => value + 1),
    setEnabled,
    select,
    switchActor: () => {
      actor = 'actor-b';
      window.dispatchEvent(new Event('focus'));
    },
  };
}

test('shows exact grant badges, explicit selection, pages and a secondary direct ID form', async () => {
  const list = vi.fn(async (request: { after?: string }) =>
    request.after === undefined
      ? readable
      : {
          tenants: [{ id: 'tenant-b', actions: ['metadata.read'] as const }],
          nextAfter: null,
        },
  );
  const view = mount({ list });
  expect(await screen.findByText('metadata.read')).toBeTruthy();
  expect(
    (
      screen.getByRole('combobox', {
        name: 'Permitted tenant',
      }) as HTMLSelectElement
    ).value,
  ).toBe('tenant-a');
  await userEvent.click(screen.getByRole('button', { name: 'Next tenants' }));
  await waitFor(() =>
    expect(list).toHaveBeenLastCalledWith(
      { limit: 50, after: 'tenant-a' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  await userEvent.click(screen.getByRole('button', { name: 'First tenants' }));
  await waitFor(() =>
    expect(list).toHaveBeenLastCalledWith(
      { limit: 50, after: undefined },
      expect.anything(),
    ),
  );
  await userEvent.click(screen.getByText('Open a known tenant ID'));
  await userEvent.clear(screen.getByLabelText('Tenant ID'));
  await userEvent.type(screen.getByLabelText('Tenant ID'), 'unknown');
  await userEvent.click(screen.getByRole('button', { name: 'Open tenant' }));
  expect(screen.getByText(/access is unverified/)).toBeTruthy();
  view.select('tenant-a');
  expect(screen.queryByText(/access is unverified/)).toBeNull();
});

test('refresh immediately clears evidence, aborts and rejects a superseded completion', async () => {
  const first = deferred<OperatorTenantPage>();
  const second = deferred<OperatorTenantPage>();
  const third = deferred<OperatorTenantPage>();
  const list = vi
    .fn()
    .mockResolvedValueOnce(readable)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
    .mockReturnValueOnce(third.promise);
  const view = mount({ list });
  expect(await screen.findByText('Current metadata evidence')).toBeTruthy();
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh tenant access' }),
  );
  expect(screen.queryByText('Current metadata evidence')).toBeNull();
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh tenant access' }),
  );
  expect(list.mock.calls[1]?.[1].signal.aborted).toBe(true);
  first.resolve(readable);
  await Promise.resolve();
  expect(screen.queryByText('Current metadata evidence')).toBeNull();
  second.resolve({
    tenants: [{ id: 'tenant-a', actions: ['metadata.manage'] }],
    nextAfter: null,
  });
  expect(await screen.findByText('metadata.manage')).toBeTruthy();
  expect(screen.getByTestId('block').textContent).toContain(
    'do not imply read',
  );
  view.switchActor();
  await waitFor(() => expect(list).toHaveBeenCalledTimes(4));
  expect(screen.queryByText('metadata.manage')).toBeNull();
  view.unmount();
  expect(list.mock.calls[3]?.[1].signal.aborted).toBe(true);
  third.resolve(readable);
});

test('missing from a partial or exhausted continuation page remains unverified', async () => {
  const view = mount(
    { list: async () => ({ tenants: [], nextAfter: null }) },
    'revoked-cursor',
  );
  expect(
    await screen.findByText(/No tenants on this continuation page/),
  ).toBeTruthy();
  expect(screen.getByText('Current metadata evidence')).toBeTruthy();
  view.setAfter(undefined);
  expect(await screen.findByText(/No accessible tenants\./)).toBeTruthy();
  expect(screen.queryByText('Current metadata evidence')).toBeNull();
});

test('invalid cursor sends no discovery and can restart from the first page', async () => {
  const list = vi.fn(async () => readable);
  mount({ list }, null);
  expect(await screen.findByText(/Invalid tenant page cursor/)).toBeTruthy();
  expect(list).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'First tenants' }));
  expect(await screen.findByText('metadata.read')).toBeTruthy();
});

test('typed and synchronous failures render recovery without leaked grants', async () => {
  const list = vi
    .fn()
    .mockRejectedValueOnce(new RequestFailure('invalid-response'))
    .mockImplementationOnce(() => {
      throw new Error('private response');
    })
    .mockResolvedValueOnce(readable);
  mount({ list });
  expect(
    await screen.findByText(/Invalid tenant discovery response/),
  ).toBeTruthy();
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh tenant access' }),
  );
  expect(
    await screen.findByText(/Tenant discovery is unavailable/),
  ).toBeTruthy();
  expect(screen.queryByText('private response')).toBeNull();
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh tenant access' }),
  );
  expect(await screen.findByText('Current metadata evidence')).toBeTruthy();
});

test('discovery 401 invalidates session and hides evidence; disabled preview sends no requests', async () => {
  const request = deferred<OperatorTenantPage>();
  const list = vi.fn(() => request.promise);
  const view = mount({ list });
  await waitFor(() => expect(list).toHaveBeenCalledOnce());
  request.reject(new RequestFailure('unauthorized'));
  await waitFor(() =>
    expect(screen.getByTestId('state').textContent).toContain('idle'),
  );
  expect(screen.queryByText('Current metadata evidence')).toBeNull();
  view.unmount();
  const other = mount({ list: vi.fn(async () => readable) });
  other.setEnabled(false);
  expect(screen.getByTestId('state').textContent).toContain('idle');
});

test('a superseded discovery 401 cannot sign out the replacement session', async () => {
  const old = deferred<OperatorTenantPage>();
  const list = vi
    .fn()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(readable);
  const view = mount({ list });
  await waitFor(() => expect(list).toHaveBeenCalledOnce());
  view.switchActor();
  expect(await screen.findByText('Current metadata evidence')).toBeTruthy();
  old.reject(new RequestFailure('unauthorized'));
  await Promise.resolve();
  expect(screen.getByTestId('state').textContent).toBe('ready');
  expect(screen.getByText('Current metadata evidence')).toBeTruthy();
});

test('unrelated URL reactivity does not restart discovery or clear current evidence', async () => {
  const list = vi.fn(async () => readable);
  const view = mount({ list });
  expect(await screen.findByText('Current metadata evidence')).toBeTruthy();
  view.changeUnrelatedQuery();
  view.changeUnrelatedQuery();
  await Promise.resolve();
  expect(list).toHaveBeenCalledOnce();
  expect(screen.getByText('Current metadata evidence')).toBeTruthy();
});
