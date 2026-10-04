import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
const commands = {
  web: {
    entry: new URL('../node_modules/vite/bin/vite.js', import.meta.url),
    cwd: new URL('../apps/web/', import.meta.url),
    args: [],
    variable: 'VITE_API_MODE',
  },
  mobile: {
    entry: new URL('../node_modules/expo/bin/cli', import.meta.url),
    cwd: new URL('../apps/mobile/', import.meta.url),
    args: ['start'],
    variable: 'EXPO_PUBLIC_API_MODE',
  },
  'mobile-web': {
    entry: new URL('../node_modules/expo/bin/cli', import.meta.url),
    cwd: new URL('../apps/mobile/', import.meta.url),
    args: ['start', '--web'],
    variable: 'EXPO_PUBLIC_API_MODE',
  },
};
const command = commands[target];

if (!command) {
  console.error('Usage: node tools/start-preview.mjs web|mobile|mobile-web');
  process.exitCode = 2;
} else {
  const child = spawn(
    process.execPath,
    [fileURLToPath(command.entry), ...command.args],
    {
      cwd: command.cwd,
      env: { ...process.env, [command.variable]: 'mock' },
      stdio: 'inherit',
    },
  );
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}
