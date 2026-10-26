import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, expect, it, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import type { DeviceGateway } from '../model/devices';
import { DeviceProvider } from './DeviceProvider';
import { useDeviceCommand } from './useDeviceCommand';
import { useDeviceRead } from './useDeviceRead';

afterEach(cleanup);
function Wrapper(props: {
  children: import('solid-js').JSX.Element;
  invalidated?: () => void;
}) {
  return (
    <DeviceProvider
      gateway={{} as DeviceGateway}
      actions={() => ['protocol.manage']}
      onUnauthorized={props.invalidated ?? (() => {})}
      tenantControl={() => null}
    >
      {props.children}
    </DeviceProvider>
  );
}
it('aborts superseded reads and suppresses late old-scope completions', async () => {
  const pending: {
    id: string;
    signal?: AbortSignal;
    resolve: (value: string) => void;
  }[] = [];
  let select!: (id: string) => void;
  function Harness() {
    const [id, set] = createSignal('first');
    select = set;
    const read = useDeviceRead(
      () => id(),
      (key, options) =>
        new Promise<string>((resolve) =>
          pending.push({ id: key, signal: options.signal, resolve }),
        ),
    );
    return <p>{JSON.stringify(read.state())}</p>;
  }
  render(() => (
    <Wrapper>
      <Harness />
    </Wrapper>
  ));
  await waitFor(() => expect(pending).toHaveLength(1));
  select('second');
  await waitFor(() => expect(pending).toHaveLength(2));
  expect(pending[0]?.signal?.aborted).toBe(true);
  pending[1]?.resolve('new evidence');
  await screen.findByText(/new evidence/u);
  pending[0]?.resolve('old evidence');
  await Promise.resolve();
  expect(screen.queryByText(/old evidence/u)).toBeNull();
  cleanup();
  expect(pending[1]?.signal?.aborted).toBe(true);
});
it('freezes ambiguous commands, retries exact content once, and never double-submits', async () => {
  const calls: unknown[] = [];
  let reject!: (reason: unknown) => void;
  const execute = vi.fn((r: unknown) => {
    calls.push(structuredClone(r));
    return calls.length === 1
      ? new Promise<string>((_, no) => {
          reject = no;
        })
      : Promise.resolve('acknowledged');
  });
  function Harness() {
    const command = useDeviceCommand(execute);
    return (
      <>
        <button
          type="button"
          onClick={() => command.submit({ id: 'same', expected: 7 })}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => command.submit({ id: 'changed', expected: 8 })}
        >
          Changed
        </button>
        <button type="button" onClick={command.retry}>
          Retry
        </button>
        <p>{JSON.stringify(command.state())}</p>
      </>
    );
  }
  render(() => (
    <Wrapper>
      <Harness />
    </Wrapper>
  ));
  fireEvent.click(screen.getByText('Send'));
  fireEvent.click(screen.getByText('Changed'));
  expect(execute).toHaveBeenCalledTimes(1);
  reject(new RequestFailure('unavailable'));
  await screen.findByText(/uncertain/u);
  fireEvent.click(screen.getByText('Changed'));
  expect(execute).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Retry'));
  await screen.findByText(/acknowledged/u);
  expect(calls).toEqual([
    { id: 'same', expected: 7 },
    { id: 'same', expected: 7 },
  ]);
});
it('hides unmounted mutation completion and invalidates unauthorized requests', async () => {
  const invalidated = vi.fn();
  let resolve!: (value: string) => void;
  let aborted: AbortSignal | undefined;
  function Pending() {
    const command = useDeviceCommand((_r: unknown, o) => {
      aborted = o.signal;
      return new Promise<string>((yes) => {
        resolve = yes;
      });
    });
    return (
      <>
        <button type="button" onClick={() => command.submit({})}>
          Submit
        </button>
        <p>{JSON.stringify(command.state())}</p>
      </>
    );
  }
  const mounted = render(() => (
    <Wrapper>
      <Pending />
    </Wrapper>
  ));
  fireEvent.click(screen.getByText('Submit'));
  mounted.unmount();
  expect(aborted?.aborted).toBe(true);
  resolve('stale');
  await Promise.resolve();
  expect(screen.queryByText(/stale/u)).toBeNull();
  function Unauthorized() {
    const read = useDeviceRead(
      () => ({ tenant: 'a' }),
      async () => {
        throw new RequestFailure('unauthorized');
      },
    );
    return <p>{read.state().kind}</p>;
  }
  render(() => (
    <Wrapper invalidated={invalidated}>
      <Unauthorized />
    </Wrapper>
  ));
  await waitFor(() => expect(invalidated).toHaveBeenCalledOnce());
});

it('revocation interrupts pending commands, rejects late acknowledgements and retains an exact retry until grants return', async () => {
  let enable!: (value: boolean) => void;
  let complete!: (value: string) => void;
  let signal: AbortSignal | undefined;
  const accepted = vi.fn(),
    calls: unknown[] = [];
  function Harness() {
    const [allowed, setAllowed] = createSignal(true);
    enable = setAllowed;
    const command = useDeviceCommand(
      (r: unknown, o) => {
        calls.push(structuredClone(r));
        signal = o.signal;
        return calls.length === 1
          ? new Promise<string>((yes) => {
              complete = yes;
            })
          : Promise.resolve('new acknowledgement');
      },
      accepted,
      allowed,
    );
    return (
      <>
        <button
          type="button"
          onClick={() => command.submit({ id: 'original' })}
        >
          Send
        </button>
        <button type="button" onClick={command.retry}>
          Retry
        </button>
        <p>{JSON.stringify(command.state())}</p>
      </>
    );
  }
  render(() => (
    <Wrapper>
      <Harness />
    </Wrapper>
  ));
  fireEvent.click(screen.getByText('Send'));
  enable(false);
  await waitFor(() => expect(signal?.aborted).toBe(true));
  complete('late acknowledgement');
  await Promise.resolve();
  expect(accepted).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Retry'));
  expect(calls).toHaveLength(1);
  enable(true);
  fireEvent.click(screen.getByText('Retry'));
  await waitFor(() =>
    expect(accepted).toHaveBeenCalledWith('new acknowledgement'),
  );
  expect(calls).toEqual([{ id: 'original' }, { id: 'original' }]);
});
