# Connected operator user guide

## TL;DR

Deliver four executable connected-metadata chapters alongside the existing console
orientation and five development previews. Record the production UI with synthetic,
contract-validated HTTP responses; never record a real provider or customer session.

Status: completed
Milestone: M04 - Semantic Twin and Live UI

## Goal

Teach the complete currently connected operator workflow with the same page objects
and assertions used by ordinary browser tests. Keep operational previews separate
from metadata procedures and installation qualification.

## Scope

- Operator session: native sign-in entry and simulated fixed return, account,
  expiry, evidence clearing, failed sign-out and confirmed retry.
- Asset discovery: explicit tenant, loaded-page filters, cursor navigation,
  Back/reload, identities, external identifiers and pinned definitions.
- Registry: directed relationships, exact target/source candidates, pinned
  properties, independent cursors, effective/known cutoffs and half-open intervals.
- Recovery and accessibility: denial, unavailable/empty/missing reads, retry,
  invalid context, empty exact-source results, keyboard, narrow layout and themes.
- Ten required chapters grouped as shell, connected-contract demonstrations and
  development samples; Markdown, HTML, screenshots and video.
- Mandatory unexpected-page-error rejection for guide-owned browser contexts.

## Design decisions

Connected-contract is an evidence label, not permission to capture live endpoints.
The existing loopback, fresh-profile, blocked-provider/API/socket, owned-output,
secret-scanning and exact-source publication restrictions remain unchanged.
The sign-in fixture models only the fixed server return to FleetIQ; it does not
pretend to verify an OIDC exchange.

Page objects own reusable actions and optional narration. Scenarios own assertions
and result prose; ordinary test mode adds no recording delays. Guide setup, execution,
finalization and failures share one cleanup owner.

Metadata fixtures preserve exact source tuple and temporal scope. Empty candidates
cannot establish an unregistered device or unassigned sensor. Missing observations
remain unavailable rather than zero or healthy.

## Acceptance criteria

- All four connected journeys pass as ordinary production-preview E2E scenarios.
- The complete book requires all ten correctly classified chapters and valid media.
- A real exception on a guide-owned page prevents successful finalization.
- Existing production/sample, capture, cleanup and publication controls remain enforced.
- Full acceptance, production/development browser and measured-quality gates pass
  against the final source.
- Guide generation, local release qualification and artifact inspection pass.
- Generated media remain ignored; no live provider credentials or customer data appear.

## Acceptance evidence

Passed initial qualification: pnpm check (735 harness tests, 175 Solid tests,
3 pure tests, 77 guide controls, critical mutation qualification and production
budgets); pnpm e2e (40 production and 24 development scenarios); and
pnpm verify --group browser-quality (8 measured scenarios and the actual
page-error qualifier). No skips or quality-limit changes qualified these results.

Passed: complete generation, exact-source local release and four-root artifact
inspection. The book contained 10 chapters, 168 annotated screenshots and 10 videos.
Chromium rendered its ten chapter links and provenance notices and played recorded
UI frames without page errors. The final caption refinement also passed a focused
registry recording and visual inspection: wrapped notes stay inside the viewport,
prefer space above large targets, and reserve room for native playback controls.

Pending at the final source freeze: fresh canonical gate and generation/release
receipts after archiving this plan and refining caption placement. The task handoff
must report their actual final status; the initial receipts cannot qualify changed
source bytes. Final verdicts belong to the ignored source-bound verification and
guide readiness receipts.

Recording proves the fixture-backed UI workflow, not an installed provider/backend.

## Out of scope

Backend APIs, tenant discovery, metadata mutation, live signals, geodetic maps,
real alert operations, deployment/provider qualification and native mobile.
