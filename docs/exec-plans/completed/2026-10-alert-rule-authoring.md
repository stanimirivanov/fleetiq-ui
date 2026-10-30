# Alert rule authoring

Status: completed (local implementation and required verification)
Milestone: M05 - Analytics and Operations
Issue: #106

## Goal

Deliver M05-PR14a: revision-aware numeric alert-rule configuration, split from
acknowledgement under the approved PR14 size condition. PR14b follows separately.

## Scope

Four already-published operations; exact rule/head/revision review, append forms,
optimistic activation/deactivation, managed execution and exact ambiguous replay.

## Design decisions

No new dependency or contract snapshot revision. Select baseline.26 operations;
share existing primitive definition contracts. Backend authority stays independent:
configuration review needs alerts.read and writes need alerts.manage. UI grant
hints are advisory. Legacy numeric rule-attribution clocks must be safe integers;
reject unsafe values rather than silently round them. Calculator output slot is 0.

Current-head reads follow every confirmed write; historical activation retries do
not restore state. Commands capture their original payload, block concurrent edits
and permit only explicit exact replay after uncertainty, including a denied replay.
Tenant/rule/actor scope disposal aborts and suppresses late completion. Head refresh
is disabled during pending/uncertain commands. No automatic retry is introduced.

## Acceptance criteria

- [x] Exact bounded grammar, typed boundary and protected revision-aware forms.
- [x] Lost-response locking, explicit replay and conflict/current-head recovery.
- [x] API/controller and production tests land with behavior.
- [x] Canonical acceptance, browser and measured quality groups reported.

## Acceptance evidence

- `pnpm check`: passed, including 890 harness tests, 347 component tests,
  scoped coverage/obligations/mutations, contracts, security and build.
- `pnpm e2e`: passed, 78 production and 24 development scenarios.
- `pnpm verify --group browser-quality`: passed, 46 scenarios and real browser
  page-error qualification, including new rule forms in desktop/narrow light/dark.
- All three full groups verified the isolated authoring source based on
  `5d92ce347d42f9141a0c22fee95a2da209cb1308`, dirty-source digest
  `2c03bf8b4b2be2e0cae257e05239013a8c24dd9dea245f2a89dd8518e345961e`.
  Completion/evidence documentation is recorded after those runs.
- Final non-map JS: 444,820 raw / 128,043 gzip bytes. The owner explicitly
  approved 460,000 / 132,000 on 2026-10-30 for both PR14 slices. All other
  thresholds and dependency/lockfile pins remain unchanged.
- Parameter validator compaction preserves the complete constraints and defaults;
  its negative/equivalence fixtures pass. Internal decoder diagnostics are retained.

## Out of scope

Acknowledgement (PR14b), calculator authoring, arbitrary expressions, bulk work,
notification delivery and installed identity/deployment qualification.
