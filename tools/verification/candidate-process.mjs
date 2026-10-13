import { spawn } from 'node:child_process';

/** Wait for process closure; interruptions and launch failures cannot pass. */
export function candidateCommand(root, launcher, args, { signal } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ status: 'not-run', reason: 'interrupted', exitCode: null });
      return;
    }
    const child = spawn(launcher.command, [...launcher.args, ...args], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
      signal,
    });
    let launchError;
    child.once('error', (error) => {
      launchError = error;
    });
    child.once('close', (code, stopped) => {
      resolve({
        status: launchError
          ? 'not-run'
          : code === 0 && !stopped
            ? 'passed'
            : 'failed',
        reason: launchError
          ? 'launch-failed'
          : stopped
            ? 'interrupted'
            : code === 0
              ? null
              : 'command-failed',
        exitCode: Number.isInteger(code) ? code : null,
      });
    });
  });
}
