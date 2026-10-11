/** The reviewed inventory owns local verification, CI entry points and evidence. */
export const CHECKS = [
  { id: 'harness-tests', script: 'harness:test' },
  { id: 'policy', script: 'harness:check' },
  { id: 'style', script: 'style:check' },
  { id: 'architecture', script: 'architecture' },
  { id: 'view', script: 'view:check' },
  { id: 'docs', script: 'docs:check' },
  { id: 'design', script: 'design:check' },
  { id: 'contract', script: 'contract:check' },
  { id: 'typecheck', script: 'typecheck' },
  { id: 'unit-tests', script: 'test:unit' },
  { id: 'component-tests', script: 'test:component' },
  { id: 'guide-tests', script: 'guide:test' },
  { id: 'build', script: 'build' },
  { id: 'browser-production', script: 'e2e:production' },
  { id: 'browser-development', script: 'e2e:development' },
];
export const GROUPS = {
  structural: CHECKS.slice(0, 8).map(({ id }) => id),
  product: ['typecheck', 'unit-tests', 'component-tests', 'build'],
  acceptance: CHECKS.slice(0, 13).map(({ id }) => id),
  browser: ['browser-production', 'browser-development'],
};
/** Script changes must be reviewed alongside the sensor, never silently bypassed. */
export const REQUIRED_SCRIPTS = {
  verify: 'node tools/verification/cli.mjs',
  check: 'node tools/verification/cli.mjs --group acceptance',
  e2e: 'node tools/verification/cli.mjs --group browser',
  'harness:check': 'node tools/verification/check-policy.mjs',
  'harness:test':
    'node --test tools/docs/*.test.mjs tools/sensors/*.test.mjs tools/check-architecture.test.mjs tools/verification/*.test.mjs',
  'style:check': 'biome ci .',
  architecture: 'node tools/check-architecture.mjs',
  'view:check':
    'node --test tools/check-view-size.test.mjs && node tools/check-view-size.mjs',
  'docs:check': 'node tools/check-docs.mjs',
  'design:check': 'node tools/check-design-tokens.mjs',
  'contract:check':
    'node tools/check-asset-contract.mjs && node tools/generate-asset-contract.mjs --check',
  typecheck:
    'pnpm --filter @fleetiq/web typecheck && pnpm exec tsc --noEmit -p apps/web-e2e/tsconfig.json',
  'test:unit': 'pnpm --filter @fleetiq/web test:unit',
  'test:component': 'pnpm --filter @fleetiq/web test:component',
  'guide:test': 'node --test tools/user-guide/*.test.mjs',
  build: 'pnpm --filter @fleetiq/web build',
  'e2e:production':
    'pnpm build && pnpm exec playwright test --config apps/web-e2e/playwright.config.ts',
  'e2e:development':
    'pnpm exec playwright test --config apps/web-e2e/playwright.development.config.ts',
};
export const REQUIRED_JOBS = {
  check: { platform: 'ubuntu-latest', command: 'pnpm check' },
  browser: { platform: 'ubuntu-latest', command: 'pnpm e2e' },
  'harness-windows': {
    platform: 'windows-latest',
    command: 'pnpm verify --group structural',
  },
};
export function selectedChecks(group) {
  const ids = GROUPS[group];
  if (!ids) throw new Error('Unknown verification group.');
  if (
    new Set(CHECKS.map(({ id }) => id)).size !== CHECKS.length ||
    new Set(ids).size !== ids.length
  )
    throw new Error('Invalid verification catalogue.');
  return ids.map((id) => {
    const check = CHECKS.find((candidate) => candidate.id === id);
    if (!check || REQUIRED_SCRIPTS[check.script] === undefined) {
      throw new Error(
        'Verification catalogue references an undefined command.',
      );
    }
    return check;
  });
}
