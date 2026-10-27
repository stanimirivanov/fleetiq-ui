# Connect inspector readings, provenance and hot history

Status: active
Milestone: M04 - Semantic Twin and Live UI

## TL;DR

Deliver product-plan PR 25 as one complete inspector slice. Current values,
history and provenance use the merged backend contract; health/liveness and
live streaming remain unavailable. Heavy checks run on CI.

## Status

Implemented for review under issue #84; full CI acceptance remains pending.

## Milestone

**M04 - Semantic Twin and Live UI**.

## Goal

Let operators choose a declared property, inspect committed exact readings and
original interpretation provenance, and explore bounded hot history without
inventing connectivity, condition or complete upstream coverage.

## Scope

- Exact merged baseline.18, generated current/history/interpretation operations.
- Dedicated managed telemetry port, pure scope/precision/ordering rules.
- Complete responsive centre-pane reading, history window/chart/table/pagination
  and original provenance panels within the established inspector shell.
- Typed missing/denied/error/pending/age states and cancellable ownership.
- Focused model/adapter/Solid tests, POM browser/guide scenarios and documentation.

## Design decisions

Follow [ADR 0006](../../design-docs/0006-connected-property-evidence.md).
Current state is not time-travel metadata. Preserve exact strings and original
attribution; normalized chart coordinates never replace table values. Query
only the selected exact declared property; no per-property eager read fan-out.

## Acceptance criteria

- [x] Select a pinned property and inspect current values and original provenance.
- [x] Bound history windows/pages and preserve URL navigation context.
- [x] Keep quality, age and pending work separate from asset health/liveness.
- [x] Reject malformed/cross-scope/contradictory responses and suppress late reads.
- [x] Add coherent POM and narrated guide procedures with synthetic-data labels.
- [ ] Full CI acceptance, coverage/build, browser quality and image checks pass.
- [ ] Execute the complete user guide after all acceptance groups qualify.

## Acceptance evidence

Focused checks are recorded in the PR. Full browser, measured quality, coverage,
production build/image and guide execution are intentionally delegated to CI
because the development host is busy. An implemented scenario is not an executed
browser pass. No D06 or infrastructure resources are changed.

## Out of scope

Live transport and reconnect, commissioning, geodetic positions, health/alerts,
analytics, archival queries, mobile, D06 and full-profile installation qualification.
