# Read-only asset registry and mapping review

## TL;DR

Build the approved registry layout as a labelled development-only sample. Review asset structure, source-to-target signal mappings, provenance, and unresolved sources at explicit effective and known times. Production stays unconfigured until the backend publishes browser-safe access and a pinned UI contract for these reads.

Status: completed

Milestone: M04 - Semantic Twin and Live UI

## Goal

Let a configurator trace a registered asset through physical relationships, device endpoints, and exact signal bindings without mistaking a missing observation for an absent mapping or a sample for production truth.

## Scope

- Add a stable read-only registry review route under Assets, with development-only sample activation and an honest production state.
- Build a responsive three-zone workspace: searchable asset catalogue, directed structure, and asset identity with mapping table, unresolved source review, and provenance.
- Keep asset, node, source, and two cutoff times in shareable URL state; preserve browser history. Apply the effective and known time pair atomically with explicit UTC labels and validation.
- Derive sample metadata from the existing inspector identities and facts. Keep observed-source inventory separate from relationship and binding records; include rail, trailer, and no-sample-detail cases.
- Resolve stable relationship and binding IDs by latest revision known at the cutoff, then test effective half-open intervals. Preserve directed edges and competing binding candidates; do not choose an arbitrary first candidate.
- Show mapped, observed-unassigned, ambiguous, and not-assessed states with their evidence basis. A configured binding without an observation remains configured, not healthy or live.
- Add pure model tests and browser journeys for temporal corrections, URL history, responsive interaction, and production sample isolation.

## Design decisions

The platform has protected, bounded bitemporal relationship and binding snapshot routes, but the pinned UI OpenAPI contains only the asset catalogue. Protected routes use a workload bearer and are not safe for direct browser use. The registry scene is therefore a development fixture, not a live adapter or a claim that every source has been inventoried.

A relationship is a directed edge, not necessarily a tree. A binding joins an exact device/endpoint/signal source to an asset property and version. Recorded/known time is inclusive; effective intervals are half-open. The latest known revision for each stable ID must be selected before filtering by endpoints or effective time, so a correction cannot resurrect a previous target. All displayed revisions remain decimal text.

The concept image includes Add asset, Map signal, and approval controls. This slice is review only. Mutations need administration contracts, permissions, audit, and conflict handling.

## Acceptance criteria

- Development opens a clearly labelled sample registry; direct production access, including ?preview=sample, exposes no fixture metadata.
- Search and selection keep the catalogue, structure, mapping rows, and provenance synchronized. Unknown and no-detail assets receive explicit states.
- Effective and known cutoffs are separate, validated, shareable, and restored by Back. A correction changes the projected relationship or binding as expected.
- Every mapping row shows exact source identity, target property/version, binding ID/revision, effective interval, and recorded time. Observed-unassigned and ambiguous sources are not silently assigned.
- The directed relationship view preserves edge identity, type, revision, and endpoint direction; missing evidence is not treated as zero or healthy.
- Desktop, laptop, and narrow layouts remain usable in light and dark themes with keyboard controls and no document-level horizontal overflow.
- pnpm check and both production and development Playwright suites pass; limitations and verification evidence are recorded before completion.

## Out of scope

Asset or binding edits, approval, work orders, live source inventory, complete graph enumeration, real telemetry values, browser workload bearer use, and production metadata integration.

## Acceptance evidence

- `pnpm check` passed: style, TypeScript, dependency boundaries, view size, documentation, design tokens, pinned contract, 3 Node unit tests, 64 Vitest tests, and production build.
- `pnpm e2e` passed: 11 production and 14 development Chromium journeys. Registry scenarios cover bitemporal corrections, half-open binding intervals, directed relationships, source ambiguity and unassignment, URL history, narrow/dark layout, and production sample isolation.
- Desktop light/dark and 390px dark renders were inspected. The narrow mapping uses complete source cards without document-level horizontal overflow.
- Production metadata integration remains pending a browser-safe identity flow and published relationship/binding UI contract; the route shows an explicit unconfigured state.
