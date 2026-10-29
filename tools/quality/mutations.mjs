import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { temporary } from '../security/owned.mjs';
import { runEntrypoint } from '../sensors/entrypoint.mjs';
import { sourceIdentity, writeQualityEvidence } from './evidence.mjs';
import { repositoryRoot } from './policy.mjs';

const cases = [
  {
    id: 'logout-hides-protected-content',
    target: 'features/identity/ui/OperatorSessionProvider.tsx',
    file: 'features/identity/ui/OperatorSessionProvider.test.tsx',
    title:
      'failed logout immediately hides evidence and exposes an explicit retry',
    before: "setState({ kind: 'loading' });",
    after: '',
  },
  {
    id: 'metadata-cancellation',
    target: 'features/assets/ui/connected/useMetadataRead.ts',
    file: 'features/assets/ui/connected/MetadataWorkspace.test.tsx',
    title:
      'aborts tenant changes and unmount, discarding a stale response from a non-cooperative reader',
    before: 'controller.abort();',
    after: '',
  },
  {
    id: 'metadata-stale-completion',
    target: 'features/assets/ui/connected/useMetadataRead.ts',
    file: 'features/assets/ui/connected/MetadataWorkspace.test.tsx',
    title:
      'aborts tenant changes and unmount, discarding a stale response from a non-cooperative reader',
    before: 'if (active)',
    after: 'if (true)',
  },
];
export function requireMutationResult(report, title, status) {
  const assertions =
    report?.testResults?.flatMap((file) => file.assertionResults ?? []) ?? [];
  if (
    !assertions.some(
      (test) =>
        test.title === title &&
        test.status === status &&
        (status !== 'failed' ||
          test.failureMessages?.some((message) =>
            /AssertionError:|TestingLibraryElementError:/u.test(message),
          )),
    )
  )
    throw new Error(
      'Mutation qualification failed; missing assertions, extraction errors and surviving mutants are not proof.',
    );
}
export function applyMutation(source, before, after) {
  if (source.split(before).length !== 2)
    throw new Error('Critical mutation anchor changed; owner review required.');
  return source.replace(before, after);
}
/** Load-hook mutations execute real component assertions without ever editing application source.
 * Persistent transform caching is disabled in these synthetic subprocesses: the
 * on-disk source stays unchanged while the plugin supplies different bytes.
 */
export function qualifyMutations(root = repositoryRoot, run = spawnSync) {
  const owned = temporary('fleetiq-quality-mutants-');
  const web = path.join(root, 'apps/web');
  const require = createRequire(path.join(web, 'package.json'));
  const vitest = path.join(
    path.dirname(require.resolve('vitest/package.json')),
    'vitest.mjs',
  );
  const solid = pathToFileURL(require.resolve('vite-plugin-solid')).href;
  const outcomes = [];
  try {
    for (const item of cases) {
      const target = path.join(web, 'src', item.target).replaceAll('\\', '/');
      const original = readFileSync(target, 'utf8');
      for (const mutant of [false, true]) {
        const report = path.join(owned.root, 'result.json');
        const config = path.join(owned.root, 'vitest.config.mjs');
        const content = mutant
          ? applyMutation(original, item.before, item.after)
          : original;
        writeFileSync(
          config,
          `import solid from ${JSON.stringify(solid)};
export default {
 root:${JSON.stringify(web)},
 plugins:[{name:'owned-negative-control',enforce:'pre',load(id){if(id.split('?')[0].replaceAll('\\\\','/')===${JSON.stringify(target)})return ${JSON.stringify(content)};}},solid({hot:false})],
 resolve:{conditions:['development','browser']},
 test:{fsModuleCache:false,environment:'jsdom',maxWorkers:1,include:[${JSON.stringify(`src/${item.file}`)}],reporters:['json'],outputFile:${JSON.stringify(report)},coverage:{enabled:false}}
};`,
        );
        const execution = run(
          process.execPath,
          [
            vitest,
            'run',
            '--configLoader',
            'native',
            '--config',
            config,
            '--testNamePattern',
            item.title,
          ],
          {
            cwd: web,
            shell: false,
            encoding: 'utf8',
            timeout: 120000,
            maxBuffer: 2 * 1024 * 1024,
          },
        );
        if (
          execution.error ||
          execution.signal ||
          execution.status !== (mutant ? 1 : 0)
        )
          throw new Error('Critical mutation subprocess did not qualify.');
        const result = JSON.parse(readFileSync(report, 'utf8'));
        requireMutationResult(result, item.title, mutant ? 'failed' : 'passed');
        outcomes.push({
          id: item.id,
          kind: mutant ? 'deliberate-regression' : 'positive-control',
          assertion: mutant ? 'killed' : 'passed',
        });
      }
    }
    return outcomes;
  } finally {
    owned.dispose();
  }
}
await runEntrypoint(import.meta.url, () => {
  const source = sourceIdentity(repositoryRoot);
  const observations = qualifyMutations();
  assert.equal(
    source.digest,
    sourceIdentity(repositoryRoot).digest,
    'Mutation qualification must preserve source bytes.',
  );
  console.log(
    'Critical assertion mutation qualification passed; evidence: ' +
      writeQualityEvidence(repositoryRoot, 'mutations', source, observations),
  );
});
