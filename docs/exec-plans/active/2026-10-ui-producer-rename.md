# Canonical UI producer rename integration

Status: active (implementation complete; qualification and review pending).
Milestone: M02 - Product Foundation.

[Issue 76](https://github.com/stanimirivanov/fleetiq-ui/issues/76) owns this slice.

## Goal

Complete the repository rename for current immutable UI production and coordinate
the consumer update without rewriting historical publication evidence.

## Scope

Canonical repository, GHCR endpoints, source labels/provenance, local artifact and
module identity, publication concurrency, contributor guidance and negative tests.

## Design decisions

Keep the existing qualification format and `ux` release role. Reject historical
producer identities for new artifacts. Preserve old receipts and digests as
historical evidence. Link the coordinated deployment issue; publication follows
merge and passing exact-source CI, not this implementation step.

## Acceptance criteria

Canonical manual-main authorization, source labels, provenance and registry reads
agree on `fleetiq-ui`. Historical/mixed identities fail regression tests. Required
acceptance, browser-quality and real image checks pass with stable source.

## Acceptance evidence

Focused image regressions passed. Full acceptance, browser-quality and image
qualification are pending; their final outcomes are recorded in the PR. No publication, promotion, Auth0 setup or live installation is
performed in this slice.

## Out of scope

Dependency/tool changes, wire-format migrations, historical receipt rewrites,
post-merge publication and Kubernetes or identity configuration.
