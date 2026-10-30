import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestFailure } from '#shared/model';
import { AlertProvider } from './AlertProvider';
import { useAlertCommand } from './useAlertCommand';

afterEach(cleanup);
test('freezes exact intent across lost response and denied replay, prevents double submit, and requires explicit retry', async () => {
  let fail = true;
  const run = vi.fn(async (r: { value: string }) => {
      if (fail)
        throw new RequestFailure(
          run.mock.calls.length === 1 ? 'unavailable' : 'forbidden',
        );
      return r.value;
    }),
    committed = vi.fn(),
    draft = { value: 'original' };
  function Harness() {
    const c = useAlertCommand(run, committed);
    return (
      <>
        <button type="button" onClick={() => c.submit(draft)}>
          Submit
        </button>
        <button type="button" onClick={c.replay}>
          Retry
        </button>
        <output>{JSON.stringify(c.state())}</output>
      </>
    );
  }
  render(() => (
    <AlertProvider>
      <Harness />
    </AlertProvider>
  ));
  const user = userEvent.setup();
  await user.click(screen.getByText('Submit'));
  await screen.findByText(/"uncertain":true/);
  draft.value = 'changed';
  await user.click(screen.getByText('Submit'));
  expect(run).toHaveBeenCalledTimes(1);
  await user.click(screen.getByText('Retry'));
  await screen.findByText(/forbidden/);
  expect(screen.getByRole('status').textContent).toContain('"uncertain":true');
  fail = false;
  await user.click(screen.getByText('Retry'));
  await waitFor(() => expect(committed).toHaveBeenCalledWith('original'));
  expect(run.mock.calls.every(([r]) => r.value === 'original')).toBe(true);
});
test('scope disposal aborts an in-flight command and suppresses non-cooperative success or unauthorized failure', async () => {
  let complete: (value: string) => void = () => {};
  let signal: AbortSignal | undefined;
  const committed = vi.fn(),
    invalidate = vi.fn();
  function Harness() {
    const c = useAlertCommand((_r: { id: string }, o) => {
      signal = o.signal;
      return new Promise<string>((r) => {
        complete = r;
      });
    }, committed);
    return (
      <button type="button" onClick={() => c.submit({ id: 'a' })}>
        Submit
      </button>
    );
  }
  const mounted = render(() => (
    <AlertProvider onUnauthorized={invalidate}>
      <Harness />
    </AlertProvider>
  ));
  await userEvent.setup().click(screen.getByText('Submit'));
  mounted.unmount();
  expect(signal?.aborted).toBe(true);
  complete('late');
  await Promise.resolve();
  expect(committed).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});
