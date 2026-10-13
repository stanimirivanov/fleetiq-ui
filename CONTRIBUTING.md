# Contributing

## TL;DR

Make one PR-sized change with a clear outcome. Update its docs and run
`pnpm check` and, for browser changes, `pnpm e2e`. Report checks that
could not run.

Start with [AGENTS.md](AGENTS.md), then use the [documentation map](docs/README.md).
Create a plan in `docs/exec-plans/active` for multi-step changes with Status,
Milestone, Goal, Scope, Design decisions, Acceptance criteria, Acceptance evidence
and Out of scope. Move it to
`completed` when verified. Record durable design decisions in
`docs/design-docs`.

Use strict TypeScript and explicit boundaries. Keep Solid components small
around one interaction, place pure rules in a feature model, and keep Effect
programs behind named service or adapter interfaces. Import shared UI and
features through explicit public entries across module boundaries. Use the
[frontend structure guide](docs/development/frontend-structure.md) when
reviewing component composition, reactivity, Effect lifetimes, and styling. Prefer established
libraries when a real requirement appears. Avoid global state for local UI
interactions and avoid app-wide abstractions for one feature.

The [verification guide](docs/development/verification.md) owns the canonical
catalogue, scoped routes and source-bound evidence. Harness changes need positive
and deliberately invalid fixtures, reviewed dependency decisions and owner review.
A partial group or missing tool is never acceptance.

`pnpm check` runs harness qualification, policy, formatting/lint, type checking, import architecture,
`pnpm view:check` (page/root-view size policy and its tests), documentation
and pinned-contract checks, pure and Solid component tests, and a production
build. The 150-line gate is a review prompt with a documented exception;
shorter pages still need structural review.

For browser behavior, also run `pnpm e2e` and
`pnpm verify --group browser-quality`; CI requires all three groups. Add focused
behavioral tests when implementing behavior, without repeating static markup
or configuration. Keep page-object locators/actions separate from scenario
assertions, and tag only coherent, verified journeys for guide generation.
See [testing](docs/development/testing.md) for ownership and commands.
When the backend UI contract changes, follow the
[snapshot update process](contracts/http/README.md) and verify its published
examples against the runtime boundary.

For handoff, include the repository name, milestone, GitHub issue title and
copy-ready issue body with Goal, Scope, Design decisions, Acceptance criteria,
and Out of scope. State exactly which checks passed, failed, or were not run.

Security and delivery changes follow [the trust guide](docs/development/security-delivery.md). Install the pinned scanner before full acceptance. Exceptions require explicit review; incomplete scans cannot be called clean.

Browser/harness changes also run pnpm verify --group browser-quality. Follow [measured quality](docs/development/measured-browser-quality.md) for per-file coverage ratchets, assertion qualification, accessibility/performance controls and recovery.
