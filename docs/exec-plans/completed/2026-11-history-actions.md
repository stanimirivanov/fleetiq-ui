# Property history lifecycle actions

Status: completed
Milestone: M06 - History, Archive, and Cost
Issue: #122

## Goal

Request restore and export work from the exact property history scope and
download authorized exports.

## Scope

The pinned baseline.36 covers restore request and status alongside export request,
status, cancellation and download.

## Design decisions

Keep the idempotency key with its original tenant, property version, window and
manifest selection for the lifetime of that scope. Access or scope changes
abort work and discard late results. Download validates the attachment before
saving a short-lived local Blob.

## Acceptance criteria

- Exact replay recovers uncertain export requests.
- Scope and access changes discard obsolete results.
- Bounded status, cancellation and complete attachment delivery are verified in
  the browser.
- Restore requests and their bounded status use a published platform contract.

## Acceptance evidence

The component regressions fail without the exact command and scope ownership.
Chromium exercises restore request, replay, status and ready selection as well as
export replay, complete download, cancellation and permission denial. The final
verification results are recorded on the PR. The owner approved 487,000 raw
and 139,000 gzip non-map JavaScript limits for this slice.

## Out of scope

Retention-policy administration and archive worker packaging.
