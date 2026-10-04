# 0001 - Keep pnpm and targeted architecture checks until the workspace needs Nx

Status: accepted

## Context

FleetIQ UI currently has two applications and no shared code package. It already runs Biome for source formatting and general linting, TypeScript for types, and dependency-cruiser for direct import boundaries. The package manager is pnpm. The question is whether Nx should own the workspace now to improve architectural enforcement.

## Options

- Keep pnpm scripts, Biome, and dependency-cruiser. This is small and gives fast file-level feedback, but does not provide affected task runs, project tags, package-manifest boundary checks, or task caching.
- Add Nx incrementally. Nx can discover the existing pnpm workspace, schedule and cache current scripts, and provide a project graph without restructuring apps. Its JavaScript module-boundary rule requires an ESLint gate alongside Biome. Nx's graph-wide Conformance rule is a Powerpack/Enterprise capability. Nx does not automatically enforce our domain rules merely by being installed.
- Replace the current stack with Nx generators and ESLint. This would add significant configuration and migration work before any product feature needs it.

## Decision

Keep the current pnpm workspace and checks for this two-app stage. Preserve Biome as the sole general formatter/linter and dependency-cruiser as the import-graph checker. Scan both apps and packages, and enforce cross-app, package-to-app, composition, model, and cycle rules. Use packages as the shared-code directory because pnpm treats each shared unit as a workspace package; Nx can discover the same layout later. The name libs is equally valid, but changing names provides no architectural guarantee.

Add Nx when task scheduling/caching or a larger project graph has measurable value, or when several shared packages need tag-based public API and manifest enforcement. Adopt it incrementally without renaming directories. If project-level boundaries move to the Nx ESLint rule, keep dependency-cruiser only for distinct file-level rules and avoid duplicate policies. Keep Biome for formatting and general linting.

## Consequences and review trigger

The current checks cannot enforce package.json dependency constraints or a public API for every future package. Review this decision when the first shared package is added, when CI time becomes material, or when cross-package boundary violations recur. A future Nx addition should demonstrate an affected run, a cache hit, and a deliberate boundary rule in CI before replacing any existing gate.

Sources: https://nx.dev/docs/kb/adding-to-monorepo and https://nx.dev/features/enforce-module-boundaries/.
