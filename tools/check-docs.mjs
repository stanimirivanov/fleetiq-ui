import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDocumentation } from './docs/check.mjs';

export { checkDocumentation } from './docs/check.mjs';

/** Stable CLI diagnostics contain source locations and policy, never file bodies. */
export function main(
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
) {
  const { diagnostics } = checkDocumentation(root);
  for (const diagnostic of diagnostics) {
    console.error(
      `${diagnostic.file}:${diagnostic.line}: [${diagnostic.code}] ${diagnostic.message}`,
    );
  }
  if (diagnostics.length) return 1;
  console.log(
    'Git-owned documentation, canonical routes and plan fields are valid.',
  );
  return 0;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main();
}
