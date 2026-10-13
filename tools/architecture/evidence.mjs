import { REVIEWED } from '../verification/reviewed-dependencies.mjs';

/**
 * dependency-cruiser uses its own supported JavaScript compiler API. The app's
 * native TypeScript 7 compiler remains separate from this exact parser pin.
 */
export const ARCHITECTURE_TYPESCRIPT = `typescript@${REVIEWED.tools.astParser}`;

/** Refuse an unavailable or ambient parser rather than accepting an empty scan. */
export function assertExtractionEnvironment(environment) {
  const parser = environment?.transpilersFound?.find(
    (entry) => entry.name === 'typescript',
  );
  if (!parser?.available || parser.currentVersion !== ARCHITECTURE_TYPESCRIPT) {
    throw new Error(
      `Architecture extraction requires ${ARCHITECTURE_TYPESCRIPT}; install the frozen lockfile with the dependency-cruiser package extension.`,
    );
  }
  for (const extension of ['.ts', '.tsx']) {
    if (
      !environment.extensionsFound?.some(
        (entry) => entry.extension === extension && entry.available,
      )
    ) {
      throw new Error(`Architecture extraction does not support ${extension}.`);
    }
  }
}

/** Validate the tool's graph against independently discovered source files. */
export function assertGraphEvidence(graph, sources) {
  if (
    !Array.isArray(graph?.modules) ||
    !Array.isArray(graph?.summary?.violations)
  ) {
    throw new Error('Architecture extraction returned an invalid graph.');
  }
  assertExtractionEnvironment(graph.summary.environment);
  if (graph.summary.optionsUsed?.tsPreCompilationDeps !== true) {
    throw new Error(
      'Architecture extraction must include type-only dependencies.',
    );
  }
  if (!sources.length || !graph.modules.length) {
    throw new Error('Architecture extraction returned an empty source graph.');
  }
  const scanned = new Set(graph.modules.map((module) => module.source));
  const missing = sources.filter((source) => !scanned.has(source));
  if (missing.length) {
    throw new Error(
      `Architecture extraction omitted sources: ${missing.join(', ')}`,
    );
  }
  if (!graph.modules.some((module) => module.dependencies?.length > 0)) {
    throw new Error('Architecture extraction returned no dependency edges.');
  }
}
