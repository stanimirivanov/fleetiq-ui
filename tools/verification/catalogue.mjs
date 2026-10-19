/** Reviewed inventory owns verification, CI entry points and bounded evidence. */
export const CHECKS = [
  { id: 'image-policy', script: 'image:policy' },
  { id: 'image-tests', script: 'image:tests' },
  { id: 'image-artifact', script: 'image:artifact' },
  { id: 'harness-tests', script: 'harness:test' },
  { id: 'policy', script: 'harness:check' },
  { id: 'quality-configuration', script: 'quality:configuration' },
  { id: 'style', script: 'style:check' },
  { id: 'architecture', script: 'architecture' },
  { id: 'boundaries', script: 'boundaries:check' },
  { id: 'view', script: 'view:check' },
  { id: 'docs', script: 'docs:check' },
  { id: 'design', script: 'design:check' },
  { id: 'contract', script: 'contract:check' },
  { id: 'secrets', script: 'security:secrets' },
  { id: 'dependencies', script: 'security:dependencies' },
  { id: 'typecheck', script: 'typecheck' },
  { id: 'unit-tests', script: 'test:unit' },
  { id: 'component-tests', script: 'test:component' },
  { id: 'guide-tests', script: 'guide:test' },
  { id: 'build', script: 'build' },
  { id: 'critical-mutations', script: 'quality:mutations' },
  { id: 'measured-browser', script: 'e2e:quality' },
  { id: 'page-error-qualification', script: 'quality:page-errors' },
  { id: 'browser-production', script: 'e2e:production' },
  { id: 'browser-development', script: 'e2e:development' },
];
const structural = [
  'harness-tests',
  'policy',
  'image-policy',
  'quality-configuration',
  'style',
  'architecture',
  'boundaries',
  'view',
  'docs',
  'design',
  'contract',
];
const product = ['typecheck', 'unit-tests', 'component-tests', 'build'];
export const GROUPS = {
  image: ['image-tests', 'image-policy', 'image-artifact'],
  structural,
  product,
  security: ['secrets', 'dependencies'],
  acceptance: [
    ...structural,
    'secrets',
    'dependencies',
    ...product.slice(0, 3),
    'guide-tests',
    'critical-mutations',
    'build',
  ],
  browser: ['browser-production', 'browser-development'],
  'browser-quality': ['measured-browser', 'page-error-qualification'],
};
/** Changes must be reviewed with the sensor; changing a script cannot bypass it. */
export const REQUIRED_SCRIPTS = {
  'image:tests': 'node --test tools/images/tests/*.test.mjs',
  'image:policy': 'node tools/images/check-policy.mjs',
  'image:artifact': 'node tools/images/qualify.mjs',
  'image:qualify': 'node tools/verification/cli.mjs --group image',
  'dependencies:review': 'node tools/verification/upgrades-cli.mjs',
  'dependencies:qualify': 'node tools/verification/cli.mjs --candidate',
  verify: 'node tools/verification/cli.mjs',
  check: 'node tools/verification/cli.mjs --group acceptance',
  e2e: 'node tools/verification/cli.mjs --group browser',
  'quality:configuration': 'node tools/quality/configuration.mjs',
  'harness:check': 'node tools/verification/check-policy.mjs',
  'harness:test':
    'node --test tools/docs/*.test.mjs tools/sensors/*.test.mjs tools/check-architecture.test.mjs tools/architecture/*.test.mjs tools/boundaries/*.test.mjs tools/security/*.test.mjs tools/verification/*.test.mjs tools/quality/*.test.mjs tools/images/tests/*.test.mjs',
  'style:check': 'biome ci .',
  architecture: 'node tools/check-architecture.mjs',
  'boundaries:check': 'node tools/check-boundaries.mjs',
  'view:check':
    'node --test tools/check-view-size.test.mjs && node tools/check-view-size.mjs',
  'docs:check': 'node tools/check-docs.mjs',
  'design:check': 'node tools/check-design-tokens.mjs',
  'contract:check':
    'node tools/check-asset-contract.mjs && node tools/generate-asset-contract.mjs --check',
  'security:install': 'node tools/security/install.mjs',
  'security:secrets': 'node tools/security/secrets.mjs',
  'security:dependencies': 'node tools/security/advisories.mjs',
  'security:artifacts': 'node tools/security/artifacts.mjs',
  typecheck:
    'pnpm --filter @fleetiq/web typecheck && pnpm exec tsc --noEmit -p apps/web-e2e/tsconfig.json',
  'test:unit': 'pnpm --filter @fleetiq/web test:unit',
  'test:component': 'pnpm --filter @fleetiq/web test:component',
  'guide:test': 'node --test tools/user-guide/*.test.mjs',
  'guide:generate': 'node tools/user-guide/generate.mjs',
  'guide:release': 'node tools/user-guide/release.mjs',
  build: 'pnpm --filter @fleetiq/web build && node tools/quality/bundle.mjs',
  'quality:mutations': 'node tools/quality/mutations.mjs',
  'quality:page-errors': 'node tools/quality/browser-error-fixture.mjs',
  'e2e:quality':
    'pnpm build && pnpm exec playwright test --config apps/web-e2e/playwright.quality.config.ts',
  'e2e:production':
    'pnpm build && pnpm exec playwright test --config apps/web-e2e/playwright.config.ts',
  'e2e:development':
    'pnpm exec playwright test --config apps/web-e2e/playwright.development.config.ts',
};
export const REQUIRED_JOBS = {
  image: { platform: 'ubuntu-24.04', command: 'pnpm image:qualify' },
  check: { platform: 'ubuntu-latest', command: 'pnpm check' },
  browser: {
    platform: 'ubuntu-latest',
    command: 'pnpm dependencies:qualify --group browser',
  },
  'browser-quality': {
    platform: 'ubuntu-latest',
    command: 'pnpm dependencies:qualify --group browser-quality',
  },
  'harness-windows': {
    platform: 'windows-latest',
    command: 'pnpm dependencies:qualify --group structural',
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
    if (!check || REQUIRED_SCRIPTS[check.script] === undefined)
      throw new Error(
        'Verification catalogue references an undefined command.',
      );
    return check;
  });
}
