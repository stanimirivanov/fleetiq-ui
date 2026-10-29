import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal, Show } from 'solid-js';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import type {
  CommandReceipt,
  CommissioningGateway,
} from '../../model/commissioning';
import { MetadataReaderProvider } from '../connected/MetadataReaderProvider';
import { RegistryCommissioning } from './RegistryCommissioning';
import { useRegistryCommand } from './useRegistryCommand';

afterEach(cleanup);
const receipt = { outcome: 'appended', actor: 'operator-a', recordedAt: 2500 };
function Owner(props: {
  execute: (
    r: { id: string },
    o: { signal?: AbortSignal },
  ) => Promise<CommandReceipt>;
  committed: (r: CommandReceipt) => void;
}) {
  const command = useRegistryCommand(props.execute, props.committed);
  return (
    <>
      <button type="button" onClick={() => command.submit({ id: 'original' })}>
        Submit
      </button>
      <button type="button" onClick={command.replay}>
        Replay
      </button>
      <button type="button" onClick={command.prepare}>
        Prepare
      </button>
      <output>{JSON.stringify(command.state())}</output>
    </>
  );
}
test('double submission is blocked and unknown outcomes replay only the frozen command', async () => {
  const execute = vi
      .fn()
      .mockRejectedValueOnce(new RequestFailure('unavailable'))
      .mockResolvedValue(receipt),
    committed = vi.fn();
  render(() => <Owner execute={execute} committed={committed} />);
  const user = userEvent.setup();
  await user.click(screen.getByText('Submit'));
  await screen.findByText(/uncertain/);
  await user.click(screen.getByText('Submit'));
  expect(execute).toHaveBeenCalledTimes(1);
  await user.click(screen.getByText('Replay'));
  await waitFor(() => expect(committed).toHaveBeenCalledOnce());
  expect(execute.mock.calls[0]?.[0]).toEqual(execute.mock.calls[1]?.[0]);
  await user.click(screen.getByText('Submit'));
  expect(execute).toHaveBeenCalledTimes(2);
  await user.click(screen.getByText('Prepare'));
  await user.click(screen.getByText('Submit'));
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));
});
test('scope disposal aborts pending commands and suppresses non-cooperative late receipts', async () => {
  let resolve!: (r: CommandReceipt) => void;
  let signal: AbortSignal | undefined;
  const execute = vi.fn((_r, o) => {
      signal = o.signal;
      return new Promise<CommandReceipt>((r) => {
        resolve = r;
      });
    }),
    committed = vi.fn();
  const [scope, setScope] = createSignal('tenant-a');
  render(() => (
    <Show when={scope()} keyed>
      {(_s) => <Owner execute={execute} committed={committed} />}
    </Show>
  ));
  const user = userEvent.setup();
  await user.click(screen.getByText('Submit'));
  await user.click(screen.getByText('Submit'));
  expect(execute).toHaveBeenCalledOnce();
  setScope('tenant-b');
  await waitFor(() => expect(signal?.aborted).toBe(true));
  resolve(receipt);
  await Promise.resolve();
  expect(committed).not.toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toContain('idle');
});
test('definite conflict stays editable and unauthorized completion invalidates the operator', async () => {
  const invalidate = vi.fn(),
    execute = vi
      .fn()
      .mockRejectedValueOnce(new RequestFailure('conflict'))
      .mockRejectedValueOnce(new RequestFailure('unauthorized'));
  render(() => (
    <MetadataReaderProvider onUnauthorized={invalidate}>
      <Owner execute={execute} committed={vi.fn()} />
    </MetadataReaderProvider>
  ));
  const user = userEvent.setup();
  await user.click(screen.getByText('Submit'));
  await screen.findByText(/conflict/);
  await user.click(screen.getByText('Submit'));
  await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
});
test('read-only and manage-only access cannot mount commissioning controls', () => {
  const gateway: CommissioningGateway = {
    types: vi.fn<CommissioningGateway['types']>(),
    register: vi.fn<CommissioningGateway['register']>(),
    append: vi.fn<CommissioningGateway['append']>(),
  };
  const [actions, setActions] = createSignal(['metadata.read']);
  render(() => (
    <MetadataReaderProvider actions={actions} commissioning={gateway}>
      <RegistryCommissioning tenant="tenant-a" committed={vi.fn()} />
    </MetadataReaderProvider>
  ));
  expect(screen.queryByRole('form')).toBeNull();
  setActions(['metadata.manage']);
  expect(screen.queryByRole('form')).toBeNull();
});

test('untyped failures stay ambiguous and disposed rejections cannot alter a new owner', async () => {
  const execute = vi.fn().mockRejectedValueOnce(new Error('transport'));
  const committed = vi.fn();
  const mounted = render(() => (
    <Owner execute={execute} committed={committed} />
  ));
  const user = userEvent.setup();
  await user.click(screen.getByText('Replay'));
  await user.click(screen.getByText('Prepare'));
  expect(execute).not.toHaveBeenCalled();
  await user.click(screen.getByText('Submit'));
  await screen.findByText(/unavailable/);
  mounted.unmount();
  let reject!: (e: unknown) => void;
  const second = render(() => (
    <Owner
      execute={() =>
        new Promise((_resolve, r) => {
          reject = r;
        })
      }
      committed={committed}
    />
  ));
  await user.click(screen.getByText('Submit'));
  second.unmount();
  reject(new RequestFailure('unavailable'));
  await Promise.resolve();
  expect(committed).not.toHaveBeenCalled();
});
