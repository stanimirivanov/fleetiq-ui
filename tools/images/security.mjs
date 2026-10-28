/** Local/CI-portable preflight: exact production build, original OCI scan, owned cleanup. */
import { qualify } from './qualify.mjs';

try {
  if (process.argv.length !== 2)
    throw new Error('Unexpected security preflight arguments.');
  await qualify({ mode: 'security' });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
