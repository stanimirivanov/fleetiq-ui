# Connected alert queue and evidence

Status: completed (local implementation and required verification)
Milestone: M05 - Analytics and Operations
Issue: #104

## Goal

Implement M05-PR13: connected bounded read-only alert triage with exact calculator
evidence, preserving scope, authorization and production/sample isolation.

## Scope

Merged backend snapshot, selected read client, independent alert/evidence models
and adapters, session/tenant composition, URL-owned queue/detail/history/evidence,
owned cancellation, responsive presentation and same-PR regression tests.

## Design decisions

Use existing managed Effect v4 transport and Solid controller patterns. Alerts
require alerts.read; calculator evidence separately requires telemetry.read.
Identifiers, phases and exact text versions/times/decimals remain backend-owned.
No inferred severity/totals, telemetry authority or sample fallback. Keep the
explicit Vite development preview separate. No new dependency or general framework.

## Acceptance criteria

- [x] Validated queue, exact detail, transition history and calculator evidence.
- [x] URL scopes/cursors, immediate clearing, cancellation and late-result safety.
- [x] Explicit empty/loading/denied/missing/invalid/retry states with keyboard/narrow use.
- [x] Exact pinned snapshot, focused tests and required quality groups reported.

## Acceptance evidence

- `pnpm check`: passed, including 880 harness tests, 341 component tests,
  critical coverage/obligations/mutations, architecture/boundaries, contracts,
  security, documentation, type checks and production budget.
- `pnpm e2e`: passed, 75 production and 24 development scenarios.
- `pnpm verify --group browser-quality`: passed, 42 scenarios including four
  new alert desktop/narrow light/dark accessibility/keyboard cases.
- All three groups verified unchanged implementation source based on
  `354e3ad813cc6856bd42f104b67e8446442a4a61`, dirty-source digest
  `55dbed69927ba05a138c2e7ef87757a5d2c0466c84a58cba20c98173d9841b9e`.
  This completion/evidence documentation is recorded after those runs.
- Frozen dependency install passed; no dependency/lockfile changes.
- Final production non-map JS: 433,783 raw / 123,920 gzip bytes; CSS:
  39,714 / 8,198. All existing budgets, coverage and security policies unchanged.

## Supporting generation decisions and limitations

Pin baseline.26 at platform c74e65d63f67b01968f7822ab3a6dd269d622b57.
Five new consumed reads bring the client to 36 operations; discovery retains all
nine explicit grants. Exact-shape identifier regex adaptation fixes an upstream
specification defect only in private generator input. Primitive sharing and omission
of runtime documentation descriptions avoid a byte-budget increase while retaining
all constraints, verified by expanded-graph equivalence and generated boundary tests.
The published snapshot remains byte-identical; upstream regex correction is still
desirable. See [decision 0013](../../design-docs/0013-connected-alerts.md).

This delivers bounded read-only observations, not complete history, aggregate
health or real installation qualification. At most 20 retained input references
are rendered with explicit truncation disclosure; output paging is explicit.

## Out of scope

Rule editing, acknowledgement commands/UI, SSE, delivery, aggregates, dependency
upgrades and real installation/provider qualification.
