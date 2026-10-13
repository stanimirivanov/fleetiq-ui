import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argumentsList = process.argv.slice(2);
let root = fileURLToPath(new URL('../../', import.meta.url));
let json = false;
try {
  const seen = new Set();
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (seen.has(argument)) throw new Error('Duplicate option.');
    seen.add(argument);
    if (argument === '--json') json = true;
    else if (
      argument === '--root' &&
      argumentsList[index + 1] &&
      !argumentsList[index + 1].startsWith('--')
    )
      root = path.resolve(argumentsList[++index]);
    else throw new Error('Unknown or missing option.');
  }
  const { reviewUpgrades } = await import('./upgrades.mjs');
  const report = reviewUpgrades(root);
  if (json) console.log(JSON.stringify(report));
  else {
    console.log(`Dependency upgrade review: ${report.status}.`);
    for (const change of report.changes) {
      console.log(`${change.role}: ${change.reviewed} -> ${change.proposed}`);
      console.log(
        `  Owner: ${change.owner}; locations: ${change.locations.join(', ')}`,
      );
      if (change.role.startsWith('action:'))
        console.log(
          '  Verify the upstream release tag and immutable commit before owner approval.',
        );
      console.log(`  Qualify after review: ${change.qualification.join('; ')}`);
    }
    for (const finding of report.issues)
      console.error(
        `${finding.code}: ${finding.role} (${finding.locations.join(', ')})`,
      );
    console.log(
      'Read-only diagnostics; no registry updates or acceptance receipt. Rerun pnpm dependencies:review after coordinating or reviewing declared pins.',
    );
  }
  process.exitCode =
    report.status === 'current'
      ? 0
      : report.status === 'review-required'
        ? 2
        : 1;
} catch {
  console.error(
    'Cannot inspect dependency upgrade inputs or command options; no clean result.',
  );
  process.exitCode = 1;
}
