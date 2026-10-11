import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Importing a sensor never runs its CLI or changes the importing process. */
export async function runEntrypoint(moduleUrl, main) {
  if (
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(moduleUrl)
  ) {
    try {
      await main();
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Sensor failed');
      process.exitCode = 1;
    }
  }
}
