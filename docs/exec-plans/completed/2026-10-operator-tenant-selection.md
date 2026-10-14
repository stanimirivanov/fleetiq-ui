# Operator tenant selection and capability-aware navigation

## TL;DR

Deliver bounded tenant discovery and exact-grant UI hints as delivery-plan PR 3.

Status: completed
Milestone: M02 - Product Foundation

## Goal

Let signed-in operators discover and explicitly select an accessible tenant without
guessing its identifier. Treat capability discovery as current UI hints, never authorization.

## Scope

Pin backend commit 986b9fcb2862bdd4765b6d1719047a21a3a8ea47 and generate its
Effect client. Deliver bounded, URL-addressable tenant pages, exact grant badges,
manual deep-link fallback, refresh/recovery, metadata cancellation and capability-aware
navigation. Extend owned HTTP fixtures, component tests, browser POMs and executable guide.

## Design decisions

- Identity owns tenant discovery; application composition connects independent features.
- Tenant selection and discovery cursor are URL state. No default tenant is invented.
- Missing from a bounded page means unverified. Empty continuation pages do not prove
  absence of grants. Explicit manage grants never imply metadata.read.
- Discovery refresh clears superseded metadata, cancels requests and suppresses late
  completions. A protected response remains authoritative, including 401 and 403.
- Same-origin managed Effect execution remains shared. No tokens or new dependencies.

## Acceptance criteria

- Generated contract and provenance match the exact merged backend bundle.
- Discovery handles pagination/history, empty, expired, invalid and unavailable states.
- Selection resets tenant-scoped filters/cursors, preserving explicit review cutoffs.
- Account changes, refresh and revocation cannot retain another scope's evidence.
- Behavioral tests cover the adapter, reactive lifetime and complete browser journey.
- Canonical acceptance, browser and measured browser-quality groups pass unchanged gates.

## Acceptance evidence

Focused identity/metadata suite: 76 tests passed. The final lifetime and URL
regression subset passes 31 tests, including verification that unrelated URL
filters do not restart discovery or protected reads. Contract sensor: 53 fixtures passed. Production
build and its unchanged output budgets passed. New tenant browser journeys and
the extended guide journey passed; the legacy explicit-choice regression was
updated for the discovered selector and passed on rerun.

At final source freeze, require `pnpm check`, `pnpm e2e` and
`pnpm verify --group browser-quality`. Source-bound receipts in
`.verification/` and the handoff carry their final verdict; changing this document
after qualification would invalidate that evidence. No coverage floor, resource
budget, mutation obligation, security allowance or dependency pin was weakened.

Browser responses are synthetic, schema-validated contract fixtures. They qualify
UI integration and recovery, not a deployed identity provider or live fleet.
The guide source covers discovery, paging, exact grants and refresh; publication
remains the separate main-branch guide workflow.

## Out of scope

Tenant administration, role editing, platform grants, production provider qualification,
metadata writes, cross-page snapshot guarantees and mobile applications.
