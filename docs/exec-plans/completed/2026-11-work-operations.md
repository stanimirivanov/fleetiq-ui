# Operational diagnostics and recovery

Status: completed on 4 November 2026
Milestone: M05 - Analytics and Operations
Issue: #111

## Goal

Give operators a bounded view of eligible, leased, failed, blocked and deferred
work, then let them review and submit one exact recovery action.

## Scope

The protected Operations route retains tenant and work family in the URL.
Diagnostics show sample counts, observation time, oldest sampled eligible age
and coverage. Liveness and notification seeding are unobserved. Lag and failure
have separate indicators. The tenant selector uses current discovery grants.

## Design decisions

Read access and recovery access use separate grants. Confirmation shows the
selected tenant, exact target, expected fence and the effect. Recovery reads
and commands use the app-owned managed runtime. The browser keeps the exact
request ID and body in memory after ambiguity and allows explicit retry in the
same scope. Leaving the scope discards that local retry. Conflicts and confirmed
receipts refresh the preparation and diagnostics independently. The receipt
describes the original command. Tenant, family and actor changes dispose the
relevant requests and prevent late results from crossing scope.

Deploy with platform baseline.28 after migration 0051 and explicitly delegate
the needed actions. The workspace uses the existing same-origin browser session
and mutation protection.

## Acceptance criteria

- Show sampled lag independently of failures and retain bounded coverage.
- Verify tenant navigation, independent denial, exact ambiguity retry and stale
  generation recovery in Chromium.
- Verify keyboard review and the pause/resume cycle at narrow and desktop widths.
- Run the canonical acceptance, browser and browser-quality groups.

## Acceptance evidence

The focused Chromium test reproduced the missing Operations navigation before
implementation. The connected scenarios then passed for tenant switching,
unconfirmed receipt recovery, conflict refresh and denial. The production
bundle passed the reviewed JavaScript limits after sharing generated problem
dispatch. The delivery PR records the canonical gate results and source evidence.

## Out of scope

Infrastructure administration, broad monitoring and installed qualification.
