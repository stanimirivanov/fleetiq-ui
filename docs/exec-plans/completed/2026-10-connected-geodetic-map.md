# Connected geodetic map workbench

Status: completed
Milestone: M04 - Semantic Twin and Live UI
Issue: #90

## TL;DR

Product-plan PR 29 connects the complete geographic map/list/selection slice to
platform baseline.20. Heavy acceptance, resource and image checks run on CI;
D06 and full-profile infrastructure qualification stay deferred.

## Goal

Show coherent observed asset positions, unlocated identities and immutable source
evidence without guessing coordinate roles or inventing operational health.

## Scope

- Pin platform `896c239958f11e90220d79cb3507cf494d84c100`, generate the fleet
  operation and strictly validate the consumed page/provenance model.
- Complete explicit mapping, loaded-page filters, pagination, selection, exact
  coordinate/evidence panels, inspector navigation and narrow layout.
- Lifecycle-owned lazy MapLibre renderer/local worker and deployment-owned
  static styles/resources, plus explicit unconfigured/WebGL/error/access states.
- Model, API, Solid, POM browser and byte/boundary regression tests, with a
  separate worker-aware resource lane under unchanged recovery limits.

## Design decisions

Follow [0008](../../design-docs/0008-connected-geodetic-map.md). URL scope and
API runtime ownership remain separate from imperative renderer state. Existing
non-map byte, coverage, architecture and security policies stay enforced. The owner
approved only the separately counted lazy-map byte budgets documented there.

## Acceptance criteria

- [x] Keep exact mapping/tenant/page/filter/selection coherent across map/list.
- [x] Validate exact coordinates, coherent provenance, freshness and page scope.
- [x] Keep unlocated assets selectable and suppress denied/late scoped evidence.
- [x] Own/cancel requests, renderer, local worker, listeners and observers.
- [x] Reject external map resources and alternate style transports.
- [x] Account for module-worker bytes and preserve non-map budget limits.
- [x] Full CI acceptance, browser, worker-aware quality and image qualification.

## Acceptance evidence

The owner confirmed PR #91 merged with all checks passing before PR 30 began.
The following local records describe implementation-time evidence.

Local TypeScript, focused model/Solid tests, dependency audit, contract regeneration, architecture/boundary/style/docs/image-policy checks and targeted harness fixtures pass; exact commands are recorded in the PR.
The focused five-case production browser suite passed (connected selection/filter/narrow/access loss, lazy SDK exclusion, external-style rejection, unsupported WebGL and signed-out sample exclusion). A production-renderer smoke scenario caught and corrected a stale Solid
selection accessor when filters hide the selection; its corrected run passed.
The full resource/browser/image suites remain CI work, not claimed local passes.
Synthetic map/HTTP fixtures do not qualify a live provider or deployment. The
known inherited go-jose v3 image-scan blocker remains without an exception.

### Resource gate correction

The initial CI geographic resource failure was reproduced locally. The workload
mixed an after-baseline accessibility scan with incomplete full-document warmups.
It now uses equivalent complete SPA cycles, separate fresh-context accessibility
and a contamination guard, with unchanged budgets. The corrupt synthetic PNG and
premature renderer-ready signal were corrected. A failing cancellation regression
also exposed a shadowed style controller, which is now fixed.

The corrected local resource run passed: 1,383 nodes before/after (zero growth),
877,760 heap-byte growth, maximum navigation 1,448 ms and filter 496 ms. Adapter
cancellation/readiness unit tests pass. Full acceptance/image suites remain on CI.

## Out of scope

Overview connection (PR 30), geofences/routes/commands, direct PMTiles protocol,
external tile services, terrain, new backend APIs, D06 and full-profile capacity.
