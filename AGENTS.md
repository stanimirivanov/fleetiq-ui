# Repository working agreement

## TL;DR

Build one reviewable web/mobile slice at a time. Keep feature boundaries explicit, share only platform-neutral code, validate external data, and run the workspace gate before handoff.

[CONTRIBUTING.md](CONTRIBUTING.md) owns workflow and completion policy. The [documentation map](docs/README.md) routes each task to its canonical guide.

## Before changing code

1. Inspect the branch and working tree; preserve unrelated changes.
2. Read the [documentation map](docs/README.md) and only the guides relevant to the task.
3. Check [the architecture](ARCHITECTURE.md) and [current implementation](docs/FRONTEND.md) before assuming a planned capability exists.
4. Choose one independently reviewable outcome and its milestone in [the execution plan](docs/PLANS.md).

## Architecture rules

- Web and mobile are separate presentation applications. Shared packages must be independent of DOM, React Native, navigation, and app-specific infrastructure.
- Compose features in each app's app layer. A feature must not reach into the other app or another feature's private files.
- Keep API DTOs, validated client models, and view state distinct when their invariants differ. Parse untrusted HTTP and stream payloads at the boundary.
- Put server-owned data behind explicit API adapters. Keep URL navigation/filter state in the web router; keep local interaction state local.
- Introduce Effect and Atom only with a real async or granular-state use case. Do not add Redux, a new package, or an abstraction for hypothetical reuse.
- Make loading, empty, stale, offline, unauthorized, and error states visible in relevant features. Preserve tenant isolation and permission boundaries.

## Evidence

Run the relevant focused checks during work and pnpm check before handoff. A skipped check is not a pass. Update contracts, tests, docs, and the active execution plan alongside behavior. Report the repository, milestone, copy-ready issue, and exact pass/fail/not-run status per [CONTRIBUTING.md](CONTRIBUTING.md).
