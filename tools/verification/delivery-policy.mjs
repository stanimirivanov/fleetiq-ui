import { isDeepStrictEqual } from 'node:util';
import { ACTIONS, GUIDE_REF, GUIDE_TRIGGER } from './actions.mjs';
import { REQUIRED_JOBS } from './catalogue.mjs';
import { REVIEWED } from './reviewed-dependencies.mjs';

const equal = (actual, expected) => isDeepStrictEqual(actual, expected);
const normal = (value) =>
  typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : value;
const uploadConditions = new Set([
  "always() && steps.artifacts.outcome == 'success'",
  "failure() && steps.artifacts.outcome == 'success'",
  "success() && steps.artifacts.outcome == 'success'",
]);
const artifactPaths = new Set([
  '.verification/*.json',
  'dist/image-reports/',
  'test-results/\nplaywright-report/',
]);
const allowedRuns = new Set([
  'corepack enable',
  'pnpm install --frozen-lockfile',
  'pnpm security:install',
  'pnpm security:artifacts',
  'pnpm exec playwright install --with-deps chromium',
  'pnpm check',
  'pnpm image:qualify',
  'pnpm e2e',
  'pnpm dependencies:qualify --group browser',
  'pnpm dependencies:qualify --group browser-quality',
  'pnpm dependencies:qualify --group structural',
  'pnpm verify --group browser-quality',
  'pnpm verify --group structural',
  'pnpm guide:generate',
  'pnpm guide:release --require-clean',
]);

/** Bounded YAML structure checks; repository owners still protect writable sensors. */
export function inspectDelivery(quality, guide, fail) {
  for (const [label, workflow] of [
    ['quality', quality],
    ['guide', guide],
  ]) {
    for (const [name, job] of Object.entries(workflow.jobs ?? {})) {
      const steps = Array.isArray(job.steps) ? job.steps : [];
      const ids = steps.flatMap((step) => (step.id ? [step.id] : []));
      if (new Set(ids).size !== ids.length)
        fail('Step identities must be unique.');
      const inspectionIndex = steps.findIndex(
        (step) => step.id === 'artifacts',
      );
      if (label === 'quality') {
        const gateIndex = steps.findIndex(
          (step) => step.run === REQUIRED_JOBS[name]?.command,
        );
        if (gateIndex < 0 || inspectionIndex <= gateIndex)
          fail(
            'Retention inspection must follow the canonical artifact-producing gate.',
          );
      }
      if (
        inspectionIndex >= 0 &&
        steps
          .slice(inspectionIndex + 1)
          .some(
            (step) =>
              ![ACTIONS.upload, ACTIONS.uploadPages].includes(step.uses) ||
              step.run !== undefined,
          )
      )
        fail('Only reviewed uploads may follow final artifact inspection.');
      for (const step of steps) {
        if (step.uses && !Object.values(ACTIONS).includes(step.uses))
          fail(`${label}/${name}: unreviewed or mutable action.`);
        if (step.run && !allowedRuns.has(step.run))
          fail(`${label}/${name}: unregistered execution.`);
        if (
          step.env !== undefined ||
          step.shell !== undefined ||
          step['working-directory'] !== undefined ||
          (step['continue-on-error'] !== undefined &&
            step['continue-on-error'] !== false)
        )
          fail(`${label}/${name}: execution override.`);
        if (
          step.uses === ACTIONS.checkout &&
          (step.with?.['persist-credentials'] !== false ||
            step.with?.['fetch-depth'] !== 0 ||
            (step.with?.['allow-unsafe-pr-checkout'] !== undefined &&
              step.with['allow-unsafe-pr-checkout'] !== false))
        )
          fail(
            `${label}/${name}: require non-persistent credentials, complete history and safe fork checkout.`,
          );
        if ([ACTIONS.upload, ACTIONS.uploadPages].includes(step.uses)) {
          const scan = steps.find(
            (candidate) =>
              candidate.id === 'artifacts' &&
              candidate.run === 'pnpm security:artifacts' &&
              candidate.if === 'always()',
          );
          if (
            !scan ||
            steps.indexOf(scan) >= steps.indexOf(step) ||
            !uploadConditions.has(step.if)
          )
            fail(
              `${label}/${name}: upload is not gated by artifact inspection.`,
            );
          if (
            step.uses === ACTIONS.upload &&
            (!artifactPaths.has(step.with?.path?.trim()) ||
              step.with?.['retention-days'] !== 7)
          )
            fail(`${label}/${name}: unregistered retained artifact.`);
          if (
            step.uses === ACTIONS.uploadPages &&
            (step.with?.path !== 'dist/user-guide' ||
              step.if !== "success() && steps.artifacts.outcome == 'success'")
          )
            fail('Guide Pages upload must require every preceding gate.');
        }
      }
      if (name !== 'deploy') {
        const install = steps.find(
          (step) =>
            step.run === 'pnpm security:install' && step.if === undefined,
        );
        const scan = steps.find(
          (step) =>
            step.id === 'artifacts' &&
            step.run === 'pnpm security:artifacts' &&
            step.if === 'always()',
        );
        if (!install || !scan || steps.indexOf(install) >= steps.indexOf(scan))
          fail(`${label}/${name}: security prerequisites/inspection missing.`);
      }
    }
  }
  if (
    !equal(Object.keys(quality.jobs ?? {}).sort(), [
      'browser',
      'browser-quality',
      'check',
      'image',
    ])
  )
    fail('Quality job inventory changed.');
  if (
    !equal(guide.on, {
      workflow_run: { workflows: ['Web quality gate'], types: ['completed'] },
      workflow_dispatch: null,
    })
  )
    fail('Require automatic and manual guide triggers.');
  if (
    !equal(guide.permissions, { contents: 'read' }) ||
    guide.defaults !== undefined ||
    guide.env !== undefined
  )
    fail('Guide workflow permissions/defaults changed.');
  if (!equal(Object.keys(guide.jobs ?? {}).sort(), ['build', 'deploy']))
    fail('Guide job inventory changed.');
  const build = guide.jobs?.build;
  const deploy = guide.jobs?.deploy;
  if (
    !build ||
    normal(build.if) !== GUIDE_TRIGGER ||
    build['runs-on'] !== 'ubuntu-latest' ||
    !equal(build.permissions, { contents: 'read', pages: 'read' })
  )
    fail('Guide trigger must exclude PR/fork/failed/non-main publication.');
  if (build) {
    if (
      build['continue-on-error'] !== undefined ||
      build.needs !== undefined ||
      build.env !== undefined ||
      build.defaults !== undefined ||
      build.container !== undefined ||
      build.strategy !== undefined
    )
      fail('Guide build can be weakened.');
    const steps = Array.isArray(build.steps) ? build.steps : [];
    const required = [
      (step) => step.uses === ACTIONS.checkout && step.with?.ref === GUIDE_REF,
      (step) =>
        step.uses === ACTIONS.node &&
        String(step.with?.['node-version']) === String(REVIEWED.nodeMajor),
      ...[
        'corepack enable',
        'pnpm install --frozen-lockfile',
        'pnpm security:install',
        'pnpm exec playwright install --with-deps chromium',
        'pnpm check',
        'pnpm e2e',
        'pnpm verify --group browser-quality',
        'pnpm guide:generate',
        'pnpm guide:release --require-clean',
      ].map((command) => (step) => step.run === command),
    ];
    let previous = -1;
    for (const predicate of required) {
      const matches = steps.filter(predicate);
      if (
        matches.length !== 1 ||
        matches[0].if !== undefined ||
        steps.indexOf(matches[0]) <= previous
      ) {
        fail('Guide exact-source setup and full acceptance order changed.');
        break;
      }
      previous = steps.indexOf(matches[0]);
    }
    const release = steps.findIndex(
      (step) => step.run === 'pnpm guide:release --require-clean',
    );
    const scan = steps.findIndex((step) => step.id === 'artifacts');
    const uploads = steps.filter((step) => step.uses === ACTIONS.uploadPages);
    if (
      scan <= release ||
      uploads.length !== 1 ||
      steps.indexOf(uploads[0]) <= scan
    )
      fail('Guide release and inspection must precede Pages upload.');
  }
  if (
    deploy &&
    ['env', 'defaults', 'container', 'strategy'].some(
      (key) => deploy[key] !== undefined,
    )
  )
    fail('Guide deployment execution override.');
  if (
    deploy?.needs !== 'build' ||
    deploy.if !== undefined ||
    deploy['continue-on-error'] !== undefined ||
    !equal(deploy.permissions, { pages: 'write', 'id-token': 'write' }) ||
    deploy.environment?.name !== 'github-pages' ||
    deploy.steps?.length !== 1 ||
    deploy.steps[0].uses !== ACTIONS.deployPages ||
    deploy.steps[0].if !== undefined
  )
    fail(
      'Guide deployment must depend on the qualified build with scoped Pages permissions.',
    );
}
