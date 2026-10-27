# Device onboarding and ingestion diagnostics

Status: active (issue #81; implementation under review).
Milestone: M03 - Extensible Device Ingestion.

## TL;DR

Product-plan PR 20.
Repository: fleetiq-ui. D06 and full-profile qualification remain deferred.

## Goal

Commission a generic communication asset and review safe ingestion evidence through
one consistent production device console, preserving independent permissions and
clear distinctions between registration, routing, observations and liveness.

## Scope

- Device navigation and tenant/device/channel URL context within the persistent shell.
- Asset/type/identifier registration, ordered endpoint declarations and bounded discovery.
- Exact stored package lookup, revision-checked assignment and explicit retirement.
- Processing evidence, observed sources, sample coverage and unknown liveness.
- Pinned merged baseline.15, generated client, typed failures and lifecycle tests.
- Stateful contract fixtures, page objects and a complete onboarding guide chapter.

## Design decisions

Devices is independent of assets and identity. Pure ports and rules point inward;
the app injects grants and its shared managed HTTP runtime. Components own local
forms; resource controllers cancel old work and suppress late results. Backend
authorization remains authoritative. Creation stages are separate, not an atomic
wizard. Existing assets can bypass asset creation. Ambiguous commands retain their
exact captured body and identity without an automatic retry or new identity.

Protocol routing is a compare-and-swap command. Configuration is re-read after
success because an exact retry can acknowledge a historical generation. An exact
stored package is not an admission attestation. Sampled source tuples are not
physical inventory. Empty activity and unobserved worker/socket liveness do not
become failure or health claims. Production has no synthetic fallback.

Consumer generation preserves the whole upstream snapshot and selects only owned
operations with their transitive schemas. The route conditional is represented by
a tested equivalent union for Effect's supported schema vocabulary. No runtime
constraint or security check is removed.

## Acceptance criteria

- Commission an asset, external identifiers, endpoints and a pinned route end-to-end.
- Keep denied actions, invalid inputs, conflicts and unconfirmed outcomes explicit.
- Preserve exact retry content and reject cross-scope/unsafe evidence at boundaries.
- Clear superseded scope/account data and cancel reads/commands on disposal.
- Display truthful truncation and unknown liveness in responsive semantic themes.
- Extend executable guides with a coherent contract-backed device journey.
- Run canonical acceptance, browser and measured-quality groups and report actual outcomes.

## Acceptance evidence

Required: focused device model, adapter and lifecycle tests; production build and
output budgets; canonical acceptance, browser, measured-quality and guide checks.
Record passed, failed and not-run outcomes with source-bound verification receipts
in the implementation PR. Synthetic contract journeys do not certify
backend installation, real OIDC, hardware, runtime throughput or fleet capacity.

## Out of scope

D06, full-profile infrastructure qualification, protocol upload/admission tooling,
new backend endpoints, live sockets, hardware qualification, inferred asset health
and semantic binding authoring (a later M04 slice).
