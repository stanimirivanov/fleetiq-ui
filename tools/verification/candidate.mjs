import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ownedFile } from '../security/owned.mjs';
import { retainCandidateArtifacts } from './candidate-artifacts.mjs';
import { candidateCommand } from './candidate-process.mjs';
import { prepareCandidateWorkspace } from './candidate-workspace.mjs';
import { selectedChecks } from './catalogue.mjs';
import { qualifyTools } from './execution.mjs';
import { REVIEWED } from './reviewed-dependencies.mjs';
import { writeEvidence } from './runner.mjs';
import { sourceState, unchangedSource } from './source-state.mjs';

function childEvidence(directory, group) {
  const names = readdirSync(path.join(directory, '.verification')).filter(
    (name) => name.startsWith(`${group}-`) && name.endsWith('.json'),
  );
  if (names.length !== 1)
    throw new Error('Candidate group evidence is ambiguous.');
  const file = ownedFile(directory, `.verification/${names[0]}`);
  if (lstatSync(file).size > 64 * 1024)
    throw new Error('Candidate evidence exceeds its bound.');
  return JSON.parse(readFileSync(file, 'utf8'));
}
const sourceShape = (source) =>
  source &&
  typeof source.revision === 'string' &&
  /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u.test(source.revision) &&
  typeof source.digest === 'string' &&
  /^[a-f0-9]{64}$/u.test(source.digest) &&
  typeof source.dirty === 'boolean' &&
  Number.isSafeInteger(source.files) &&
  source.files >= 0;
const version = (value) =>
  typeof value === 'string' &&
  value.length <= 64 &&
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(value);

function changesShape(changes) {
  return (
    Array.isArray(changes) &&
    changes.length > 0 &&
    changes.length <= 8 &&
    new Set(changes.map((change) => change?.role)).size === changes.length &&
    changes.every(
      (change) =>
        change &&
        Object.hasOwn(REVIEWED.tools, change.role) &&
        version(change.reviewed) &&
        version(change.proposed) &&
        change.reviewed !== change.proposed,
    )
  );
}
function outcomeShape(result) {
  return (
    result &&
    ['passed', 'failed', 'not-run'].includes(result.status) &&
    [null, 'interrupted', 'launch-failed', 'command-failed'].includes(
      result.reason,
    ) &&
    (result.exitCode === null ||
      (Number.isInteger(result.exitCode) &&
        result.exitCode >= 0 &&
        result.exitCode <= 255)) &&
    (result.status !== 'passed' ||
      (result.reason === null && result.exitCode === 0))
  );
}

/** Private snapshot success is qualification, never original-source acceptance. */
export function candidatePassed(child, group, source) {
  const checks = selectedChecks(group);
  return Boolean(
    child?.schemaVersion === 1 &&
      child.group === group &&
      child.completePass === true &&
      child.blocker === null &&
      child.kind === undefined &&
      child.qualificationPass === undefined &&
      child.sourceStable === true &&
      child.dependencyReview?.status === 'current' &&
      child.dependencyReview.changes === 0 &&
      child.dependencyReview.issues === 0 &&
      child.installedTools?.status === 'current' &&
      child.installedTools.issues === 0 &&
      typeof child.tools?.node === 'string' &&
      child.tools.node.startsWith(`v${REVIEWED.nodeMajor}.`) &&
      /^v[1-9]\d*\.\d+\.\d+$/u.test(child.tools.node) &&
      child.tools.pnpm === REVIEWED.pnpm &&
      typeof child.tools.git === 'string' &&
      /^\d+\.\d+(?:\.\d+)?[.a-z0-9-]{0,48}$/iu.test(child.tools.git) &&
      sourceShape(child.source) &&
      sourceShape(source) &&
      unchangedSource(child.source, source) &&
      Array.isArray(child.checks) &&
      child.checks.length === checks.length &&
      checks.every(({ id, script }, index) => {
        const entry = child.checks[index];
        return (
          entry?.id === id &&
          entry.command === `pnpm run ${script}` &&
          entry.status === 'passed' &&
          entry.reason === null &&
          entry.exitCode === 0
        );
      }),
  );
}

/**
 * Exercise unchanged gates in a disposable, exact-source npm candidate workspace.
 * Approval, action/runtime changes and publication remain outside this operation.
 */
export async function qualifyCandidate(
  root,
  manifest,
  group,
  {
    prepare = prepareCandidateWorkspace,
    qualify = qualifyTools,
    execute = candidateCommand,
    readEvidence = childEvidence,
    snapshot = sourceState,
    persist = writeEvidence,
    retain = retainCandidateArtifacts,
    signal,
  } = {},
) {
  selectedChecks(group);
  const report = {
    schemaVersion: 1,
    kind: 'dependency-candidate',
    group,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    source: null,
    sourceStable: false,
    candidateSource: null,
    dependencyReview: { status: 'review-required', changes: 0, issues: 0 },
    changes: [],
    stages: [],
    checks: [],
    blocker: null,
    qualificationPass: false,
    completePass: false,
  };
  let workspace;
  let context;
  let scannerReady = false;
  const run = async (id, args) => {
    const outcome = await execute(workspace.directory, context.launcher, args, {
      signal,
    });
    workspace.assertCandidateStable();
    if (!outcomeShape(outcome))
      throw new Error('Candidate command returned an invalid outcome.');
    report.stages.push({
      id,
      status: outcome.status,
      reason: outcome.reason,
      exitCode: outcome.exitCode,
    });
    if (outcome.status !== 'passed') report.blocker ??= `${id}-failed`;
    return outcome.status === 'passed';
  };
  try {
    report.source = snapshot(root);
    if (!sourceShape(report.source))
      throw new Error('Candidate source unavailable.');
    context = qualify(root, manifest);
    if (context.blocker)
      throw new Error('Candidate runtime prerequisites unavailable.');
    workspace = prepare(root);
    if (
      !unchangedSource(report.source, workspace.source) ||
      !sourceShape(workspace.expectedCandidateSource) ||
      !changesShape(workspace.changes)
    )
      throw new Error('Candidate preparation source or proposals changed.');
    workspace.assertCandidateStable();
    report.changes = workspace.changes.map(({ role, reviewed, proposed }) => ({
      role,
      reviewed,
      proposed,
    }));
    report.dependencyReview.changes = report.changes.length;
    if (await run('frozen-install', ['install', '--frozen-lockfile'])) {
      scannerReady = await run('scanner-install', ['run', 'security:install']);
      if (
        scannerReady &&
        (await run('candidate-policy', ['run', 'harness:check']))
      ) {
        const groupPassed = await run('candidate-group', [
          'run',
          'verify',
          '--group',
          group,
        ]);
        const child = readEvidence(workspace.directory, group);
        report.candidateSource = { ...workspace.expectedCandidateSource };
        report.checks = selectedChecks(group).map(({ id, script }, index) => ({
          id,
          command: `pnpm run ${script}`,
          status: ['passed', 'failed', 'not-run'].includes(
            child.checks?.[index]?.status,
          )
            ? child.checks[index].status
            : 'not-run',
        }));
        if (
          groupPassed &&
          !candidatePassed(child, group, workspace.expectedCandidateSource)
        )
          throw new Error('Candidate receipt failed qualification.');
      }
    }
  } catch {
    report.blocker ??= 'candidate-setup-or-evidence-failed';
  } finally {
    try {
      if (
        scannerReady &&
        (await run('artifact-inspection', ['run', 'security:artifacts']))
      )
        await retain(root, workspace.directory);
      workspace?.assertCandidateStable();
      workspace?.assertSourceStable();
      report.sourceStable = Boolean(
        sourceShape(report.source) &&
          unchangedSource(report.source, snapshot(root)),
      );
      if (!report.sourceStable) report.blocker = 'sources-changed';
      if (signal?.aborted) report.blocker = 'interrupted';
    } catch {
      report.blocker ??= 'candidate-inspection-or-source-failed';
    }
    try {
      workspace?.cleanup();
    } catch {
      report.blocker = 'candidate-cleanup-failed';
    }
  }
  report.qualificationPass =
    !report.blocker &&
    report.sourceStable &&
    report.stages.length === 5 &&
    report.stages.every(({ status }) => status === 'passed');
  report.finishedAt = new Date().toISOString();
  return { report, evidencePath: persist(root, report) };
}
