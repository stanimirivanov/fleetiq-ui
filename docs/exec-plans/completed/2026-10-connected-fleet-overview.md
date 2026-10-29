# Connected fleet overview

Status: completed
Milestone: M04 - Semantic Twin and Live UI
Issue: #92

## TL;DR

Product-plan PR 30 connects server-owned inventory/coverage and bounded location
context in one complete overview slice. Heavy suites run on CI. D06 and
full-profile qualification remain deferred.

## Goal

Make the overview an authorized operational entry point without inventing
fleet-wide freshness, health, alerts or utilization.

## Scope

- Reuse the exact pinned fleet reader and shared cancellable overview/map scope.
- Complete summary, snapshot/pending status, coverage, optional geography,
  filtered discovery/paging and navigation panels in both responsive themes.
- Explicit development samples and scope-preserving connected navigation.
- Pure/Solid regressions, POM journeys, a required guide chapter and representative
  200-asset/50-row accessibility/resource workloads.

## Design decisions

Follow [0009](../../design-docs/0009-connected-fleet-overview.md). Full-tenant
aggregates remain server-owned; page evidence and browser-clock review age are
labelled independently. Geographic preview is opt-in and retains the existing
adapter boundary. M05 panels stay unavailable. The owner approved the measured
400,000 raw / 120,000 gzip non-map JavaScript budget on 2026-10-29; all other
budgets and security checks are unchanged.

## Acceptance criteria

- [x] Preserve exact totals and scope-specific coverage without N+1 or accumulation.
- [x] Handle pending/aged/empty/invalid/denied states and suppress late evidence.
- [x] Compose complete responsive panels with context/history-safe navigation.
- [x] Dispose owned preview and age clock on scope loss/unmount.
- [x] Add required connected overview guide and bounded quality scenarios.
- [x] Record approval of the measured feature byte-budget increase.
- [x] Complete CI acceptance, browser, browser-quality and image qualification (owner confirmed merged PR #93 and all checks passed).

## Acceptance evidence

Compilation, focused model/Solid tests, three connected/signed-out browser
journeys, the connected overview guide journey, formatting, architecture,
boundaries, documentation and quality/guide sensor fixtures passed locally.
The final production footprint is 391,941 raw / 112,391 gzip non-map JS bytes,
within the owner-approved 400,000 / 120,000 limits. Heavy groups and complete
guide generation remain CI work, not claimed local passes. Contract mocks do not qualify real providers, trackers,
production fleet capacity or a persistent installation.

## Out of scope

M05 health/alerts/energy analytics, new APIs, history/archive, new map providers,
mobile, automatic polling, D06 and full-profile qualification.

Closure: the owner confirmed PR #93 merged with all checks passing on 2026-10-29.
