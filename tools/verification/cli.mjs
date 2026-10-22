import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS, selectedChecks } from './catalogue.mjs';
import { verificationExitCode } from './cli-decision.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const flags = process.argv.slice(2);
const candidateRequested = flags[0] === '--candidate';
const arguments_ = candidateRequested ? flags.slice(1) : flags;
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  if (
    !candidateRequested &&
    arguments_.length === 1 &&
    arguments_[0] === '--list'
  ) {
    for (const group of Object.keys(GROUPS)) {
      console.log(
        group +
          ': ' +
          selectedChecks(group)
            .map(({ id }) => id)
            .join(', '),
      );
    }
  } else {
    if (
      arguments_.length !== 0 &&
      (arguments_.length !== 2 || arguments_[0] !== '--group')
    ) {
      throw new Error(
        'Usage: pnpm verify [--candidate] [--group acceptance|structural|product|browser|browser-quality|security] or --list',
      );
    }
    const group = arguments_[1] ?? 'acceptance';
    let manifest;
    try {
      manifest = JSON.parse(
        readFileSync(path.join(root, 'package.json'), 'utf8'),
      );
    } catch {
      manifest = {};
    }
    const { verify } = await import('./runner.mjs');
    const { report, evidencePath } = await verify(root, manifest, group, {
      signal: controller.signal,
    });
    let candidate;
    if (
      report.blocker === 'dependency-review-required' &&
      (group === 'acceptance' || candidateRequested)
    ) {
      const { qualifyCandidate } = await import('./candidate.mjs');
      candidate = await qualifyCandidate(root, manifest, group, {
        signal: controller.signal,
      });
      for (const stage of candidate.report.stages)
        console.log(`candidate/${stage.id}: ${stage.status}`);
      console.log(
        `candidate evidence: ${path.relative(root, candidate.evidencePath)}`,
      );
    }
    if (
      ['review-required', 'blocked'].includes(report.dependencyReview?.status)
    )
      console.error(
        'Dependency inventory needs attention. Run pnpm dependencies:review for affected pins, coordinated changes and required qualification.',
      );
    if (
      ['reviewed-tools-unavailable', 'reviewed-tools-changed'].includes(
        report.blocker,
      )
    ) {
      console.error(
        'Declared pins are reviewed, but installed tools are missing or mismatched. Run pnpm install --frozen-lockfile and check the declared dependency graph before rerunning verification.',
      );
      try {
        const { inspectInstalledTools } = await import('./installed-tools.mjs');
        // The inspector emits fixed inventory labels/codes only, never package
        // fields, absolute paths, resolver exceptions or candidate output.
        for (const { role, location, code } of inspectInstalledTools(root))
          console.error(`Installed tool: ${role} (${location}): ${code}.`);
      } catch {
        console.error(
          'Installed tool inspection unavailable (details redacted).',
        );
      }
    }
    for (const entry of report.checks)
      console.log(`${entry.id}: ${entry.status}`);
    console.log(`verification evidence: ${path.relative(root, evidencePath)}`);
    console.log(
      candidate
        ? 'Candidate qualification ' +
            (candidate.report.qualificationPass ? 'passed' : 'failed') +
            '; dependency review remains pending; no group acceptance pass.'
        : report.completePass
          ? `Verification group ${group} passed.`
          : 'Verification incomplete (' +
            (report.blocker ?? 'check-failed') +
            '); no group acceptance pass.',
    );
    process.exitCode = verificationExitCode(
      group,
      candidateRequested,
      report,
      candidate?.report,
    );
  }
} catch {
  console.error(
    'Verification setup failed. Inspect the group name, manifest and owned evidence directory.',
  );
  process.exitCode = 1;
}
