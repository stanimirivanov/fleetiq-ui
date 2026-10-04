# Contributing

## TL;DR

Deliver one coherent capability per pull request; update its tests and documentation; run pnpm check; report any unavailable check honestly. Each implementation issue names one FleetIQ milestone and uses Goal, Scope, Design decisions, Acceptance criteria, and Out of scope.

## Workflow

1. Inspect branch, working tree, relevant guides, and active plan.
2. Define the smallest observable outcome and one milestone.
3. Add a focused behavior test when behavior changes; avoid tests that only repeat the implementation.
4. Implement through the owning app/feature and update contracts and docs.
5. Run focused checks, then pnpm check. Review the final diff.
6. Report the repository, milestone, issue title/body, checks, and limitations.

Keep broad refactors, dependency upgrades, and unrelated formatting in separate PRs. Add a dependency only for behavior delivered now, and document why the package is appropriate, maintained, compatible with Expo/web, and replaceable.

## Verification

pnpm check runs Biome CI (format, lint, and import organization), TypeScript checks for both apps and shared packages, architecture and documentation checks, a production Vite build, and Expo dependency compatibility plus Android and web exports. CI runs the same command with a frozen lockfile. When native behavior changes, additionally exercise Android and iOS on available devices or simulators; report platforms not run. Future API changes require contract fixture validation and a mocked integration run.

An unavailable check is **not run**, with the blocker and residual risk. Do not weaken checks for local convenience.

## Documentation and decisions

[docs/README.md](docs/README.md) is the progressive map. Keep one canonical owner for each rule and link to it. Long documents begin with TL;DR. Record multi-PR work in docs/exec-plans/active, move a plan to completed with its results, and maintain an explicit tech-debt tracker. GitHub issues own live delivery state; local plans explain sequence and decisions.

Use a design document for a choice that changes public contracts, security, app/package boundaries, navigation model, state ownership, or multi-PR rollout. Include context, alternatives, decision, consequences, and verification. Do not copy the platform's Rust-specific requirements into TypeScript guidance.

## Issue body

**Milestone:** MNN - Outcome

### Goal

Describe the problem and observable result.

### Scope

- Included behavior and boundaries.

### Design decisions

- Tradeoffs, assumptions, and compatibility effects.

### Acceptance criteria

- [ ] Observable behavior and verification evidence.
- [ ] Relevant error and empty states.
- [ ] Documentation and operational effects.

### Out of scope

- Deliberate exclusions.

## Completion report

Give the repository, exact milestone, proposed issue title, and copy-ready Markdown body with the sections above. List checks as passed, failed, or not run, including limitations. This does not claim an external issue or PR was created.

