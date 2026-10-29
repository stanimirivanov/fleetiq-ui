# Linux development tooling

Status: active
Milestone: M02 - Product Foundation

## TL;DR

Issue #102, M02 - Product Foundation, removes Windows host support while
retaining Linux verification, security boundaries and historical evidence.

## Goal

Support ongoing development and verification on Linux after retiring Windows tooling.

## Scope

Remove Windows CI jobs, installer targets, process and filesystem compatibility
branches and Windows-only fixtures. Update active developer and operator commands
for Linux. Upstream lock entries, historical evidence and path-rejection fixtures
remain because they are not supported-host tooling.

## Decisions

CI policy and negative fixtures change together. Linux checks remain mandatory.
External required-status configuration must retire the removed Windows status.
No live installation or trust-store change is authorized by this cleanup.

## Acceptance evidence

- Windows host paths and CI lanes removed from active tooling.
- Passed: 863 harness fixtures. Full acceptance and browser checks are pending;
  final verification results are recorded in the linked PR.
- Missing service-backed prerequisites remain explicit limitations.
