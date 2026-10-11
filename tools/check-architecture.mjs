import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGraphEvidence } from './architecture/evidence.mjs';
import { runDependencyCruiser } from './architecture/runner.mjs';
import { architectureSources } from './architecture/sources.mjs';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

/** The existing source scan, qualified for parser capability and full coverage. */
export function checkArchitecture(root = repositoryRoot) {
  const sources = architectureSources(root);
  const result = runDependencyCruiser(root);
  assertGraphEvidence(result.graph, sources);
  const violations = result.graph.summary.violations;
  if (result.status !== 0 || result.graph.summary.error > 0) {
    const diagnostics = violations.map(
      (entry) => `${entry.rule.name}: ${entry.from} -> ${entry.to}`,
    );
    throw new Error(`Architecture violations:\n${diagnostics.join('\n')}`);
  }
  return {
    sources: sources.length,
    dependencies: result.graph.summary.totalDependenciesCruised,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = checkArchitecture();
    console.log(
      `Architecture extraction and boundaries passed (${result.sources} sources, ${result.dependencies} dependencies).`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
