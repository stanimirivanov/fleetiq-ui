import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTION_OWNERS } from '../boundaries/policy.mjs';

// Resolve installed tools through their public package entry, never ambient PATH.
const dependencyCli = fileURLToPath(
  new URL(
    '../../bin/dependency-cruiser.mjs',
    import.meta.resolve('dependency-cruiser'),
  ),
);
const biomeCli = fileURLToPath(
  new URL(
    './node_modules/@biomejs/biome/bin/biome',
    new URL('../../', import.meta.url),
  ),
);

function runTool(tool, args, root) {
  const result = spawnSync(process.execPath, [tool, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 45_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error)
    throw new Error(`Harness tool failed to launch: ${result.error.message}`);
  if (result.signal || result.status === null) {
    throw new Error(
      `Harness tool did not complete: ${result.signal ?? 'missing exit status'}`,
    );
  }
  return result;
}

/** Execute the real pinned CLI against a repository or an isolated fixture. */
export function runDependencyCruiser(root, entries = PRODUCTION_OWNERS) {
  const result = runTool(
    dependencyCli,
    [
      '--config',
      path.join(root, '.dependency-cruiser.cjs'),
      '--output-type=json',
      ...entries,
    ],
    root,
  );
  let graph;
  try {
    graph = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Architecture CLI returned no valid JSON graph: ${result.stderr || result.stdout}`,
    );
  }
  if (![0, 1].includes(result.status)) {
    throw new Error(
      `Architecture CLI failed (${result.status}): ${result.stderr}`,
    );
  }
  return { status: result.status, graph };
}

/** Lint fixtures using the copied production Biome configuration and real CLI. */
export function runBiome(root, file) {
  return runTool(
    biomeCli,
    ['lint', '--config-path', path.join(root, 'biome.json'), file],
    root,
  );
}
