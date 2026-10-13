import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-parser';
import { architectureSources } from './architecture/sources.mjs';
import { analyzeBoundarySource } from './boundaries/analyze.mjs';
import {
  assertBoundaryPolicy,
  BOUNDARY_POLICY,
  isTestSource,
} from './boundaries/policy.mjs';
import { resolveOwnedPath } from './docs/source.mjs';
import { REVIEWED } from './verification/reviewed-dependencies.mjs';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

/** Qualify source extraction and every registered production owner before scanning. */
export function checkBoundaries(
  root = repositoryRoot,
  policy = BOUNDARY_POLICY,
) {
  if (ts.version !== REVIEWED.tools.astParser)
    throw new Error(
      `Browser boundary extraction requires the reviewed typescript-parser@${REVIEWED.tools.astParser}.`,
    );
  assertBoundaryPolicy(policy);
  const sources = architectureSources(root, policy.owners).filter(
    (file) => !isTestSource(file),
  );
  if (!sources.length)
    throw new Error(
      'Browser boundary extraction returned no production sources.',
    );
  for (const adapter of policy.adapters) {
    const target = resolveOwnedPath(root, adapter.file);
    if (!target.metadata.isFile())
      throw new Error(
        'Browser adapter privileges must identify an owned source file.',
      );
  }
  const owned = new Map(
    sources.map((relative) => {
      const target = resolveOwnedPath(root, relative);
      return [
        target.absolute,
        { relative, content: readFileSync(target.absolute, 'utf8') },
      ];
    }),
  );
  const options = {
    allowJs: true,
    noResolve: true,
    noLib: true,
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.Preserve,
  };
  const host = ts.createCompilerHost(options);
  host.readFile = (file) => owned.get(path.resolve(file))?.content;
  host.fileExists = (file) => owned.has(path.resolve(file));
  const program = ts.createProgram([...owned.keys()], options, host);
  const checker = program.getTypeChecker();
  const diagnostics = [];
  for (const [absolute, entry] of owned) {
    const source = program.getSourceFile(absolute);
    if (!source)
      throw new Error('Browser boundary extraction omitted an owned source.');
    if (source.parseDiagnostics.length)
      throw new Error(
        `Browser boundary syntax extraction failed: ${entry.relative}`,
      );
    diagnostics.push(
      ...analyzeBoundarySource(source, entry.relative, checker, policy),
    );
  }
  if (diagnostics.length) {
    throw new Error(
      'Browser boundary violations:\n' +
        diagnostics
          .map(
            (entry) =>
              `${entry.rule}: ${entry.file}:${entry.line}:${entry.column}`,
          )
          .join('\n'),
    );
  }
  return { sources: sources.length, owners: policy.owners.length };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = checkBoundaries();
    console.log(
      `Browser boundaries passed (${result.sources} sources, ${result.owners} production owner).`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
