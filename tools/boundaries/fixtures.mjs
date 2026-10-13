import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const sensorFiles = [
  'tools/check-boundaries.mjs',
  'tools/verification/reviewed-dependencies.mjs',
  'tools/verification/reviewed-dependencies.json',
  'tools/security/owned.mjs',
  'tools/architecture/sources.mjs',
  'tools/docs/source.mjs',
  'tools/boundaries/policy.mjs',
  'tools/boundaries/provenance.mjs',
  'tools/boundaries/analyze.mjs',
];

/** Execute the actual copied sensor and policy in a disposable, owned repository. */
export function boundaryFixture(context) {
  const root = mkdtempSync(path.join(tmpdir(), 'fleetiq-browser-boundary-'));
  context.after(() => {
    if (!path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep))
      throw new Error('Unsafe boundary fixture cleanup.');
    rmSync(root, { recursive: true, force: true });
  });
  function write(relative, content) {
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep))
      throw new Error('Fixture escaped owner.');
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
  }
  for (const file of sensorFiles)
    write(file, readFileSync(path.join(repositoryRoot, file), 'utf8'));
  // Installed tooling is explicit; a missing parser must fail, never skip.
  symlinkSync(
    path.join(repositoryRoot, 'node_modules'),
    path.join(root, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  write('package.json', '{"private":true,"type":"module"}\n');
  write(
    'apps/web/src/shared/api/browser-api.ts',
    "import { ManagedRuntime, Effect } from 'effect';\nexport const owned = () => window.fetch('/api/v1/assets');\nexport const run = () => ManagedRuntime.make({}).runPromise(Effect.succeed(1));\n",
  );
  write(
    'apps/web/src/features/assets/api/sample-live-signal-service.ts',
    readFileSync(
      path.join(
        repositoryRoot,
        'apps/web/src/features/assets/api/sample-live-signal-service.ts',
      ),
      'utf8',
    ),
  );
  write(
    'apps/web/src/generated/fleetiq-api.ts',
    "import type * as HttpClient from 'effect/http/HttpClient';\nexport type Client = HttpClient.HttpClient;\n",
  );
  write(
    'apps/web/src/features/assets/model/port.ts',
    'export interface Reader { read(signal?: AbortSignal): Promise<string>; }\n',
  );
  write(
    'apps/web/src/app/Navigation.tsx',
    "export const login = () => window.location.assign('/api/v1/auth/login');\nexport const focus = () => document.getElementById('content')?.focus();\n",
  );
  function run() {
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'tools/check-boundaries.mjs')],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 45_000,
        maxBuffer: 1024 * 1024,
      },
    );
    if (result.error || result.signal || result.status === null)
      throw new Error('Boundary fixture CLI did not complete.');
    return result;
  }
  return { root, write, run };
}
