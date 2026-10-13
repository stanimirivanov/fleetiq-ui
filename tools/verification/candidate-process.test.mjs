import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCommand } from './candidate-process.mjs';

test('real process failure cannot qualify or retain command output', async () => {
  const result = await candidateCommand(
    process.cwd(),
    { command: process.execPath, args: [] },
    ['-e', 'process.exit(9)'],
  );
  assert.deepEqual(result, {
    status: 'failed',
    reason: 'command-failed',
    exitCode: 9,
  });
});
test('real launch failure and prior cancellation cannot pass', async () => {
  const missing = await candidateCommand(
    process.cwd(),
    { command: 'fleetiq-nonexistent-tool-fixture', args: [] },
    [],
  );
  assert.equal(missing.status, 'not-run');
  const controller = new AbortController();
  controller.abort();
  assert.deepEqual(
    await candidateCommand(
      process.cwd(),
      { command: process.execPath, args: [] },
      ['-e', 'process.exit(0)'],
      { signal: controller.signal },
    ),
    { status: 'not-run', reason: 'interrupted', exitCode: null },
  );
});
test('an actual running candidate process closes after cancellation', async () => {
  const controller = new AbortController();
  const running = candidateCommand(
    process.cwd(),
    { command: process.execPath, args: [] },
    ['-e', 'setInterval(() => {}, 1000)'],
    { signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 100);
  const result = await running;
  assert.notEqual(result.status, 'passed');
});
