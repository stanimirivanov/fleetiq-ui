# Archive-aware history review

Status: completed
Milestone: M06 - History, Archive, and Cost
Issue: #120

## Goal

Display explicit history coverage and selectable exact numeric summaries in the connected inspector.

## Scope

Pin merged backend baseline.34, validate scoped raw/restored/summary reads, keep selection in the URL and preserve legacy hot history navigation. No restore or export commands.

## Design decisions

Reuse managed same-origin transport and cancellable ownership. Show selected-manifest coverage without interval completeness claims. Keep exact values and arithmetic mean sum/count as strings. Reject malformed selection and resolution, rather than falling back to hot/raw data.

## Acceptance criteria

- Archive/unavailable coverage cannot appear as complete empty history.
- Numeric summaries are labelled and precise, with bounded aligned buckets.
- Scope changes cancel work and suppress late results.
- Canonical acceptance, both browser suites and measured browser-quality gates pass.

## Acceptance evidence

Focused parser/component/transport tests pass, including malformed arithmetic,
missing or mismatched archive coverage, late-result suppression and refreshing a
pinned summary continuation. Inverting the summary unit guard fails three parser
tests; the source was restored. Architecture, presentation-size, documentation and
type checks pass.

All 87 production-browser, 24 development-browser and 52 measured accessibility/
performance scenarios pass. Source/history secrets and dependency advisories pass.
The owner approved 480,000 raw / 137,000 gzip non-map JavaScript limits on
2026-11-07 for this slice, measured at 473,920 / 134,722 bytes. All other quality
and security limits remain unchanged.

Final handoff requires `pnpm check`, `pnpm e2e`,
`pnpm verify --group browser-quality` and `pnpm security:preflight`; their measured
results are recorded in the associated PR. Browser fixtures are synthetic and do
not establish deployed archive availability or production capacity.

## Out of scope

Restore/export commands, lifecycle policy editing, deployment and installed capacity qualification.
