import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS, selectedChecks } from './catalogue.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const arguments_ = process.argv.slice(2);
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  if (arguments_.length === 1 && arguments_[0] === '--list') {
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
        'Usage: pnpm verify [--group acceptance|structural|product|browser|browser-quality|security] or --list',
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
    if (
      report.dependencyReview?.status !== 'current' &&
      report.dependencyReview
    )
      console.error(
        'Dependency inventory needs attention. Run pnpm dependencies:review for affected pins, coordinated changes and required qualification.',
      );
    if (
      ['reviewed-tools-unavailable', 'reviewed-tools-changed'].includes(
        report.blocker,
      )
    )
      console.error(
        'Declared pins are reviewed, but installed tools are missing or mismatched. Run pnpm install --frozen-lockfile and rerun verification.',
      );
    for (const entry of report.checks)
      console.log(`${entry.id}: ${entry.status}`);
    console.log(`verification evidence: ${path.relative(root, evidencePath)}`);
    console.log(
      report.completePass
        ? `Verification group ${group} passed.`
        : 'Verification incomplete (' +
            (report.blocker ?? 'check-failed') +
            '); no group acceptance pass.',
    );
    if (!report.completePass) process.exitCode = 1;
  }
} catch {
  console.error(
    'Verification setup failed. Inspect the group name, manifest and owned evidence directory.',
  );
  process.exitCode = 1;
}
