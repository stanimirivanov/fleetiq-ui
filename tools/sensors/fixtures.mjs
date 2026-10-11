import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Each regression owns one disposable directory, never a repository artifact. */
export async function ownedFixture(context) {
  const root = await mkdtemp(path.join(tmpdir(), 'fleetiq-sensor-'));
  context.after(async () => {
    const resolved = path.resolve(root);
    if (!resolved.startsWith(`${path.resolve(tmpdir())}${path.sep}`)) {
      throw new Error('Sensor fixture escaped its temporary parent');
    }
    await rm(root, { recursive: true, force: true });
  });
  return root;
}
