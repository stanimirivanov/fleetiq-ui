import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { selectedChecks } from '../verification/catalogue.mjs';
import { requiredChapters } from './assemble-book.mjs';

export const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a22AAAAAASUVORK5CYII=',
  'base64',
);
export const webm = Buffer.concat([
  Buffer.from([
    26, 69, 223, 163, 159, 66, 130, 132, 119, 101, 98, 109, 24, 83, 128, 103,
  ]),
  Buffer.alloc(32),
]);
export const source = {
  revision: 'a'.repeat(40),
  dirty: false,
  digest: 'b'.repeat(64),
  files: 10,
};
export const manifest = { packageManager: 'pnpm@12.5.1' };

export async function chapters(output) {
  await Promise.all(
    [...requiredChapters].map(async ([slug, dataMode], chapterIndex) => {
      const directory = path.join(output, slug);
      await mkdir(path.join(directory, 'assets'), { recursive: true });
      const steps = Array.from({ length: 5 }, (_, index) => ({
        title: `Step ${index + 1}`,
        body: `Verified action ${index + 1}.`,
        image: `assets/step-${String(index + 1).padStart(2, '0')}.png`,
      }));
      await Promise.all([
        writeFile(path.join(directory, 'assets', `${slug}.webm`), webm),
        ...steps.map((step) =>
          writeFile(path.join(directory, step.image), png),
        ),
        writeFile(
          path.join(directory, 'guide.json'),
          JSON.stringify({
            schemaVersion: 2,
            dataMode,
            order: (chapterIndex + 1) * 10,
            slug,
            title: slug,
            summary: 'A verified browser journey.',
            video: `assets/${slug}.webm`,
            steps,
          }),
        ),
      ]);
    }),
  );
}

export function report(group, current = source) {
  return {
    schemaVersion: 1,
    group,
    source: current,
    sourceStable: true,
    blocker: null,
    completePass: true,
    tools: { node: 'v24.18.0', pnpm: '12.5.1', git: '2.55.0' },
    checks: selectedChecks(group).map(({ id, script }) => ({
      id,
      command: `pnpm run ${script}`,
      status: 'passed',
      reason: null,
      exitCode: 0,
    })),
  };
}
export async function fixture(context) {
  const root = await mkdtemp(path.join(tmpdir(), 'fleetiq-guide-'));
  context.after(async () => {
    assert.ok(
      path.resolve(root).startsWith(`${path.resolve(tmpdir())}${path.sep}`),
    );
    await rm(root, { recursive: true, force: true });
  });
  const output = path.join(root, 'dist', 'user-guide');
  await mkdir(output, { recursive: true });
  await mkdir(path.join(root, '.verification'));
  await writeFile(path.join(root, 'package.json'), JSON.stringify(manifest));
  await writeFile(
    path.join(root, 'dist', 'unrelated.txt'),
    'preserve this output',
  );
  for (const group of ['acceptance', 'browser']) {
    await writeFile(
      path.join(root, '.verification', `${group}-123-fixture.json`),
      JSON.stringify(report(group)),
    );
  }
  await chapters(output);
  return { root, output };
}
export async function changeManifest(output, slug, change) {
  const file = path.join(output, slug, 'guide.json');
  const value = JSON.parse(await readFile(file, 'utf8'));
  change(value);
  await writeFile(file, JSON.stringify(value));
}
