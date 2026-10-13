# Make dependency upgrades explicit and mechanically qualified

## TL;DR

Replace duplicated executable approval pins with one registry and qualify
Dependabot proposals through read-only diagnostics, early group guards and exact
installed-tool checks. Preserve all current versions and acceptance gates.

Status: completed (implementation and focused qualification; canonical receipts reported at handoff)
Milestone: M02 - Product Foundation

## Goal

Avoid repeated cryptic pin-drift failures while continuing to reject unreviewed
executables and genuine behavior, security or measurement regressions.

## Scope

- One strict, immutable reviewed registry for existing critical tool/action pins.
- Registry-derived workflow, compiler/parser and coverage expectations.
- Read-only diagnostics for coordinated proposals and broken inventories.
- Preflight and installed-tool checks in every canonical verification group.
- Publication refusal for missing review/install evidence.
- Related maintenance proposal groups, recovery guidance and negative controls.

## Design decisions

A candidate manifest or workflow is never approval. Dependabot can propose exact
changes; maintainers review the upstream release and propose the registry change.
No automation writes approval state, uses privileged PR triggers or relaxes
immutable action, source, secret, advisory or artifact checks.

Retain separate compiler and parser decisions. Resolve installed package metadata
without importing executable package code, including the TypeScript compiler API
dependency-cruiser actually consumes. Reject stale nearer installations and ambient
packages. Sample installed qualification at the beginning and end of execution.

Critical tools and actions have one approval inventory. Product dependencies remain
manifest-owned and scanners retain their separate version/checksum review. Proposal
tests derive distinct candidate versions so subsequent real upgrades do not make
positive fixtures stale.

## Acceptance criteria

- Current declarations and installed tools qualify without changing any version.
- Coordinated exact proposals produce actionable review-required diagnostics.
- Mutable, unknown, missing, inconsistent and malformed inputs are rejected.
- Every canonical group refuses pending review before launching tools/tests.
- Stale installs, private parser drift and end-of-run installation drift block acceptance.
- Missing or contradictory receipt review/install evidence cannot publish a guide.
- Actual CLI fixtures prove read-only behavior, redaction and unchanged negative controls.
- Full acceptance, functional browser and measured browser groups qualify final sources.

## Acceptance evidence

Focused registry, actual graph/lint, preflight CLI and installed-tool fixtures passed.
Independent integration review identified and repaired stale proposal fixtures,
actual dependency-cruiser parser scope, malformed registry CLI recovery and final
installed-tool resampling. Final canonical receipts, artifact inspection and exact
pass/fail/not-run status are reported at handoff. The initial full run correctly
stopped when copied boundary CLI fixtures lacked the new registry dependency
closure; repair preserves the actual positive and invalid CLI cases. Its incomplete
receipt remains separate from final acceptance.

## Out of scope

Dependency upgrades themselves, auto-approval/merge, remote ruleset changes,
scanner checksum or advisory exceptions, raised browser limits and user-guide
regeneration.
