import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qualifyTools } from '../verification/execution.mjs';
import { sourceState, unchangedSource } from '../verification/source-state.mjs';
import { assembleBook } from './assemble-book.mjs';
import { discardGuideOutput, resetGuideOutput } from './owned-output.mjs';
import { requireQualification } from './qualification.mjs';
import {
  inspectGuideArtifacts,
  outputInventory,
  writeReady,
} from './release.mjs';

/** Fixed argument arrays use the version-qualified launcher; no shell or test bypass. */
export function executeGuideStage(root, launcher, args, environment) {
  const result = spawnSync(launcher.command, [...launcher.args, ...args], {
    cwd: root,
    env: environment,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error || result.status !== 0 || result.signal)
    throw new Error('Guide command did not complete successfully.');
}

/** Recording requires completed gates; a failed stage never leaves publishable partial output. */
export async function generateGuide(
  root,
  {
    qualify = qualifyTools,
    snapshot = sourceState,
    execute = executeGuideStage,
    assemble = assembleBook,
    inspect = inspectGuideArtifacts,
  } = {},
) {
  const manifest = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const source = snapshot(root);
  const qualified = qualify(root, manifest);
  if (qualified.blocker || !qualified.launcher)
    throw new Error('Guide tool qualification is incomplete.');
  const qualification = requireQualification(root, source, manifest);
  const outputRoot = resetGuideOutput(root);
  try {
    const environment = { ...process.env, FLEETIQ_E2E_MODE: 'user-guide' };
    await execute(root, qualified.launcher, ['run', 'build'], environment);
    for (const config of [
      'playwright.config.ts',
      'playwright.development.config.ts',
    ]) {
      await execute(
        root,
        qualified.launcher,
        [
          'exec',
          'playwright',
          'test',
          '--config',
          `apps/web-e2e/${config}`,
          '--grep',
          '@user-guide',
        ],
        environment,
      );
    }
    await assemble(outputRoot);
    const inspectedInventory = outputInventory(outputRoot);
    await inspect(outputRoot, root);
    if (
      JSON.stringify(inspectedInventory) !==
      JSON.stringify(outputInventory(outputRoot))
    )
      throw new Error('Guide output changed during inspection.');
    if (!unchangedSource(source, snapshot(root)))
      throw new Error('Source changed during guide generation.');
    const ready = writeReady(root, source, qualification);
    console.log(
      '[ok] Complete guide generated and inspected under dist/user-guide.',
    );
    return ready;
  } catch {
    discardGuideOutput(root);
    throw new Error(
      'Guide generation failed; partial owned output was discarded.',
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 2)
      throw new Error('Guide generator accepts no options.');
    await generateGuide(fileURLToPath(new URL('../../', import.meta.url)));
  } catch {
    console.error(
      'User guide generation incomplete; no publication is permitted.',
    );
    process.exitCode = 1;
  }
}
