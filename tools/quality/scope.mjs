import { readFileSync } from 'node:fs';
/** Explicit owned source inventory, shared by provider configuration and receipt validation. */
export const coverageScope = JSON.parse(
  readFileSync(new URL('./coverage-scope.json', import.meta.url), 'utf8'),
).files;
