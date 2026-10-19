import { docker } from './process.mjs';

/** Prove remote availability before building; a warm daemon cache is not evidence. */
export async function pullToolImages(tools, execute = docker) {
  for (const role of ['transport', 'registry', 'scanner', 'node', 'edge']) {
    console.log(`Pull pinned ${role} image: ${tools[role]}`);
    try {
      await execute(['pull', '--platform', tools.platform, tools[role]], {
        capture: false,
        timeout: 180_000,
      });
    } catch {
      throw new Error(
        `Pinned ${role} image is unavailable; check its registry digest and the pull diagnostic above.`,
      );
    }
  }
}
