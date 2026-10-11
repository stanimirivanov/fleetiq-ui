import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPolicy } from './policy.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
try {
  const diagnostics = checkPolicy(root);
  for (const diagnostic of diagnostics) console.error(diagnostic);
  if (diagnostics.length > 0) process.exitCode = 1;
  else
    console.log(
      'Verification catalogue, package pins and required CI routes agree.',
    );
} catch {
  console.error('Cannot inspect verification policy inputs.');
  process.exitCode = 1;
}
