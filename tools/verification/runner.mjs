import { randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { resolveOwnedPath } from '../docs/source.mjs';
import { REQUIRED_SCRIPTS, selectedChecks } from './catalogue.mjs';
import { executeCheck, qualifyTools } from './execution.mjs';
import { sourceState, unchangedSource } from './source-state.mjs';

function writeEvidence(root, report) {
  const directory = path.join(root, '.verification');
  try {
    if (!lstatSync(directory).isDirectory())
      throw new Error('Evidence path is not a directory.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    mkdirSync(directory);
  }
  resolveOwnedPath(root, '.verification');
  const file = path.join(
    directory,
    `${report.group}-${process.pid}-${randomUUID()}.json`,
  );
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
  return file;
}
/** A group passes only when every selected command passes against stable sources. */
export async function verify(
  root,
  manifest,
  group,
  {
    qualify = qualifyTools,
    snapshot = sourceState,
    execute = executeCheck,
    persist = writeEvidence,
    signal,
  } = {},
) {
  const checks = selectedChecks(group);
  const report = {
    schemaVersion: 1,
    group,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    tools: {},
    source: null,
    sourceStable: false,
    blocker: null,
    checks: checks.map(({ id, script }) => ({
      id,
      command: `pnpm run ${script}`,
      status: 'not-run',
      reason: 'prerequisites-unavailable',
      exitCode: null,
    })),
    completePass: false,
  };
  let context;
  try {
    report.source = snapshot(root);
    context = qualify(root, manifest);
    report.tools = context.tools;
    report.blocker = context.blocker;
    if (
      !report.blocker &&
      checks.some(
        ({ script }) => manifest.scripts?.[script] !== REQUIRED_SCRIPTS[script],
      )
    ) {
      report.blocker = 'canonical-command-changed';
    }
  } catch {
    report.blocker = 'source-or-tool-discovery-failed';
  }
  if (!report.blocker) {
    for (let index = 0; index < checks.length; index++) {
      const started = Date.now();
      let result;
      try {
        result = await execute(root, context.launcher, checks[index].script, {
          signal,
        });
      } catch {
        result = { status: 'failed', reason: 'runner-error', exitCode: null };
      }
      Object.assign(report.checks[index], result, {
        durationMs: Date.now() - started,
      });
      if (result.status !== 'passed') {
        for (const entry of report.checks.slice(index + 1))
          entry.reason = 'prior-check-incomplete';
        break;
      }
    }
  }
  if (report.source) {
    try {
      report.sourceStable = unchangedSource(report.source, snapshot(root));
      if (!report.sourceStable) report.blocker = 'sources-changed';
    } catch {
      report.blocker = 'source-state-unavailable';
    }
  }
  if (signal?.aborted) report.blocker = 'interrupted';
  report.completePass =
    !report.blocker &&
    report.sourceStable &&
    report.checks.every(({ status }) => status === 'passed');
  report.finishedAt = new Date().toISOString();
  const evidencePath = persist(root, report);
  return { report, evidencePath };
}
