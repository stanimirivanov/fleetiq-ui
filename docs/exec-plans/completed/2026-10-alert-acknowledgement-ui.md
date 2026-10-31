# Exact-version alert acknowledgement UI

Status: completed (local implementation and required verification)
Milestone: M05 - Analytics and Operations
Issue: #107

## Goal

Deliver M05-PR14b, stacked on rule authoring (#106), with independently authorized
acknowledgement and exact immutable operator attribution.

## Scope

Published acknowledgeAlert, optional transition annotations, a protected exact
version form, actor expectation validation and existing exact-command recovery.

## Design decisions

Acknowledgement does not change phase, timers, selection, evidence or delivery.
The command captures tenant/rule/revision/observed lifecycle version and current
operator expectation, sending only expected_version in its closed JSON body.
Validate receipt version, actor and canonical signed-i64 time text. Read annotations
must match their own transition version, including historical receipts.

Use independent alerts.acknowledge hints, with authoritative backend rechecks.
The current actor comes from app composition and is never supplied in JSON.
Unknown outcomes preserve exact replay even after denial. Conflicts offer current
alert refresh; confirmed commands refresh detail/history while retaining the exact
receipt scoped to the selected rule. Protected actor changes and scope disposal
abort/suppress late completion through the existing owner boundary.

## Acceptance criteria

- [x] Exact captured acknowledgement and validated annotation display.
- [x] Lost response, denied replay and resolve/acknowledge race regressions.
- [x] No implication of resolution, silence, assignment or delivery suppression.
- [x] Canonical acceptance, browser and measured quality groups reported.

## Acceptance evidence

- `pnpm check`: passed, including 893 harness tests, 350 component tests,
  scoped coverage/obligations/mutations, contract, security and build checks.
- `pnpm e2e`: passed, 81 production and 24 development scenarios.
- `pnpm verify --group browser-quality`: passed, 50 scenarios and actual
  page-error qualification, including independent acknowledgement keyboard use
  at desktop/narrow widths and light/dark themes.
- All three full groups verified stacked source based on authoring commit
  `4b2762051eb013412558b2def19998c25b8a87ed`, dirty-source digest
  `3414bb6ffccfa18c69c46b42574c943708cc5c2027c8047cef75b8a918948854`.
  Completion/evidence documentation is recorded after those runs.
- Final combined non-map JS: 448,822 raw / 129,023 gzip bytes, within the
  owner's approved 460,000 / 132,000 limits. No additional policy, dependency
  or lockfile change is introduced by the acknowledgement slice.

## Out of scope

Rule authoring changes beyond the stacked dependency, silencing, assignment,
bulk commands, notification suppression and installed identity/deployment qualification.
